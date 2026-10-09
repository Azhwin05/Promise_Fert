"use client";
import { createContext, useCallback, useContext, useEffect, useId, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

/* ---------- Buttons ---------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "sm";
  loading?: boolean;
};
export function Button({ variant = "secondary", size = "md", loading, className, children, disabled, ...p }: BtnProps) {
  const v = {
    primary: "bg-ink text-white border-ink shadow-[var(--shadow-sm)] hover:bg-[#242a31] hover:border-[#242a31]",
    secondary: "bg-surface text-ink border-line-strong hover:bg-surface-2 hover:border-[#c4ccd3] shadow-[var(--shadow-sm)]",
    ghost: "bg-transparent text-muted border-transparent hover:bg-black/[.045] hover:text-ink",
    danger: "bg-danger text-white border-danger hover:brightness-110 shadow-[var(--shadow-sm)]",
  }[variant];
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-[10px] border font-medium transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45",
        size === "md" ? "min-h-11 px-4 text-[14.5px]" : "min-h-9 px-3 text-[13px]",
        v, className,
      )}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80" />}
      {children}
    </button>
  );
}

/* ---------- Form controls ---------- */
const ctl =
  "w-full min-h-11 rounded-[11px] border border-line bg-surface px-3.5 text-[15px] text-ink shadow-[inset_0_1px_1px_rgba(15,31,43,.02)] transition-colors placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-[var(--brand-ring)] focus:outline-none disabled:bg-surface-2 disabled:text-muted";
export const Input = ({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(ctl, className)} />;
export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(ctl, "min-h-24 resize-y py-2.5 leading-relaxed", className)} />
);
export function Select({ options, placeholder = "Select…", className, ...p }:
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select {...p} className={cx(ctl, "cursor-pointer appearance-none pr-10", className)}>
        <option value="">{placeholder}</option>
        {options.map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" viewBox="0 0 16 16" fill="none" aria-hidden><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  );
}
export function Field({ label, hint, required, children, className }:
  { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={cx("flex flex-col gap-1.5", className)}>
      <span id={id} className="text-[13px] font-semibold text-ink/90">
        {label}{required && <span className="text-danger"> *</span>}
      </span>
      <div>{children}</div>
      {hint && <p className="text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={cx("flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-[11px] border px-3.5 transition-colors",
      checked ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-surface-2")}>
      <input type="checkbox" className="size-5 accent-[var(--brand)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={checked ? "font-medium text-ink" : ""}>{label}</span>
    </label>
  );
}
export function Segmented({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="inline-flex rounded-[11px] border border-line bg-surface-2 p-1" role="radiogroup">
      {options.map((o) => (
        <button type="button" role="radio" aria-checked={value === o} key={o} onClick={() => onChange(value === o ? "" : o)}
          className={cx("min-h-9 min-w-16 rounded-[8px] px-3.5 text-sm font-medium transition-all",
            value === o ? "bg-surface text-brand shadow-[var(--shadow-sm)]" : "text-muted hover:text-ink")}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------- Layout ---------- */
export function Card({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[14px] border border-line bg-surface shadow-[var(--shadow-sm)]", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-5">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </header>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[1.35rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[1.5rem]">{title}</h1>
        {subtitle && <div className="mt-1 text-[14px] text-muted">{subtitle}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </div>
  );
}
type Tone = "neutral" | "ok" | "warn" | "danger" | "brand";
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const t = { neutral: "bg-surface-2 text-muted border-line", ok: "bg-ok-soft text-ok border-ok/15", warn: "bg-warn-soft text-warn border-warn/15",
    danger: "bg-danger-soft text-danger border-danger/15", brand: "bg-brand-soft text-brand border-brand/15" }[tone];
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-semibold", t)}>{children}</span>;
}
export const statusTone = (s?: string | null): Tone => {
  const v = (s ?? "").toLowerCase();
  if (/(received|paid|completed|done|stored|positive|success|signed|active)/.test(v)) return "ok";
  if (/(pending|partial|draft|planned|scheduled|open|culture|awaiting|stimulation)/.test(v)) return "warn";
  if (/(denied|refused|cancel|discard|failed|no_show|overdue)/.test(v)) return "danger";
  return "neutral";
};
export const Spinner = () => <div className="grid place-items-center p-12"><span className="size-6 animate-spin rounded-full border-[2.5px] border-brand/25 border-t-brand" /></div>;
export const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[12px] border border-dashed border-line-strong bg-surface-2 p-10 text-center text-muted">{children}</div>
);
export function Alert({ tone = "warn", children }: { tone?: "warn" | "danger" | "ok"; children: React.ReactNode }) {
  const t = { warn: "bg-warn-soft text-warn border-warn/20", danger: "bg-danger-soft text-danger border-danger/20", ok: "bg-ok-soft text-ok border-ok/20" }[tone];
  return <div role="alert" className={cx("rounded-[11px] border px-3.5 py-2.5 text-sm leading-snug", t)}>{children}</div>;
}

/* ---------- Tabs ---------- */
export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="no-print -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-0.5" role="tablist">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
          className={cx("min-h-10 shrink-0 rounded-[10px] px-3.5 text-[14px] font-medium transition-all",
            value === t ? "bg-ink text-white shadow-[var(--shadow-sm)]" : "bg-surface text-muted border border-line hover:bg-surface-2 hover:text-ink")}>
          {t}
        </button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, title, onClose, children, footer, wide }:
  { open: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fade fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={cx("sheet flex max-h-[100dvh] w-full flex-col bg-surface shadow-[var(--shadow-lg)] sm:max-h-[92dvh] sm:rounded-[20px]", wide ? "sm:max-w-5xl" : "sm:max-w-2xl",
          "rounded-t-[20px]")}>
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="truncate text-[17px] font-semibold tracking-tight">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="-mr-1.5 grid size-10 shrink-0 place-items-center rounded-[10px] text-muted hover:bg-black/[.05] hover:text-ink"><X size={20} /></button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="safe-b flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3.5 sm:rounded-b-[20px]">{footer}</footer>}
      </div>
    </div>
  );
}

/* ---------- Toast ---------- */
type Toast = { id: number; msg: string; tone: "ok" | "danger" };
const ToastCtx = createContext<(msg: string, tone?: "ok" | "danger") => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((msg: string, tone: "ok" | "danger" = "ok") => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, msg, tone }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), tone === "danger" ? 6000 : 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cx("pop pointer-events-auto flex items-center gap-2.5 rounded-[12px] px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-lg)]", t.tone === "ok" ? "bg-ink" : "bg-danger")}>
            {t.tone === "ok" ? <CheckCircle2 size={18} className="shrink-0 opacity-90" /> : <XCircle size={18} className="shrink-0 opacity-90" />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Responsive data table ---------- */
export type Col<T> = { key: string; label: string; render?: (r: T) => React.ReactNode; low?: boolean; primary?: boolean };
export function DataTable<T extends { id?: string | number }>({ cols, rows, onRow, empty = "Nothing here yet.", actions }:
  { cols: Col<T>[]; rows: T[]; onRow?: (r: T) => void; empty?: string; actions?: (r: T) => React.ReactNode }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  const cell = (c: Col<T>, r: T) => (c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "—"));
  return (
    <>
      {/* Table — tablet landscape & desktop */}
      <div className="hidden overflow-x-auto rounded-[12px] border border-line md:block">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line bg-surface-2 text-[11.5px] uppercase tracking-wider text-muted">
            <tr>{cols.map((c) => <th key={c.key} className={cx("px-4 py-3 font-semibold", c.low && "hidden xl:table-cell")}>{c.label}</th>)}{actions && <th className="px-4" />}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={r.id ?? i} onClick={() => onRow?.(r)} className={cx("transition-colors", onRow && "cursor-pointer hover:bg-brand-soft/40 active:bg-brand-soft/70")}>
                {cols.map((c) => <td key={c.key} className={cx("px-4 py-3 align-middle", c.primary && "font-semibold text-ink", c.low && "hidden xl:table-cell")}>{cell(c, r)}</td>)}
                {actions && <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Cards — phone & tablet portrait */}
      <ul className="space-y-2.5 md:hidden">
        {rows.map((r, i) => {
          const primary = cols.find((c) => c.primary);
          const rest = cols.filter((c) => !c.primary);
          return (
            <li key={r.id ?? i} onClick={() => onRow?.(r)}
              className={cx("rounded-[13px] border border-line bg-surface p-3.5 shadow-[var(--shadow-sm)] transition-colors", onRow && "active:bg-brand-soft/60")}>
              {primary && <div className="mb-2 text-[16px] font-semibold text-ink">{cell(primary, r)}</div>}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {rest.map((c) => (
                  <div key={c.key} className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wide text-faint">{c.label}</dt>
                    <dd className="truncate">{cell(c, r)}</dd>
                  </div>
                ))}
              </dl>
              {actions && <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-line pt-3" onClick={(e) => e.stopPropagation()}>{actions(r)}</div>}
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-[11.5px] uppercase tracking-wide text-faint">{label}</dt><dd className="mt-0.5 font-medium text-ink">{children || "—"}</dd></div>;
}
