"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from "@/components/ui";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { nul } from "@/lib/util";

type Drug = { id: string; name: string; generic_name: string | null; form: string | null; strength: string | null; unit: string | null; active: boolean; version: number };
type Mv = { drug_id: string; qty: number; kind: string };
const KINDS = [{ value: "opening", label: "Opening stock" }, { value: "receipt", label: "Receipt (stock in)" }, { value: "issue", label: "Issue (stock out)" }, { value: "adjustment", label: "Adjustment (+/−)" }];

export default function Inventory() {
  const toast = useToast();
  const stockMode = useSearchParams().get("stock") === "1";
  const drugs = useQ<Drug[]>("drugs", () => supabase.from("drugs").select("*").eq("active", true).order("name") as never);
  const mv = useQ<Mv[]>("stock:mv", () => supabase.from("stock_movements").select("drug_id,qty,kind").limit(10000) as never);
  const [q, setQ] = useState("");
  const [e, setE] = useState<Partial<Drug> | null>(null);
  const [s, setS] = useState<{ drug_id: string; kind: string; qty: string; batch: string; expiry: string } | null>(stockMode ? { drug_id: "", kind: "opening", qty: "", batch: "", expiry: "" } : null);
  const [busy, setBusy] = useState(false);

  const onHand = new Map<string, number>();
  (mv.data ?? []).forEach((m) => onHand.set(m.drug_id, (onHand.get(m.drug_id) ?? 0) + (m.kind === "issue" ? -Math.abs(m.qty) : m.qty)));
  const rows = (drugs.data ?? []).filter((d) => !q || `${d.name} ${d.generic_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  async function saveDrug() {
    if (!e?.name?.trim()) return toast("Drug name is required", "danger");
    setBusy(true);
    try {
      await saveRow("drugs", { name: e.name, generic_name: nul(e.generic_name), form: nul(e.form), strength: nul(e.strength), unit: nul(e.unit) }, e.id, e.version);
      toast("Drug saved"); refresh("drugs"); setE(null);
    } catch (x) { toast((x as Error).message, "danger"); }
    setBusy(false);
  }
  async function saveStock() {
    if (!s?.drug_id) return toast("Choose a drug", "danger");
    const qty = Number(s.qty);
    if (!qty || (s.kind !== "adjustment" && qty < 0)) return toast("Enter a valid quantity", "danger");
    setBusy(true);
    try {
      await saveRow("stock_movements", { drug_id: s.drug_id, kind: s.kind, qty, batch: nul(s.batch), expiry: nul(s.expiry) });
      toast("Stock recorded"); refresh("stock:"); setS(null);
    } catch (x) { toast((x as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <>
      <PageHeader title="Drug Formulary" subtitle="Drugs and current stock on hand"
        actions={<><Button onClick={() => setS({ drug_id: "", kind: "opening", qty: "", batch: "", expiry: "" })}>Record Opening Stock</Button>
          <Button variant="primary" onClick={() => setE({})}><Plus size={18} /> Add drug</Button></>} />
      <Card>
        <Input className="mb-4 max-w-md" placeholder="Search drug or generic name" value={q} onChange={(x) => setQ(x.target.value)} />
        {drugs.isLoading && !drugs.data ? <Spinner /> : (
          <DataTable<Drug> rows={rows} empty="No drugs in the formulary yet." onRow={setE}
            cols={[
              { key: "name", label: "Drug", primary: true }, { key: "generic_name", label: "Generic Drug Name", render: (d) => d.generic_name ?? "—" },
              { key: "form", label: "Form", render: (d) => d.form ?? "—", low: true }, { key: "strength", label: "Strength", render: (d) => d.strength ?? "—", low: true },
              { key: "stock", label: "On hand", render: (d) => { const n = onHand.get(d.id) ?? 0; return <Badge tone={n <= 0 ? "danger" : "ok"}>{n} {d.unit ?? ""}</Badge>; } },
            ]} />
        )}
      </Card>
      <Modal open={!!e} onClose={() => setE(null)} title={e?.id ? "Edit drug" : "Add drug"} footer={<><Button onClick={() => setE(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={saveDrug}>Save</Button></>}>
        {e && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Drug name" required className="sm:col-span-2"><Input value={e.name ?? ""} onChange={(x) => setE({ ...e, name: x.target.value })} /></Field>
            <Field label="Generic Drug Name" className="sm:col-span-2"><Input value={e.generic_name ?? ""} onChange={(x) => setE({ ...e, generic_name: x.target.value })} /></Field>
            <Field label="Form"><Input value={e.form ?? ""} onChange={(x) => setE({ ...e, form: x.target.value })} placeholder="e.g. Injection" /></Field>
            <Field label="Strength"><Input value={e.strength ?? ""} onChange={(x) => setE({ ...e, strength: x.target.value })} /></Field>
            <Field label="Stock unit"><Input value={e.unit ?? ""} onChange={(x) => setE({ ...e, unit: x.target.value })} placeholder="e.g. vials" /></Field>
          </div>
        )}
      </Modal>
      <Modal open={!!s} onClose={() => setS(null)} title="Record stock" footer={<><Button onClick={() => setS(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={saveStock}>Save</Button></>}>
        {s && (
          <div className="space-y-4">
            <Field label="Drug" required><Select options={(drugs.data ?? []).map((d) => ({ value: d.id, label: d.name }))} value={s.drug_id} onChange={(x) => setS({ ...s, drug_id: x.target.value })} /></Field>
            <Field label="Type"><Select placeholder="" options={KINDS} value={s.kind} onChange={(x) => setS({ ...s, kind: x.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Quantity"><Input type="number" step="any" inputMode="decimal" value={s.qty} onChange={(x) => setS({ ...s, qty: x.target.value })} /></Field>
              <Field label="Batch"><Input value={s.batch} onChange={(x) => setS({ ...s, batch: x.target.value })} /></Field>
              <Field label="Expiry"><Input type="date" value={s.expiry} onChange={(x) => setS({ ...s, expiry: x.target.value })} /></Field>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
