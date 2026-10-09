"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Profile, type Role } from "./supabase";

type Ctx = { profile: Profile | null; ready: boolean; signOut: () => Promise<void>; can: (...r: Role[]) => boolean };
const AuthCtx = createContext<Ctx>({ profile: null, ready: false, signOut: async () => {}, can: () => false });
export const useAuth = () => useContext(AuthCtx);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    setProfile(data as Profile | null);
    setReady(true);
  }, [router]);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => { if (e === "SIGNED_OUT") router.replace("/login"); });
    return () => sub.subscription.unsubscribe();
  }, [load, router]);

  const signOut = async () => { await supabase.auth.signOut(); router.replace("/login"); };
  const can = (...r: Role[]) => !!profile && (profile.role === "admin" || r.includes(profile.role));

  if (!ready) return <div className="grid min-h-screen place-items-center text-muted">Loading…</div>;
  if (!profile || !profile.active)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Your account is not active.</p>
          <p className="mt-1 text-muted">Ask an administrator to enable it.</p>
          <button onClick={signOut} className="mt-4 rounded-lg border border-line bg-surface px-4 py-2">Sign out</button>
        </div>
      </div>
    );
  return <AuthCtx.Provider value={{ profile, ready, signOut, can }}>{children}</AuthCtx.Provider>;
}
