"use client";
import { useState } from "react";
import { Plus, Repeat } from "lucide-react";
import { Button, Card, Empty, Field, Input, Modal, Spinner, Textarea, useToast } from "../ui";
import { StimResponse, follicleCount } from "../charts";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, nul, num, todayISO } from "@/lib/util";
import type { CycleFull, Med, StimDay } from "@/lib/types";

const MEDS = ["HMG", "R-FSH", "GnRH Antagonist"] as const;
type Draft = { day_no: number; day_date: string; meds: Record<string, Med>; right: string; left: string; endo: string; doppler: string; e2: string; p4: string; advice: string; timing: string; repeat: string };

const blank = (day_no: number, day_date: string): Draft => ({
  day_no, day_date, meds: Object.fromEntries(MEDS.map((m) => [m, { name: m }])), right: "", left: "", endo: "", doppler: "", e2: "", p4: "", advice: "", timing: "", repeat: "",
});

export function StimTab({ cycle }: { cycle: CycleFull }) {
  const toast = useToast();
  const { profile } = useAuth();
  const key = `stim:${cycle.id}`;
  const { data, isLoading } = useQ<StimDay[]>(key, () => supabase.from("stim_days").select("*").eq("cycle_id", cycle.id).order("day_no") as never);
  const [d, setD] = useState<Draft | null>(null);
  const [existing, setExisting] = useState<StimDay | null>(null);
  const [busy, setBusy] = useState(false);
  const days = data ?? [];

  function openNew() {
    const last = days.at(-1);
    const next = last ? new Date(new Date(last.day_date).getTime() + 86400000).toISOString().slice(0, 10) : cycle.start_date ?? todayISO();
    const dr = blank((last?.day_no ?? 0) + 1, next);
    // pre-fill medications from the previous day (dosage carries forward, clinician confirms)
    last?.medications?.forEach((m) => { if (dr.meds[m.name]) dr.meds[m.name] = { ...m }; });
    setExisting(null); setD(dr);
  }
  function openEdit(x: StimDay) {
    const dr = blank(x.day_no, x.day_date);
    x.medications?.forEach((m) => { if (dr.meds[m.name]) dr.meds[m.name] = { ...m }; });
    Object.assign(dr, { right: x.right_follicles ?? "", left: x.left_follicles ?? "", endo: x.endo_thickness_mm?.toString() ?? "", doppler: x.endo_doppler ?? "",
      e2: x.e2?.toString() ?? "", p4: x.p4?.toString() ?? "", advice: x.advice ?? "", timing: x.timing ?? "" });
    setExisting(x); setD(dr);
  }

  async function save() {
    if (!d) return;
    for (const [k, v] of [["Endometrium", d.endo], ["E2", d.e2], ["P4", d.p4]] as const)
      if (v !== "" && (isNaN(Number(v)) || Number(v) < 0)) return toast(`${k} must be a non-negative number`, "danger");
    setBusy(true);
    try {
      const meds = MEDS.map((m) => d.meds[m]);
      const dose = (n: string) => num(d.meds[n].dosage);
      const row = {
        cycle_id: cycle.id, day_no: d.day_no, day_date: d.day_date, medications: meds,
        hmg_mg: dose("HMG"), rfsh_mg: dose("R-FSH"), antagonist_mg: dose("GnRH Antagonist"),
        timing: nul(d.timing), right_follicles: nul(d.right), left_follicles: nul(d.left), endo_thickness_mm: num(d.endo), endo_doppler: nul(d.doppler),
        e2: num(d.e2), p4: num(d.p4), advice: nul(d.advice), recorded_by: profile?.id,
      };
      await saveRow("stim_days", row, existing?.id, existing?.version);
      const rep = Math.min(Number(d.repeat) || 0, 14);
      if (rep > 0 && !existing) {
        const extra = Array.from({ length: rep }, (_, i) => ({
          cycle_id: cycle.id, day_no: d.day_no + i + 1, medications: meds, hmg_mg: dose("HMG"), rfsh_mg: dose("R-FSH"), antagonist_mg: dose("GnRH Antagonist"),
          day_date: new Date(new Date(d.day_date).getTime() + (i + 1) * 86400000).toISOString().slice(0, 10), recorded_by: profile?.id,
        }));
        const { error } = await supabase.from("stim_days").insert(extra);
        if (error) throw new Error(error.message);
      }
      if (cycle.status === "Planned") await saveRow("cycles", { status: "Stimulation" }, cycle.id);
      toast(`Day ${d.day_no} recorded`); refresh(key, "cycle:"); setD(null);
    } catch (e) {
      const m = (e as Error).message;
      toast(m.includes("duplicate") ? `Day ${d.day_no} already exists for this cycle` : m, "danger");
    }
    setBusy(false);
  }

  const setMed = (n: string, k: keyof Med, v: string) => setD((s) => s && { ...s, meds: { ...s.meds, [n]: { ...s.meds[n], [k]: v } } });
  const th = "whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted";

  const chartData = days.map((x) => ({
    day: x.day_no,
    follicles: follicleCount(x.right_follicles) + follicleCount(x.left_follicles),
    endo: x.endo_thickness_mm, e2: x.e2, p4: x.p4,
  }));

  return (
    <div className="space-y-4">
    {days.length > 0 && <Card title="Stimulation response"><StimResponse data={chartData} /></Card>}
    <Card title="IVF Stimulation Monitoring" actions={<Button size="sm" variant="primary" onClick={openNew}><Plus size={16} /> Record next day</Button>}>
      {isLoading && !data ? <Spinner /> : days.length === 0 ? <Empty>No stimulation days recorded.</Empty> : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-bg">
              <tr>
                <th className={`${th} sticky left-0 bg-bg`}>Day</th><th className={th}>HMG (mg)</th><th className={th}>R-FSH (mg)</th><th className={th}>GnRH Antagonist (mg)</th>
                <th className={th}>Timing</th><th className={th}>Right Follicles (mm)</th><th className={th}>Left Follicles (mm)</th>
                <th className={th}>Endo Thickness (mm)</th><th className={th}>Endo Doppler</th><th className={th}>E2</th><th className={th}>P4</th>
              </tr>
            </thead>
            <tbody>
              {days.map((x) => (
                <tr key={x.id} onClick={() => openEdit(x)} className="cursor-pointer border-t border-line hover:bg-brand-soft/50">
                  <td className="sticky left-0 bg-surface px-3 py-3"><b>Day {x.day_no}</b><div className="text-xs text-muted">{fmtDate(x.day_date)}</div></td>
                  {[x.hmg_mg, x.rfsh_mg, x.antagonist_mg, x.timing, x.right_follicles, x.left_follicles, x.endo_thickness_mm, x.endo_doppler, x.e2, x.p4].map((v, i) => (
                    <td key={i} className="px-3 py-3">{v ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!d} onClose={() => setD(null)} wide title={d ? `Record results of Day ${d.day_no}` : ""}
        footer={<><Button onClick={() => setD(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
        {d && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Day"><Input type="number" min={1} value={d.day_no} disabled={!!existing} onChange={(e) => setD({ ...d, day_no: Number(e.target.value) })} /></Field>
              <Field label="Date"><Input type="date" value={d.day_date} onChange={(e) => setD({ ...d, day_date: e.target.value })} /></Field>
              <Field label="Timing"><Input value={d.timing} onChange={(e) => setD({ ...d, timing: e.target.value })} placeholder="e.g. 8 PM" /></Field>
            </div>
            <section>
              <h3 className="mb-2 font-semibold">Medications</h3>
              <div className="space-y-3">
                {MEDS.map((m) => (
                  <div key={m} className="rounded-xl border border-line bg-bg/60 p-3">
                    <div className="mb-2 font-medium">{m}</div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Generic Drug Name"><Input value={d.meds[m].generic ?? ""} onChange={(e) => setMed(m, "generic", e.target.value)} /></Field>
                      <Field label="Dosage"><Input type="number" inputMode="decimal" step="any" value={d.meds[m].dosage ?? ""} onChange={(e) => setMed(m, "dosage", e.target.value)} /></Field>
                      <Field label="Quantity"><Input value={d.meds[m].qty ?? ""} onChange={(e) => setMed(m, "qty", e.target.value)} /></Field>
                      <Field label="Remarks"><Input value={d.meds[m].remarks ?? ""} onChange={(e) => setMed(m, "remarks", e.target.value)} /></Field>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Follicular Scan</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Right Follicles (mm)" hint="e.g. 18, 17, 15, 14"><Input value={d.right} onChange={(e) => setD({ ...d, right: e.target.value })} /></Field>
                <Field label="Left Follicles (mm)"><Input value={d.left} onChange={(e) => setD({ ...d, left: e.target.value })} /></Field>
                <Field label="Endometrium (mm)"><Input type="number" inputMode="decimal" step="any" value={d.endo} onChange={(e) => setD({ ...d, endo: e.target.value })} /></Field>
                <Field label="Endo-Doppler"><Input value={d.doppler} onChange={(e) => setD({ ...d, doppler: e.target.value })} /></Field>
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Labs</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="E2"><Input type="number" inputMode="decimal" step="any" value={d.e2} onChange={(e) => setD({ ...d, e2: e.target.value })} /></Field>
                <Field label="P4"><Input type="number" inputMode="decimal" step="any" value={d.p4} onChange={(e) => setD({ ...d, p4: e.target.value })} /></Field>
              </div>
            </section>
            <Field label="Advice"><Textarea value={d.advice} onChange={(e) => setD({ ...d, advice: e.target.value })} /></Field>
            {!existing && (
              <Field label="Repeat dosage for further days" hint="Copies today's medication doses onto the next N days (max 14). Scans and labs are not copied.">
                <div className="flex items-center gap-2"><Repeat size={18} className="text-muted" />
                  <Input type="number" min={0} max={14} className="max-w-32" value={d.repeat} onChange={(e) => setD({ ...d, repeat: e.target.value })} /><span className="text-sm text-muted">days</span></div>
              </Field>
            )}
          </div>
        )}
      </Modal>
    </Card>
    </div>
  );
}
