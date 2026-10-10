"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Baby, CalendarDays, ClipboardList, Container, Download, FileCheck, FileText, FlaskConical, Flame,
  HeartHandshake, Inbox, LayoutDashboard, LayoutTemplate, LogOut, Menu, MessagesSquare, Microscope, PanelLeftClose,
  PanelLeftOpen, Pill, Receipt, ReceiptText, RefreshCw, Search, Send, Settings, Star, Stethoscope, TestTube2, Users, UserPlus, Wallet, X,
} from "lucide-react";
import { NAV, type NavItem } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { cx, ToastProvider } from "./ui";
import { Logo, Mark } from "./logo";

type Tab = { href: string; label: string };
type WS = { setTitle: (t: string) => void };
const WSCtx = createContext<WS>({ setTitle: () => {} });

export function useTabTitle(title?: string) {
  const { setTitle } = useContext(WSCtx);
  useEffect(() => { if (title) setTitle(title); }, [title, setTitle]);
}

type Icon = typeof LayoutDashboard;
const ICONS: Record<string, Icon> = {
  "/": LayoutDashboard, "/patients/new": UserPlus, "/registrations": ClipboardList, "/appointments": CalendarDays, "/patients": Users,
  "/counselling": MessagesSquare, "/worklists/opu": Stethoscope, "/worklists/et": Baby, "/worklists/iui": Stethoscope, "/worklists/surgeries": Activity,
  "/worklists/prepare-embryos": FlaskConical, "/worklists/monitor-embryos": Microscope, "/semen": TestTube2, "/worklists/vitrify": Container,
  "/worklists/thaw": Flame, "/worklists/renew": RefreshCw, "/worklists/pgd-send": Send, "/worklists/pgd-receive": Inbox,
  "/worklists/donor-fertilise": FlaskConical, "/worklists/donor-fertilisations": FlaskConical, "/worklists/vitrifications": Container,
  "/worklists/vitrified-embryos": Container, "/worklists/vitrified-oocytes": Container, "/storage": Container, "/donors": HeartHandshake,
  "/billing/new": ReceiptText, "/billing": Receipt, "/billing/receipts": Wallet, "/documents": FileText, "/templates": LayoutTemplate,
  "/consents": FileCheck, "/inventory": Pill, "/reports": BarChart3, "/export": Download, "/settings": Settings,
};
const base = (href: string) => href.split("?")[0];
const iconFor = (href: string) => ICONS[base(href)] ?? FileText;

