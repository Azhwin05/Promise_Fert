"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Badge, Button, DataTable, Field, Input, Modal, Select, Spinner, statusTone, Textarea, useToast } from "./ui";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useStaffMap } from "@/lib/staff";
import { fmtDate, nul, todayISO } from "@/lib/util";
import { CONSENT_STATUS } from "./consent";

type Note = { id: string; couple_id: string; done_by: string | null; note_date: string; note: string; status: string | null; created_by: string | null; version: number };

export function CounsellingPanel({ coupleId }: { coupleId: string }) {
  const toast = useToast();
  const { profile } = useAuth();
  const who = useStaffMap();
  const key = `counselling:${coupleId}`;
  const { data, isLoading } = useQ<Note[]>(key, () => supabase.from("counselling_notes").select("*").eq("couple_id", coupleId).order("note_date", { ascending: false }) as never);
  const [e, setE] = useState<Partial<Note> | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!e?.note?.trim()) return toast("Write a note first", "danger");
    setBusy(true);
    try {
      await saveRow("counselling_notes", { couple_id: coupleId, done_by: nul(e.done_by) ?? profile?.full_name, note_date: e.note_date || todayISO(), note: e.note, status: nul(e.status) }, e.id, e.version);
      toast("Note saved"); refresh(key, "counselling-list"); setE(null);
    } catch (x) { toast((x as Error).message, "danger"); }
    setBusy(false);
  }
  return (
    <>
      <div className="mb-3 flex justify-end"><Button size="sm" variant="primary" onClick={() => setE({ note_date: todayISO(), done_by: profile?.full_name })}><Plus size={16} /> New Note</Button></div>
      {isLoading && !data ? <Spinner /> : (
        <DataTable<Note> rows={data ?? []} empty="No counselling notes yet." onRow={(n) => setE(n)}
          cols={[
            { key: "note_date", label: "Date", primary: true, render: (n) => fmtDate(n.note_date) },
            { key: "done_by", label: "Done By", render: (n) => n.done_by ?? "—" },
            { key: "note", label: "Note" },
            { key: "status", label: "Status", render: (n) => (n.status ? <Badge tone={statusTone(n.status)}>{n.status}</Badge> : "—") },
            { key: "by", label: "Recorded By", render: (n) => who(n.created_by), low: true },
          ]} />
      )}
      <Modal open={!!e} onClose={() => setE(null)} title={e?.id ? "Counselling note" : "New Note"}
        footer={<><Button onClick={() => setE(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
        {e && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Done By"><Input value={e.done_by ?? ""} onChange={(x) => setE({ ...e, done_by: x.target.value })} /></Field>
              <Field label="Date"><Input type="date" value={e.note_date ?? ""} onChange={(x) => setE({ ...e, note_date: x.target.value })} /></Field>
            </div>
            <Field label="Note"><Textarea value={e.note ?? ""} onChange={(x) => setE({ ...e, note: x.target.value })} /></Field>
            <Field label="Status"><Select options={CONSENT_STATUS} value={e.status ?? ""} onChange={(x) => setE({ ...e, status: x.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
