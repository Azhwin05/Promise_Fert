"use client";
import { useState } from "react";
import { Camera } from "lucide-react";
import { Alert, Button, Field, Input, Select, Textarea, useToast } from "./ui";
import { saveRow, uploadDoc } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { nul } from "@/lib/util";

export type Patient = {
  id: string; mrn: string; full_name: string; gender: string; dob: string | null; phone: string | null; alt_phone: string | null;
  email: string | null; address: string | null; blood_group: string | null; allergies: string | null; referred_by: string | null;
  photo_path: string | null; id_proof_path: string | null; version: number;
};

export const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/** Create or edit a patient with duplicate detection (same phone, or very similar name + DOB). */
export function PatientForm({ initial, defaultGender, onSaved, onCancel }:
  { initial?: Patient; defaultGender?: string; onSaved: (p: Patient) => void; onCancel?: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({
    full_name: initial?.full_name ?? "", gender: initial?.gender ?? defaultGender ?? "Female", dob: initial?.dob ?? "",
    phone: initial?.phone ?? "", alt_phone: initial?.alt_phone ?? "", email: initial?.email ?? "", address: initial?.address ?? "",
    blood_group: initial?.blood_group ?? "", allergies: initial?.allergies ?? "", referred_by: initial?.referred_by ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [dups, setDups] = useState<Patient[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent, force = false) {
    e.preventDefault();
    if (busy) return; // prevent duplicate submissions
    setBusy(true);
    try {
      if (!initial && !force) {
        const ors = [f.phone && `phone.eq.${f.phone}`, f.full_name && f.dob && `and(full_name.ilike.${f.full_name.replace(/[,()]/g, " ")},dob.eq.${f.dob})`].filter(Boolean);
        if (ors.length) {
          const { data } = await supabase.from("patients").select("*").or(ors.join(",")).is("deleted_at", null).limit(5);
          if (data?.length) { setDups(data as Patient[]); setBusy(false); return; }
        }
      }
      const row: Record<string, unknown> = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, nul(v)]));
      let p = (await saveRow("patients", row, initial?.id, initial?.version)) as Patient;
      const up: Record<string, unknown> = {};
      if (photo) up.photo_path = await uploadDoc(`patients/${p.id}`, photo);
      if (idProof) up.id_proof_path = await uploadDoc(`patients/${p.id}`, idProof);
      if (Object.keys(up).length) p = (await saveRow("patients", up, p.id)) as Patient;
      toast(initial ? "Patient updated" : `Registered ${p.mrn}`);
      onSaved(p);
    } catch (err) { toast((err as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <form onSubmit={(e) => submit(e)} className="space-y-4">
      {dups.length > 0 && (
        <Alert tone="warn">
          <p className="font-medium">Possible duplicate patient{dups.length > 1 ? "s" : ""} found:</p>
          <ul className="mt-1 list-disc pl-5">{dups.map((d) => <li key={d.id}>{d.mrn} — {d.full_name} ({d.phone ?? "no phone"})</li>)}</ul>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={(e) => submit(e, true)}>Register anyway</Button>
            <Button size="sm" variant="ghost" onClick={() => setDups([])}>Review details</Button>
          </div>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" required><Input required value={f.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="off" /></Field>
        <Field label="Gender" required><Select required options={["Female", "Male", "Other"]} value={f.gender} onChange={(e) => set("gender", e.target.value)} /></Field>
        <Field label="Date of birth"><Input type="date" max={new Date().toISOString().slice(0, 10)} value={f.dob} onChange={(e) => set("dob", e.target.value)} /></Field>
        <Field label="Blood group"><Select options={BLOOD} value={f.blood_group} onChange={(e) => set("blood_group", e.target.value)} /></Field>
        <Field label="Phone"><Input type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Alternate phone"><Input type="tel" inputMode="tel" value={f.alt_phone} onChange={(e) => set("alt_phone", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Referred By"><Input value={f.referred_by} onChange={(e) => set("referred_by", e.target.value)} /></Field>
        <Field label="Address" className="md:col-span-2"><Textarea value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="Allergies" className="md:col-span-2"><Input value={f.allergies} onChange={(e) => set("allergies", e.target.value)} placeholder="e.g. antihistamines, wheat & gluten" /></Field>
        <Field label="Photograph" hint="Take a photo or choose a file">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 text-sm text-muted">
            <Camera size={18} /> {photo?.name ?? (initial?.photo_path ? "Replace photograph" : "Add photograph")}
            <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
        <Field label="Identity document" hint="Confirm mandatory documents with the clinic">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 text-sm text-muted">
            <Camera size={18} /> {idProof?.name ?? (initial?.id_proof_path ? "Replace identity document" : "Add identity document")}
            <input type="file" accept="image/*,application/pdf" capture="environment" className="sr-only" onChange={(e) => setIdProof(e.target.files?.[0] ?? null)} />
          </label>
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" loading={busy}>{initial ? "Save changes" : "Register patient"}</Button>
      </div>
    </form>
  );
}
