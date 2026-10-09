"use client";
import { useState } from "react";
import { Download, Eye, Paperclip, Upload } from "lucide-react";
import { Button, DataTable, Field, Input, Modal, Select, useToast, Spinner } from "./ui";
import { refresh, saveRow, signedUrl, uploadDoc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { fmtDateTime } from "@/lib/util";

export type Doc = { id: string; patient_id: string; title: string; category: string | null; file_path: string; mime: string | null; created_at: string };
export const DOC_CATEGORIES = ["Report", "Prescription", "Lab result", "Imaging", "Identity", "Consent", "Other"];

export async function openFile(path: string) {
  const w = window.open("", "_blank");
  try { const url = await signedUrl(path); if (w) w.location.href = url; }
  catch (e) { w?.close(); throw e; }
}

export function DocsPanel({ patientId, startOpen }: { patientId: string; startOpen?: boolean }) {
  const toast = useToast();
  const { data, isLoading } = useQ<Doc[]>(`docs:${patientId}`, () => supabase.from("documents").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }) as never);
  const [open, setOpen] = useState(!!startOpen);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return toast("Choose a file first", "danger");
    if (file.size > 25 * 1024 * 1024) return toast("File is larger than 25 MB", "danger");
    setBusy(true);
    try {
      const path = await uploadDoc(`patients/${patientId}`, file);
      await saveRow("documents", { patient_id: patientId, title: title || file.name, category: cat || null, file_path: path, mime: file.type });
      toast("Document attached"); refresh(`docs:${patientId}`, "docs-all");
      setOpen(false); setFile(null); setTitle(""); setCat("");
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <>
      <div className="mb-3 flex justify-end"><Button variant="primary" onClick={() => setOpen(true)}><Upload size={18} /> Attach document</Button></div>
      {isLoading && !data ? <Spinner /> : (
        <DataTable<Doc> rows={data ?? []} empty="No documents attached."
          cols={[
            { key: "title", label: "Title", primary: true },
            { key: "category", label: "Category", render: (d) => d.category ?? "—" },
            { key: "created_at", label: "Attached", render: (d) => fmtDateTime(d.created_at) },
          ]}
          actions={(d) => (
            <Button size="sm" onClick={() => openFile(d.file_path).catch((e) => toast(e.message, "danger"))}><Eye size={16} /> View</Button>
          )} />
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Attach patient document"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" loading={busy} onClick={upload}>Upload</Button></>}>
        <div className="space-y-4">
          <Field label="File" hint="PDF or image, up to 25 MB. On iPad you can take a photo directly.">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 text-muted">
              <Paperclip size={18} /> {file?.name ?? "Choose file or take photo"}
              <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </Field>
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={file?.name} /></Field>
          <Field label="Category"><Select options={DOC_CATEGORIES} value={cat} onChange={(e) => setCat(e.target.value)} /></Field>
        </div>
      </Modal>
    </>
  );
}

export { Download };
