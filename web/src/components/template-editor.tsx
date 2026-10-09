"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2, Type } from "lucide-react";
import { Button, Field, Input, Modal, Select, Textarea } from "./ui";
import { FormEngine, type FieldDef, type Schema, type SectionDef } from "./forms";

const TYPES: { value: string; label: string }[] = [
  { value: "text", label: "Single value — Text" }, { value: "number", label: "Single value — Numeric" },
  { value: "numeric_details", label: "Numeric Details (with unit)" }, { value: "textarea", label: "Paragraph input" },
  { value: "select", label: "Dropdown" }, { value: "multiselect", label: "Multiple choice" }, { value: "yesno", label: "Yes / No" },
  { value: "checkbox", label: "Checkbox" }, { value: "date", label: "Date" }, { value: "computed", label: "Is a computed field" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field";
const uniqueKey = (schema: Schema, base: string) => {
  const all = new Set(schema.sections.flatMap((s) => s.fields.map((f) => f.key)));
  let k = slug(base), n = 2;
  while (all.has(k)) k = `${slug(base)}_${n++}`;
  return k;
};

type Pos = { s: number; f: number };

/** Template configuration: Edit/Rename/Remove field, Insert Field/Text before/after, Insert Duplicate, Edit Section/Paragraph, Add field. */
export function TemplateEditor({ schema, onChange }: { schema: Schema; onChange: (s: Schema) => void }) {
  const [sel, setSel] = useState<Pos | null>(null);
  const [edit, setEdit] = useState<{ pos: Pos; field: FieldDef; mode: "edit" | "new"; where?: "before" | "after" } | null>(null);
  const [preview, setPreview] = useState(false);

  const mut = (fn: (sections: SectionDef[]) => void) => {
    const next = structuredClone(schema.sections);
    fn(next);
    onChange({ ...schema, sections: next });
  };
  const blank = (type = "text"): FieldDef => ({ key: "", label: "", type });

  function commit() {
    if (!edit || !edit.field.label.trim()) return;
    const { pos, mode, where } = edit;
    const f = { ...edit.field };
    if (f.type === "numeric_details") { f.type = "number"; f.unit = f.unit || "unit"; }
    if (mode === "new") f.key = uniqueKey(schema, f.label);
    mut((secs) => {
      const arr = secs[pos.s].fields;
      if (mode === "edit") arr[pos.f] = { ...arr[pos.f], ...f, key: arr[pos.f].key };
      else arr.splice(where === "before" ? pos.f : pos.f + 1, 0, f);
    });
    setEdit(null);
  }

  const act = (name: string, pos: Pos) => {
    const f = schema.sections[pos.s].fields[pos.f];
    switch (name) {
      case "Edit Field": return setEdit({ pos, field: { ...f }, mode: "edit" });
      case "Rename Field": { const l = prompt("Rename field", f.label); if (l?.trim()) mut((s) => { s[pos.s].fields[pos.f].label = l.trim(); }); return; }
      case "Remove Field": if (confirm(`Remove “${f.label}”? Existing saved answers are kept but no longer shown.`)) mut((s) => { s[pos.s].fields.splice(pos.f, 1); }); return setSel(null);
      case "Insert Field Before": return setEdit({ pos, field: blank(), mode: "new", where: "before" });
      case "Insert Field After": return setEdit({ pos, field: blank(), mode: "new", where: "after" });
      case "Insert Text Before": return setEdit({ pos, field: blank("paragraph"), mode: "new", where: "before" });
      case "Insert Text After": return setEdit({ pos, field: blank("paragraph"), mode: "new", where: "after" });
      case "Insert Duplicate": return mut((s) => { s[pos.s].fields.splice(pos.f + 1, 0, { ...f, key: uniqueKey(schema, f.label + " copy"), label: `${f.label} (copy)` }); });
      case "Move up": return mut((s) => { const a = s[pos.s].fields; if (pos.f > 0) [a[pos.f - 1], a[pos.f]] = [a[pos.f], a[pos.f - 1]]; });
      case "Move down": return mut((s) => { const a = s[pos.s].fields; if (pos.f < a.length - 1) [a[pos.f + 1], a[pos.f]] = [a[pos.f], a[pos.f + 1]]; });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => { const t = prompt("New section title"); if (t?.trim()) mut((s) => { s.push({ title: t.trim(), fields: [] }); }); }}><Plus size={14} /> Add section</Button>
        <Button size="sm" onClick={() => setPreview(!preview)}>{preview ? "Back to editing" : "Preview form"}</Button>
      </div>
      {preview ? <FormEngine schema={schema} data={{}} onChange={() => {}} /> : schema.sections.map((sec, si) => (
        <section key={si} className="rounded-xl border border-line">
          <header className="flex items-center justify-between gap-2 border-b border-line bg-bg/60 px-3 py-2">
            <b>{sec.title}</b>
            <span className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => { const t = prompt("Edit Section", sec.title); if (t?.trim()) mut((s) => { s[si].title = t.trim(); }); }}><Pencil size={14} /> Edit Section</Button>
              <Button size="sm" variant="ghost" onClick={() => confirm(`Remove section “${sec.title}” and its fields?`) && mut((s) => { s.splice(si, 1); })}><Trash2 size={14} /></Button>
            </span>
          </header>
          <ul>
            {sec.fields.map((f, fi) => {
              const on = sel?.s === si && sel.f === fi;
              return (
                <li key={f.key} className={`border-b border-line last:border-0 ${on ? "bg-brand-soft/60" : ""}`}>
                  <button className="flex min-h-12 w-full items-center justify-between gap-3 px-3 text-left" onClick={() => setSel(on ? null : { s: si, f: fi })}>
                    <span className={f.type === "paragraph" ? "italic text-muted" : ""}>{f.label}</span>
                    <span className="text-xs text-muted">{f.type === "paragraph" ? "text" : f.type}</span>
                  </button>
                  {on && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                      {(f.type === "paragraph" ? ["Edit Field", "Remove Field", "Insert Field Before", "Insert Field After"] :
                        ["Edit Field", "Rename Field", "Remove Field", "Insert Field Before", "Insert Field After", "Insert Text Before", "Insert Text After", "Insert Duplicate", "Move up", "Move down"]).map((a) => (
                        <Button key={a} size="sm" variant={a === "Remove Field" ? "danger" : "secondary"} onClick={() => act(a === "Edit Field" && f.type === "paragraph" ? "Edit Field" : a, { s: si, f: fi })}>
                          {a === "Move up" ? <ArrowUp size={14} /> : a === "Move down" ? <ArrowDown size={14} /> : a === "Insert Duplicate" ? <Copy size={14} /> : null}{a === "Edit Field" && f.type === "paragraph" ? "Edit Paragraph" : a}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="p-2"><Button size="sm" variant="ghost" onClick={() => setEdit({ pos: { s: si, f: sec.fields.length - 1 }, field: blank(), mode: "new", where: "after" })}><Plus size={14} /> Add Field</Button>
            <Button size="sm" variant="ghost" onClick={() => setEdit({ pos: { s: si, f: sec.fields.length - 1 }, field: blank("paragraph"), mode: "new", where: "after" })}><Type size={14} /> Add text</Button></div>
        </section>
      ))}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.mode === "new" ? "New Field" : "Edit Field"}
        footer={<><Button onClick={() => setEdit(null)}>Cancel</Button><Button variant="primary" onClick={commit}>Apply</Button></>}>
        {edit && (
          <div className="space-y-4">
            {edit.field.type === "paragraph" ? (
              <Field label="Paragraph text"><Textarea value={edit.field.label} onChange={(e) => setEdit({ ...edit, field: { ...edit.field, label: e.target.value } })} /></Field>
            ) : (
              <>
                <Field label="Field name" required><Input value={edit.field.label} onChange={(e) => setEdit({ ...edit, field: { ...edit.field, label: e.target.value } })} /></Field>
                <Field label="Type"><Select placeholder="" options={TYPES} value={edit.field.type} onChange={(e) => setEdit({ ...edit, field: { ...edit.field, type: e.target.value } })} /></Field>
                {["select", "multiselect"].includes(edit.field.type) && (
                  <Field label="Options" hint="One per line"><Textarea value={(edit.field.options ?? []).join("\n")} onChange={(e) => setEdit({ ...edit, field: { ...edit.field, options: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) } })} /></Field>
                )}
                {["number", "numeric_details"].includes(edit.field.type) && (
                  <Field label="Unit"><Input value={edit.field.unit ?? ""} onChange={(e) => setEdit({ ...edit, field: { ...edit.field, unit: e.target.value } })} placeholder="e.g. mm" /></Field>
                )}
                {edit.field.type === "computed" && (
                  <Field label="Expression" hint="Supported: daysSince(fieldKey) with optional +N / -N. All formulas must be clinically verified before use.">
                    <Input value={edit.field.expr ?? ""} onChange={(e) => setEdit({ ...edit, field: { ...edit.field, expr: e.target.value, unverified: true } })} placeholder="daysSince(lmp)+1" />
                  </Field>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
