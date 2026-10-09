"use client";
import { useRouter } from "next/navigation";
import { Card, DataTable, PageHeader, Spinner } from "@/components/ui";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { endOfDay, fmtDateTime, startOfDay, money } from "@/lib/util";

type Row = { id: string; receipt_no: string; amount: number; mode: string; created_at: string; bill_id: string; bills: { bill_no: string; patients: { full_name: string; mrn: string } } };

export default function Receipts() {
  const router = useRouter();
  const { data, isLoading } = useQ<Row[]>("receipts:mine-today", async () => {
    const { data: u } = await supabase.auth.getUser();
    return (await supabase.from("receipts").select("*, bills(bill_no, patients(full_name,mrn))").gte("created_at", startOfDay()).lte("created_at", endOfDay()).eq("created_by", u.user?.id ?? "").order("created_at", { ascending: false })) as never;
  });
  const total = (data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const byMode = (data ?? []).reduce<Record<string, number>>((m, r) => ({ ...m, [r.mode]: (m[r.mode] ?? 0) + Number(r.amount) }), {});
  return (
    <>
      <PageHeader title="My Today's Receipts" subtitle={`${data?.length ?? 0} receipt(s) · ${money(total)}${Object.keys(byMode).length ? " (" + Object.entries(byMode).map(([k, v]) => `${k} ${money(v)}`).join(", ") + ")" : ""}`} />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<Row> rows={data ?? []} empty="No receipts collected today." onRow={(r) => router.push(`/billing/${r.bill_id}`)}
          cols={[
            { key: "receipt_no", label: "Receipt No.", primary: true }, { key: "bill", label: "Bill", render: (r) => r.bills.bill_no },
            { key: "p", label: "Patient", render: (r) => `${r.bills.patients.full_name} (${r.bills.patients.mrn})` },
            { key: "amount", label: "Amount", render: (r) => money(r.amount) }, { key: "mode", label: "Mode" }, { key: "t", label: "Time", render: (r) => fmtDateTime(r.created_at), low: true },
          ]} />
      )}</Card>
    </>
  );
}
