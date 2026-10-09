"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flame, RefreshCw, Send } from "lucide-react";
import { Alert, Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Spinner, statusTone, useToast, type Col } from "@/components/ui";
import { PgdResultModal, type Pgd } from "@/components/cycle/storage";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { renewVit, thawItem, VIT_SELECT_FULL, type Vit, type VitItem } from "@/lib/lab";
import { endOfDay, fmtDate, startOfDay, todayISO } from "@/lib/util";

type CyRow = {
  id: string; cycle_no: number; treatment_type: string; start_date: string | null; status: string; ovum_source: string | null; sperm_source: string | null;
  couples: { couple_no: string; female: { full_name: string; mrn: string }; male: { full_name: string } | null };
};
const CY = "id,cycle_no,treatment_type,start_date,status,ovum_source,sperm_source,couples(couple_no,female:patients!couples_female_id_fkey(full_name,mrn),male:patients!couples_male_id_fkey(full_name))";

const cycleCols = (extra: Col<CyRow>[] = []): Col<CyRow>[] => [
  { key: "couple", label: "Couple No.", render: (c) => c.couples.couple_no },
  { key: "pat", label: "Patient", primary: true, render: (c) => `${c.couples.female.full_name} (${c.couples.female.mrn})` },
  { key: "partner", label: "Partner", render: (c) => c.couples.male?.full_name ?? "—", low: true },
  { key: "cycle", label: "Cycle", render: (c) => `#${c.cycle_no} · ${c.treatment_type}` },
  ...extra,
  { key: "status", label: "Status", render: (c) => <Badge tone={statusTone(c.status)}>{c.status}</Badge> },
];

type CycleList = { title: string; tab: string; note?: string; build: () => unknown; map?: (rows: never[]) => CyRow[] };

const CYCLE_LISTS: Record<string, CycleList> = {
  opu: { title: "Patients for OPU", tab: "OPU", build: () => supabase.from("cycles").select(CY).in("status", ["Planned", "Stimulation", "Stimulation Completed"]).not("treatment_type", "ilike", "IUI%").order("start_date") },
  et: { title: "Patients for ET", tab: "Outcome", note: "Cycles with oocytes retrieved or embryos in culture.", build: () => supabase.from("cycles").select(CY).in("status", ["OPU Done", "Embryo Culture"]).order("start_date") },
  iui: { title: "Patients for IUI", tab: "Outcome", build: () => supabase.from("cycles").select(CY).ilike("treatment_type", "IUI%").not("status", "in", "(Completed,Cancelled)").order("start_date") },
  "prepare-embryos": { title: "Prepare Embryos", tab: "Embryology", note: "OPU done; fertilisation not yet recorded or in progress.", build: () => supabase.from("cycles").select(CY).eq("status", "OPU Done").order("start_date") },
  "donor-fertilise": { title: "Fertilise Donor Oocyte and Sperm", tab: "Embryology", build: () => supabase.from("cycles").select(CY).or("ovum_source.ilike.%Donor%,sperm_source.ilike.%Donor%").not("status", "in", "(Completed,Cancelled)").order("start_date") },
};

export default function Worklist() {
  const { slug } = useParams<{ slug: string }>();
  const cfg = CYCLE_LISTS[slug];
  if (cfg) return <CycleWorklist cfg={cfg} slug={slug} />;
  switch (slug) {
    case "surgeries": return <Surgeries />;
    case "monitor-embryos": return <CultureCycles title="Monitor Embryos" tab="Embryology" />;
    case "vitrify": return <CultureCycles title="Vitrify Embryos" tab="Storage & PGD" />;
    case "donor-fertilisations": return <DonorFerts />;
    case "vitrifications": return <Vitrifications kind="embryo" title="View Embryo Vitrifications" />;
    case "vitrified-embryos": return <StoredItems kind="embryo" title="View Vitrified Embryos" />;
    case "vitrified-oocytes": return <StoredItems kind="oocyte" title="View Vitrified Oocytes" />;
    case "thaw": return <StoredItems kind="embryo" title="Thaw Embryos" thaw />;
    case "renew": return <Renewals />;
    case "pgd-send": return <PgdSend />;
    case "pgd-receive": return <PgdReceive />;
    default: return <Alert tone="danger">Unknown worklist.</Alert>;
  }
}

