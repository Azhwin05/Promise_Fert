"use client";
import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button, Card, DataTable, PageHeader, Select, Spinner, useToast } from "@/components/ui";
import { refresh, saveRow, signedUrl, uploadDoc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { ConsentForm } from "@/components/consent";

export default function ConsentLibrary() {
  const toast = useToast();
  const { can } = useAuth();
  const { data, isLoading } = useQ<ConsentForm[]>("consent_forms:all", () => supabase.from("consent_forms").select("*").eq("active", true).order("name") as never);
  const [lang, setLang] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const rows = (data ?? []).filter((f) => !lang || f.language === lang);
  const langs = [...new Set((data ?? []).map((f) => f.language).filter(Boolean) as string[])];

  async function download() {
    const paths = rows.filter((f) => sel.includes(f.id) && f.file_path).map((f) => f.file_path!);
    if (!paths.length) return toast("Select forms that have a file attached", "danger");
    for (const p of paths) { const a = document.createElement("a"); a.href = await signedUrl(p); a.target = "_blank"; a.click(); }
  }
  async function upload(f: ConsentForm, file?: File | null) {
    if (!file) return;
    try { const path = await uploadDoc("consent-library", file); await saveRow("consent_forms", { file_path: path }, f.id); toast("Form file uploaded"); refresh("consent_forms"); }
    catch (e) { toast((e as Error).message, "danger"); }
  }
  return (
    <>
      <PageHeader title="Consent Forms" subtitle="Library of consent forms. Attach the signed copy from the patient's Consents tab."
        actions={<Button onClick={download} disabled={!sel.length}><Download size={16} /> Multiple download ({sel.length})</Button>} />
      <Card>
        <div className="mb-4 max-w-xs"><Select placeholder="All languages" options={langs} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Filter by language" /></div>
        {isLoading && !data ? <Spinner /> : (
          <DataTable<ConsentForm> rows={rows} empty="No consent forms."
            cols={[
              { key: "s", label: "", render: (f) => <input type="checkbox" aria-label={`Select ${f.name}`} className="size-5" checked={sel.includes(f.id)} onChange={(e) => setSel(e.target.checked ? [...sel, f.id] : sel.filter((x) => x !== f.id))} /> },
              { key: "name", label: "Consent Form", primary: true }, { key: "language", label: "Language", render: (f) => f.language ?? "—" },
              { key: "file", label: "Attached Documents", render: (f) => (f.file_path ? "1 file" : "No file uploaded") },
            ]}
            actions={can() ? (f) => (
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium hover:bg-bg">
                <Upload size={14} /> {f.file_path ? "Replace" : "Upload"}<input type="file" accept="application/pdf,image/*" className="sr-only" onChange={(e) => upload(f, e.target.files?.[0])} />
              </label>) : undefined} />
        )}
      </Card>
    </>
  );
}
