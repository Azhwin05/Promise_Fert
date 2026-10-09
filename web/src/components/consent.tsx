"use client";
import { useState } from "react";
import { Download, Eye, Plus } from "lucide-react";
import { Badge, Button, DataTable, Field, Input, Modal, Select, Spinner, statusTone, Textarea, useToast } from "./ui";
import { refresh, saveRow, signedUrl, uploadDoc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDate, nul, todayISO } from "@/lib/util";
import { openFile } from "./docs";

export const CONSENT_STATUS = ["Consent pending", "Consent received", "Consent denied", "Refused to continue"];
export type ConsentForm = { id: string; name: string; language: string | null; file_path: string | null };
export type Consent = {
  id: string; patient_id: string; cycle_id: string | null; form_id: string | null; kind: string | null; status: string;
  received_on: string | null; file_path: string | null; notes: string | null; created_at: string; version: number;
  consent_forms: { name: string } | null;
};

export function ConsentPanel({ patientId, cycleId, kind }: { patientId: string; cycleId?: string; kind?: string }) {
  const toast = useToast();
  const key = `consents:${patientId}:${cycleId ?? ""}`;
  const forms = useQ<ConsentForm[]>("consent_forms", () => supabase.from("consent_forms").select("*").eq("active", true).order("name") as never);
  const { data, isLoading } = useQ<Consent[]>(key, () => {
    let r = supabase.from("consents").select("*, consent_forms(name)").eq("patient_id", patientId).order("created_at", { ascending: false });
    if (cycleId) r = r.eq("cycle_id", cycleId);
    return r as never;
  });
  const [edit, setEdit] = useState<Partial<Consent> | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string[]>([]);

  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      let file_path = edit.file_path ?? null;
      if (file) file_path = await uploadDoc(`patients/${patientId}/consents`, file);
      const row = {
        patient_id: patientId, cycle_id: cycleId ?? null, form_id: nul(edit.form_id), kind: kind ?? edit.kind ?? null,
        status: edit.status ?? "Consent pending", received_on: nul(edit.received_on), file_path, notes: nul(edit.notes),
      };
      if (row.status === "Consent received" && !row.received_on) row.received_on = todayISO();
      await saveRow("consents", row, edit.id, edit.version);
      toast("Consent saved"); refresh("consents:"); setEdit(null); setFile(null);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }

  async function multiDownload() {
    const paths = (data ?? []).filter((c) => sel.includes(c.id) && c.file_path).map((c) => c.file_path!);
    if (!paths.length) return toast("Select consents that have attachments", "danger");
    for (const p of paths) { const a = document.createElement("a"); a.href = await signedUrl(p); a.target = "_blank"; a.click(); }
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap justify-end gap-2">
        <Button onClick={multiDownload} disabled={!sel.length}><Download size={16} /> Multiple download ({sel.length})</Button>
        <Button variant="primary" onClick={() => setEdit({ status: "Consent pending" })}><Plus size={18} /> Add consent form</Button>
      </div>
      {isLoading && !data ? <Spinner /> : (
        <DataTable<Consent> rows={data ?? []} empty="No consent records yet." onRow={(c) => setEdit(c)}
          cols={[
            { key: "sel", label: "", render: (c) => (
              <input type="checkbox" aria-label="Select for download" className="size-5" checked={sel.includes(c.id)}
                onClick={(e) => e.stopPropagation()} onChange={(e) => setSel(e.target.checked ? [...sel, c.id] : sel.filter((x) => x !== c.id))} />) },
            { key: "form", label: "Consent Form", primary: true, render: (c) => c.consent_forms?.name ?? c.kind ?? "—" },
            { key: "status", label: "Status", render: (c) => <Badge tone={statusTone(c.status)}>{c.status}</Badge> },
            { key: "received_on", label: "Received on", render: (c) => fmtDate(c.received_on) },
            { key: "file", label: "Attached Documents", render: (c) => c.file_path ? "1 file" : "—", low: true },
          ]}
          actions={(c) => c.file_path ? <Button size="sm" onClick={() => openFile(c.file_path!).catch((e) => toast(e.message, "danger"))}><Eye size={16} /> View</Button> : null} />
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Update consent" : "Add consent form"}
        footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Consent form"><Select options={(forms.data ?? []).map((f) => ({ value: f.id, label: f.name }))} value={edit.form_id ?? ""} onChange={(e) => setEdit({ ...edit, form_id: e.target.value })} /></Field>
            <Field label="Status"><Select options={CONSENT_STATUS} value={edit.status ?? ""} onChange={(e) => setEdit({ ...edit, status: e.target.value })} /></Field>
            <Field label="Received on"><Input type="date" value={edit.received_on ?? ""} onChange={(e) => setEdit({ ...edit, received_on: e.target.value })} /></Field>
            <Field label="Upload signed consent"><Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
            <Field label="Notes"><Textarea value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