function CycleWorklist({ cfg, slug }: { cfg: CycleList; slug: string }) {
  const router = useRouter();
  const { data, isLoading } = useQ<CyRow[]>(`worklist:${slug}`, () => cfg.build() as never);
  return (
    <>
      <PageHeader title={cfg.title} subtitle={cfg.note} />
      <Card>{isLoading && !data ? <Spinner /> : <DataTable<CyRow> rows={data ?? []} empty="Nothing in this worklist." onRow={(c) => router.push(`/cycles/${c.id}?tab=${encodeURIComponent(cfg.tab)}`)}
        cols={cycleCols([{ key: "start", label: "Start", render: (c) => fmtDate(c.start_date), low: true }])} />}</Card>
    </>
  );
}

function CultureCycles({ title, tab }: { title: string; tab: string }) {
  const router = useRouter();
  const { data, isLoading } = useQ<{ n: number; cycle: CyRow }[]>(`worklist:culture:${tab}`, async () => {
    const { data, error } = await supabase.from("embryos").select(`id, fertilisations!inner(cycle_id, cycles!inner(${CY}))`).eq("status", "culture");
    if (error) return { data: null, error };
    const m = new Map<string, { n: number; cycle: CyRow }>();
    (data as unknown as { fertilisations: { cycles: CyRow } }[]).forEach((e) => {
      const c = e.fertilisations.cycles;
      m.set(c.id, { n: (m.get(c.id)?.n ?? 0) + 1, cycle: c });
    });
    return { data: [...m.values()], error: null };
  });
  const rows = (data ?? []).map((x) => ({ ...x.cycle, embryos: x.n }));
  return (
    <>
      <PageHeader title={title} subtitle="Cycles with embryos currently in culture" />
      <Card>{isLoading && !data ? <Spinner /> : <DataTable<CyRow & { embryos: number }> rows={rows} empty="No embryos in culture." onRow={(c) => router.push(`/cycles/${c.id}?tab=${encodeURIComponent(tab)}`)}
        cols={[...cycleCols(), { key: "embryos", label: "Embryos in culture" }] as Col<CyRow & { embryos: number }>[]} />}</Card>
    </>
  );
}

function Surgeries() {
  const router = useRouter();
  const { data, isLoading } = useQ<{ id: string; opu_at: string; surgeon: string | null; cycles: CyRow }[]>("worklist:surgeries", () =>
    supabase.from("opu").select(`id,opu_at,surgeon,cycles!inner(${CY})`).gte("opu_at", startOfDay()).lte("opu_at", endOfDay()).order("opu_at") as never);
  return (
    <>
      <PageHeader title="Hospital Surgeries for Today" />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable rows={data ?? []} empty="No surgeries scheduled for today." onRow={(o) => router.push(`/cycles/${o.cycles.id}?tab=OPU`)}
          cols={[
            { key: "t", label: "Time", primary: true, render: (o) => new Date(o.opu_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) },
            { key: "p", label: "Patient", render: (o) => `${o.cycles.couples.female.full_name} (${o.cycles.couples.female.mrn})` },
            { key: "pr", label: "Procedure", render: () => "OPU" }, { key: "s", label: "Surgeon", render: (o) => o.surgeon ?? "—" },
          ]} />
      )}</Card>
    </>
  );
}

function DonorFerts() {
  const router = useRouter();
  const { data, isLoading } = useQ<{ id: string; fert_date: string | null; method: string | null; successful: boolean | null; cycles: CyRow }[]>("worklist:donor-ferts", () =>
    supabase.from("fertilisations").select(`id,fert_date,method,successful,cycles!inner(${CY})`).or("ovum_source.ilike.%Donor%,sperm_source.ilike.%Donor%", { referencedTable: "cycles" }).order("fert_date", { ascending: false }) as never);
  return (
    <>
      <PageHeader title="View Donor Fertilisations" />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable rows={data ?? []} empty="No donor fertilisations." onRow={(f) => router.push(`/cycles/${f.cycles.id}?tab=Embryology`)}
          cols={[
            { key: "c", label: "Couple No.", render: (f) => f.cycles.couples.couple_no }, { key: "p", label: "Patient", primary: true, render: (f) => f.cycles.couples.female.full_name },
            { key: "o", label: "Ovum", render: (f) => f.cycles.ovum_source ?? "—" }, { key: "s", label: "Sperm", render: (f) => f.cycles.sperm_source ?? "—" },
            { key: "d", label: "Date of fertilisation", render: (f) => fmtDate(f.fert_date) }, { key: "m", label: "Method", render: (f) => f.method ?? "—" },
            { key: "ok", label: "Successful", render: (f) => (f.successful == null ? "—" : f.successful ? "Yes" : "No") },
          ]} />
      )}</Card>
    </>
  );
}

