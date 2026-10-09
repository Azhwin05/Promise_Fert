"use client";
import { useState } from "react";
import { ImagePlus, Microscope, Plus } from "lucide-react";
import { Badge, Button, Card, Empty, Field, Input, Modal, Segmented, Select, Spinner, statusTone, Textarea, useToast } from "../ui";
import { refresh, saveRow, uploadDoc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDate, fmtDateTime, nul, num, todayISO } from "@/lib/util";
import { FERT_METHODS } from "@/lib/consts";
import { openFile } from "../docs";
import { SemenModal, type Semen } from "../semen";
import { useStaff } from "./opu-outcome";
import type { CycleFull, Embryo, Fert } from "@/lib/types";

const SURVIVAL = ["Alive", "Arrested", "Degenerated"]; // proposed — confirm with embryology team
const DAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];

const dayNumber = (fertDate: string | null) => (fertDate ? Math.max(0, Math.floor((Date.now() - new Date(fertDate).getTime()) / 86400000)) : 0);
const local = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function EmbryoTab({ cycle }: { cycle: CycleFull }) {
  const key = `ferts:${cycle.id}`;
  const ferts = useQ<Fert[]>(key, () => supabase.from("fertilisations").select("*").eq("cycle_id", cycle.id).order("created_at") as never);
  const [edit, setEdit] = useState<Partial<Fert> | null>(null);
  const [semenOpen, setSemenOpen] = useState(false);
  const male = cycle.couples.male;

  return (
    <div className="space-y-4">
      <Card title="Fertilisation" actions={<>
        {male && <Button size="sm" onClick={() => setSemenOpen(true)}><Microscope size={16} /> Wash semen sample</Button>}
        <Button size="sm" variant="primary" onClick={() => setEdit({ fert_date: todayISO(), method: "ICSI" })}><Plus size={16} /> Record fertilisation</Button></>}>
        {ferts.isLoading && !ferts.data ? <Spinner /> : !(ferts.data ?? []).length ? <Empty>No fertilisation recorded for this cycle.</Empty> : (
          <ul className="space-y-6">
            {ferts.data!.map((f) => (
              <li key={f.id}>
                <FertBlock f={f} cycle={cycle} onEdit={() => setEdit(f)} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <FertModal cycle={cycle} edit={edit} onClose={() => setEdit(null)} />
      {male && <SemenModal open={semenOpen} onClose={() => setSemenOpen(false)} patientId={male.id} cycleId={cycle.id} />}
    </div>
  );
}

function FertBlock({ f, cycle, onEdit }: { f: Fert; cycle: CycleFull; onEdit: () => void }) {
  const toast = useToast();
  const key = `embryos:${f.id}`;
  const { data } = useQ<Embryo[]>(key, () => supabase.from("embryos").select("*").eq("fertilisation_id", f.id).order("oocyte_no") as never);
  const [row, setRow] = useState<Embryo | null>(null);
  const [adding, setAdding] = useState("");
  const dn = dayNumber(f.fert_date);

  async function addOocytes() {
    const n = Math.min(Number(adding) || 0, 40);
    if (n < 1) return;
    const start = (data?.at(-1)?.oocyte_no ?? 0) + 1;
    const rows = Array.from({ length: n }, (_, i) => ({ fertilisation_id: f.id, oocyte_no: start + i, stage: `Day ${Math.min(dn, 6)}` }));
    const { error } = await supabase.from("embryos").insert(rows);
    if (error) return toast(error.message, "danger");
    setAdding(""); refresh(key, "worklist"); toast(`${n} oocyte${n > 1 ? "s" : ""} added`);
    if (cycle.status === "OPU Done") saveRow("cycles", { status: "Embryo Culture" }, cycle.id).then(() => refresh("cycle:"));
  }

  const th = "whitespace-nowrap px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted";
  return (
    <div className="rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg/60 px-4 py-3">
        <div>
          <div className="font-semibold">Day {dn} Embryos · {f.method ?? "Method not set"}</div>
          <div className="text-sm text-muted">Date of fertilisation {fmtDate(f.fert_date)} · Insemination/ICSI {fmtDateTime(f.inseminated_at)} · {cycle.treatment_type}, {cycle.ovum_source}, {cycle.sperm_source}</div>
          <div className="text-sm text-muted">Embryologists: {[f.embryologist1, f.embryologist2].filter(Boolean).join(", ") || "—"} · Incubator: {f.incubator ?? "—"}</div>
        </div>
        <div className="flex items-center gap-2">
          {f.successful != null && <Badge tone={f.successful ? "ok" : "danger"}>{f.successful ? "Fertilisation successful" : "Fertilisation failed"}</Badge>}
          <Button size="sm" onClick={onEdit}>Edit</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-bg"><tr>
            {["Oocyte No", "Sample", "Polar Body", "Breakage", "Attempts", "SPZ Morpho", "SPZ Location", "Stage", "Survival", "Growth", "Comments", "Status"].map((h, i) => (
              <th key={h} className={`${th} ${i === 0 ? "sticky left-0 bg-bg" : ""}`}>{h}</th>))}
          </tr></thead>
          <tbody>
            {(data ?? []).map((e) => (
              <tr key={e.id} onClick={() => setRow(e)} className="cursor-pointer border-t border-line hover:bg-brand-soft/50">
                <td className="sticky left-0 bg-surface px-3 py-3 font-semibold">{e.oocyte_no}</td>
                {[e.sample, e.polar_body, e.breakage, e.attempts, e.spz_morpho, e.spz_location, e.stage, e.survival].map((v, i) => <td key={i} className="px-3 py-3">{v ?? "—"}</td>)}
                <td className="max-w-48 truncate px-3 py-3">{Object.entries(e.growth ?? {}).filter(([, v]) => v).map(([k, v]) => `${k.replace("Day ", "D")}: ${v}`).join(" · ") || "—"}</td>
                <td className="max-w-40 truncate px-3 py-3">{e.comments ?? "—"}</td>
                <td className="px-3 py-3"><Badge tone={statusTone(e.status)}>{e.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(data ?? []).length && <p className="p-4 text-muted">No oocytes added yet.</p>}
      </div>
      <div className="flex items-center gap-2 border-t border-line p-3">
        <Input type="number" min={1} max={40} className="max-w-28" placeholder="No." aria-label="Number of oocytes to add" value={adding} onChange={(e) => setAdding(e.target.value)} />
        <Button size="sm" onClick={addOocytes}><Plus size={16} /> Add oocytes</Button>
      </div>
      <EmbryoModal e={row} fert={f} onClose={() => setRow(null)} reload={key} />
    </div>
  );
}

function EmbryoModal({ e, fert, onClose, reload }: { e: Embryo | null; fert: Fert; onClose: () => void; reload: string }) {
  const toast = useToast();
  const [d, setD] = useState<Partial<Embryo> | null>(null);
  const [busy, setBusy] = useState(false);
  const cur = d ?? e ?? {};
  const set = (k: keyof Embryo, v: unknown) => setD({ ...cur, [k]: v });
  const close = () => { setD(null); onClose(); };
  const growth = (cur.growth ?? {}) as Record<string, string>;

  async function save() {
    if (!e) return;
    setBusy(true);
    try {
      await saveRow("embryos", {
        sample: nul(cur.sample), polar_body: nul(cur.polar_body), breakage: nul(cur.breakage), attempts: num(cur.attempts), spz_morpho: nul(cur.spz_morpho),
        spz_location: nul(cur.spz_location), embryo_source: nul(cur.embryo_source), stage: nul(cur.stage), survival: nul(cur.survival), comments: nul(cur.comments),
        growth, image_paths: cur.image_paths ?? [], status: cur.status ?? "culture",
      }, e.id, e.version);
      toast(`Oocyte ${e.oocyte_no} saved`); refresh(reload, "worklist", "vit"); close();
    } catch (x) { toast((x as Error).message, "danger"); }
    setBusy(false);
  }
  async function attach(file?: File | null) {
    if (!file || !e) return;
    try { const p = await uploadDoc(`embryos/${e.id}`, file); set("image_paths", [...(cur.image_paths ?? []), p]); toast("Image attached — save to keep it"); }
    catch (x) { toast((x as Error).message, "danger"); }
  }

  return (
    <Modal open={!!e} onClose={close} wide title={e ? `Oocyte ${e.oocyte_no} — Embryo growth` : ""}
      footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
      {e && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Sample / Semen No."><Input value={cur.sample ?? ""} onChange={(x) => set("sample", x.target.value)} /></Field>
            <Field label="Embryo Source"><Input value={cur.embryo_source ?? ""} onChange={(x) => set("embryo_source", x.target.value)} /></Field>
            <Field label="Polar Body"><Input value={cur.polar_body ?? ""} onChange={(x) => set("polar_body", x.target.value)} /></Field>
            <Field label="Breakage"><Input value={cur.breakage ?? ""} onChange={(x) => set("breakage", x.target.value)} /></Field>
            <Field label="Attempts"><Input type="number" min={0} inputMode="numeric" value={cur.attempts ?? ""} onChange={(x) => set("attempts", x.target.value)} /></Field>
            <Field label="SPZ Morphology"><Input value={cur.spz_morpho ?? ""} onChange={(x) => set("spz_morpho", x.target.value)} /></Field>
            <Field label="SPZ Location"><Input value={cur.spz_location ?? ""} onChange={(x) => set("spz_location", x.target.value)} /></Field>
            <Field label="Stage"><Input value={cur.stage ?? ""} onChange={(x) => set("stage", x.target.value)} /></Field>
            <Field label="Survival"><Select options={SURVIVAL} value={cur.survival ?? ""} onChange={(x) => set("survival", x.target.value)} /></Field>
          </div>
          <section>
            <h3 className="mb-2 font-semibold">Embryo Growth</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DAYS.map((day) => (
                <Field key={day} label={day}><Input value={growth[day] ?? ""} onChange={(x) => set("growth", { ...growth, [day]: x.target.value })} placeholder="e.g. 8-cell, grade A" /></Field>
              ))}
            </div>
          </section>
          <Field label="Comments"><Textarea value={cur.comments ?? ""} onChange={(x) => set("comments", x.target.value)} /></Field>
          <section>
            <h3 className="mb-2 font-semibold">Embryo Growth Image</h3>
            <div className="flex flex-wrap items-center gap-2">
              {(cur.image_paths ?? []).map((p, i) => (
                <Button key={p} size="sm" onClick={() => openFile(p).catch((x) => toast(x.message, "danger"))}>Image {i + 1}</Button>
              ))}
              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 text-sm text-muted">
                <ImagePlus size={18} /> Attach Embryo Growth Image
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(x) => attach(x.target.files?.[0])} />
              </label>
            </div>
          </section>
          <Field label="Status">
            <Segmented value={cur.status ?? "culture"} onChange={(v) => set("status", v || "culture")} options={["culture", "transferred", "discarded"]} />
            {["vitrified", "biopsied", "thawed"].includes(cur.status ?? "") && <p className="mt-1 text-sm text-muted">Current status “{cur.status}” is managed from the Storage & PGD tab.</p>}
          </Field>
          <p className="text-xs text-muted">Fertilised {fmtDate(fert.fert_date)} · {fert.method}</p>
        </div>
      )}
    </Modal>
  );
}

function FertModal({ cycle, edit, onClose }: { cycle: CycleFull; edit: Partial<Fert> | null; onClose: () => void }) {
  const toast = useToast();
  const staff = useStaff();
  const [d, setD] = useState<Partial<Fert> | null>(null);
  const [busy, setBusy] = useState(false);
  const cur = d ?? edit ?? {};
  const male = cycle.couples.male;
  const samples = useQ<Semen[]>(male && edit ? `semen:${male.id}` : null, () => supabase.from("semen_samples").select("id,collected_at,volume_ml").eq("patient_id", male!.id).order("collected_at", { ascending: false }).limit(20) as never);
  const set = (k: keyof Fert, v: unknown) => setD({ ...cur, [k]: v });
  const close = () => { setD(null); onClose(); };

  async function save() {
    setBusy(true);
    try {
      await saveRow("fertilisations", {
        cycle_id: cycle.id, fert_date: nul(cur.fert_date), inseminated_at: cur.inseminated_at ? new Date(cur.inseminated_at).toISOString() : null, method: nul(cur.method),
        semen_sample_id: nul(cur.semen_sample_id), embryologist1: nul(cur.embryologist1), embryologist2: nul(cur.embryologist2), incubator: nul(cur.incubator),
        successful: cur.successful ?? null, notes: nul(cur.notes),
      }, edit?.id, edit?.version);
      toast("Fertilisation saved"); refresh(`ferts:${cycle.id}`, "worklist"); close();
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  const yn = cur.successful == null ? "" : cur.successful ? "Yes" : "No";
  return (
    <Modal open={!!edit} onClose={close} wide title={edit?.id ? "Edit fertilisation" : "Record fertilisation"}
      footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
      <datalist id="staff2">{staff.map((s) => <option key={s} value={s} />)}</datalist>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Date of fertilisation"><Input type="date" value={cur.fert_date ?? ""} onChange={(e) => set("fert_date", e.target.value)} /></Field>
        <Field label="Date/Time of Insemination / ICSI"><Input type="datetime-local" value={local(cur.inseminated_at) || (cur.inseminated_at ?? "")} onChange={(e) => set("inseminated_at", e.target.value)} /></Field>
        <Field label="Fertilisation Method"><Select options={FERT_METHODS} value={cur.method ?? ""} onChange={(e) => set("method", e.target.value)} /></Field>
        <Field label="Semen Sample id">
          <Select options={(samples.data ?? []).map((s) => ({ value: s.id, label: `${fmtDateTime(s.collected_at)}${s.volume_ml ? ` · ${s.volume_ml} ml` : ""}` }))} value={cur.semen_sample_id ?? ""} onChange={(e) => set("semen_sample_id", e.target.value)} />
        </Field>
        <Field label="Embryologist 1"><Input list="staff2" value={cur.embryologist1 ?? ""} onChange={(e) => set("embryologist1", e.target.value)} /></Field>
        <Field label="Embryologist 2"><Input list="staff2" value={cur.embryologist2 ?? ""} onChange={(e) => set("embryologist2", e.target.value)} /></Field>
        <Field label="Incubator / equipment reference"><Input value={cur.incubator ?? ""} onChange={(e) => set("incubator", e.target.value)} /></Field>
        <Field label="Fertilisation Successful"><Segmented value={yn} onChange={(v) => set("successful", v === "" ? null : v === "Yes")} options={["Yes", "No"]} /></Field>
        <Field label="Comments" className="md:col-span-2"><Textarea value={cur.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
