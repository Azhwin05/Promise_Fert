"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Alert, Badge, Button, Card, DataTable, Field, Input, KV, Modal, PageHeader, Select, Spinner, statusTone, useToast } from "@/components/ui";
import { useTabTitle } from "@/components/shell";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDateTime, money } from "@/lib/util";

type Bill = { id: string; bill_no: string; kind: string; total: number; status: string; created_at: string; version: number; patients: { mrn: string; full_name: string; phone: string | null } };
type Item = { id: string; description: string; qty: number; rate: number; amount: number };
type Rcpt = { id: string; receipt_no: string; amount: number; mode: string; reference: string | null; created_at: string };
const MODES = ["Cash", "Card", "UPI", "Bank transfer", "Cheque"];

export default function BillPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { can } = useAuth();
  const bill = useQ<Bill>(`bill:${id}`, () => supabase.from("bills").select("*, patients(mrn,full_name,phone)").eq("id", id).single() as never);
  const items = useQ<Item[]>(`bill-items:${id}`, () => supabase.from("bill_items").select("*").eq("bill_id", id).order("created_at") as never);
  const rcpts = useQ<Rcpt[]>(`bill-rcpts:${id}`, () => supabase.from("receipts").select("*").eq("bill_id", id).order("created_at") as never);
  const [pay, setPay] = useState<{ amount: string; mode: string; reference: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const b = bill.data;
  useTabTitle(b ? `Bill ${b.bill_no}` : undefined);
  if (bill.isLoading && !b) return <Spinner />;
  if (!b) return <Alert tone="danger">Bill not found.</Alert>;

  const paid = (rcpts.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const balance = Number(b.total) - paid;
  const canBill = can("billing", "front_desk");
  const reload = () => refresh(`bill:${id}`, `bill-items:${id}`, `bill-rcpts:${id}`, "bills", "receipts");

  async function setStatus(status: string, msg: string) {
    setBusy(true);
    try { await saveRow("bills", { status }, b!.id, b!.version); toast(msg); reload(); } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  async function collect() {
    if (!pay || busy) return;
    const amt = Number(pay.amount);
    if (!(amt > 0)) return toast("Enter an amount greater than zero", "danger");
    if (amt > balance + 0.001) return toast(`Amount exceeds the balance of ${money(balance)}`, "danger");
    setBusy(true);
    try {
      await saveRow("receipts", { bill_id: b!.id, amount: amt, mode: pay.mode, reference: pay.reference || null });
      toast("Receipt recorded"); setPay(null); reload();
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <>
      <PageHeader title={`Bill ${b.bill_no}`} subtitle={<span>{b.patients.full_name} · {b.patients.mrn} · {fmtDateTime(b.created_at)}</span>}
        actions={<>
          <Button onClick={() => window.print()}><Printer size={16} /> Print</Button>
          {canBill && b.status === "draft" && <Button variant="primary" loading={busy} onClick={() => confirm("Issue this bill? It cannot be edited afterwards.") && setStatus("issued", "Bill issued")}>Issue bill</Button>}
          {canBill && ["issued", "partial"].includes(b.status) && balance > 0 && <Button variant="primary" onClick={() => setPay({ amount: balance.toFixed(2), mode: "Cash", reference: "" })}>Collect payment</Button>}
          {canBill && b.status === "draft" && <Button variant="danger" onClick={() => confirm("Cancel this draft bill?") && setStatus("cancelled", "Bill cancelled")}>Cancel bill</Button>}
        </>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Items" className="lg:col-span-2">
          <DataTable<Item> rows={items.data ?? []} empty="No items."
            cols={[{ key: "description", label: "Description", primary: true }, { key: "qty", label: "Qty" }, { key: "rate", label: "Rate", render: (i) => money(i.rate) }, { key: "amount", label: "Amount", render: (i) => money(i.amount) }]} />
        </Card>
        <Card title="Summary">
          <dl className="space-y-3">
            <KV label="Status"><Badge tone={statusTone(b.status)}>{b.status}</Badge></KV>
            <KV label="Total">{money(b.total)}</KV><KV label="Paid">{money(paid)}</KV><KV label="Balance">{money(balance)}</KV>
          </dl>
        </Card>
        <Card title="Receipts" className="lg:col-span-3">
          <DataTable<Rcpt> rows={rcpts.data ?? []} empty="No payments received yet."
            cols={[{ key: "receipt_no", label: "Receipt No.", primary: true }, { key: "amount", label: "Amount", render: (r) => money(r.amount) }, { key: "mode", label: "Mode" }, { key: "reference", label: "Reference", render: (r) => r.reference ?? "—" }, { key: "created_at", label: "Date", render: (r) => fmtDateTime(r.created_at) }]} />
        </Card>
      </div>
      <Modal open={!!pay} onClose={() => setPay(null)} title="Collect payment"
        footer={<><Button onClick={() => setPay(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={collect}>Record receipt</Button></>}>
        {pay && (
          <div className="space-y-4">
            <p className="text-muted">Balance due {money(balance)}</p>
            <Field label="Amount (₹)"><Input type="number" min={0.01} step="0.01" inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
            <Field label="Mode"><Select options={MODES} value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })} /></Field>
            <Field label="Reference"><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
