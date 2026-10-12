"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ChevronRight, Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Star, X } from "lucide-react";
import { ALL_ITEMS, SECTIONS, iconFor, sectionVisible, visibleItems, type Item } from "@/lib/sections";
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

const base = (href: string) => href.split("?")[0];
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
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    setFavs(load("pf.favs", [])); setTabs(load("pf.tabs", []));
    setCollapsed(load("pf.collapsed", false));
  }, []);

  const items = useMemo(() => ALL_ITEMS.filter((i) => !i.roles || can(...i.roles)), [can]);
  const byHref = useMemo(() => new Map(items.map((i) => [base(i.href), i])), [items]);
  const sections = useMemo(() => SECTIONS.filter((s) => sectionVisible(s, can)), [can]);

  // Friendly label for the open-workspace tab
  const labelFor = useCallback((p: string) => {
    if (p === "/") return "Home";
    if (p === "/dashboard") return "IVF Dashboard";
    if (p.startsWith("/s/")) return SECTIONS.find((s) => s.key === p.split("/")[2])?.title ?? "Section";
    return byHref.get(p)?.label ?? (p.split("/").filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1)).join(" ") || "Page");
  }, [byHref]);

  useEffect(() => {
    if (path === "/login") return;
    setTabs((t) => {
      if (t.some((x) => x.href === path)) return t;
      const n = [...t, { href: path, label: labelFor(path) }].slice(-8);
      save("pf.tabs", n); return n;
    });
    setDrawer(false);
  }, [path, labelFor]);

  const setTitle = useCallback((title: string) => {
    setTabs((t) => { const n = t.map((x) => (x.href === path ? { ...x, label: title } : x)); save("pf.tabs", n); return n; });
  }, [path]);

  const closeTab = (href: string) => {
    const next = tabs.filter((t) => t.href !== href);
    setTabs(next); save("pf.tabs", next);
    if (href === path) router.push(next.at(-1)?.href ?? "/");
  };
  const toggleFav = (href: string) => setFavs((f) => { const n = f.includes(href) ? f.filter((x) => x !== href) : [...f, href]; save("pf.favs", n); return n; });

  // Query-aware active for individual tool links (favourites / search results)
  const activeHref = useMemo(() => {
    let best: string | null = null, bestScore = -1;
    for (const i of items) {
      const [b, qs] = i.href.split("?");
      if (!(b === "/" ? path === "/" : path === b || path.startsWith(b + "/"))) continue;
      let score = 1;
      if (qs) { const pr = new URLSearchParams(qs); let ok = true; pr.forEach((v, k) => { if (sp.get(k) !== v) ok = false; }); if (!ok) continue; score = 1 + Array.from(pr.keys()).length; }
      if (score > bestScore) { bestScore = score; best = i.href; }
    }
    return best;
  }, [items, path, sp]);

  // Which top-level section is the current page part of
  const activeSection = useMemo(() => {
    if (path.startsWith("/s/")) return path.split("/")[2];
    for (const s of SECTIONS) {
      if (s.href && base(s.href) === path) return s.key;
      if (s.items.some((i) => { const b = base(i.href); return b === "/" ? path === "/" : path === b || path.startsWith(b + "/"); })) return s.key;
    }
    return null;
  }, [path]);

  const fl = filter.trim().toLowerCase();

  const toolRow = (i: Item, keyPrefix = "") => {
    const Ico = iconFor(i.href);
    const on = i.href === activeHref;
    const fav = favs.includes(i.href);
    return (
      <li key={keyPrefix + i.label} className="group relative flex items-center">
        <Link href={i.href} aria-current={on ? "page" : undefined}
          className={cx("flex min-h-[40px] flex-1 items-center gap-3 rounded-[9px] pl-2.5 pr-9 text-[13.5px] leading-tight transition-colors",
            on ? "bg-[var(--nav-active)] font-medium text-white" : "text-[color:var(--nav-ink)] hover:bg-[var(--nav-hover)] hover:text-white")}>
          <Ico size={17} className={cx("shrink-0", on ? "text-[color:var(--nav-accent)]" : "text-[color:var(--nav-muted)] group-hover:text-white/80")} />
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

  const sectionRow = (s: (typeof SECTIONS)[number]) => {
    const Ico = s.icon;
    const on = activeSection === s.key;
    const href = s.href ?? `/s/${s.key}`;
    const count = s.href ? 0 : visibleItems(s, can).length;
    return (
      <li key={s.key} className="relative">
        <Link href={href} aria-current={on ? "page" : undefined}
          className={cx("flex min-h-[44px] items-center gap-3 rounded-[10px] pl-2.5 pr-2 text-[14px] leading-tight transition-colors",
            on ? "bg-[var(--nav-active)] font-medium text-white" : "text-[color:var(--nav-ink)] hover:bg-[var(--nav-hover)] hover:text-white")}>
          <Ico size={18} className={cx("shrink-0", on ? "text-[color:var(--nav-accent)]" : "text-[color:var(--nav-muted)]")} />
          <span className="flex-1 truncate">{s.title}</span>
          {count > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[11px] font-semibold text-[color:var(--nav-muted)]">{count}</span>}
          {!s.href && <ChevronRight size={15} className="text-[color:var(--nav-muted)]" />}
          {on && <span className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r-full bg-[color:var(--nav-accent)]" />}
        </Link>
      </li>
    );
  };

  const homeRow = (
    <li className="relative">
      <Link href="/" aria-current={path === "/" ? "page" : undefined}
        className={cx("flex min-h-[44px] items-center gap-3 rounded-[10px] pl-2.5 pr-2 text-[14px] font-medium transition-colors",
          path === "/" ? "bg-[var(--nav-active)] text-white" : "text-[color:var(--nav-ink)] hover:bg-[var(--nav-hover)] hover:text-white")}>
        <Home size={18} className={path === "/" ? "text-[color:var(--nav-accent)]" : "text-[color:var(--nav-muted)]"} />
        <span className="flex-1">Home</span>
        {path === "/" && <span className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-r-full bg-[color:var(--nav-accent)]" />}
      </Link>
    </li>
  );

  const brandBlock = (
    <Link href="/" className="block px-4 pb-3 pt-4 text-white"><Logo /></Link>
  );

  const sidebar = (
    <nav aria-label="Primary" className="flex h-full flex-col bg-[var(--nav-bg)]">
      {brandBlock}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--nav-muted)]" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Jump to a tool…" aria-label="Find a tool"
            className="min-h-9 w-full rounded-[9px] border border-[var(--nav-line)] bg-[var(--nav-surface)] pr-3 text-[13px] text-white placeholder:text-[color:var(--nav-muted)] focus:border-[color:var(--nav-accent)] focus:outline-none" style={{ paddingLeft: "2.1rem" }} />
        </div>
      </div>
      <div className="nav-scroll flex-1 overflow-y-auto px-2.5 pb-6">
        {fl ? (
          <ul className="space-y-0.5">{items.filter((i) => i.label.toLowerCase().includes(fl)).map((i) => toolRow(i))}</ul>
        ) : (
          <>
            <ul className="space-y-0.5">{homeRow}</ul>
            {favs.length > 0 && <Group title="Favourites">{items.filter((i) => favs.includes(i.href)).map((i) => toolRow(i, "f"))}</Group>}
            <div className="mt-4">
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--nav-head)]">Modules</div>
              <ul className="space-y-0.5">{sections.map((s) => sectionRow(s))}</ul>
            </div>
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
          <li className="group relative">
            <Link href="/" title="Home" aria-label="Home" className={cx("grid size-11 place-items-center rounded-[11px] transition-colors", path === "/" ? "bg-[var(--nav-active)] text-white" : "text-[color:var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-white")}><Home size={19} className={path === "/" ? "text-[color:var(--nav-accent)]" : ""} /></Link>
            <Tip>Home</Tip>
          </li>
          {sections.map((s) => {
            const Ico = s.icon; const on = activeSection === s.key; const href = s.href ?? `/s/${s.key}`;
            return (
              <li key={s.key} className="group relative">
                <Link href={href} title={s.title} aria-label={s.title} className={cx("grid size-11 place-items-center rounded-[11px] transition-colors", on ? "bg-[var(--nav-active)] text-white" : "text-[color:var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-white")}>
                  <Ico size={19} className={on ? "text-[color:var(--nav-accent)]" : ""} />
                </Link>
                <Tip>{s.title}</Tip>
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
        <div className="min-h-screen">
          <aside className={cx("no-print fixed inset-y-0 left-0 z-40 hidden lg:block", collapsed ? "w-[4.75rem]" : "w-[16.5rem]")}>
            {collapsed ? rail : sidebar}
          </aside>
          {drawer && (
            <div className="no-print fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
              <div className="fade absolute inset-0 bg-ink/50 backdrop-blur-[2px]" />
              <aside className="slideL absolute inset-y-0 left-0 w-[17rem] max-w-[86vw] shadow-[var(--shadow-lg)]" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
            </div>
          )}

          <div className={cx("flex min-h-screen min-w-0 flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[4.75rem]" : "lg:pl-[16.5rem]")}>
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

const Tip = ({ children }: { children: React.ReactNode }) => (
  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">{children}</span>
);
