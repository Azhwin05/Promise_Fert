"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, Badge, Card, DataTable, PageHeader, Select, Spinner, Tabs, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { refresh, useQ } from "@/lib/q";
import { supabase, type Role } from "@/lib/supabase";
import { fmtDateTime } from "@/lib/util";

const ROLES: Role[] = ["admin", "doctor", "nurse", "embryologist", "lab", "front_desk", "billing"];
type U = { id: string; full_name: string; email: string | null; role: Role; active: boolean };
type Ev = { id: number; table_name: string; row_id: string | null; action: string; actor: string | null; at: string };

export default function Settings() {
  const { can, profile } = useAuth();
  const [tab, setTab] = useState(useSearchParams().get("tab") === "setup" ? "Setup" : "Users");
  if (!can()) return <Alert tone="danger">Only administrators can access settings.</Alert>;
  return (
    <>
      <PageHeader title={tab === "Setup" ? "Setup" : "Settings"} />
      <Tabs tabs={["Users", "Setup", "Audit log"]} value={tab} onChange={setTab} />
      {tab === "Users" && <Users me={profile!.id} />}
      {tab === "Setup" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[["IVF Storage configuration", "/storage"], ["Consent forms library", "/consents"], ["Configure Document Templates", "/templates?configure=1"], ["Drug Formulary", "/inventory"], ["Donors", "/donors"]].map(([l, h]) => (
            <Link key={h} href={h}><Card className="transition hover:bg-bg"><b>{l}</b></Card></Link>
          ))}
        </div>
      )}
      {tab === "Audit log" && <Audit />}
    </>
  );
}

function Users({ me }: { me: string }) {
  const toast = useToast();
  const { data, isLoading } = useQ<U[]>("users", () => supabase.from("profiles").select("*").order("created_at") as never);
  async function patch(u: U, p: Partial<U>) {
    const { error } = await supabase.from("profiles").update(p).eq("id", u.id);
    if (error) return toast(error.message, "danger");
    toast("User updated"); refresh("users", "doctors", "staff");
  }
  return (
    <Card title="Users and roles">
      <p className="mb-3 text-sm text-muted">New accounts are inactive until you enable them and assign a role. Confirm the clinic&apos;s role matrix before granting sensitive roles.</p>
      {isLoading && !data ? <Spinner /> : (
        <DataTable<U> rows={data ?? []}
          cols={[
            { key: "full_name", label: "Name", primary: true }, { key: "email", label: "Email", render: (u) => u.email ?? "—", low: true },
            { key: "role", label: "Role", render: (u) => <div className="w-44"><Select placeholder="" aria-label="Role" options={ROLES.map((r) => ({ value: r, label: r.replace("_", " ") }))} value={u.role} disabled={u.id === me} onChange={(e) => patch(u, { role: e.target.value as Role })} /></div> },
            { key: "active", label: "Status", render: (u) => <Badge tone={u.active ? "ok" : "warn"}>{u.active ? "Active" : "Awaiting approval"}</Badge> },
          ]}
          actions={(u) => u.id !== me && <button className="min-h-9 rounded-lg border border-line px-3 text-sm font-medium hover:bg-bg" onClick={() => patch(u, { active: !u.active })}>{u.active ? "Deactivate" : "Activate"}</button>} />
      )}
    </Card>
  );
}

function Audit() {
  const [t, setT] = useState("");
  const staff = useQ<{ id: string; full_name: string }[]>("staff-map", () => supabase.from("profiles").select("id, full_name") as never);
  const names = new Map((staff.data ?? []).map((s) => [s.id, s.full_name]));
  const { data, isLoading } = useQ<Ev[]>(`audit:${t}`, () => {
    let q = supabase.from("audit_log").select("id,table_name,row_id,action,actor,at").order("at", { ascending: false }).limit(200);
    if (t) q = q.eq("table_name", t);
    return q as never;
  });
  return (
    <Card title="Audit log" actions={<div className="w-48"><Select placeholder="All tables" aria-label="Table" options={["patients", "visits", "cycles", "stim_days", "opu", "outcomes", "embryos", "consents", "bills", "receipts", "profiles"]} value={t} onChange={(e) => setT(e.target.value)} /></div>}>
      {isLoading && !data ? <Spinner /> : (
        <DataTable<Ev> rows={data ?? []} empty="No events."
          cols={[
            { key: "at", label: "When", primary: true, render: (e) => fmtDateTime(e.at) }, { key: "actor", label: "Who", render: (e) => (e.actor ? names.get(e.actor) ?? "—" : "system") },
            { key: "action", label: "Action", render: (e) => <Badge tone={e.action === "DELETE" ? "danger" : e.action === "INSERT" ? "ok" : "neutral"}>{e.action}</Badge> },
            { key: "table_name", label: "Record" },
          ]} />
      )}
    </Card>
  );
}
