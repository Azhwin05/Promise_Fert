"use client";
import Link from "next/link";
import { Activity, ArrowRight, CalendarDays, ClipboardList, Microscope } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { endOfDay, startOfDay } from "@/lib/util";
import { SECTIONS, sectionVisible, visibleItems } from "@/lib/sections";
import { SectionCard, cardGrid } from "@/components/hub";

function useCount(key: string, build: () => PromiseLike<{ count: number | null }>) {
  const q = useQ<number>(key, async () => ({ data: (await build()).count ?? 0, error: null }));
  return q.data;
}

function MiniStat({ label, value, href, icon: Ico }: { label: string; value?: number; href: string; icon: typeof Activity }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-[13px] border border-line bg-surface px-4 py-3 shadow-[var(--shadow-sm)] transition-all hover:border-line-strong hover:shadow-[var(--shadow)]">
      <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-soft text-brand"><Ico size={18} /></div>
      <div className="min-w-0">
        <div className="text-[1.25rem] font-semibold leading-none tabular-nums">{value ?? <span className="text-faint">·</span>}</div>
        <div className="mt-0.5 truncate text-[12px] text-muted">{label}</div>
      </div>
    </Link>
  );
}

export default function Home() {
  const { profile, can } = useAuth();
  const s = startOfDay(), e = endOfDay();
  const regs = useCount("home:regs", () => supabase.from("visits").select("id", { count: "exact", head: true }).gte("visit_at", s).lte("visit_at", e) as never);
  const appts = useCount("home:appts", () => supabase.from("appointments").select("id", { count: "exact", head: true }).gte("starts_at", s).lte("starts_at", e) as never);
  const active = useCount("home:active", () => supabase.from("cycles").select("id", { count: "exact", head: true }).not("status", "in", "(Completed,Cancelled)") as never);
  const culture = useCount("home:culture", () => supabase.from("embryos").select("id", { count: "exact", head: true }).eq("status", "culture") as never);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = (profile?.full_name ?? "").split(" ")[0];
  const sections = SECTIONS.filter((sec) => sectionVisible(sec, can));

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-semibold tracking-tight sm:text-[1.8rem]">{greeting}{first ? `, ${first}` : ""}</h1>
        <p className="mt-1 text-[15px] text-muted">Here&apos;s your clinic at a glance — choose a module to get started.</p>
      </div>

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label="Today's registrations" value={regs} href="/registrations" icon={ClipboardList} />
        <MiniStat label="Appointments today" value={appts} href="/appointments" icon={CalendarDays} />
        <MiniStat label="Active cycles" value={active} href="/dashboard" icon={Activity} />
        <MiniStat label="Embryos in culture" value={culture} href="/worklists/monitor-embryos" icon={Microscope} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">Modules</h2>
        <Link href="/dashboard" className="flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">Open dashboard <ArrowRight size={14} /></Link>
      </div>
      <div className={cardGrid("sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
        {sections.map((sec) => (
          <SectionCard key={sec.key} section={sec} href={sec.href ?? `/s/${sec.key}`} count={sec.href ? undefined : visibleItems(sec, can).length} />
        ))}
      </div>
    </>
  );
}
