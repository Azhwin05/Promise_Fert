"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Alert, Badge, Button, Card, DataTable, Field, Input, Modal, PageHeader, Select, Spinner, Tabs, useToast } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { refresh, useQ } from "@/lib/q";
import { supabase, type Role } from "@/lib/supabase";
import { fmtDateTime } from "@/lib/util";

const ROLES: Role[] = ["admin", "doctor", "nurse", "embryologist", "lab", "front_desk", "billing"];
const roleLabel = (r: Role) => r.replace("_", " ");
type Loc = { id: string; name: string };
type U = { id: string; full_name: string; email: string | null; role: Role; active: boolean; location_id: string | null };
type Ev = { id: number; table_name: string; row_id: string | null; action: string; actor: string | null; at: string };

const genPassword = () => {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ", b = "abcdefghijkmnpqrstuvwxyz", n = "23456789", s = "!@#$";
  const pick = (set: string, k: number) => Array.from({ length: k }, () => set[Math.floor(Math.random() * set.length)]).join("");
  return (pick(a, 2) + pick(b, 4) + pick(n, 3) + pick(s, 1)).split("").sort(() => Math.random() - 0.5).join("");
};

async function adminCall(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    let msg = error.message;
    try { const j = await (error as { context?: Response }).context?.json(); if (j?.error) msg = j.error; } catch { /* keep msg */ }
    throw new Error(msg);
  }
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data;
}

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
            <Link key={h} href={h}><Card className="transition hover:bg-surface-2"><b>{l}</b></Card></Link>
          ))}
        </div>
      )}
      {tab === "Audit log" && <Audit />}
    </>
  );
}

function Users({ me }: { me: string }) {
  const toast = useToast();
  const users = useQ<U[]>("users", () => supabase.from("profiles").select("*").order("created_at") as never);
  const locs = useQ<Loc[]>("locations", () => supabase.from("locations").select("id,name").eq("active", true).order("name") as never);
  const locName = (id: string | null) => (id ? locs.data?.find((l) => l.id === id)?.name ?? "—" : "—");
  const [add, setAdd] = useState(false);
  const [reset, setReset] = useState<U | null>(null);

  async function patch(u: U, p: Partial<U>) {
    const { error } = await supabase.from("profiles").update(p).eq("id", u.id);
    if (error) return toast(error.message, "danger");
    toast("User updated"); refresh("users", "doctors", "staff");
  }
  async function remove(u: U) {
    if (!confirm(`Permanently remove ${u.full_name}? This deletes their login and cannot be undone.`)) return;
    try { await adminCall({ action: "delete", user_id: u.id }); toast("User removed"); refresh("users"); }
    catch (e) { toast((e as Error).message, "danger"); }
  }

  return (
    <>
      <Card title="Users & roles" actions={<Button size="sm" variant="primary" onClick={() => setAdd(true)}><Plus size={16} /> Add staff</Button>}>
        <p className="mb-4 text-sm text-muted">Create accounts for your team and set each person&apos;s role. People who self-register stay inactive until you activate them here. Confirm the clinic&apos;s role matrix before granting sensitive roles.</p>
        {users.isLoading && !users.data ? <Spinner /> : (
          <DataTable<U> rows={users.data ?? []}
            cols={[
              { key: "full_name", label: "Name", primary: true },
              { key: "email", label: "Email", render: (u) => u.email ?? "—", low: true },
              { key: "role", label: "Role", render: (u) => (
                <div className="w-40"><Select placeholder="" aria-label="Role" options={ROLES.map((r) => ({ value: r, label: roleLabel(r) }))} value={u.role} disabled={u.id === me} onChange={(e) => patch(u, { role: e.target.value as Role })} /></div>
              ) },
              { key: "location", label: "Location", low: true, render: (u) => (
                <div className="w-40"><Select placeholder="—" aria-label="Location" options={(locs.data ?? []).map((l) => ({ value: l.id, label: l.name }))} value={u.location_id ?? ""} onChange={(e) => patch(u, { location_id: e.target.value || null })} /></div>
              ) },
              { key: "active", label: "Status", render: (u) => <Badge tone={u.active ? "ok" : "warn"}>{u.active ? "Active" : "Awaiting approval"}</Badge> },
            ]}
            actions={(u) => (
              <div className="flex flex-wrap justify-end gap-1.5">
                {u.id !== me && <Button size="sm" onClick={() => patch(u, { active: !u.active })}>{u.active ? "Deactivate" : "Activate"}</Button>}
                <Button size="sm" onClick={() => setReset(u)}><KeyRound size={14} /> Password</Button>
                {u.id !== me && <Button size="sm" variant="danger" onClick={() => remove(u)}><Trash2 size={14} /></Button>}
              </div>
            )} />
        )}
      </Card>
      <AddStaff open={add} onClose={() => setAdd(false)} locs={locs.data ?? []} />
      <ResetPassword user={reset} onClose={() => setReset(null)} />
    </>
  );
}

