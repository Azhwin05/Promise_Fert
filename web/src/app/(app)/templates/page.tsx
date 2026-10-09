"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from "@/components/ui";
import { FormEngine, type Schema } from "@/components/forms";
import { TemplateEditor } from "@/components/template-editor";
import { useAuth } from "@/lib/auth";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { nul } from "@/lib/util";

type T = { id: string; name: string; category: string; speciality: string | null; diagnosis: string | null; gender: string; schema: Schema; active: boolean; version: number };

export default function Templates() {
  const toast = useToast();
  const { can } = useAuth();
  const configure = useSearchParams().get("configure") === "1";
  const [spec, setSpec] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<Partial<T> | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQ<T[]>("templates:all", () => supabase.from("templates").select("*").order("name") as never);
  const canEdit = can("doctor");

  const rows = (data ?? []).filter((t) => (!spec || t.speciality === spec) && (!cat || t.category === cat));
  const uniq = (k: "speciality" | "category") => [...new Set((data ?? []).map((t) => t[k]).filter(Boolean) as string[])].sort();

  async function save() {
    if (!open?.name?.trim()) return toast("Document name is required", "danger");
    setBusy(true);
    try {
      await saveRow("templates", { name: open.name, category: open.category || "Examination", speciality: nul(open.speciality), diagnosis: nul(open.diagnosis), gender: open.gender || "All", schema: open.schema ?? { sections: [] }, active: open.active ?? true }, open.id, open.version);
      toast("Template saved"); refresh("templates"); setOpen(null);
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  const openT = (t: Partial<T>, m: "view" | "edit") => { setOpen(t); setMode(m); };

  return (
    <>
      <PageHeader title={configure ? "Configure Document Templates" : "Document Templates"}
        actions={canEdit && configure ? <Button variant="primary" onClick={() => openT({ gender: "All", category: "Examination", schema: { sections: [{ title: "Section 1", fields: [] }] } }, "edit")}><Plus size={18} /> CREATE TEMPLATE</Button> : undefined} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <Field label="Category"><Select placeholder="All" options={uniq("speciality")} value={spec} onChange={(e) => setSpec(e.target.value)} /></Field>
          <Field label="Types"><Select placeholder="All" options={uniq("category")} value={cat} onChange={(e) => setCat(e.target.value)} /></Field>
        </div>
        {isLoading && !data ? <Spinner /> : (
          <DataTable<T> rows={rows} empty="No templates match the filters." onRow={(t) => openT(t, configure && canEdit ? "edit" : "view")}
            cols={[
              { key: "n", label: "S.No", render: (t) => rows.indexOf(t) + 1 }, { key: "name", label: "Document Name", primary: true },
              { key: "category", label: "Category" }, { key: "speciality", label: "Speciality", render: (t) => t.speciality ?? "—" },
              { key: "diagnosis", label: "Diagnosis", render: (t) => t.diagnosis ?? "—", low: true },
              { key: "gender", label: "Gender" },
              { key: "st", label: "", render: (t) => (t.schema.partial ? <Badge tone="warn">Partial</Badge> : null) },
            ]} />
        )}
      </Card>
      <Modal open={!!open} wide onClose={() => setOpen(null)} title={open?.name || "New template"}
        footer={<>
          <Button onClick={() => setOpen(null)}>{mode === "edit" ? "Cancel" : "Close"}</Button>
          {canEdit && mode === "view" && <Button onClick={() => setMode("edit")}>Configure</Button>}
          {mode === "edit" && <Button variant="primary" loading={busy} onClick={save}>Save template</Button>}</>}>
        {open && (mode === "view" ? <FormEngine schema={open.schema ?? { sections: [] }} data={{}} onChange={() => {}} /> : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Document Name" required><Input value={open.name ?? ""} onChange={(e) => setOpen({ ...open, name: e.target.value })} /></Field>
              <Field label="Category"><Input value={open.category ?? ""} onChange={(e) => setOpen({ ...open, category: e.target.value })} /></Field>
              <Field label="Speciality"><Input value={open.speciality ?? ""} onChange={(e) => setOpen({ ...open, speciality: e.target.value })} /></Field>
              <Field label="Diagnosis"><Input value={open.diagnosis ?? ""} onChange={(e) => setOpen({ ...open, diagnosis: e.target.value })} /></Field>
              <Field label="Gender"><Select placeholder="" options={["All", "Female", "Male"]} value={open.gender ?? "All"} onChange={(e) => setOpen({ ...open, gender: e.target.value })} /></Field>
            </div>
            <TemplateEditor schema={open.schema ?? { sections: [] }} onChange={(s) => setOpen({ ...open, schema: s })} />
          </div>
        ))}
      </Modal>
    </>
  );
}
