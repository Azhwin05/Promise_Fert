"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, DataTable, Field, Input, PageHeader, Spinner, Tabs } from "@/components/ui";
import { AreaTrend, Bars, Donut, statusColor, C, type Point } from "@/components/charts";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/util";

type Cy = { treatment_type: string; status: string; start_date: string | null };
type Bill = { total: number; status: string; created_at: string };

const monthLabel = (ym: string) => {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym || "—";
  const [y, m] = ym.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][+m - 1]} ${y.slice(2)}`;
};
// Build a continuous month axis between two dates so the trend has no gaps
const monthsBetween = (from: string, to: string) => {
  const out: string[] = [];
  const d = new Date(from.slice(0, 7) + "-01"), end = new Date(to.slice(0, 7) + "-01");
  while (d <= end && out.length < 36) { out.push(d.toISOString().slice(0, 7)); d.setMonth(d.getMonth() + 1); }
  return out;
};

export default function Reports() {
  const [tab, setTab] = useState(useSearchParams().get("tab") === "analytics" ? "Analytics" : "Reports");
  const [from, setFrom] = useState(() => new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const cycles = useQ<Cy[]>(`rep:cycles:${from}:${to}`, () => supabase.from("cycles").select("treatment_type,status,start_date").gte("start_date", from).lte("start_date", to).limit(5000) as never);
  const bills = useQ<Bill[]>(`rep:bills:${from}:${to}`, () => supabase.from("bills").select("total,status,created_at").neq("status", "cancelled").gte("created_at", from).lte("created_at", `${to}T23:59:59`).limit(5000) as never);

  const d = useMemo(() => {
    const by = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number = () => 1): Point[] => {
      const m = new Map<string, number>();
      rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + val(r)));
      return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
    };
    const axis = monthsBetween(from, to);
    const fill = (pts: Point[]): Point[] => {
      const map = new Map(pts.map((p) => [p.label, p.value]));
      return axis.map((ym) => ({ label: monthLabel(ym), value: map.get(ym) ?? 0 }));
    };
    return {
      byTreatment: by(cycles.data ?? [], (c) => c.treatment_type),
      byStatus: by(cycles.data ?? [], (c) => c.status),
      byMonth: fill(by(cycles.data ?? [], (c) => (c.start_date ?? "").slice(0, 7))),
      revMonth: fill(by(bills.data ?? [], (b) => b.created_at.slice(0, 7), (b) => Number(b.total))),
      billed: (bills.data ?? []).reduce((s, b) => s + Number(b.total), 0),
    };
  }, [cycles.data, bills.data, from, to]);

  const loading = cycles.isLoading && !cycles.data;

  return (
    <>
      <PageHeader title={tab} subtitle="Cycle, outcome and billing insights for the selected range" />
      <Tabs tabs={["Reports", "Analytics"]} value={tab} onChange={setTab} />
      <Card className="mb-4">
        <div className="grid max-w-md grid-cols-2 gap-3">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
      </Card>
      {loading ? <Spinner /> : tab === "Reports" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Cycles by treatment"><DataTable rows={d.byTreatment.map((p, i) => ({ id: i, ...p }))} cols={[{ key: "label", label: "Treatment", primary: true }, { key: "value", label: "Cycles" }]} /></Card>
          <Card title="Cycles by status"><DataTable rows={d.byStatus.map((p, i) => ({ id: i, ...p }))} cols={[{ key: "label", label: "Status", primary: true }, { key: "value", label: "Cycles" }]} /></Card>
          <Card title="Billed (excluding cancelled)" className="lg:col-span-2">
            <p className="text-[2rem] font-semibold tabular-nums">{money(d.billed)}</p><p className="text-sm text-muted">{bills.data?.length ?? 0} bill(s) in range</p>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Cycles started per month"><AreaTrend data={d.byMonth} /></Card>
          <Card title="Billing per month"><Bars data={d.revMonth} fmt={(n) => money(n)} colorFn={() => C.brand} /></Card>
          <Card title="Cycles by status"><Donut data={d.byStatus} colorFn={(p) => statusColor(p.label)} /></Card>
          <Card title="Cycles by treatment"><Bars data={d.byTreatment} horizontal /></Card>
        </div>
      )}
    </>
  );
}
