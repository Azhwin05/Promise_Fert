"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, PageHeader, Select, useToast } from "@/components/ui";
import { PatientPicker } from "@/components/picker";
import { refresh, saveRow } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { money } from "@/lib/util";
import type { PatientLite } from "@/lib/types";

const KINDS = ["General", "Consultation", "Procedure", "Pharmacy", "Vitrification"]; // proposed categories

export default function NewBill() {
  const router = useRouter();
  const toast = useToast();
  const sp = useSearchParams();
  const [pat, setPat] = useState<PatientLite | null>(null);
  const [pick, setPick] = useState(false);
  const [kind, setKind] = useState(sp.get("kind") ?? "General");
  const [items, setItems] = useState([{ description: sp.get("kind") === "Vitrification" ? "Vitrification" : "", qty: "1", rate: "" }]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = sp.get("patient");
    if (id) supabase.from("patients").select("id,mrn,full_name,gender,dob,phone").eq("id", id).single().then(({ data }) => data && setPat(data as PatientLite));
  }, [sp]);

  const total = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const upd = (n: number, k: "description" | "qty" | "rate", v: string) => setItems(items.map((x, i) => (i === n ? { ...x, [k]: v } : x)));

  async function create() {
    if (!pat) return toast("Select a patient", "danger");
    const valid = items.filter((i) => i.description.trim());
    if (!valid.length) return toast("Add at least one line item", "danger");
    if (valid.some((i) => !(Number(i.qty) > 0) || Number(i.rate) < 0 || i.rate === "")) return toast("Check quantity and rate on every line", "danger");
    if (busy) return;
    setBusy(true);
    try {
      const bill = await saveRow("bills", { patient_id: pat.id, cycle_id: sp.get("cycle") || null, kind });
      const { error } = await supabase.from("bill_items").insert(valid.map((i) => ({ bill_id: bill.id, description: i.description, qty: Number(i.qty), rate: Number(i.rate) })));
      if (error) throw new Error(error.message);
      toast(`Draft bill ${bill.bill_no} created`); refresh("bills"); router.replace(`/billing/${bill.id}`);
    } catch (e) { toast((e as Error).message, "danger"); setBusy(false); }
  }

  return (
    <>
      <PageHeader title="New bill" subtitle="Bills are drafts until issued; issued bills are locked" />
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Patient" required><Button type="button" className="w-full justify-start" onClick={() => setPick(true)}>{pat ? `${pat.full_name} (${pat.mrn})` : "Select patient…"}</Button></Field>
          <Field label="Bill type"><Select options={KINDS} value={kind} onChange={(e) => setKind(e.target.value)} /></Field>
        </div>
        <h3 className="mb-2 mt-6 font-semibold">Items</h3>
        <ul className="space-y-3">
          {items.map((it, n) => (
            <li key={n} className="grid items-end gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_6rem_9rem_auto]">
              <Field label="Description"><Input value={it.description} onChange={(e) => upd(n, "description", e.target.value)} /></Field>
              <Field label="Qty"><Input type="number" min={0.01} step="any" inputMode="decimal" value={it.qty} onChange={(e) => upd(n, "qty", e.target.value)} /></Field>
              <Field label="Rate (₹)"><Input type="number" min={0} step="0.01" inputMode="decimal" value={it.rate} onChange={(e) => upd(n, "rate", e.target.value)} /></Field>
              <Button variant="ghost" aria-label="Remove line" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== n))}><Trash2 size={18} /></Button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Button onClick={() => setItems([...items, { description: "", qty: "1", rate: "" }])}><Plus size={16} /> Add line</Button>
          <div className="text-xl font-semibold">Total {money(total)}</div>
        </div>
        <div className="mt-6 flex justify-end gap-2"><Button onClick={() => router.back()}>Cancel</Button><Button variant="primary" loading={busy} onClick={create}>Create draft bill</Button></div>
      </Card>
      <PatientPicker open={pick} onClose={() => setPick(false)} onPick={setPat} />
    </>
  );
}