const load = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const sp = useSearchParams();
  const router = useRouter();
  const { profile, can, signOut } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setFavs(load("pf.favs", [])); setRecent(load("pf.recent", [])); setTabs(load("pf.tabs", []));
    setCollapsed(load("pf.collapsed", false));
  }, []);

  const items = useMemo(() => NAV.flatMap((g) => g.items).filter((i) => !i.roles || can(...i.roles)), [can]);
  const byHref = useMemo(() => new Map(items.map((i) => [base(i.href), i])), [items]);

  useEffect(() => {
    if (path === "/login") return;
    const known = byHref.get(path)?.label;
    const label = known ?? (path.split("/").filter(Boolean).map((s) => s[0].toUpperCase() + s.slice(1)).join(" ") || "Home");
    setTabs((t) => {
      if (t.some((x) => x.href === path)) return t;
      const n = [...t, { href: path, label: path === "/" ? "IVF Dashboard" : label }].slice(-8);
      save("pf.tabs", n); return n;
    });
    if (known) setRecent((r) => { const n = [path, ...r.filter((x) => x !== path)].slice(0, 6); save("pf.recent", n); return n; });
    setDrawer(false);
  }, [path, byHref]);

  const setTitle = useCallback((title: string) => {
    setTabs((t) => { const n = t.map((x) => (x.href === path ? { ...x, label: title } : x)); save("pf.tabs", n); return n; });
  }, [path]);

  const closeTab = (href: string) => {
    const next = tabs.filter((t) => t.href !== href);
    setTabs(next); save("pf.tabs", next);
    if (href === path) router.push(next.at(-1)?.href ?? "/");
  };
  const toggleFav = (href: string) => setFavs((f) => { const n = f.includes(href) ? f.filter((x) => x !== href) : [...f, href]; save("pf.favs", n); return n; });

  // Query-aware active state: the single best-matching nav item wins, so items that share a
  // path but differ by query (e.g. Settings vs Setup) never both highlight.
  const activeHref = useMemo(() => {
    let best: string | null = null, bestScore = -1;
    for (const i of items) {
      const [b, qs] = i.href.split("?");
      const pathOk = b === "/" ? path === "/" : path === b || path.startsWith(b + "/");
      if (!pathOk) continue;
      let score = 1;
      if (qs) {
        const params = new URLSearchParams(qs);
        let ok = true;
        params.forEach((v, k) => { if (sp.get(k) !== v) ok = false; });
        if (!ok) continue;
        score = 1 + Array.from(params.keys()).length;
      }
      if (score > bestScore) { bestScore = score; best = i.href; }
    }
    return best;
  }, [items, path, sp]);
  const active = (href: string) => href === activeHref;
  const fl = filter.trim().toLowerCase();

  const navItem = (i: NavItem, keyPrefix = "") => {
    const Ico = iconFor(i.href);
    const on = active(i.href);
    const fav = favs.includes(i.href);
    return (
      <li key={keyPrefix + i.label} className="group relative flex items-center">
        <Link href={i.href} aria-current={on ? "page" : undefined}
          className={cx("flex min-h-[40px] flex-1 items-center gap-3 rounded-[9px] pl-2.5 pr-9 text-[13.5px] leading-tight transition-colors",
            on ? "bg-[var(--nav-active)] font-medium text-white" : "text-[color:var(--nav-ink)] hover:bg-[var(--nav-hover)] hover:text-white")}>
          <Ico size={17.5} className={cx("shrink-0 transition-colors", on ? "text-[color:var(--nav-accent)]" : "text-[color:var(--nav-muted)] group-hover:text-white/80")} />
          <span className="truncate">{i.label}</span>
          {on && <span className="absolute left-0 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-r-full bg-[color:var(--nav-accent)]" />}
        </Link>
        <button aria-label={fav ? "Remove favourite" : "Add favourite"} onClick={() => toggleFav(i.href)}
          className={cx("absolute right-1 grid size-8 place-items-center rounded-lg text-[color:var(--nav-muted)] transition-opacity hover:bg-white/10 hover:text-white",
            fav ? "opacity-100" : "opacity-0 focus-visible:opacity-100 group-hover:opacity-100")}>
          <Star size={14} className={fav ? "fill-amber-400 text-amber-400" : ""} />
        </button>
      </li>
    );
  };

  const brandBlock = (
    <Link href="/" className="block px-4 pb-3 pt-4 text-white">
      <Logo />
    </Link>
  );

  const sidebar = (
    <nav aria-label="Primary" className="flex h-full flex-col bg-[var(--nav-bg)]">
      {brandBlock}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--nav-muted)]" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a worklist…" aria-label="Find a worklist"
            className="min-h-9 w-full rounded-[9px] border border-[var(--nav-line)] bg-[var(--nav-surface)] pl-8.5 pr-3 text-[13px] text-white placeholder:text-[color:var(--nav-muted)] focus:border-[color:var(--nav-accent)] focus:outline-none" style={{ paddingLeft: "2.1rem" }} />
        </div>
      </div>
      <div className="nav-scroll flex-1 overflow-y-auto px-2.5 pb-6">
        {fl ? (
          <ul className="space-y-0.5">{items.filter((i) => i.label.toLowerCase().includes(fl)).map((i) => navItem(i))}</ul>
        ) : (
          <>
            {favs.length > 0 && <Group title="Favourites">{items.filter((i) => favs.includes(i.href)).map((i) => navItem(i, "f"))}</Group>}
            {recent.length > 0 && <Group title="Recent">{recent.map((h) => byHref.get(h)).filter(Boolean).slice(0, 4).map((i) => navItem(i!, "r"))}</Group>}
            {NAV.map((g) => {
              const vis = g.items.filter((i) => !i.roles || can(...i.roles));
              return vis.length ? <Group key={g.title} title={g.title}>{vis.map((i) => navItem(i))}</Group> : null;
            })}
          </>
        )}
      </div>
    </nav>
  );

  const rail = (
    <nav aria-label="Primary" className="flex h-full flex-col items-center bg-[var(--nav-bg)] py-3">
      <Link href="/" className="mb-3 text-white"><Mark className="size-9" /></Link>
      <div className="nav-scroll flex-1 overflow-y-auto">
        <ul className="flex flex-col items-center gap-1">
          {items.map((i) => {
            const Ico = iconFor(i.href); const on = active(i.href);
            return (
              <li key={i.label} className="group relative">
                <Link href={i.href} title={i.label} aria-label={i.label}
                  className={cx("grid size-11 place-items-center rounded-[11px] transition-colors",
                    on ? "bg-[var(--nav-active)] text-white" : "text-[color:var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-white")}>
                  <Ico size={19} className={on ? "text-[color:var(--nav-accent)]" : ""} />
                </Link>
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{i.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );

  return (
    <WSCtx.Provider value={{ setTitle }}>
      <ToastProvider>
        <div className="flex min-h-screen">
          <aside className={cx("no-print sticky top-0 hidden h-screen shrink-0 lg:block", collapsed ? "w-[4.75rem]" : "w-[16.5rem]")}>
            {collapsed ? rail : sidebar}
          </aside>
          {drawer && (
            <div className="no-print fixed inset-0 z-40 lg:hidden" onClick={() => setDrawer(false)}>
              <div className="fade absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
              <aside className="slideL absolute inset-y-0 left-0 w-[17rem] max-w-[86vw] shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-surface/80 px-3 py-2.5 backdrop-blur-xl" style={{ paddingTop: "max(.625rem, env(safe-area-inset-top))" }}>
              <button aria-label="Menu" className="grid size-11 place-items-center rounded-[10px] text-muted hover:bg-black/[.05] hover:text-ink lg:hidden" onClick={() => setDrawer(true)}><Menu size={22} /></button>
              <button aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden size-11 place-items-center rounded-[10px] text-muted hover:bg-black/[.05] hover:text-ink lg:grid"
                onClick={() => setCollapsed((c) => { save("pf.collapsed", !c); return !c; })}>
                {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
              </button>
              <form className="relative max-w-md flex-1" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/patients?q=${encodeURIComponent(q.trim())}`); }}>
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search MRN, name or phone" aria-label="Search patients"
                  className="min-h-10 w-full rounded-[10px] border border-line bg-surface-2 pl-10 pr-3 text-[14px] focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-[var(--brand-ring)]" />
              </form>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="hidden items-center gap-2.5 pl-1 sm:flex">
                  <div className="text-right leading-tight">
                    <div className="text-[13px] font-semibold">{profile?.full_name}</div>
                    <div className="text-[11px] capitalize text-muted">{profile?.role.replace("_", " ")}</div>
                  </div>
                  <div className="grid size-9 place-items-center rounded-full bg-ink text-[12px] font-semibold text-white">{(profile?.full_name ?? "?").slice(0, 2).toUpperCase()}</div>
                </div>
                <button aria-label="Sign out" onClick={signOut} className="grid size-11 place-items-center rounded-[10px] text-muted hover:bg-danger-soft hover:text-danger"><LogOut size={18} /></button>
              </div>
            </header>

            {tabs.length > 1 && (
              <div className="no-print flex gap-0.5 overflow-x-auto border-b border-line bg-surface-2 px-3 pt-1.5" role="tablist" aria-label="Open workspaces">
                {tabs.map((t) => {
                  const on = t.href === path;
                  return (
                    <div key={t.href} className={cx("relative flex shrink-0 items-center rounded-t-[9px] text-[12.5px] transition-colors",
                      on ? "bg-surface text-ink" : "text-muted hover:bg-black/[.03]")}>
                      {on && <span className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-ink" />}
                      <Link href={t.href} role="tab" aria-selected={on} className={cx("flex min-h-9 max-w-52 items-center truncate pl-3 pr-1", on && "font-semibold")}>{t.label}</Link>
                      <button aria-label={`Close ${t.label}`} onClick={() => closeTab(t.href)} className="mr-1 grid size-7 place-items-center rounded-md text-faint hover:bg-black/[.06] hover:text-ink"><X size={13} /></button>
                    </div>
                  );
                })}
              </div>
            )}

            <main className="mx-auto w-full max-w-[1480px] flex-1 p-4 pb-20 sm:p-7">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </WSCtx.Provider>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 first:mt-1">
      <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--nav-head)]">{title}</div>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}
