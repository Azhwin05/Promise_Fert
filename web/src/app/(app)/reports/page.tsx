"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, DataTable, Field, Input, PageHeader, Spinner, Tabs } from "@/components/ui";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/util";

type Cy = { treatment_type: string; status: string; start_date: string | null };
type Bill = { total: number; status: string; created_at: string };
type Bar = { id: string; label: string; value: number };

function Bars({ rows, fmt = (n: number) => String(n) }: { rows: Bar[]; fmt?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-muted">No data in range.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.id} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-sm">
          <span className="truncate text-muted">{r.label}</span>
          <span className="h-5 overflow-hidden rounded bg-bg"><span className="block h-full rounded bg-brand" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="text-right tabular-nums">{fmt(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Reports() {
  const [tab, setTab] = useState(useSearchParams().get("tab") === "analytics" ? "Analytics" : "Reports");
  const [from, setFrom] = useState(() => new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const cycles = useQ<Cy[]>(`rep:cycles:${from}:${to}`, () => supabase.from("cycles").select("treatment_type,status,start_date").gte("start_date", from).lte("start_date", to).limit(5000) as never);
  const bills = useQ<Bill[]>(`rep:bills:${from}:${to}`, () => supabase.from("bills").select("total,status,created_at").neq("status", "cancelled").gte("created_at", from).lte("created_at", `${to}T23:59:59`).limit(5000) as never);

  const d = useMemo(() => {
    const by = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number = () => 1) => {
      const m = new Map<string, number>();
      rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + val(r)));
      return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([label, value]) => ({ id: label, label, value }));
    };
    return {
      byTreatment: by(cycles.data ?? [], (c) => c.treatment_type),
      byStatus: by(cycles.data ?? [], (c) => c.status),
      byMonth: by(cycles.data ?? [], (c) => (c.start_date ?? "").slice(0, 7)),
      revMonth: by(bills.data ?? [], (b) => b.created_at.slice(0, 7), (b) => Number(b.total)),
      billed: (bills.data ?? []).reduce((s, b) => s + Number(b.total), 0),
    };
  }, [cycles.data, bills.data]);

  return (
    <>
      <PageHeader title={tab} />
      <Tabs tabs={["Reports", "Analytics"]} value={tab} onChange={setTab} />
      <Card className="mb-4">
        <div className="grid max-w-md grid-cols-2 gap-3">
          <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        </div>
      </Card>
      {cycles.isLoading && !cycles.data ? <Spinner /> : tab === "Reports" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Cycles by treatment"><DataTable rows={d.byTreatment} cols={[{ key: "label", label: "Treatment", primary: true }, { key: "value", label: "Cycles" }]} /></Card>
          <Card title="Cycles by status"><DataTable rows={d.byStatus} cols={[{ key: "label", label: "Status", primary: true }, { key: "value", label: "Cycles" }]} /></Card>
          <Card title="Billed (excluding cancelled)"><p className="text-3xl font-semibold">{money(d.billed)}</p><p className="text-sm text-muted">{bills.data?.length ?? 0} bill(s)</p></Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Cycles started per month"><Bars rows={d.byMonth} /></Card>
          <Card title="Billing per month"><Bars rows={d.revMonth} fmt={(n) => money(n)} /></Card>
          <Card title="Cycles by treatment"><Bars rows={d.byTreatment} /></Card>
        </div>
      )}
    </>
  );
}
