"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowUpDown, FileText, Pencil, Plus, UserPlus } from "lucide-react";
import { Alert, Badge, Button, Card, DataTable, Field, Input, KV, Modal, Select, Spinner, statusTone, Tabs, Textarea, useToast } from "@/components/ui";
import { useTabTitle } from "@/components/shell";
import { PatientForm, type Patient } from "@/components/patient-form";
import { FormModal, type Response, type Schema } from "@/components/forms";
import { ConsentPanel } from "@/components/consent";
import { DocsPanel } from "@/components/docs";
import { esc, refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { VISIT_TYPES, TREATMENTS, OVUM, SPERM } from "@/lib/consts";
import { age, fmtDate, fmtDateTime, nul, todayISO } from "@/lib/util";

type Couple = {
  id: string; couple_no: string; female_id: string; male_id: string | null; referred_by: string | null; allergies: string | null; version: number;
  female: Patient; male: Patient | null;
};
type Cycle = { id: string; cycle_no: number; cycle_ref: string | null; treatment_type: string; start_date: string | null; status: string; ovum_source: string | null; sperm_source: string | null; protocol_name: string | null };
type Visit = {
  id: string; visit_type: string; visit_at: string; doctor_id: string | null; doctor_name: string | null; reason: string | null;
  complaints: string | null; diagnosis: string | null; status: string; signed_by: string | null; signed_at: string | null; version: number;
};
type Template = { id: string; name: string; category: string; gender: string; schema: Schema };


export default function EMR() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const patient = useQ<Patient>(`patient:${id}`, () => supabase.from("patients").select("*").eq("id", id).single() as never);
  const couple = useQ<Couple | null>(`couple-of:${id}`, () =>
    supabase.from("couples").select("*, female:patients!couples_female_id_fkey(*), male:patients!couples_male_id_fkey(*)")
      .or(`female_id.eq.${id},male_id.eq.${id}`).limit(1).maybeSingle() as never);
  const p = patient.data;
  useTabTitle(p ? `EMR of ${p.full_name}` : undefined);

  if (patient.isLoading && !p) return <Spinner />;
  if (!p) return <Alert tone="danger">Patient not found or you do not have access.</Alert>;
  const partner = couple.data ? (couple.data.female_id === id ? couple.data.male : couple.data.female) : null;

  return (
    <>
      <div className="mb-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.full_name}</h1>
            <p className="text-muted">MRN {p.mrn} · {p.gender}{p.dob ? ` · ${age(p.dob)}` : ""}{p.phone ? ` · ${p.phone}` : ""}{p.blood_group ? ` · ${p.blood_group}` : ""}</p>
            {couple.data && (
              <p className="mt-1 text-sm">Couple No. <b>{couple.data.couple_no}</b>
                {partner && <> · Partner: <Link className="text-brand underline" href={`/patients/${partner.id}`}>{partner.full_name}</Link> ({partner.mrn})</>}
              </p>
            )}
          </div>
          <Button onClick={() => setEditing(true)}><Pencil size={16} /> Edit details</Button>
        </div>
        {(p.allergies || couple.data?.allergies) && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-danger">
            <AlertTriangle size={18} /><span className="font-medium">Allergies:</span> {[p.allergies, couple.data?.allergies].filter(Boolean).join("; ")}
          </div>
        )}
      </div>

      <Tabs tabs={["Overview", "Visits", "Forms & History", "IVF Cycles", "Consents", "Documents", "Billing"]} value={tab} onChange={setTab} />
      {tab === "Overview" && <Overview p={p} couple={couple.data ?? null} />}
      {tab === "Visits" && <Visits p={p} couple={couple.data ?? null} />}
      {tab === "Forms & History" && <Forms p={p} />}
      {tab === "IVF Cycles" && <Cycles p={p} couple={couple.data ?? null} />}
      {tab === "Consents" && <Card><ConsentPanel patientId={id} /></Card>}
      {tab === "Documents" && <Card><DocsPanel patientId={id} /></Card>}
      {tab === "Billing" && <PatientBills patientId={id} />}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit patient details" wide>
        <PatientForm initial={p} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(`patient:${id}`, "patients", "couple-of"); }} />
      </Modal>
    </>
  );
}

