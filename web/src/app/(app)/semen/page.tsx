"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Card, DataTable, PageHeader, Spinner } from "@/components/ui";
import { PatientPicker } from "@/components/picker";
import { SemenModal, type Semen } from "@/components/semen";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDateTime } from "@/lib/util";
import type { PatientLite } from "@/lib/types";

type Row = Semen & { patients: { mrn: string; full_name: string } };

export default function SemenPage() {
  const { data, isLoading } = useQ<Row[]>("semen:list", () => supabase.from("semen_samples").select("*, patients(mrn,full_name)").order("collected_at", { ascending: false }).limit(200) as never);
  const [pick, setPick] = useState(false);
  const [pat, setPat] = useState<PatientLite | null>(null);
  const [edit, setEdit] = useState<Row | null>(null);
  return (
    <>
      <PageHeader title="Semen Samples" subtitle="Collection, analysis and processing" actions={<Button variant="primary" onClick={() => setPick(true)}><Plus size={18} /> New sample</Button>} />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<Row> rows={data ?? []} empty="No semen samples recorded." onRow={setEdit}
          cols={[
            { key: "c", label: "Collection Date", primary: true, render: (s) => fmtDateTime(s.collected_at) },
            { key: "p", label: "Patient", render: (s) => `${s.patients.full_name} (${s.patients.mrn})` },
            { key: "v", label: "Volume (ml)", render: (s) => s.volume_ml ?? "—" },
            { key: "con", label: "Concentration (mill/ml)", render: (s) => s.concentration_mill_ml ?? "—", low: true },
            { key: "m", label: "Total motile prog.", render: (s) => s.total_motile_prog ?? "—", low: true },
          ]} />
      )}</Card>
      <PatientPicker open={pick} onClose={() => setPick(false)} onPick={setPat} gender="Male" title="Select male patient" />
      {pat && <SemenModal key={pat.id} open onClose={() => setPat(null)} patientId={pat.id} />}
      {edit && <SemenModal key={edit.id} open onClose={() => setEdit(null)} patientId={edit.patient_id} existing={edit} />}
    </>
  );
}
