"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Alert, Badge, Button, Card, DataTable, Field, Input, Modal, Segmented, Select, Spinner, Textarea, useToast } from "../ui";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDate, nul, num } from "@/lib/util";
import type { CycleFull, Opu, Outcome } from "@/lib/types";

export function useStaff() {
  const q = useQ<{ full_name: string }[]>("staff-names", () => supabase.from("profiles").select("full_name").eq("active", true) as never);
  return (q.data ?? []).map((s) => s.full_name);
}

const counts: [keyof Opu, string][] = [
  ["mature_oocytes", "Mature Oocytes"], ["immature_oocytes", "Immature Oocytes"], ["metaphase_ii", "Metaphase II"], ["metaphase_i", "Metaphase I"],
  ["microinjected", "Microinjected"], ["others", "Others"], ["fert_2pn", "Normal Fertilisation (2 PN)"], ["fert_1pn", "Abnormal Fertilisation (1PN)"],
  ["fert_3pn", "Abnormal Fertilisation (>= 3PN)"], ["embryos_obtained", "No. of embryos obtained"],
];

export function OpuTab({ cycle }: { cycle: CycleFull }) {
  const toast = useToast();
  const staff = useStaff();
  const key = `opu:${cycle.id}`;
  const { data, isLoading } = useQ<Opu | null>(key, () => supabase.from("opu").select("*").eq("cycle_id", cycle.id).maybeSingle() as never);
  const consent = useQ<{ status: string }[]>(`opu-consent:${cycle.id}`, () => supabase.from("consents").select("status").eq("cycle_id", cycle.id).eq("kind", "OPU") as never);
  const [d, setD] = useState<Record<string, string | boolean> | null>(null);
  const [busy, setBusy] = useState(false);
  const cur = d ?? toDraft(data);
  const set = (k: string, v: string | boolean) => setD({ ...cur, [k]: v });
  const consentOk = consent.data?.some((c) => c.status === "Consent received");

  async function save() {
    setBusy(true);
    try {
      const row: Record<string, unknown> = {
        cycle_id: cycle.id, consent_obtained: !!cur.consent_obtained,
        opu_at: cur.opu_at ? new Date(String(cur.opu_at)).toISOString() : null,
        surgeon: nul(cur.surgeon), assistant_surgeon: nul(cur.assistant_surgeon), primary_embryologist: nul(cur.primary_embryologist),
        secondary_embryologist: nul(cur.secondary_embryologist), trigger_on: nul(cur.trigger_on), trigger_at: nul(cur.trigger_at), notes: nul(cur.notes),
      };
      counts.forEach(([k]) => (row[k] = num(cur[k])));
      await saveRow("opu", row, data?.id, data?.version);
      if (row.opu_at && ["Planned", "Stimulation", "Stimulation Completed"].includes(cycle.status)) await saveRow("cycles", { status: "OPU Done" }, cycle.id);
      toast("OPU saved"); refresh(key, "cycle:", "worklist"); setD(null);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }

  if (isLoading && !data) return <Spinner />;
  return (
    <div className="space-y-4">
      <datalist id="staff">{staff.map((s) => <option key={s} value={s} />)}</datalist>
      <Card title="Oocyte Retrieval (OPU)" actions={<Button variant="primary" loading={busy} onClick={save} disabled={!d}>Save OPU</Button>}>
        {!consentOk && <div className="mb-4"><Alert>No received OPU consent on file. Add one in the Consent tab (kind “OPU”) before the procedure.</Alert></div>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Consent For OPU"><Segmented value={cur.consent_obtained ? "Yes" : "No"} onChange={(v) => set("consent_obtained", v === "Yes")} options={["Yes", "No"]} /></Field>
          <Field label="Date/Time of OPU"><Input type="datetime-local" value={String(cur.opu_at ?? "")} onChange={(e) => set("opu_at", e.target.value)} /></Field>
          {(["surgeon", "assistant_surgeon", "primary_embryologist", "secondary_embryologist"] as const).map((k) => (
            <Field key={k} label={{ surgeon: "Surgeon", assistant_surgeon: "Assistant Surgeon", primary_embryologist: "Primary Embryologist", secondary_embryologist: "Secondary Embryologist" }[k]}>
              <Input list="staff" value={String(cur[k] ?? "")} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}
          <Field label="Trigger On"><Input type="date" value={String(cur.trigger_on ?? "")} onChange={(e) => set("trigger_on", e.target.value)} /></Field>
          <Field label="Trigger At"><Input type="time" value={String(cur.trigger_at ?? "")} onChange={(e) => set("trigger_at", e.target.value)} /></Field>
        </div>
      </Card>
      <Card title="Oocytes & fertilisation summary">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {counts.map(([k, label]) => (
            <Field key={k} label={label}><Input type="number" min={0} inputMode="numeric" value={String(cur[k] ?? "")} onChange={(e) => set(k, e.target.value)} /></Field>
          ))}
        </div>
        <Field label="Notes" className="mt-4"><Textarea value={String(cur.notes ?? "")} onChange={(e) => set("notes", e.target.value)} /></Field>
      </Card>
    </div>
  );
}

function toDraft(o?: Opu | null): Record<string, string | boolean> {
  if (!o) return { consent_obtained: false };
  const local = o.opu_at ? new Date(new Date(o.opu_at).getTime() - new Date(o.opu_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  const r: Record<string, string | boolean> = { consent_obtained: o.consent_obtained, opu_at: local };
  (Object.keys(o) as (keyof Opu)[]).forEach((k) => { if (k !== "opu_at" && k !== "consent_obtained" && o[k] != null) r[k] = String(o[k]); });
  return r;
}

const LOCATIONS = ["Intrauterine", "Ectopic", "Heterotopic", "Unknown"]; // "Ectopic" observed; others proposed

export function OutcomeTab({ cycle }: { cycle: CycleFull }) {
  const toast = useToast();
  const key = `outcomes:${cycle.id}`;
  const { data, isLoading } = useQ<Outcome[]>(key, () => supabase.from("outcomes").select("*").eq("cycle_id", cycle.id).order("created_at", { ascending: false }) as never);
  const [e, setE] = useState<Partial<Outcome> | null>(null);
  const [busy, setBusy] = useState(false);
  const yn = (v: boolean | null | undefined) => (v == null ? "" : v ? "Yes" : "No");
  const female = cycle.couples.female;

  async function save() {
    if (!e) return;
    setBusy(true);
    try {
      await saveRow("outcomes", {
        cycle_id: cycle.id, transfer_date: nul(e.transfer_date), gestation: nul(e.gestation), pregnancy: e.pregnancy ?? null,
        beta_hcg_value: num(e.beta_hcg_value), beta_hcg_date: nul(e.beta_hcg_date), clinical_pregnancy: e.clinical_pregnancy ?? null,
        clinical_pregnancy_date: nul(e.clinical_pregnancy_date), location: nul(e.location), sacs_seen: num(e.sacs_seen), notes: nul(e.notes),
      }, e.id, e.version);
      toast("Outcome recorded"); refresh(key, "cycle:", "reports"); setE(null);
    } catch (x) { toast((x as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <Card title="Cycle outcome" actions={<Button size="sm" variant="primary" onClick={() => setE({})}><Plus size={16} /> Record outcome</Button>}>
      {isLoading && !data ? <Spinner /> : (
        <DataTable<Outcome> rows={data ?? []} empty="No outcome recorded." onRow={(o) => setE(o)}
          cols={[
            { key: "transfer_date", label: "Transfer Date", primary: true, render: (o) => fmtDate(o.transfer_date) },
            { key: "pregnancy", label: "Pregnancy", render: (o) => (o.pregnancy == null ? "—" : <Badge tone={o.pregnancy ? "ok" : "neutral"}>{o.pregnancy ? "Yes" : "No"}</Badge>) },
            { key: "beta", label: "Beta HCG", render: (o) => (o.beta_hcg_value != null ? `${o.beta_hcg_value} (${fmtDate(o.beta_hcg_date)})` : "—") },
            { key: "cp", label: "Clinical Pregnancy", render: (o) => yn(o.clinical_pregnancy) || "—" },
            { key: "location", label: "Location", render: (o) => o.location ?? "—", low: true },
            { key: "sacs", label: "No. of sac seen", render: (o) => o.sacs_seen ?? "—", low: true },
          ]} />
      )}
      <Modal open={!!e} onClose={() => setE(null)} wide title={`Record Outcome for ${female.full_name}, Couple No.: ${cycle.couples.couple_no}`}
        footer={<><Button onClick={() => setE(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
        {e && (
          <div className="space-y-6">
            <p className="text-muted">Cycle No: {cycle.cycle_no}{cycle.cycle_ref ? ` (${cycle.cycle_ref})` : ""}</p>
            <section>
              <h3 className="mb-2 font-semibold">Birth Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Transfer Date"><Input type="date" value={e.transfer_date ?? ""} onChange={(x) => setE({ ...e, transfer_date: x.target.value })} /></Field>
                <Field label="Gestation"><Input value={e.gestation ?? ""} onChange={(x) => setE({ ...e, gestation: x.target.value })} placeholder="e.g. 8w2d" /></Field>
              </div>
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Outcome Results</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Pregnancy"><Segmented value={yn(e.pregnancy)} onChange={(v) => setE({ ...e, pregnancy: v === "" ? null : v === "Yes" })} options={["Yes", "No"]} /></Field>
                <div />
                <Field label="Beta HCG Value"><Input type="number" inputMode="decimal" step="any" min={0} value={e.beta_hcg_value ?? ""} onChange={(x) => setE({ ...e, beta_hcg_value: x.target.value as never })} /></Field>
                <Field label="Recording Date"><Input type="date" value={e.beta_hcg_date ?? ""} onChange={(x) => setE({ ...e, beta_hcg_date: x.target.value })} /></Field>
                <Field label="Clinical Pregnancy"><Segmented value={yn(e.clinical_pregnancy)} onChange={(v) => setE({ ...e, clinical_pregnancy: v === "" ? null : v === "Yes" })} options={["Yes", "No"]} /></Field>
                <Field label="Clinical Pregnancy Recorded Dates"><Input type="date" value={e.clinical_pregnancy_date ?? ""} onChange={(x) => setE({ ...e, clinical_pregnancy_date: x.target.value })} /></Field>
                <Field label="Location"><Select options={LOCATIONS} value={e.location ?? ""} onChange={(x) => setE({ ...e, location: x.target.value })} /></Field>
                <Field label="No. of sac seen"><Input type="number" min={0} inputMode="numeric" value={e.sacs_seen ?? ""} onChange={(x) => setE({ ...e, sacs_seen: x.target.value as never })} /></Field>
              </div>
            </section>
            <Field label="Notes"><Textarea value={e.notes ?? ""} onChange={(x) => setE({ ...e, notes: x.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </Card>
  );
}
