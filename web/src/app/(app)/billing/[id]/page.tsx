"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Alert, Badge, Button, Card, DataTable, Field, Input, KV, Modal, PageHeader, Select, Spinner, statusTone, useToast } from "@/components/ui";
import { useTabTitle } from "@/components/shell";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtDateTime, money } from "@/lib/util";

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
      {/* Printable invoice — only visible when printing */}
      <div className="hidden text-black print:block">
        <div className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <div className="text-[20px] font-bold tracking-tight">PROMISE FERTILITY CENTER</div>
            <div className="text-[11px]">A Unit of Sri Kumaran Hospital</div>
          </div>
          <div className="text-right text-[12px]">
            <div className="text-[16px] font-bold">BILL / INVOICE</div>
            <div>No. {b.bill_no}</div>
            <div>{fmtDate(b.created_at)}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-[12px]">
          <div><b>Patient:</b> {b.patients.full_name}</div>
          <div><b>MRN:</b> {b.patients.mrn}</div>
          <div><b>Phone:</b> {b.patients.phone ?? "-"}</div>
          <div><b>Bill type:</b> {b.kind}</div>
        </div>
        <table className="mt-4 w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-y border-black text-left">
              <th className="py-1.5 pr-2">#</th><th>Description</th>
              <th className="text-right">Qty</th><th className="text-right">Rate</th><th className="py-1.5 pl-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(items.data ?? []).map((it, i) => (
              <tr key={it.id} className="border-b border-gray-300">
                <td className="py-1.5 pr-2 align-top">{i + 1}</td>
                <td className="align-top">{it.description}</td>
                <td className="text-right align-top">{it.qty}</td>
                <td className="text-right align-top">{money(it.rate)}</td>
                <td className="py-1.5 pl-2 text-right align-top">{money(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex justify-end">
          <table className="text-[12px]">
            <tbody>
              <tr><td className="pr-10 text-right">Total</td><td className="w-28 text-right font-bold">{money(b.total)}</td></tr>
              <tr><td className="pr-10 text-right">Paid</td><td className="text-right">{money(paid)}</td></tr>
              <tr className="border-t border-black"><td className="pr-10 pt-1 text-right font-bold">Balance due</td><td className="pt-1 text-right font-bold">{money(balance)}</td></tr>
            </tbody>
          </table>
        </div>
        {(rcpts.data ?? []).length > 0 && (
          <div className="mt-5 text-[12px]">
            <div className="mb-1 font-bold">Payments received</div>
            <table className="w-full border-collapse">
              <thead><tr className="border-y border-gray-400 text-left"><th className="py-1 pr-2">Receipt</th><th>Date</th><th>Mode</th><th className="text-right">Amount</th></tr></thead>
              <tbody>
                {(rcpts.data ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-gray-200">
                    <td className="py-1 pr-2">{r.receipt_no}</td><td>{fmtDate(r.created_at)}</td><td>{r.mode}</td><td className="text-right">{money(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-16 flex items-end justify-between text-[11px]">
          <div>Status: <b>{b.status.toUpperCase()}</b></div>
          <div className="text-center"><div className="mb-1 h-10 w-44 border-b border-black" />Authorised signatory</div>
        </div>
        <div className="mt-6 text-center text-[10px] text-gray-600">This is a computer-generated bill from Promise Fertility Center.</div>
      </div>

      {/* On-screen view — hidden when printing */}
      <div className="print:hidden">
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
      </div>
    </>
  );
}
