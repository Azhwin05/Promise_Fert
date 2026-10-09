"use client";
import { useState } from "react";
import { Card, DataTable, Input, Modal, PageHeader, Spinner, Button } from "@/components/ui";
import { CounsellingPanel } from "@/components/counselling";
import { ConsentPanel } from "@/components/consent";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/util";

type Row = { id: string; couple_no: string; created_at: string; female: { id: string; full_name: string; mrn: string }; male: { full_name: string } | null };

export default function Counselling() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Row | null>(null);
  const { data, isLoading } = useQ<Row[]>("counselling-list", () =>
    supabase.from("couples").select("id,couple_no,created_at,female:patients!couples_female_id_fkey(id,full_name,mrn),male:patients!couples_male_id_fkey(full_name)").order("created_at", { ascending: false }).limit(200) as never);
  const rows = (data ?? []).filter((r) => !q || `${r.couple_no} ${r.female.full_name} ${r.female.mrn} ${r.male?.full_name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Counsel Infertility Patients" subtitle="Counselling notes and consent status for each couple" />
      <Card>
        <Input className="mb-4 max-w-md" placeholder="Search couple no., name or MRN" value={q} onChange={(e) => setQ(e.target.value)} />
        {isLoading && !data ? <Spinner /> : (
          <DataTable<Row> rows={rows} onRow={setOpen} empty="No couples registered yet."
            cols={[
              { key: "couple_no", label: "Couple No.", primary: true }, { key: "f", label: "Female", render: (r) => `${r.female.full_name} (${r.female.mrn})` },
              { key: "m", label: "Male", render: (r) => r.male?.full_name ?? "—" }, { key: "c", label: "Registered", render: (r) => fmtDate(r.created_at), low: true },
            ]} />
        )}
      </Card>
      <Modal open={!!open} onClose={() => setOpen(null)} wide title={open ? `Counselling · ${open.couple_no}` : ""} footer={<Button onClick={() => setOpen(null)}>Close</Button>}>
        {open && (
          <div className="space-y-6">
            <section><h3 className="mb-2 font-semibold">Counselling notes</h3><CounsellingPanel coupleId={open.id} /></section>
            <section><h3 className="mb-2 font-semibold">Consents</h3><ConsentPanel patientId={open.female.id} /></section>
          </div>
        )}
      </Modal>
    </>
  );
}