const vitCols = (extra?: Col<Vit>[]): Col<Vit>[] => [
  { key: "mrn", label: "Patient MRN", render: (v) => v.cycles?.couples.female.mrn ?? "—" },
  { key: "c", label: "Couple No", render: (v) => v.cycles?.couples.couple_no ?? "—" },
  { key: "p", label: "Patient Name", primary: true, render: (v) => v.cycles?.couples.female.full_name ?? "—" },
  { key: "pt", label: "Partner Name", render: (v) => v.cycles?.couples.male?.full_name ?? "—", low: true },
  { key: "d", label: "Vitrification Date", render: (v) => fmtDate(v.vit_date) },
  { key: "n", label: "No of embryos vitrified", render: (v) => v.item_count },
  { key: "by", label: "Done By", render: (v) => v.done_by ?? "—" },
  ...(extra ?? []),
];

function Vitrifications({ kind, title }: { kind: "embryo" | "oocyte"; title: string }) {
  const toast = useToast();
  const { data, isLoading } = useQ<Vit[]>(`vit:list:${kind}`, () => supabase.from("vitrifications").select(VIT_SELECT_FULL).eq("kind", kind).order("vit_date", { ascending: false }) as never);
  const [e, setE] = useState<Vit | null>(null);
  const [f, setF] = useState({ vit_date: "", done_by: "", contract_ref: "" });
  async function save() {
    try { await saveRow("vitrifications", { vit_date: f.vit_date, done_by: f.done_by || null, contract_ref: f.contract_ref || null }, e!.id, e!.version); toast("Vitrification updated"); refresh("vit"); setE(null); }
    catch (x) { toast((x as Error).message, "danger"); }
  }
  return (
    <>
      <PageHeader title={title} />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<Vit> rows={data ?? []} empty="No vitrifications recorded."
          cols={vitCols([{ key: "k", label: "Vitrification Contract", render: (v) => v.contract_ref ?? "—", low: true }])}
          actions={(v) => <Button size="sm" onClick={() => { setE(v); setF({ vit_date: v.vit_date, done_by: v.done_by ?? "", contract_ref: v.contract_ref ?? "" }); }}>Modify Vitrification Details</Button>} />
      )}</Card>
      <Modal open={!!e} onClose={() => setE(null)} title="Modify Vitrification Details" footer={<><Button onClick={() => setE(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Vitrification Date"><Input type="date" value={f.vit_date} onChange={(x) => setF({ ...f, vit_date: x.target.value })} /></Field>
          <Field label="Done By"><Input value={f.done_by} onChange={(x) => setF({ ...f, done_by: x.target.value })} /></Field>
          <Field label="Vitrification Contract"><Input value={f.contract_ref} onChange={(x) => setF({ ...f, contract_ref: x.target.value })} /></Field>
        </div>
      </Modal>
    </>
  );
}

type ItemRow = VitItem & { vitrifications: Vit };
function StoredItems({ kind, title, thaw }: { kind: "embryo" | "oocyte"; title: string; thaw?: boolean }) {
  const toast = useToast();
  const { profile } = useAuth();
  const { data, isLoading } = useQ<ItemRow[]>(`vit:items:${kind}:${thaw ? "stored" : "all"}`, () => {
    let q = supabase.from("vitrified_items").select(`*, embryos(oocyte_no), storage_units(label,kind,colour), vitrifications!inner(${VIT_SELECT_FULL.replace("*, vitrified_items(*, embryos(oocyte_no), storage_units(label,kind,colour)), ", "*, ")})`).eq("vitrifications.kind", kind);
    if (thaw) q = q.eq("status", "stored");
    return q.order("created_at", { ascending: false }) as never;
  });
  return (
    <>
      <PageHeader title={title} />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<ItemRow> rows={data ?? []} empty="Nothing found."
          cols={[
            { key: "mrn", label: "Patient MRN", render: (i) => i.vitrifications.cycles?.couples.female.mrn ?? "—" },
            { key: "p", label: "Patient Name", primary: true, render: (i) => i.vitrifications.cycles?.couples.female.full_name ?? "—" },
            { key: "c", label: "Couple No", render: (i) => i.vitrifications.cycles?.couples.couple_no ?? "—" },
            { key: "o", label: kind === "embryo" ? "Oocyte No" : "Oocyte", render: (i) => i.embryos?.oocyte_no ?? "—" },
            { key: "u", label: "Storage", render: (i) => (i.storage_units ? `${i.storage_units.kind} ${i.storage_units.label}${i.position ? ` · ${i.position}` : ""}` : "—") },
            { key: "d", label: "Vitrified", render: (i) => fmtDate(i.vitrifications.vit_date), low: true },
            { key: "s", label: "Status", render: (i) => <Badge tone={statusTone(i.status)}>{i.status}</Badge> },
          ]}
          actions={thaw ? (i) => (
            <Button size="sm" onClick={() => { if (confirm("Thaw this item? This cannot be undone.")) thawItem(i, profile?.full_name ?? "").then(() => toast("Marked as thawed")).catch((e) => toast(e.message, "danger")); }}><Flame size={14} /> Thaw</Button>
          ) : undefined} />
      )}</Card>
    </>
  );
}

