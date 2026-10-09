"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { Button, Card, DataTable, Input, Modal, PageHeader, Spinner, useToast } from "@/components/ui";
import { PatientPicker } from "@/components/picker";
import { DocsPanel, openFile, type Doc } from "@/components/docs";
import { esc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDateTime } from "@/lib/util";
import type { PatientLite } from "@/lib/types";

type Row = Doc & { patients: { mrn: string; full_name: string } };

export default function Documents() {
  const toast = useToast();
  const attach = useSearchParams().get("attach") === "1";
  const [q, setQ] = useState("");
  const [pick, setPick] = useState(attach);
  const [pat, setPat] = useState<PatientLite | null>(null);
  useEffect(() => { if (attach) setPick(true); }, [attach]);
  const { data, isLoading } = useQ<Row[]>(`docs-all:${q}`, () => {
    let r = supabase.from("documents").select("*, patients!inner(mrn,full_name)").order("created_at", { ascending: false }).limit(100);
    if (q.trim()) r = r.or(`full_name.ilike.%${esc(q)}%,mrn.ilike.%${esc(q)}%`, { referencedTable: "patients" });
    return r as never;
  });
  return (
    <>
      <PageHeader title="Patient Documents" actions={<Button variant="primary" onClick={() => setPick(true)}><Upload size={18} /> Attach Patient Documents</Button>} />
      <Card>
        <Input className="mb-4 max-w-md" placeholder="Filter by patient name or MRN" value={q} onChange={(e) => setQ(e.target.value)} />
        {isLoading && !data ? <Spinner /> : (
          <DataTable<Row> rows={data ?? []} empty="No documents found." onRow={(d) => openFile(d.file_path).catch((e) => toast(e.message, "danger"))}
            cols={[
              { key: "title", label: "Title", primary: true }, { key: "p", label: "Patient", render: (d) => `${d.patients.full_name} (${d.patients.mrn})` },
              { key: "category", label: "Category", render: (d) => d.category ?? "—" }, { key: "c", label: "Attached", render: (d) => fmtDateTime(d.created_at), low: true },
            ]} />
        )}
      </Card>
      <PatientPicker open={pick} onClose={() => setPick(false)} onPick={setPat} />
      <Modal open={!!pat} onClose={() => setPat(null)} wide title={pat ? `Documents · ${pat.full_name}` : ""} footer={<Button onClick={() => setPat(null)}>Close</Button>}>
        {pat && <DocsPanel patientId={pat.id} startOpen />}
      </Modal>
    </>
  );
}
