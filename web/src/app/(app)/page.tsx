"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Baby, CalendarDays, ClipboardList, Container, Eye, EyeOff, Microscope } from "lucide-react";
import { Badge, Button, Card, DataTable, PageHeader, Select, Spinner } from "@/components/ui";
import { AreaTrend, Donut, statusColor, type Point } from "@/components/charts";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { endOfDay, fmtDate, startOfDay } from "@/lib/util";

type Cy = { id: string; couple_id: string; treatment_type: string; start_date: string | null; status: string; couples: { couple_no: string; female: { full_name: string } } };
type Out = { cycle_id: string; pregnancy: boolean | null; clinical_pregnancy: boolean | null; created_at: string };
type Later = { couple_id: string; treatment_type: string; start_date: string | null };

function useCount(key: string, build: () => PromiseLike<{ count: number | null }>) {
  const q = useQ<number>(key, async () => ({ data: (await build()).count ?? 0, error: null }));
  return q.data;
}

type TileTone = "brand" | "info" | "ok" | "warn";
function Tile({ label, value, href, icon: Ico }:
  { label: string; value?: number; href?: string; icon: typeof Activity; tone?: TileTone }) {
  const body = (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[14px] border border-line bg-surface p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-px hover:border-line-strong hover:shadow-[var(--shadow)]">
      <div className="flex items-start justify-between">
        <span className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</span>
        <Ico size={17} className="shrink-0 text-faint transition-colors group-hover:text-brand" />
      </div>
      <div className="mt-5 text-[2rem] font-semibold leading-none tabular-nums tracking-tight text-ink">{value ?? <span className="text-faint">·</span>}</div>
      <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export default function Dashboard() {
  const [days, setDays] = useState("90");
  const [hide, setHide] = useState(false);
  const s = startOfDay(), e = endOfDay();
  const regs = useCount("dash:regs", () => supabase.from("visits").select("id", { count: "exact", head: true }).gte("visit_at", s).lte("visit_at", e) as never);
  const appts = useCount("dash:appts", () => supabase.from("appointments").select("id", { count: "exact", head: true }).gte("starts_at", s).lte("starts_at", e) as never);
  const active = useCount("dash:active", () => supabase.from("cycles").select("id", { count: "exact", head: true }).not("status", "in", "(Completed,Cancelled)") as never);
  const opuToday = useCount("dash:opu", () => supabase.from("opu").select("id", { count: "exact", head: true }).gte("opu_at", s).lte("opu_at", e) as never);
  const culture = useCount("dash:culture", () => supabase.from("embryos").select("id", { count: "exact", head: true }).eq("status", "culture") as never);
  const stored = useCount("dash:stored", () => supabase.from("vitrified_items").select("id", { count: "exact", head: true }).eq("status", "stored") as never);

  const since = useMemo(() => new Date(Date.now() - Number(days) * 86400000).toISOString().slice(0, 10), [days]);
  const cycles = useQ<Cy[]>(`dash:cycles:${since}`, () =>
    supabase.from("cycles").select("id,couple_id,treatment_type,start_date,status,couples(couple_no, female:patients!couples_female_id_fkey(full_name))").gte("start_date", since) as never);
  const ids = (cycles.data ?? []).map((c) => c.id);
  const outs = useQ<Out[]>(ids.length ? `dash:outs:${since}:${ids.length}` : null, () => supabase.from("outcomes").select("cycle_id,pregnancy,clinical_pregnancy,created_at").in("cycle_id", ids).order("created_at", { ascending: false }) as never);
  const later = useQ<Later[]>(`dash:later:${since}`, () => supabase.from("cycles").select("couple_id,treatment_type,start_date").ilike("treatment_type", "IVF%").gte("start_date", since) as never);

  const stats = useMemo(() => {
    const latest = new Map<string, Out>();
    (outs.data ?? []).forEach((o) => { if (!latest.has(o.cycle_id)) latest.set(o.cycle_id, o); });
    const verdict = (id: string) => {
      const o = latest.get(id);
      if (!o) return "pending";
      if (o.clinical_pregnancy === true || o.pregnancy === true) return "succeeded";
      if (o.clinical_pregnancy === false || o.pregnancy === false) return "failed";
      return "pending";
    };
    const byProc = new Map<string, { total: number; succeeded: number; failed: number; pending: number }>();
    (cycles.data ?? []).forEach((c) => {
      const r = byProc.get(c.treatment_type) ?? { total: 0, succeeded: 0, failed: 0, pending: 0 };
      r.total++; r[verdict(c.id) as "succeeded" | "failed" | "pending"]++;
      byProc.set(c.treatment_type, r);
    });
    const iuiFailed = (cycles.data ?? []).filter((c) => /^IUI/i.test(c.treatment_type) && verdict(c.id) === "failed");
    const converted = (c: Cy) => (later.data ?? []).some((l) => l.couple_id === c.couple_id && l.start_date && c.start_date && l.start_date > c.start_date);
    return { byProc: [...byProc.entries()].map(([procedure, v]) => ({ id: procedure, procedure, ...v })), iuiFailed, converted };
  }, [cycles.data, outs.data, later.data]);

  const iuiTotal = stats.byProc.find((p) => /^IUI/i.test(p.procedure));
  const convertedCount = stats.iuiFailed.filter(stats.converted).length;

  const charts = useMemo(() => {
    const cy = cycles.data ?? [];
    const ml = (ym: string) => { const [y, m] = ym.split("-"); return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m - 1]} ${y.slice(2)}`; };
    const months = new Map<string, number>();
    cy.forEach((c) => { const ym = (c.start_date ?? "").slice(0, 7); if (ym) months.set(ym, (months.get(ym) ?? 0) + 1); });
    const trend: Point[] = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => ({ label: ml(k), value: v }));
    const st = new Map<string, number>();
    cy.forEach((c) => st.set(c.status, (st.get(c.status) ?? 0) + 1));
    const status: Point[] = [...st.entries()].map(([label, value]) => ({ label, value }));
    return { trend, status };
  }, [cycles.data]);

  return (
    <>
      <PageHeader title="IVF Dashboard & 90 Day Conversion" subtitle="Live figures from recorded cycles and outcomes"
        actions={<div className="w-44"><Select aria-label="Window" placeholder="" options={[{ value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }, { value: "180", label: "Last 180 days" }, { value: "365", label: "Last 12 months" }]} value={days} onChange={(e) => setDays(e.target.value)} /></div>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Today's registrations" value={regs} href="/registrations" icon={ClipboardList} tone="brand" />
        <Tile label="Appointments today" value={appts} href="/appointments" icon={CalendarDays} tone="info" />
        <Tile label="Active cycles" value={active} icon={Activity} tone="brand" />
        <Tile label="OPU today" value={opuToday} href="/worklists/surgeries" icon={Baby} tone="warn" />
        <Tile label="Embryos in culture" value={culture} href="/worklists/monitor-embryos" icon={Microscope} tone="info" />
        <Tile label="Items in storage" value={stored} href="/worklists/vitrified-embryos" icon={Container} tone="ok" />
      </div>
      {!(cycles.isLoading && !cycles.data) && (cycles.data?.length ?? 0) > 0 && (
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <Card title="Cycles started per month"><AreaTrend data={charts.trend} height={200} /></Card>
          <Card title="Cycles by status"><Donut data={charts.status} height={200} colorFn={(p) => statusColor(p.label)} /></Card>
        </div>
      )}
      {cycles.isLoading && !cycles.data ? <Spinner /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="IUI Treatment Performance" actions={<Badge tone="brand">Summary By: Procedure</Badge>}>
            {hide ? <p className="text-muted">Table hidden.</p> : (
              <DataTable rows={stats.byProc} empty="No cycles started in this window."
                cols={[{ key: "procedure", label: "Procedure", primary: true }, { key: "total", label: "Cycles" }, { key: "succeeded", label: "Succeeded" }, { key: "failed", label: "Failed" }, { key: "pending", label: "Outcome pending" }]} />
            )}
            <div className="mt-3"><Button size="sm" variant="ghost" onClick={() => setHide(!hide)}>{hide ? <Eye size={16} /> : <EyeOff size={16} />} {hide ? "Show table" : "Hide table"}</Button></div>
          </Card>
          <Card title="IUI Cycles Succeeded / Failed · IUI → IVF Conversions">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[["IUI cycles", iuiTotal?.total ?? 0], ["Succeeded", iuiTotal?.succeeded ?? 0], ["Failed", iuiTotal?.failed ?? 0], ["Converted to IVF", convertedCount]].map(([l, v]) => (
                <div key={l as string}><dt className="text-xs uppercase tracking-wide text-muted">{l}</dt><dd className="text-2xl font-semibold tabular-nums">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted">Succeeded = positive pregnancy outcome recorded; Failed = negative outcome recorded; Converted = failed IUI couple with a later IVF cycle. Definitions pending clinic confirmation.</p>
          </Card>
          <Card title="Failed IUI Conversions" className="lg:col-span-2">
            <DataTable<Cy> rows={stats.iuiFailed} empty="No failed IUI cycles in this window."
              cols={[
                { key: "couple", label: "Couple No.", primary: true, render: (c) => c.couples.couple_no },
                { key: "name", label: "Patient", render: (c) => c.couples.female.full_name },
                { key: "start", label: "IUI start", render: (c) => fmtDate(c.start_date) },
                { key: "conv", label: "Converted to IVF", render: (c) => (stats.converted(c) ? <Badge tone="ok">Yes</Badge> : <Badge tone="warn">Not yet</Badge>) },
              ]}
              actions={(c) => <Link href={`/cycles/${c.id}`}><Button size="sm">Open</Button></Link>} />
          </Card>
        </div>
      )}
    </>
  );
}
