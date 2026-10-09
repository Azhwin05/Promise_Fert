"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Select, Spinner, statusTone, useToast } from "@/components/ui";
import { PatientPicker } from "@/components/picker";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { nul, todayISO } from "@/lib/util";
import type { PatientLite } from "@/lib/types";

type Appt = { id: string; patient_id: string; doctor_name: string | null; starts_at: string; duration_min: number; reason: string | null; status: string; version: number; patients: { mrn: string; full_name: string; phone: string | null } };
const STATUS = ["scheduled", "arrived", "completed", "cancelled", "no_show"];

export default function Appointments() {
  const toast = useToast();
  const [date, setDate] = useState(todayISO());
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(false);
  const [pat, setPat] = useState<PatientLite | null>(null);
  const [f, setF] = useState({ time: "10:00", duration_min: "15", doctor_name: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const key = `appts:${date}`;
  const { data, isLoading } = useQ<Appt[]>(key, () => {
    const s = new Date(`${date}T00:00:00`), e = new Date(`${date}T23:59:59`);
    return supabase.from("appointments").select("*, patients(mrn,full_name,phone)").gte("starts_at", s.toISOString()).lte("starts_at", e.toISOString()).order("starts_at") as never;
  });
  const shift = (n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d.toISOString().slice(0, 10)); };

  async function create() {
    if (!pat) return toast("Select a patient", "danger");
    setBusy(true);
    try {
      await saveRow("appointments", { patient_id: pat.id, starts_at: new Date(`${date}T${f.time}`).toISOString(), duration_min: Number(f.duration_min) || 15, doctor_name: nul(f.doctor_name), reason: nul(f.reason) });
      toast("Appointment scheduled"); refresh("appts:", "dash:"); setOpen(false); setPat(null);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  async function setStatus(a: Appt, status: string) {
    try { await saveRow("appointments", { status }, a.id, a.version); refresh("appts:"); } catch (e) { toast((e as Error).message, "danger"); }
  }

  return (
    <>
      <PageHeader title="Schedule Appointments" actions={<Button variant="primary" onClick={() => setOpen(true)}><Plus size={18} /> New appointment</Button>} />
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Button aria-label="Previous day" onClick={() => shift(-1)}><ChevronLeft size={18} /></Button>
          <Input type="date" className="max-w-48" value={date} onChange={(e) => setDate(e.target.value)} />
          <Button aria-label="Next day" onClick={() => shift(1)}><ChevronRight size={18} /></Button>
          <Button variant="ghost" onClick={() => setDate(todayISO())}>Today</Button>
        </div>
        {isLoading && !data ? <Spinner /> : (
          <DataTable<Appt> rows={data ?? []} empty="No appointments on this day."
            cols={[
              { key: "time", label: "Time", primary: true, render: (a) => new Date(a.starts_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) },
              { key: "patient", label: "Patient", render: (a) => `${a.patients.full_name} (${a.patients.mrn})` },
              { key: "doctor", label: "Doctor", render: (a) => a.doctor_name ?? "—", low: true },
              { key: "reason", label: "Reason", render: (a) => a.reason ?? "—", low: true },
              { key: "status", label: "Status", render: (a) => <Badge tone={statusTone(a.status)}>{a.status.replace("_", " ")}</Badge> },
            ]}
            actions={(a) => <div className="w-36"><Select aria-label="Set status" placeholder="Set status…" options={STATUS.filter((s) => s !== a.status)} value="" onChange={(e) => setStatus(a, e.target.value)} /></div>} />
        )}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="New appointment"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" loading={busy} onClick={create}>Schedule</Button></>}>
        <div className="space-y-4">
          <Field label="Patient" required><Button type="button" className="w-full justify-start" onClick={() => setPick(true)}>{pat ? `${pat.full_name} (${pat.mrn})` : "Select patient…"}</Button></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Time"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
            <Field label="Duration (min)"><Input type="number" min={5} step={5} value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: e.target.value })} /></Field>
          </div>
          <Field label="Doctor"><Input value={f.doctor_name} onChange={(e) => setF({ ...f, doctor_name: e.target.value })} /></Field>
          <Field label="Reason"><Input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
        </div>
      </Modal>
      <PatientPicker open={pick} onClose={() => setPick(false)} onPick={setPat} />
    </>
  );
}
