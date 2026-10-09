"use client";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Alert, Badge, Button, Check, Field, Input, Modal, Segmented, Select, Textarea, useToast } from "./ui";
import { saveRow } from "@/lib/q";
import { useAuth } from "@/lib/auth";
import { cx } from "./ui";

export type FieldDef = {
  key: string; label: string; type: string; options?: string[]; unit?: string;
  columns?: FieldDef[]; expr?: string; unverified?: boolean;
};
export type SectionDef = { title: string; fields: FieldDef[] };
export type Schema = { sections: SectionDef[]; partial?: boolean };
type Data = Record<string, unknown>;

/** Tiny, safe evaluator. Only `daysSince(field)` with optional +/- integer is supported. */
function evalExpr(expr: string | undefined, data: Data): string {
  const m = expr?.match(/^daysSince\((\w+)\)\s*([+-]\s*\d+)?$/);
  if (!m) return "";
  const v = data[m[1]];
  if (!v) return "";
  const d = Math.floor((Date.now() - new Date(String(v)).getTime()) / 86400000);
  return String(d + (m[2] ? Number(m[2].replace(/\s/g, "")) : 0));
}

function Control({ f, value, onChange, data, ro }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; data: Data; ro?: boolean }) {
  const s = value == null ? "" : String(value);
  switch (f.type) {
    case "textarea": return <Textarea disabled={ro} value={s} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <div className="flex items-center gap-2">
          <Input disabled={ro} type="number" inputMode="decimal" step="any" value={s} onChange={(e) => onChange(e.target.value)} />
          {f.unit && <span className="text-sm text-muted">{f.unit}</span>}
        </div>
      );
    case "date": return <Input disabled={ro} type="date" value={s} onChange={(e) => onChange(e.target.value)} />;
    case "select": return <Select disabled={ro} options={f.options ?? []} value={s} onChange={(e) => onChange(e.target.value)} />;
    case "yesno": return <Segmented value={s} onChange={(v) => !ro && onChange(v)} options={["Yes", "No"]} />;
    case "checkbox": return <Check label={f.label} checked={!!value} onChange={(v) => !ro && onChange(v)} />;
    case "multiselect": {
      const cur = (Array.isArray(value) ? value : []) as string[];
      return (
        <div className="flex flex-wrap gap-2">
          {(f.options ?? []).map((o) => {
            const on = cur.includes(o);
            return (
              <button type="button" key={o} aria-pressed={on} disabled={ro}
                onClick={() => onChange(on ? cur.filter((x) => x !== o) : [...cur, o])}
                className={cx("min-h-11 rounded-lg border px-3 text-sm", on ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-surface")}>
                {on ? "✓ " : ""}{o}
              </button>
            );
          })}
        </div>
      );
    }
    case "computed":
      return (
        <div>
          <Input disabled value={evalExpr(f.expr, data)} readOnly />
          {f.unverified && <p className="mt-1 text-xs text-warn">Formula pending clinical verification.</p>}
        </div>
      );
    default: return <Input disabled={ro} value={s} onChange={(e) => onChange(e.target.value)} />;
  }
}

function Rows({ f, value, onChange, ro }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; ro?: boolean }) {
  const rows = (Array.isArray(value) ? value : []) as Data[];
  const set = (i: number, k: string, v: unknown) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted">#{i + 1}</span>
            {!ro && <Button size="sm" variant="ghost" aria-label="Remove row" onClick={() => onChange(rows.filter((_, j) => j !== i))}><Trash2 size={16} /></Button>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(f.columns ?? []).map((c) => (
              <Field key={c.key} label={c.label}><Control f={c} ro={ro} value={r[c.key]} data={r} onChange={(v) => set(i, c.key, v)} /></Field>
            ))}
          </div>
        </div>
      ))}
      {!ro && <Button size="sm" onClick={() => onChange([...rows, {}])}><Plus size={16} /> Add {f.label.toLowerCase()} row</Button>}
    </div>
  );
}

