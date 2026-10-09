"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, PageHeader, Segmented, Spinner, statusTone } from "@/components/ui";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { endOfDay, fmtDateTime, money, startOfDay } from "@/lib/util";

type BillRow = { id: string; bill_no: string; kind: string; total: number; status: string; created_at: string; patients: { mrn: string; full_name: string } };

export default function Billing() {
  const router = useRouter();
  const today = useSearchParams().get("scope") === "today";
  const [status, setStatus] = useState("");
  const { data, isLoading } = useQ<BillRow[]>(`bills:${today}:${status}`, async () => {
    let q = supabase.from("bills").select("id,bill_no,kind,total,status,created_at,patients(mrn,full_name)").order("created_at", { ascending: false }).limit(200);
    if (today) {
      const { data: u } = await supabase.auth.getUser();
      q = q.gte("created_at", startOfDay()).lte("created_at", endOfDay()).eq("created_by", u.user?.id ?? "");
    }
    if (status) q = q.eq("status", status);
    return (await q) as never;
  });
  const sum = (data ?? []).filter((b) => b.status !== "cancelled").reduce((s, b) => s + Number(b.total), 0);
  return (
    <>
      <PageHeader title={today ? "My Today's Bills" : "Bills"} subtitle={data ? `${data.length} bill(s) · ${money(sum)}` : undefined}
        actions={<Link href="/billing/new"><Button variant="primary"><Plus size={18} /> New bill</Button></Link>} />
      <Card>
        <div className="mb-4 overflow-x-auto"><Segmented value={status} onChange={setStatus} options={["draft", "issued", "partial", "paid", "cancelled"]} /></div>
        {isLoading && !data ? <Spinner /> : (
          <DataTable<BillRow> rows={data ?? []} empty="No bills found." onRow={(b) => router.push(`/billing/${b.id}`)}
            cols={[
              { key: "bill_no", label: "Bill No.", primary: true }, { key: "p", label: "Patient", render: (b) => `${b.patients.full_name} (${b.patients.mrn})` },
              { key: "kind", label: "Type", low: true }, { key: "total", label: "Total", render: (b) => money(b.total) },
              { key: "status", label: "Status", render: (b) => <Badge tone={statusTone(b.status)}>{b.status}</Badge> },
              { key: "d", label: "Created", render: (b) => fmtDateTime(b.created_at), low: true },
            ]} />
        )}
      </Card>
    </>
  );
}
