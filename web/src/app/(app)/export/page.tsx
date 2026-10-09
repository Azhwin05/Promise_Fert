"use client";
import { useState } from "react";
import { Download } from "lucide-react";
import { Alert, Button, Card, PageHeader, useToast } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { download, toCSV, todayISO } from "@/lib/util";

const TABLES: [string, string][] = [
  ["patients", "Patients"], ["couples", "Couples"], ["visits", "Patient visits"], ["appointments", "Appointments"], ["cycles", "IVF cycles"],
  ["stim_days", "Stimulation days"], ["opu", "OPU"], ["outcomes", "Cycle outcomes"], ["semen_samples", "Semen samples"], ["fertilisations", "Fertilisations"],
  ["embryos", "Embryos"], ["vitrifications", "Vitrifications"], ["consents", "Consents"], ["bills", "Bills"], ["receipts", "Receipts"], ["drugs", "Drug formulary"],
];

export default function Export() {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  async function run(t: string) {
    setBusy(t);
    try {
      const { data, error } = await supabase.from(t).select("*").limit(20000);
      if (error) throw new Error(error.message);
      if (!data?.length) return toast("Nothing to export", "danger");
      await supabase.rpc("log_export", { tbl: t, n: data.length });
      download(`${t}-${todayISO()}.csv`, toCSV(data));
      toast(`Exported ${data.length} rows`);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy("");
  }
  return (
    <>
      <PageHeader title="Data Export" subtitle="Download tables as CSV" />
      <div className="mb-4"><Alert>Exports contain patient-identifiable data. Every export is recorded in the audit log. Store downloaded files securely and delete them when no longer needed.</Alert></div>
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TABLES.map(([t, label]) => (
            <Button key={t} className="justify-between" loading={busy === t} onClick={() => run(t)}>{label}<Download size={16} /></Button>
          ))}
        </div>
      </Card>
    </>
  );
}
