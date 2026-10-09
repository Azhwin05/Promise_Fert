"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link2, Plus } from "lucide-react";
import { Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Segmented, Spinner, Textarea, useToast } from "@/components/ui";
import { esc, refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { nul } from "@/lib/util";

type Donor = { id: string; kind: "ovum" | "semen"; code: string; details: { notes?: string; blood_group?: string; age?: string }; active: boolean; version: number };
type CyOpt = { id: string; cycle_no: number; treatment_type: string; couples: { couple_no: string; female: { full_name: string } } };

export default function Donors() {
  const toast = useToast();
  const sp = useSearchParams();
  const [kind, setKind] = useState<"ovum" | "semen">(sp.get("kind") === "semen" ? "semen" : "ovum");
  const { data, isLoading } = useQ<Donor[]>(`donors:${kind}`, () => supabase.from("donors").select("*").eq("kind", kind).eq("active", true).order("code") as never);
  const [e, setE] = useState<Partial<Donor> | null>(null);
  const [match, setMatch] = useState<Donor | null>(null);
  const [q, setQ] = useState("");
  const cycles = useQ<CyOpt[]>(match && q.trim().length > 1 ? `donor-cycles:${q}` : null, () =>
    supabase.from("cycles").select("id,cycle_no,treatment_type,couples!inner(couple_no, female:patients!couples_female_id_fkey(full_name))").or(`couple_no.ilike.%${esc(q)}%`, { referencedTable: "couples" }).not("status", "in", "(Completed,Cancelled)").limit(10) as never);

  async function save() {
    if (!e?.code) return toast("Donor code is required", "danger");
    try {
      await saveRow("donors", { kind, code: e.code, details: { notes: e.details?.notes, blood_group: e.details?.blood_group, age: e.details?.age } }, e.id, e.version);
      toast("Donor saved"); refresh("donors:"); setE(null);
    } catch (x) { toast((x as Error).message, "danger"); }
  }
  async function doMatch(c: CyOpt) {
    if (!match) return;
    try {
      const patch = match.kind === "ovum" ? { donor_ovum_id: match.id, ovum_source: "Donor Ovum" } : { donor_sperm_id: match.id, sperm_source: "Donor Sperm" };
      await saveRow("cycles", patch, c.id);
      toast(`${match.code} matched to ${c.couples.couple_no} cycle ${c.cycle_no}`); refresh("cycle:", "worklist"); setMatch(null); setQ("");
    } catch (x) { toast((x as Error).message, "danger"); }
  }

  return (
    <>
      <PageHeader title={kind === "ovum" ? "Ovum Donors" : "Semen Donors"} subtitle="Register donors and match them to cycles"
        actions={<><Segmented value={kind} onChange={(v) => v && setKind(v as never)} options={["ovum", "semen"]} /><Button variant="primary" onClick={() => setE({ details: {} })}><Plus size={18} /> Add donor</Button></>} />
      <Card>{isLoading && !data ? <Spinner /> : (
        <DataTable<Donor> rows={data ?? []} empty="No donors registered." onRow={setE}
          cols={[
            { key: "code", label: "Donor code", primary: true }, { key: "bg", label: "Blood group", render: (d) => d.details.blood_group ?? "—" },
            { key: "age", label: "Age", render: (d) => d.details.age ?? "—" }, { key: "n", label: "Notes", render: (d) => d.details.notes ?? "—", low: true },
          ]}
          actions={(d) => <Button size="sm" onClick={() => setMatch(d)}><Link2 size={14} /> Match to cycle</Button>} />
      )}</Card>
      <Modal open={!!e} onClose={() => setE(null)} title={e?.id ? "Edit donor" : "Add donor"} footer={<><Button onClick={() => setE(null)}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
        {e && (
          <div className="space-y-4">
            <Field label="Donor code" required><Input value={e.code ?? ""} onChange={(x) => setE({ ...e, code: x.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Blood group"><Input value={e.details?.blood_group ?? ""} onChange={(x) => setE({ ...e, details: { ...e.details, blood_group: x.target.value } })} /></Field>
              <Field label="Age"><Input value={e.details?.age ?? ""} onChange={(x) => setE({ ...e, details: { ...e.details, age: x.target.value } })} /></Field>
            </div>
            <Field label="Notes" hint="Donor profile fields will be extended once the clinic confirms the required attributes."><Textarea value={e.details?.notes ?? ""} onChange={(x) => setE({ ...e, details: { ...e.details, notes: nul(x.target.value) as never } })} /></Field>
          </div>
        )}
      </Modal>
      <Modal open={!!match} onClose={() => setMatch(null)} title={`Match ${match?.code ?? ""} to a cycle`} footer={<Button onClick={() => setMatch(null)}>Close</Button>}>
        <Field label="Search by couple number"><Input autoFocus value={q} onChange={(x) => setQ(x.target.value)} placeholder="e.g. IVF/00012" /></Field>
        <div className="mt-4">
          <DataTable<CyOpt> rows={cycles.data ?? []} empty={q.length > 1 ? "No open cycles found." : "Type to search."} onRow={doMatch}
            cols={[{ key: "c", label: "Couple No.", render: (c) => c.couples.couple_no, primary: true }, { key: "p", label: "Patient", render: (c) => c.couples.female.full_name }, { key: "t", label: "Cycle", render: (c) => <Badge>{`#${c.cycle_no} ${c.treatment_type}`}</Badge> }]} />
        </div>
      </Modal>
    </>
  );
}
