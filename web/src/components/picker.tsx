"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button, DataTable, Input, Modal } from "./ui";
import { esc, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { age } from "@/lib/util";
import type { PatientLite } from "@/lib/types";

/** "Select Patient" dialog: search by MRN, name or phone. */
export function PatientPicker({ open, onClose, onPick, gender, title = "Select Patient" }:
  { open: boolean; onClose: () => void; onPick: (p: PatientLite) => void; gender?: string; title?: string }) {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const { data } = useQ<PatientLite[]>(open ? `pick:${dq}:${gender ?? ""}` : null, () => {
    let r = supabase.from("patients").select("id,mrn,full_name,gender,dob,phone,allergies").is("deleted_at", null).order("created_at", { ascending: false }).limit(15);
    const s = esc(dq);
    if (s) r = r.or(`full_name.ilike.%${s}%,mrn.ilike.%${s}%,phone.ilike.%${s}%`);
    if (gender) r = r.eq("gender", gender);
    return r as never;
  });
  return (
    <Modal open={open} onClose={onClose} title={title} wide footer={<Button onClick={onClose}>Close</Button>}>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <Input autoFocus className="pl-10" placeholder="Search MRN, name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable<PatientLite> rows={data ?? []} onRow={(p) => { onPick(p); onClose(); }} empty="No patients found."
        cols={[
          { key: "mrn", label: "MRN" }, { key: "full_name", label: "Name", primary: true }, { key: "gender", label: "Gender" },
          { key: "dob", label: "Age", render: (p) => age(p.dob) || "—" }, { key: "phone", label: "Phone No", render: (p) => p.phone ?? "—" },
        ]} />
    </Modal>
  );
}
