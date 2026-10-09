"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, PageHeader, Spinner } from "@/components/ui";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { endOfDay, fmtDateTime, startOfDay } from "@/lib/util";

type Row = { id: string; patient_id: string; visit_type: string; visit_at: string; doctor_name: string | null; reason: string | null; signed_at: string | null; patients: { mrn: string; full_name: string; gender: string; phone: string | null } };

export default function Registrations() {
  const router = useRouter();
  const { data, isLoading } = useQ<Row[]>("registrations:today", () =>
    supabase.from("visits").select("*, patients(mrn,full_name,gender,phone)").gte("visit_at", startOfDay()).lte("visit_at", endOfDay()).order("visit_at", { ascending: false }) as never);
  return (
    <>
      <PageHeader title="Today's Registrations" subtitle={`${data?.length ?? 0} visit(s) today`}
        actions={<Link href="/patients/new"><Button variant="primary"><Plus size={18} /> Register patient</Button></Link>} />
      <Card>
        {isLoading && !data ? <Spinner /> : (
          <DataTable<Row> rows={data ?? []} empty="No registrations yet today." onRow={(r) => router.push(`/patients/${r.patient_id}`)}
            cols={[
              { key: "mrn", label: "MRN", render: (r) => r.patients.mrn },
              { key: "name", label: "Name", primary: true, render: (r) => r.patients.full_name },
              { key: "visit_type", label: "Visit Type" },
              { key: "time", label: "Time", render: (r) => fmtDateTime(r.visit_at) },
              { key: "doctor", label: "Doctor", render: (r) => r.doctor_name ?? "—", low: true },
              { key: "reason", label: "Reason", render: (r) => r.reason ?? "—", low: true },
              { key: "s", label: "Status", render: (r) => (r.signed_at ? <Badge tone="ok">Signed</Badge> : <Badge tone="warn">Open</Badge>) },
            ]} />
        )}
      </Card>
    </>
  );
}
