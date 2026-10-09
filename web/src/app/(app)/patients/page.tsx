"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button, Card, DataTable, Input, PageHeader, Spinner } from "@/components/ui";
import { esc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { age, fmtDate } from "@/lib/util";
import type { Patient } from "@/components/patient-form";

export default function PatientsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [dq, setDq] = useState(q);
  useEffect(() => { setQ(sp.get("q") ?? ""); }, [sp]);
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);

  const { data, isLoading } = useQ<Patient[]>(`patients?${dq}`, () => {
    let r = supabase.from("patients").select("*").is("deleted_at", null).order("created_at", { ascending: false }).limit(50);
    const s = esc(dq);
    if (s) r = r.or(`full_name.ilike.%${s}%,mrn.ilike.%${s}%,phone.ilike.%${s}%`);
    return r as never;
  });

  return (
    <>
      <PageHeader title="Patients" subtitle="Search by MRN, name or phone number"
        actions={<Link href="/patients/new"><Button variant="primary"><Plus size={18} /> Register patient</Button></Link>} />
      <Card>
        <div className="relative mb-4 max-w-xl">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input autoFocus className="pl-10" placeholder="MRN, name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {isLoading && !data ? <Spinner /> : (
          <DataTable<Patient>
            rows={data ?? []} onRow={(p) => router.push(`/patients/${p.id}`)}
            empty={dq ? "No patients match your search." : "No patients registered yet."}
            cols={[
              { key: "mrn", label: "MRN" },
              { key: "full_name", label: "Name", primary: true },
              { key: "gender", label: "Gender" },
              { key: "dob", label: "DOB", render: (p) => `${fmtDate(p.dob)} ${age(p.dob)}`.trim(), low: true },
              { key: "phone", label: "Phone No", render: (p) => p.phone ?? "—" },
            ]} />
        )}
      </Card>
    </>
  );
}
