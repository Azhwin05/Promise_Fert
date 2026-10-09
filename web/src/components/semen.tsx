"use client";
import { useState } from "react";
import { Alert, Button, Check, Field, Input, Modal, Textarea, useToast } from "./ui";
import { refresh, saveRow } from "@/lib/q";
import { nul, num } from "@/lib/util";

export type Semen = {
  id: string; patient_id: string; cycle_id: string | null; collected_at: string; volume_ml: number | null; concentration_mill_ml: number | null;
  total_sperm: number | null; rapid_progressive_pct: number | null; slow_progressive_pct: number | null; non_progressive_pct: number | null;
  immobile_pct: number | null; total_motile_prog: number | null; morphology_normal_pct: number | null; morphology_abnormal_pct: number | null;
  head_defects_pct: number | null; midpiece_defects_pct: number | null; manual_calculation: boolean; macs_done: boolean; hbal: boolean; dfi: boolean;
  pics: boolean; occasional_count: boolean; notes: string | null; macroscopic: { notes?: string }; microscopic: { notes?: string }; morphology: { notes?: string }; version: number;
};

const NUM: [keyof Semen, string][] = [
  ["volume_ml", "Volume (ml)"], ["concentration_mill_ml", "Concentration (mill/ml)"], ["total_sperm", "Total Sperm"],
  ["rapid_progressive_pct", "Rapid Progressive (%)"], ["slow_progressive_pct", "Slow Progressive (%)"], ["non_progressive_pct", "Non-Progressive (%)"],
  ["immobile_pct", "immobile (%)"], ["total_motile_prog", "Total motile prog."],
];
const MORPH: [keyof Semen, string][] = [
  ["morphology_normal_pct", "Normal in %"], ["morphology_abnormal_pct", "Abnormal in %"], ["head_defects_pct", "Head Defects in %"], ["midpiece_defects_pct", "Mid-piece Defects in %"],
];
const FLAGS: [keyof Semen, string][] = [
  ["manual_calculation", "Manual Calculation"], ["macs_done", "MACS Done"], ["hbal", "HBAL"], ["dfi", "DFI"], ["pics", "PICS!"], ["occasional_count", "Occasional Count"],
];

/** Wash Semen Sample / semen analysis. Labels are preserved from the source; no calculations are applied pending clinical confirmation. */
export function SemenModal({ open, onClose, patientId, cycleId, existing }: { open: boolean; onClose: () => void; patientId: string; cycleId?: string | null; existing?: Semen | null }) {
  const toast = useToast();
  const [d, setD] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const v = (k: string) => (d[k] !== undefined ? d[k] : (existing as unknown as Record<string, unknown>)?.[k]);
  const note = (k: "macroscopic" | "microscopic" | "morphology") => (d[`n_${k}`] as string) ?? existing?.[k]?.notes ?? "";

  const close = () => { setD({}); onClose(); };
  async function save() {
    setBusy(true);
    try {
      const row: Record<string, unknown> = { patient_id: patientId, cycle_id: cycleId ?? existing?.cycle_id ?? null, notes: nul(v("notes")) };
      [...NUM, ...MORPH].forEach(([k]) => (row[k] = num(v(k))));
      FLAGS.forEach(([k]) => (row[k] = !!v(k)));
      for (const k of ["macroscopic", "microscopic", "morphology"] as const) row[k] = { notes: note(k) };
      for (const [k, label] of [...NUM.filter(([k]) => String(k).endsWith("pct")), ...MORPH]) {
        const n = row[k as string] as number | null;
        if (n != null && (n < 0 || n > 100)) throw new Error(`${label} must be between 0 and 100`);
      }
      await saveRow("semen_samples", row, existing?.id, existing?.version);
      toast("Semen sample saved"); refresh("semen"); close();
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  const set = (k: string, val: unknown) => setD({ ...d, [k]: val });

  return (
    <Modal open={open} onClose={close} wide title="Wash Semen Sample"
      footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
      <div className="space-y-6">
        <Alert>Totals are entered manually. Auto-calculation and reference ranges will be enabled once confirmed by the clinic.</Alert>
        <section>
          <h3 className="mb-2 font-semibold">Semen Analysis</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Macroscopic Analysis" className="md:col-span-1"><Textarea value={note("macroscopic")} onChange={(e) => set("n_macroscopic", e.target.value)} /></Field>
            <Field label="Microscopic Analysis"><Textarea value={note("microscopic")} onChange={(e) => set("n_microscopic", e.target.value)} /></Field>
            <Field label="Morphology"><Textarea value={note("morphology")} onChange={(e) => set("n_morphology", e.target.value)} /></Field>
          </div>
        </section>
        <section>
          <h3 className="mb-2 font-semibold">Capacitated / Processed</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NUM.map(([k, l]) => <Field key={k} label={l}><Input type="number" min={0} step="any" inputMode="decimal" value={String(v(k) ?? "")} onChange={(e) => set(k, e.target.value)} /></Field>)}
          </div>
        </section>
        <section>
          <h3 className="mb-2 font-semibold">Morphology PR</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MORPH.map(([k, l]) => <Field key={k} label={l}><Input type="number" min={0} max={100} step="any" inputMode="decimal" value={String(v(k) ?? "")} onChange={(e) => set(k, e.target.value)} /></Field>)}
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLAGS.map(([k, l]) => <Check key={k} label={l} checked={!!v(k)} onChange={(c) => set(k, c)} />)}
        </section>
        <Field label="Notes"><Textarea value={String(v("notes") ?? "")} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
