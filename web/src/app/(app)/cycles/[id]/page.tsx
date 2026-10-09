"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Alert, Badge, Button, Card, KV, Select, Spinner, statusTone, Tabs, useToast } from "@/components/ui";
import { useTabTitle } from "@/components/shell";
import { StimTab } from "@/components/cycle/stim";
import { OpuTab, OutcomeTab } from "@/components/cycle/opu-outcome";
import { EmbryoTab } from "@/components/cycle/embryo";
import { StorageTab } from "@/components/cycle/storage";
import { ConsentPanel } from "@/components/consent";
import { CounsellingPanel } from "@/components/counselling";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { CYCLE_STATUS } from "@/lib/consts";
import { age, fmtDate } from "@/lib/util";
import type { CycleFull, Opu, Outcome } from "@/lib/types";

const TABS = ["Overview", "Stimulation", "OPU", "Embryology", "Storage & PGD", "Outcome", "Consent & Counselling", "Billing"];

export default function CyclePage() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const [tab, setTab] = useState(TABS.includes(sp.get("tab") ?? "") ? sp.get("tab")! : "Overview");
  const toast = useToast();
  const { data: c, isLoading } = useQ<CycleFull>(`cycle:${id}`, () =>
    supabase.from("cycles").select("*, couples(id, couple_no, referred_by, allergies, female:patients!couples_female_id_fkey(id,mrn,full_name,gender,dob,phone,allergies), male:patients!couples_male_id_fkey(id,mrn,full_name,gender,dob,phone,allergies))").eq("id", id).single() as never);
  useEffect(() => { const t = sp.get("tab"); if (t && TABS.includes(t)) setTab(t); }, [sp]);
  useTabTitle(c ? `Cycle ${c.cycle_no} · ${c.couples.female.full_name}` : undefined);

  if (isLoading && !c) return <Spinner />;
  if (!c) return <Alert tone="danger">Cycle not found or you do not have access.</Alert>;
  const { female, male } = c.couples;
  const allergies = [female.allergies, male?.allergies, c.couples.allergies].filter(Boolean).join("; ");

  async function setStatus(status: string) {
    if (!status || status === c!.status) return;
    if (status === "Cancelled" && !confirm("Cancel this cycle?")) return;
    try { await saveRow("cycles", { status }, c!.id, c!.version); toast(`Status: ${status}`); refresh("cycle:", "worklist", `cycles:`); }
    catch (e) { toast((e as Error).message, "danger"); }
  }

  return (
    <>
      <div className="mb-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Couple No. <b className="text-ink">{c.couples.couple_no}</b> · Cycle No. <b className="text-ink">{c.cycle_no}</b>{c.cycle_ref ? ` (${c.cycle_ref})` : ""}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
              <Link href={`/patients/${female.id}`} className="hover:underline">{female.full_name}</Link>
              {male && <> <span className="text-muted">&amp;</span> <Link href={`/patients/${male.id}`} className="hover:underline">{male.full_name}</Link></>}
            </h1>
            <p className="text-sm text-muted">
              {female.mrn} · {age(female.dob)} F{female.phone ? ` · ${female.phone}` : ""}{male ? ` — ${male.mrn} · ${age(male.dob)} M${male.phone ? ` · ${male.phone}` : ""}` : ""}
            </p>
          </div>
          <div className="w-60"><Select placeholder={c.status} options={CYCLE_STATUS} value="" onChange={(e) => setStatus(e.target.value)} aria-label="Change cycle status" /></div>
        </div>
        {allergies && <div className="mt-3 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2 text-danger"><AlertTriangle size={18} /><b>Allergies:</b> {allergies}</div>}
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "Overview" && <Overview c={c} />}
      {tab === "Stimulation" && <StimTab cycle={c} />}
      {tab === "OPU" && <OpuTab cycle={c} />}
      {tab === "Embryology" && <EmbryoTab cycle={c} />}
      {tab === "Storage & PGD" && <StorageTab cycle={c} />}
      {tab === "Outcome" && <OutcomeTab cycle={c} />}
      {tab === "Consent & Counselling" && (
        <div className="space-y-4">
          <Card title="Consents"><ConsentPanel patientId={female.id} cycleId={c.id} /></Card>
          <Card title="Counselling notes"><CounsellingPanel coupleId={c.couples.id} /></Card>
        </div>
      )}
      {tab === "Billing" && (
        <Card title="Billing for this cycle">
          <p className="mb-3 text-muted">Create a bill linked to this cycle, then collect receipts against it.</p>
          <Link href={`/billing/new?patient=${female.id}&cycle=${c.id}`}><Button variant="primary">New bill for this cycle</Button></Link>
        </Card>
      )}
    </>
  );
}

function Overview({ c }: { c: CycleFull }) {
  const opu = useQ<Opu | null>(`opu:${c.id}`, () => supabase.from("opu").select("*").eq("cycle_id", c.id).maybeSingle() as never);
  const out = useQ<Outcome[]>(`outcomes:${c.id}`, () => supabase.from("outcomes").select("*").eq("cycle_id", c.id).order("created_at", { ascending: false }) as never);
  const o = opu.data;
  const last = out.data?.[0];
  const stat = (label: string, v: number | null | undefined) => <KV label={label}>{v ?? ""}</KV>;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Treatment">
        <dl className="grid grid-cols-2 gap-4">
          <KV label="Treatment">{c.treatment_type}</KV><KV label="Status"><Badge tone={statusTone(c.status)}>{c.status}</Badge></KV>
          <KV label="Ovum">{c.ovum_source}</KV><KV label="Sperm">{c.sperm_source}</KV>
          <KV label="Treatment Protocol">{c.protocol_name}</KV><KV label="Daily Dose">{c.daily_dose}</KV>
          <KV label="Start Date">{fmtDate(c.start_date)}</KV><KV label="Referred By">{c.couples.referred_by}</KV>
          <KV label="OPU done on">{o?.opu_at ? fmtDate(o.opu_at) : ""}</KV>
        </dl>
      </Card>
      <Card title="Oocytes & fertilisation">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stat("No. of embryos obtained", o?.embryos_obtained)}{stat("Mature Oocytes", o?.mature_oocytes)}{stat("Immature Oocytes", o?.immature_oocytes)}
          {stat("Metaphase II", o?.metaphase_ii)}{stat("Metaphase I", o?.metaphase_i)}{stat("Microinjected", o?.microinjected)}
          {stat("Normal Fertilisation (2 PN)", o?.fert_2pn)}{stat("Abnormal (1PN)", o?.fert_1pn)}{stat("Abnormal (>= 3PN)", o?.fert_3pn)}
        </dl>
      </Card>
      <Card title="Latest outcome" className="lg:col-span-2">
        {last ? (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KV label="Transfer Date">{fmtDate(last.transfer_date)}</KV>
            <KV label="Pregnancy">{last.pregnancy == null ? "" : last.pregnancy ? "Yes" : "No"}</KV>
            <KV label="Beta HCG">{last.beta_hcg_value != null ? String(last.beta_hcg_value) : ""}</KV>
            <KV label="Clinical Pregnancy">{last.clinical_pregnancy == null ? "" : last.clinical_pregnancy ? "Yes" : "No"}</KV>
          </dl>
        ) : <p className="text-muted">No outcome recorded.</p>}
      </Card>
    </div>
  );
}
