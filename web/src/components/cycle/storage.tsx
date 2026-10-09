"use client";
import { useState } from "react";
import { Snowflake, Send, Flame, RefreshCw } from "lucide-react";
import { Badge, Button, Card, DataTable, Field, Input, Modal, Select, Spinner, statusTone, useToast, Alert } from "../ui";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, nul, num, todayISO } from "@/lib/util";
import { renewVit, thawItem, VIT_SELECT, type Vit, type VitItem } from "@/lib/lab";
import { useStaff } from "./opu-outcome";
import type { CycleFull, Embryo, StorageUnit } from "@/lib/types";

type EmbryoRow = Embryo & { fertilisations: { cycle_id: string } };
export type Pgd = { id: string; embryo_id: string; sent_at: string | null; lab: string | null; received_at: string | null; result: string | null; notes: string | null; version: number; embryos: { oocyte_no: number } };

export function StorageTab({ cycle }: { cycle: CycleFull }) {
  const toast = useToast();
  const { profile } = useAuth();
  const staff = useStaff();
  const embryos = useQ<EmbryoRow[]>(`embryos:cycle:${cycle.id}`, () =>
    supabase.from("embryos").select("*, fertilisations!inner(cycle_id)").eq("fertilisations.cycle_id", cycle.id).order("oocyte_no") as never);
  const vits = useQ<Vit[]>(`vit:${cycle.id}`, () => supabase.from("vitrifications").select(VIT_SELECT).eq("cycle_id", cycle.id).order("vit_date", { ascending: false }) as never);
  const pgd = useQ<Pgd[]>(`pgd:${cycle.id}`, () =>
    supabase.from("pgd_samples").select("*, embryos!inner(oocyte_no, fertilisations!inner(cycle_id))").eq("embryos.fertilisations.cycle_id", cycle.id) as never);
  const units = useQ<StorageUnit[]>("storage_units", () => supabase.from("storage_units").select("*").order("label") as never);
  const [sel, setSel] = useState<string[]>([]);
  const [vitOpen, setVitOpen] = useState<"embryo" | "oocyte" | null>(null);
  const [pgdRes, setPgdRes] = useState<Pgd | null>(null);
  const [renew, setRenew] = useState<Vit | null>(null);
  const [contract, setContract] = useState("");

  const culture = (embryos.data ?? []).filter((e) => e.status === "culture");
  const chosen = culture.filter((e) => sel.includes(e.id));

  async function sendPgd() {
    if (!chosen.length) return toast("Select embryos in culture first", "danger");
    const { error } = await supabase.from("pgd_samples").insert(chosen.map((e) => ({ embryo_id: e.id, sent_at: todayISO() })));
    if (error) return toast(error.message, "danger");
    await Promise.all(chosen.map((e) => saveRow("embryos", { status: "biopsied" }, e.id)));
    toast(`${chosen.length} sample(s) sent for PGD`); setSel([]); refresh("embryos:", "pgd", "worklist");
  }

  return (
    <div className="space-y-4">
      <Card title="Embryos in culture" actions={<>
        <Button size="sm" disabled={!chosen.length} onClick={() => setVitOpen("embryo")}><Snowflake size={16} /> Vitrify selected</Button>
        <Button size="sm" disabled={!chosen.length} onClick={sendPgd}><Send size={16} /> Send for PGD</Button>
        <Button size="sm" onClick={() => setVitOpen("oocyte")}><Snowflake size={16} /> Vitrify oocytes</Button></>}>
        {embryos.isLoading && !embryos.data ? <Spinner /> : (
          <DataTable<EmbryoRow> rows={culture} empty="No embryos in culture." onRow={(e) => setSel((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))}
            cols={[
              { key: "sel", label: "", render: (e) => <input type="checkbox" aria-label={`Select oocyte ${e.oocyte_no}`} className="size-5" readOnly checked={sel.includes(e.id)} /> },
              { key: "oocyte_no", label: "Oocyte No", primary: true },
              { key: "stage", label: "Stage", render: (e) => e.stage ?? "—" },
              { key: "survival", label: "Survival", render: (e) => e.survival ?? "—" },
              { key: "comments", label: "Comments", render: (e) => e.comments ?? "—", low: true },
            ]} />
        )}
      </Card>

      <Card title="Embryo & oocyte vitrifications">
        {vits.isLoading && !vits.data ? <Spinner /> : (vits.data ?? []).length === 0 ? <p className="text-muted">Nothing vitrified for this cycle.</p> : (
          <ul className="space-y-4">
            {vits.data!.map((v) => (
              <li key={v.id} className="rounded-xl border border-line">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg/60 px-4 py-3">
                  <div>
                    <b>{v.kind === "embryo" ? "Embryo" : "Oocyte"} vitrification · {fmtDate(v.vit_date)}</b>
                    <div className="text-sm text-muted">{v.item_count} item(s) · Done by {v.done_by ?? "—"} · Contract {v.contract_ref ?? "—"} · Renewal due {fmtDate(v.renewal_due)}</div>
                  </div>
                  <div className="flex items-center gap-2"><Badge tone={statusTone(v.status)}>{v.status}</Badge>
                    <Button size="sm" onClick={() => { setRenew(v); setContract(v.contract_ref ?? ""); }}><RefreshCw size={14} /> Renew</Button></div>
                </div>
                <ul className="divide-y divide-line">
                  {v.vitrified_items.map((i: VitItem) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <span>{i.embryos ? `Oocyte ${i.embryos.oocyte_no}` : "Oocyte"} · {i.storage_units ? `${i.storage_units.kind} ${i.storage_units.label}${i.storage_units.colour ? ` (${i.storage_units.colour})` : ""}` : "unit not set"}{i.position ? ` · pos ${i.position}` : ""}{i.grade ? ` · grade ${i.grade}` : ""}</span>
                      <span className="flex items-center gap-2"><Badge tone={statusTone(i.status)}>{i.status}</Badge>
                        {i.status === "stored" && <Button size="sm" onClick={() => { if (confirm("Thaw this item? This cannot be undone.")) thawItem(i, profile?.full_name ?? "").then(() => toast("Marked as thawed")).catch((e) => toast(e.message, "danger")); }}><Flame size={14} /> Thaw</Button>}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="PGD samples">
        <DataTable<Pgd> rows={pgd.data ?? []} empty="No samples sent for PGD." onRow={(p) => setPgdRes(p)}
          cols={[
            { key: "o", label: "Oocyte No", primary: true, render: (p) => p.embryos.oocyte_no },
            { key: "sent", label: "Sent", render: (p) => fmtDate(p.sent_at) },
            { key: "lab", label: "Lab", render: (p) => p.lab ?? "—" },
            { key: "res", label: "Result", render: (p) => (p.result ? <Badge tone="ok">{p.result}</Badge> : <Badge tone="warn">Awaiting</Badge>) },
            { key: "rec", label: "Received", render: (p) => fmtDate(p.received_at), low: true },
          ]} />
      </Card>

      <VitrifyModal mode={vitOpen} onClose={() => setVitOpen(null)} cycle={cycle} embryos={chosen} units={units.data ?? []} staff={staff} onDone={() => setSel([])} />
      <PgdResultModal p={pgdRes} onClose={() => setPgdRes(null)} />
      <Modal open={!!renew} onClose={() => setRenew(null)} title="Renew vitrification"
        footer={<><Button onClick={() => setRenew(null)}>Cancel</Button><Button variant="primary" onClick={async () => {
          try { await renewVit(renew!, contract || undefined); toast("Renewed for one year"); setRenew(null); } catch (e) { toast((e as Error).message, "danger"); }
        }}>Renew for 1 year</Button></>}>
        <Field label="Vitrification Contract (reference)"><Input value={contract} onChange={(e) => setContract(e.target.value)} /></Field>
        <p className="mt-3 text-sm text-muted">The renewal period (1 year) is a proposed default. Confirm with the clinic. Create the matching bill from Billing.</p>
      </Modal>
    </div>
  );
}

function VitrifyModal({ mode, onClose, cycle, embryos, units, staff, onDone }:
  { mode: "embryo" | "oocyte" | null; onClose: () => void; cycle: CycleFull; embryos: EmbryoRow[]; units: StorageUnit[]; staff: string[]; onDone: () => void }) {
  const toast = useToast();
  const [f, setF] = useState({ vit_date: todayISO(), done_by: "", contract_ref: "", count: "", unit: "" });
  const [place, setPlace] = useState<Record<string, { unit: string; position: string; grade: string }>>({});
  const [busy, setBusy] = useState(false);
  const unitOpts = units.filter((u) => u.kind !== "CANISTER" || true).map((u) => ({ value: u.id, label: `${u.kind} ${u.label}${u.colour ? ` (${u.colour})` : ""}` }));

  async function save() {
    setBusy(true);
    try {
      const n = mode === "embryo" ? embryos.length : Number(f.count) || 0;
      if (n < 1) throw new Error(mode === "oocyte" ? "Enter the number of oocytes" : "Select embryos first");
      const renewal = new Date(f.vit_date); renewal.setFullYear(renewal.getFullYear() + 1);
      const v = await saveRow("vitrifications", { cycle_id: cycle.id, kind: mode, vit_date: f.vit_date, done_by: nul(f.done_by), contract_ref: nul(f.contract_ref), item_count: n, renewal_due: renewal.toISOString().slice(0, 10) });
      const items = mode === "embryo"
        ? embryos.map((e) => ({ vitrification_id: v.id, embryo_id: e.id, unit_id: nul(place[e.id]?.unit), position: num(place[e.id]?.position), grade: nul(place[e.id]?.grade) }))
        : Array.from({ length: n }, () => ({ vitrification_id: v.id, unit_id: nul(f.unit) }));
      const { error } = await supabase.from("vitrified_items").insert(items);
      if (error) throw new Error(error.message);
      if (mode === "embryo") await Promise.all(embryos.map((e) => saveRow("embryos", { status: "vitrified" }, e.id)));
      toast(`${n} ${mode}(s) vitrified`); refresh("vit", "embryos:", "worklist"); onDone(); onClose();
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  return (
    <Modal open={!!mode} onClose={onClose} wide title={mode === "oocyte" ? "Vitrify oocytes" : "Vitrify embryos"}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save vitrification</Button></>}>
      <datalist id="staff3">{staff.map((s) => <option key={s} value={s} />)}</datalist>
      {!units.length && <div className="mb-4"><Alert>No storage units configured yet. Add canisters / goblets / hexatubes under IVF Storage to record positions.</Alert></div>}
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Vitrification Date"><Input type="date" value={f.vit_date} onChange={(e) => setF({ ...f, vit_date: e.target.value })} /></Field>
        <Field label="Done By"><Input list="staff3" value={f.done_by} onChange={(e) => setF({ ...f, done_by: e.target.value })} /></Field>
        <Field label="Vitrification Contract"><Input value={f.contract_ref} onChange={(e) => setF({ ...f, contract_ref: e.target.value })} /></Field>
      </div>
      {mode === "oocyte" ? (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Number of oocytes"><Input type="number" min={1} value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></Field>
          <Field label="Storage unit"><Select options={unitOpts} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></Field>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {embryos.map((e) => (
            <li key={e.id} className="grid items-end gap-3 rounded-xl border border-line p-3 sm:grid-cols-4">
              <div className="font-semibold">Oocyte {e.oocyte_no}<div className="text-sm font-normal text-muted">{e.stage ?? ""}</div></div>
              <Field label="Storage unit"><Select options={unitOpts} value={place[e.id]?.unit ?? ""} onChange={(x) => setPlace({ ...place, [e.id]: { ...place[e.id], unit: x.target.value } as never })} /></Field>
              <Field label="Position"><Input type="number" min={1} value={place[e.id]?.position ?? ""} onChange={(x) => setPlace({ ...place, [e.id]: { ...place[e.id], position: x.target.value } as never })} /></Field>
              <Field label="Grade"><Input value={place[e.id]?.grade ?? ""} onChange={(x) => setPlace({ ...place, [e.id]: { ...place[e.id], grade: x.target.value } as never })} /></Field>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export function PgdResultModal({ p, onClose }: { p: Pgd | null; onClose: () => void }) {
  const toast = useToast();
  const [d, setD] = useState<Partial<Pgd> | null>(null);
  const cur = d ?? p ?? {};
  const close = () => { setD(null); onClose(); };
  async function save() {
    if (!p) return;
    try {
      await saveRow("pgd_samples", { lab: nul(cur.lab), result: nul(cur.result), notes: nul(cur.notes), received_at: cur.result ? (cur.received_at ?? todayISO()) : null }, p.id, p.version);
      toast("PGD result saved"); refresh("pgd", "worklist"); close();
    } catch (e) { toast((e as Error).message, "danger"); }
  }
  return (
    <Modal open={!!p} onClose={close} title={p ? `PGD — oocyte ${p.embryos.oocyte_no}` : ""}
      footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Lab"><Input value={cur.lab ?? ""} onChange={(e) => setD({ ...cur, lab: e.target.value })} /></Field>
        <Field label="Result"><Input value={cur.result ?? ""} onChange={(e) => setD({ ...cur, result: e.target.value })} placeholder="Enter result as reported" /></Field>
        <Field label="Received on"><Input type="date" value={cur.received_at ?? ""} onChange={(e) => setD({ ...cur, received_at: e.target.value })} /></Field>
        <Field label="Notes"><Input value={cur.notes ?? ""} onChange={(e) => setD({ ...cur, notes: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