export function FormEngine({ schema, data, onChange, ro }: { schema: Schema; data: Data; onChange: (d: Data) => void; ro?: boolean }) {
  const set = (k: string, v: unknown) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-6">
      {schema.partial && <Alert>This template is only partially captured from the source system. Fields shown are confirmed; the rest are pending clinic confirmation.</Alert>}
      {schema.sections.length > 2 && (
        <div className="sticky top-0 z-10 -mx-1 flex gap-1 overflow-x-auto bg-surface/95 px-1 py-1 backdrop-blur">
          {schema.sections.map((s, i) => (
            <a key={i} href={`#sec-${i}`} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-bg">{s.title}</a>
          ))}
        </div>
      )}
      {schema.sections.map((s, i) => (
        <section key={i} id={`sec-${i}`} className="scroll-mt-14">
          <h3 className="mb-3 border-b border-line pb-1 font-semibold">{s.title}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {s.fields.map((f) =>
              f.type === "paragraph" ? (
                <p key={f.key} className="text-muted md:col-span-2">{f.label}</p>
              ) : f.type === "rows" ? (
                <Field key={f.key} label={f.label} className="md:col-span-2"><Rows f={f} ro={ro} value={data[f.key]} onChange={(v) => set(f.key, v)} /></Field>
              ) : f.type === "checkbox" ? (
                <div key={f.key}><Control f={f} ro={ro} value={data[f.key]} data={data} onChange={(v) => set(f.key, v)} /></div>
              ) : (
                <Field key={f.key} label={f.label} className={f.type === "textarea" || f.type === "multiselect" ? "md:col-span-2" : ""}>
                  <Control f={f} ro={ro} value={data[f.key]} data={data} onChange={(v) => set(f.key, v)} />
                </Field>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

export type Response = { id: string; template_id: string; patient_id: string; data: Data; signed_by: string | null; signed_at: string | null; version: number; created_at: string };

/** Modal to fill / view a template-driven form for a patient. */
export function FormModal({ open, onClose, template, patientId, visitId, cycleId, existing, onSaved }: {
  open: boolean; onClose: () => void; template: { id: string; name: string; schema: Schema } | null;
  patientId: string; visitId?: string; cycleId?: string; existing?: Response | null; onSaved: () => void;
}) {
  const toast = useToast();
  const { profile } = useAuth();
  const [draft, setDraft] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const data = draft ?? existing?.data ?? {};
  const signed = !!existing?.signed_at;
  const ro = signed;
  const title = useMemo(() => template?.name ?? "Form", [template]);

  const close = () => { setDraft(null); onClose(); };
  async function save(sign = false) {
    if (!template) return;
    setBusy(true);
    try {
      const row: Data = { template_id: template.id, patient_id: patientId, visit_id: visitId ?? null, cycle_id: cycleId ?? null, data };
      if (sign) { row.signed_by = profile?.id; row.signed_at = new Date().toISOString(); }
      await saveRow("form_responses", existing ? { data, ...(sign ? { signed_by: profile?.id, signed_at: row.signed_at } : {}) } : row, existing?.id, existing?.version);
      toast(sign ? "Saved and signed" : "Saved");
      onSaved(); close();
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <Modal open={open} onClose={close} title={title} wide
      footer={<>
        {signed && <Badge tone="ok">Signed {existing?.signed_at && new Date(existing.signed_at).toLocaleString("en-GB")}</Badge>}
        <Button onClick={close}>{signed ? "Close" : "Cancel"}</Button>
        {!signed && <Button loading={busy} onClick={() => save(false)}>Save draft</Button>}
        {!signed && <Button variant="primary" loading={busy} onClick={() => save(true)}>Save & sign</Button>}
      </>}>
      {template && <FormEngine schema={template.schema} data={data} onChange={setDraft} ro={ro} />}
    </Modal>
  );
}