function Overview({ p, couple }: { p: Patient; couple: Couple | null }) {
  const visits = useQ<Visit[]>(`visits:${p.id}:recent`, () => supabase.from("visits").select("*").eq("patient_id", p.id).order("visit_at", { ascending: false }).limit(3) as never);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Identity & contact">
        <dl className="grid grid-cols-2 gap-4">
          <KV label="MRN">{p.mrn}</KV><KV label="Gender">{p.gender}</KV>
          <KV label="Date of birth">{p.dob ? `${fmtDate(p.dob)} (${age(p.dob)})` : ""}</KV><KV label="Blood group">{p.blood_group}</KV>
          <KV label="Phone">{p.phone}</KV><KV label="Alternate phone">{p.alt_phone}</KV>
          <KV label="Email">{p.email}</KV><KV label="Referred By">{p.referred_by ?? couple?.referred_by}</KV>
          <div className="col-span-2"><KV label="Address">{p.address}</KV></div>
        </dl>
      </Card>
      <Card title="Recent visits">
        {(visits.data ?? []).length === 0 ? <p className="text-muted">No visits recorded.</p> : (
          <ul className="divide-y divide-line">
            {visits.data!.map((v) => (
              <li key={v.id} className="py-2"><div className="flex justify-between"><b>{v.visit_type}</b><span className="text-muted">{fmtDateTime(v.visit_at)}</span></div>
                <p className="text-sm text-muted">{v.diagnosis || v.reason || "—"}</p></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Visits({ p, couple }: { p: Patient; couple: Couple | null }) {
  const toast = useToast();
  const { profile } = useAuth();
  const [desc, setDesc] = useState(true);
  const [edit, setEdit] = useState<Partial<Visit> | null>(null);
  const [busy, setBusy] = useState(false);
  const key = `visits:${p.id}`;
  const visits = useQ<Visit[]>(key, () => supabase.from("visits").select("*").eq("patient_id", p.id).order("visit_at", { ascending: false }) as never);
  const doctors = useQ<{ id: string; full_name: string }[]>("doctors", () => supabase.from("profiles").select("id, full_name").eq("role", "doctor").eq("active", true) as never);
  const rows = useMemo(() => { const r = [...(visits.data ?? [])]; return desc ? r : r.reverse(); }, [visits.data, desc]);

  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      const doc = doctors.data?.find((d) => d.id === edit.doctor_id);
      await saveRow("visits", {
        patient_id: p.id, couple_id: couple?.id ?? null, visit_type: edit.visit_type || "Consultation",
        visit_at: edit.visit_at ? new Date(edit.visit_at).toISOString() : new Date().toISOString(),
        doctor_id: nul(edit.doctor_id), doctor_name: doc?.full_name ?? nul(edit.doctor_name),
        reason: nul(edit.reason), complaints: nul(edit.complaints), diagnosis: nul(edit.diagnosis),
      }, edit.id, edit.version);
      toast("Visit saved"); refresh(key, `visits:${p.id}`, "registrations"); setEdit(null);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  async function sign(v: Visit) {
    try { await saveRow("visits", { signed_by: profile?.id, signed_at: new Date().toISOString(), status: "signed" }, v.id, v.version); toast("Visit signed"); refresh(key); }
    catch (e) { toast((e as Error).message, "danger"); }
  }
  const local = (iso?: string) => { const d = iso ? new Date(iso) : new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

  return (
    <Card title="Patient Visits" actions={<>
      <Button size="sm" onClick={() => setDesc(!desc)}><ArrowUpDown size={14} /> Sort</Button>
      <Button size="sm" variant="primary" onClick={() => setEdit({ visit_type: "Consultation", visit_at: new Date().toISOString() })}><Plus size={16} /> Register visit</Button></>}>
      {visits.isLoading && !visits.data ? <Spinner /> : (
        <DataTable<Visit> rows={rows} onRow={(v) => !v.signed_at && setEdit(v)} empty="No visits yet."
          cols={[
            { key: "visit_type", label: "Visit Type", primary: true },
            { key: "visit_at", label: "Date", render: (v) => fmtDateTime(v.visit_at) },
            { key: "doctor_name", label: "Doctor", render: (v) => v.doctor_name ?? "—" },
            { key: "reason", label: "Reason for Visit", render: (v) => v.reason ?? "—", low: true },
            { key: "complaints", label: "Chief Complaints", render: (v) => v.complaints ?? "—", low: true },
            { key: "diagnosis", label: "Diagnosis", render: (v) => v.diagnosis ?? "—" },
            { key: "signed", label: "Status", render: (v) => v.signed_at ? <Badge tone="ok">Signed {fmtDate(v.signed_at)}</Badge> : <Badge tone="warn">Open</Badge> },
          ]}
          actions={(v) => !v.signed_at && <Button size="sm" onClick={() => sign(v)}>Sign</Button>} />
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit visit" : "Register visit"}
        footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save visit</Button></>}>
        {edit && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Visit type"><Select options={VISIT_TYPES} value={edit.visit_type ?? ""} onChange={(e) => setEdit({ ...edit, visit_type: e.target.value })} /></Field>
            <Field label="Date & time"><Input type="datetime-local" value={local(edit.visit_at)} onChange={(e) => setEdit({ ...edit, visit_at: e.target.value })} /></Field>
            <Field label="Doctor">
              {doctors.data?.length ? <Select options={doctors.data.map((d) => ({ value: d.id, label: d.full_name }))} value={edit.doctor_id ?? ""} onChange={(e) => setEdit({ ...edit, doctor_id: e.target.value })} />
                : <Input value={edit.doctor_name ?? ""} onChange={(e) => setEdit({ ...edit, doctor_name: e.target.value })} />}
            </Field>
            <Field label="Reason for Visit"><Input value={edit.reason ?? ""} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} /></Field>
            <Field label="Chief Complaints" className="md:col-span-2"><Textarea value={edit.complaints ?? ""} onChange={(e) => setEdit({ ...edit, complaints: e.target.value })} /></Field>
            <Field label="Diagnosis" className="md:col-span-2"><Textarea value={edit.diagnosis ?? ""} onChange={(e) => setEdit({ ...edit, diagnosis: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function Forms({ p }: { p: Patient }) {
  const templates = useQ<Template[]>("templates:active", () => supabase.from("templates").select("*").eq("active", true).order("name") as never);
  const responses = useQ<Response[]>(`responses:${p.id}`, () => supabase.from("form_responses").select("*").eq("patient_id", p.id).order("created_at", { ascending: false }) as never);
  const [open, setOpen] = useState<{ t: Template; r: Response | null } | null>(null);
  const avail = (templates.data ?? []).filter((t) => t.gender === "All" || t.gender === p.gender);
  const byId = new Map((templates.data ?? []).map((t) => [t.id, t]));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Fill a form">
        {avail.length === 0 ? <p className="text-muted">No templates available.</p> : (
          <ul className="divide-y divide-line">
            {avail.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                <div><div className="font-medium">{t.name}</div><div className="text-sm text-muted">{t.category}</div></div>
                <Button size="sm" onClick={() => setOpen({ t, r: null })}><FileText size={16} /> New</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Saved forms">
        <DataTable<Response> rows={responses.data ?? []} empty="No forms saved yet."
          onRow={(r) => byId.get(r.template_id) && setOpen({ t: byId.get(r.template_id)!, r })}
          cols={[
            { key: "t", label: "Form", primary: true, render: (r) => byId.get(r.template_id)?.name ?? "Form" },
            { key: "created_at", label: "Created", render: (r) => fmtDateTime(r.created_at) },
            { key: "s", label: "Status", render: (r) => r.signed_at ? <Badge tone="ok">Signed</Badge> : <Badge tone="warn">Draft</Badge> },
          ]} />
      </Card>
      <FormModal key={open?.r?.id ?? open?.t.id ?? "none"} open={!!open} onClose={() => setOpen(null)} template={open?.t ?? null} patientId={p.id}
        existing={open?.r} onSaved={() => refresh(`responses:${p.id}`)} />
    </div>
  );
}

function Cycles({ p, couple }: { p: Patient; couple: Couple | null }) {
  const router = useRouter();
  const toast = useToast();
  const [linking, setLinking] = useState(false);
  const [newCycle, setNewCycle] = useState(false);
  const cycles = useQ<Cycle[]>(couple ? `cycles:couple:${couple.id}` : null, () => supabase.from("cycles").select("*").eq("couple_id", couple!.id).order("cycle_no", { ascending: false }) as never);

  return (
    <>
      {!couple ? (
        <Card title="Couple">
          <p className="mb-3 text-muted">Link a partner to start IVF cycles. A couple number is generated automatically.</p>
          <Button variant="primary" onClick={() => setLinking(true)}><UserPlus size={18} /> Create couple / link partner</Button>
        </Card>
      ) : (
        <Card title={`IVF Cycles — Couple No. ${couple.couple_no}`} actions={<Button size="sm" variant="primary" onClick={() => setNewCycle(true)}><Plus size={16} /> New cycle</Button>}>
          <DataTable<Cycle> rows={cycles.data ?? []} empty="No cycles yet." onRow={(c) => router.push(`/cycles/${c.id}`)}
            cols={[
              { key: "cycle_no", label: "Cycle No.", primary: true, render: (c) => `${c.cycle_no}${c.cycle_ref ? ` (${c.cycle_ref})` : ""}` },
              { key: "treatment_type", label: "Treatment" },
              { key: "ovum", label: "Ovum", render: (c) => c.ovum_source ?? "—", low: true },
              { key: "sperm", label: "Sperm", render: (c) => c.sperm_source ?? "—", low: true },
              { key: "start_date", label: "Start Date", render: (c) => fmtDate(c.start_date) },
              { key: "status", label: "Status", render: (c) => <Badge tone={statusTone(c.status)}>{c.status}</Badge> },
            ]} />
        </Card>
      )}
      <LinkPartner open={linking} onClose={() => setLinking(false)} p={p} />
      {couple && <NewCycle open={newCycle} onClose={() => setNewCycle(false)} couple={couple} count={cycles.data?.[0]?.cycle_no ?? 0}
        onCreated={(id) => { toast("Cycle created"); router.push(`/cycles/${id}`); }} />}
    </>
  );
}

function LinkPartner({ open, onClose, p }: { open: boolean; onClose: () => void; p: Patient }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const opp = p.gender === "Male" ? "Female" : "Male";
  const found = useQ<Patient[]>(open && q.trim().length > 1 ? `partner-search:${q}` : null, () =>
    supabase.from("patients").select("*").neq("id", p.id).or(`full_name.ilike.%${esc(q)}%,mrn.ilike.%${esc(q)}%,phone.ilike.%${esc(q)}%`).limit(8) as never);

  async function make(partner: Patient | null) {
    try {
      // The female partner is the primary record; same-sex or other pairings are left to the clinic to confirm.
      const female = p.gender === "Male" ? partner : p;
      const male = p.gender === "Male" ? p : partner;
      if (!female) throw new Error("A female patient is required for an IVF couple record.");
      await saveRow("couples", { female_id: female.id, male_id: male?.id ?? null });
      toast("Couple created"); refresh("couple-of", "cycles:"); onClose();
    } catch (e) { toast((e as Error).message, "danger"); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Create couple / link partner" wide>
      {creating ? (
        <PatientForm defaultGender={opp} onCancel={() => setCreating(false)} onSaved={(np) => make(np)} />
      ) : (
        <div className="space-y-4">
          <Field label="Search existing patient (MRN, name or phone)"><Input value={q} onChange={(e) => setQ(e.target.value)} autoFocus /></Field>
          <DataTable<Patient> rows={found.data ?? []} empty={q.length > 1 ? "No match." : "Type to search."} onRow={(x) => make(x)}
            cols={[{ key: "mrn", label: "MRN" }, { key: "full_name", label: "Name", primary: true }, { key: "gender", label: "Gender" }, { key: "phone", label: "Phone", render: (x) => x.phone ?? "—" }]} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setCreating(true)}><UserPlus size={16} /> Register new {opp.toLowerCase()} partner</Button>
            {p.gender !== "Male" && <Button onClick={() => make(null)}>Create without partner</Button>}
          </div>
        </div>
      )}
    </Modal>
  );
}

function NewCycle({ open, onClose, couple, count, onCreated }: { open: boolean; onClose: () => void; couple: Couple; count: number; onCreated: (id: string) => void }) {
  const toast = useToast();
  const [f, setF] = useState({ treatment_type: "IVF (ICSI)", ovum_source: OVUM[0], sperm_source: SPERM[0], protocol_name: "", daily_dose: "", start_date: todayISO() });
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      const n = count + 1;
      const c = await saveRow("cycles", { ...f, protocol_name: nul(f.protocol_name), daily_dose: nul(f.daily_dose), couple_id: couple.id, cycle_no: n, cycle_ref: `${couple.couple_no}/C${n}`, status: "Planned" });
      refresh("cycles:"); onCreated(c.id);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  return (
    <Modal open={open} onClose={onClose} title={`New cycle ${count + 1}`}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Create cycle</Button></>}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Treatment"><Select options={TREATMENTS} value={f.treatment_type} onChange={(e) => setF({ ...f, treatment_type: e.target.value })} /></Field>
        <Field label="Start Date"><Input type="date" value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
        <Field label="Ovum"><Select options={OVUM} value={f.ovum_source} onChange={(e) => setF({ ...f, ovum_source: e.target.value })} /></Field>
        <Field label="Sperm"><Select options={SPERM} value={f.sperm_source} onChange={(e) => setF({ ...f, sperm_source: e.target.value })} /></Field>
        <Field label="Protocol Name"><Input value={f.protocol_name} onChange={(e) => setF({ ...f, protocol_name: e.target.value })} /></Field>
        <Field label="Daily Dose"><Input value={f.daily_dose} onChange={(e) => setF({ ...f, daily_dose: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}

function PatientBills({ patientId }: { patientId: string }) {
  const router = useRouter();
  const bills = useQ<{ id: string; bill_no: string; kind: string; total: number; status: string; created_at: string }[]>(`bills:patient:${patientId}`, () =>
    supabase.from("bills").select("id,bill_no,kind,total,status,created_at").eq("patient_id", patientId).order("created_at", { ascending: false }) as never);
  return (
    <Card title="Bills" actions={<Link href={`/billing/new?patient=${patientId}`}><Button size="sm" variant="primary"><Plus size={16} /> New bill</Button></Link>}>
      <DataTable rows={bills.data ?? []} empty="No bills yet." onRow={(b) => router.push(`/billing/${b.id}`)}
        cols={[
          { key: "bill_no", label: "Bill No.", primary: true }, { key: "kind", label: "Type" },
          { key: "total", label: "Total", render: (b) => `₹${Number(b.total).toLocaleString("en-IN")}` },
          { key: "status", label: "Status", render: (b) => <Badge tone={statusTone(b.status)}>{b.status}</Badge> },
          { key: "created_at", label: "Date", render: (b) => fmtDate(b.created_at) },
        ]} />
    </Card>
  );
}