function Renewals() {
  const toast = useToast();
  const horizon = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  const { data, isLoading } = useQ<Vit[]>("vit:renewals", () => supabase.from("vitrifications").select(VIT_SELECT_FULL).eq("status", "stored").lte("renewal_due", horizon).order("renewal_due") as never);
  return (
    <>
      <PageHeader title="Renew Embryo Vitrifications" subtitle="Due within 60 days or overdue (window is a proposed default)" />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<Vit> rows={data ?? []} empty="No renewals due."
          cols={vitCols([{ key: "r", label: "Renewal due", render: (v) => <Badge tone={v.renewal_due && v.renewal_due < todayISO() ? "danger" : "warn"}>{fmtDate(v.renewal_due)}</Badge> }])}
          actions={(v) => <Button size="sm" onClick={() => renewVit(v).then(() => toast("Renewed for one year")).catch((e) => toast(e.message, "danger"))}><RefreshCw size={14} /> Renew</Button>} />
      )}</Card>
    </>
  );
}

function PgdSend() {
  const toast = useToast();
  const { data, isLoading } = useQ<{ id: string; oocyte_no: number; stage: string | null; fertilisations: { cycles: CyRow } }[]>("worklist:pgd-send", () =>
    supabase.from("embryos").select(`id,oocyte_no,stage,fertilisations!inner(cycles!inner(${CY}))`).eq("status", "culture") as never);
  async function send(id: string) {
    const { error } = await supabase.from("pgd_samples").insert({ embryo_id: id, sent_at: todayISO() });
    if (error) return toast(error.message, "danger");
    await saveRow("embryos", { status: "biopsied" }, id);
    toast("Sample sent for PGD"); refresh("worklist", "pgd", "embryos:");
  }
  return (
    <>
      <PageHeader title="Send Embryo Samples for PGD" />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable rows={data ?? []} empty="No embryos available to send."
          cols={[
            { key: "c", label: "Couple No.", render: (e) => e.fertilisations.cycles.couples.couple_no },
            { key: "p", label: "Patient", primary: true, render: (e) => e.fertilisations.cycles.couples.female.full_name },
            { key: "o", label: "Oocyte No", render: (e) => e.oocyte_no }, { key: "s", label: "Stage", render: (e) => e.stage ?? "—" },
          ]}
          actions={(e) => <Button size="sm" onClick={() => send(e.id)}><Send size={14} /> Send</Button>} />
      )}</Card>
    </>
  );
}

type PgdRow = Pgd & { embryos: { oocyte_no: number; fertilisations: { cycles: CyRow } } };
function PgdReceive() {
  const { data, isLoading } = useQ<PgdRow[]>("worklist:pgd-recv", () =>
    supabase.from("pgd_samples").select(`*, embryos!inner(oocyte_no, fertilisations!inner(cycles!inner(${CY})))`).is("result", null).order("sent_at") as never);
  const [p, setP] = useState<PgdRow | null>(null);
  return (
    <>
      <PageHeader title="Receive PGD Results" />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<PgdRow> rows={data ?? []} empty="No results awaited." onRow={setP}
          cols={[
            { key: "c", label: "Couple No.", render: (x) => x.embryos.fertilisations.cycles.couples.couple_no },
            { key: "p", label: "Patient", primary: true, render: (x) => x.embryos.fertilisations.cycles.couples.female.full_name },
            { key: "o", label: "Oocyte No", render: (x) => x.embryos.oocyte_no }, { key: "s", label: "Sent", render: (x) => fmtDate(x.sent_at) },
          ]} />
      )}</Card>
      <PgdResultModal p={p} onClose={() => setP(null)} />
    </>
  );
}