function AddStaff({ open, onClose, locs }: { open: boolean; onClose: () => void; locs: Loc[] }) {
  const toast = useToast();
  const [f, setF] = useState({ full_name: "", email: "", role: "front_desk" as Role, location_id: "", password: genPassword() });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }));
  const reGen = () => set("password", genPassword());

  function close() { setCreated(null); setF({ full_name: "", email: "", role: "front_desk", location_id: "", password: genPassword() }); onClose(); }
  async function create() {
    if (!f.email.trim() || f.password.length < 8) return toast("Enter an email and an 8+ character password", "danger");
    setBusy(true);
    try {
      await adminCall({ action: "create", email: f.email, password: f.password, full_name: f.full_name, role: f.role, location_id: f.location_id || null });
      setCreated({ email: f.email.trim().toLowerCase(), password: f.password });
      refresh("users", "doctors", "staff"); toast("Account created");
    } catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }

  return (
    <Modal open={open} onClose={close} title="Add staff member"
      footer={created
        ? <Button variant="primary" onClick={close}>Done</Button>
        : <><Button onClick={close}>Cancel</Button><Button variant="primary" loading={busy} onClick={create}>Create account</Button></>}>
      {created ? (
        <div className="space-y-4">
          <Alert tone="ok">Account created. Share these credentials with the staff member — they can change the password after signing in.</Alert>
          <div className="rounded-[11px] border border-line bg-surface-2 p-4 font-mono text-sm">
            <div><span className="text-muted">Email:&nbsp;&nbsp;&nbsp;</span>{created.email}</div>
            <div><span className="text-muted">Password:</span> {created.password}</div>
          </div>
          <Button onClick={() => { navigator.clipboard?.writeText(`Email: ${created.email}\nPassword: ${created.password}`); toast("Copied"); }}>Copy credentials</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="off" /></Field>
            <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" inputMode="email" /></Field>
            <Field label="Role"><Select placeholder="" options={ROLES.map((r) => ({ value: r, label: roleLabel(r) }))} value={f.role} onChange={(e) => set("role", e.target.value)} /></Field>
            <Field label="Location"><Select options={locs.map((l) => ({ value: l.id, label: l.name }))} value={f.location_id} onChange={(e) => set("location_id", e.target.value)} /></Field>
          </div>
          <Field label="Temporary password" required hint="Share this with the staff member; they can change it after first sign-in.">
            <div className="flex gap-2">
              <Input value={f.password} onChange={(e) => set("password", e.target.value)} className="font-mono" />
              <Button type="button" onClick={reGen} aria-label="Generate new password"><RefreshCw size={16} /></Button>
            </div>
          </Field>
          <p className="text-xs text-muted">The account is created active with the chosen role. The first account in the system is always the administrator.</p>
        </div>
      )}
    </Modal>
  );
}

function ResetPassword({ user, onClose }: { user: U | null; onClose: () => void }) {
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  function close() { setPw(""); onClose(); }
  async function save() {
    if (pw.length < 8) return toast("Password must be at least 8 characters", "danger");
    setBusy(true);
    try { await adminCall({ action: "reset_password", user_id: user!.id, password: pw }); toast("Password updated"); close(); }
    catch (e) { toast((e as Error).message, "danger"); }
    setBusy(false);
  }
  return (
    <Modal open={!!user} onClose={close} title={user ? `Set password — ${user.full_name}` : ""}
      footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Update password</Button></>}>
      <Field label="New password" required hint="The staff member can change it again after signing in.">
        <div className="flex gap-2">
          <Input value={pw} onChange={(e) => setPw(e.target.value)} className="font-mono" placeholder="At least 8 characters" />
          <Button type="button" onClick={() => setPw(genPassword())} aria-label="Generate"><RefreshCw size={16} /></Button>
        </div>
      </Field>
    </Modal>
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
