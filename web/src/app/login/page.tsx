"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Alert, Button, Field, Input } from "@/components/ui";
import { Logo } from "@/components/logo";

// Demo accounts for quick role-based sign-in (remove before production go-live).
const DEMO: [string, string, string][] = [
  ["Admin", "auditor@promisefertility.in", "AuditPass2026"],
  ["Doctor", "doctor@promisefertility.in", "Promise@2026"],
  ["Nurse", "nurse@promisefertility.in", "Promise@2026"],
  ["Embryologist", "embryologist@promisefertility.in", "Promise@2026"],
  ["Front Desk", "frontdesk@promisefertility.in", "Promise@2026"],
  ["Billing", "billing@promisefertility.in", "Promise@2026"],
];

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setInfo(""); setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message); else router.replace("/");
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) setErr(error.message);
      else if (data.session) router.replace("/");
      else setInfo("Account created. Check your email to confirm, then sign in.");
    }
    setBusy(false);
  }

  async function quick(em: string, pw: string) {
    setErr(""); setInfo(""); setEmail(em); setPassword(pw); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    if (error) setErr(error.message); else router.replace("/");
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel — desktop/tablet-landscape */}
      <div className="relative hidden w-[46%] max-w-2xl flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ background: "radial-gradient(900px 500px at 15% 10%, #1c2a2a, transparent 55%), linear-gradient(160deg, #14171c 0%, #0f1518 100%)" }}>
        <Logo className="text-white" />
        <div className="relative">
          <div className="eyebrow mb-4" style={{ color: "rgba(52,208,176,.85)" }}>IVF Hospital Information System</div>
          <h2 className="max-w-md text-[2.1rem] font-semibold leading-[1.15] tracking-tight text-white">
            Every cycle, every embryo, every outcome — in one calm, trusted record.
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/55">
            Purpose-built for the fertility clinic: from first consultation through stimulation, embryology and transfer.
          </p>
        </div>
        <div className="flex items-center gap-6 text-[12.5px] text-white/40">
          <span>Encrypted &amp; access-controlled</span><span>·</span><span>Audit-logged</span><span>·</span><span>Tablet-ready</span>
        </div>
        <div className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full border border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 size-64 rounded-full border border-white/5" />
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-5">
        <form onSubmit={submit} className="rise w-full max-w-[380px]">
          <div className="mb-8 text-brand lg:hidden"><Logo /></div>
          <h1 className="text-[1.55rem] font-semibold tracking-tight">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
          <p className="mb-7 mt-1.5 text-[14px] text-muted">{mode === "in" ? "Sign in to continue to your workspace." : "Set up access to the clinic system."}</p>
          <div className="space-y-4">
            {mode === "up" && <Field label="Full name"><Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>}
            <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></Field>
            <Field label="Password"><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} /></Field>
            {err && <Alert tone="danger">{err}</Alert>}
            {info && <Alert tone="ok">{info}</Alert>}
            <Button variant="primary" type="submit" loading={busy} className="h-12 w-full">{mode === "in" ? "Sign in" : "Create account"}</Button>
          </div>
          <button type="button" className="mt-5 w-full text-[13.5px] text-muted transition-colors hover:text-brand" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }}>
            {mode === "in" ? "First time here? Create an account" : "Already have an account? Sign in"}
          </button>
          {mode === "up" && <p className="mt-5 rounded-[10px] border border-line bg-surface-2 p-3 text-[12.5px] leading-relaxed text-muted">The first account becomes the administrator. Later accounts start as Front Desk until an admin assigns a role.</p>}

          {mode === "in" && (
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-3 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-faint">
                <span className="h-px flex-1 bg-line" />Quick demo access<span className="h-px flex-1 bg-line" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DEMO.map(([label, em, pw]) => (
                  <Button key={label} type="button" size="sm" disabled={busy} onClick={() => quick(em, pw)} className="justify-center">{label}</Button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11.5px] text-faint">One-tap sign-in as each role. Demo only — remove before go-live.</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
