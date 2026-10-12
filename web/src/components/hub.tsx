"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cx } from "./ui";
import type { Icon, Item, Section } from "@/lib/sections";

/** Large card for a top-level section on the Modules hub. */
export function SectionCard({ section, href, count }: { section: Section; href: string; count?: number }) {
  const Ico = section.icon;
  return (
    <Link href={href}
      className="group relative flex flex-col overflow-hidden rounded-[16px] border border-line bg-surface p-5 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[var(--shadow-md)]">
      <div className="mb-4 flex items-start justify-between">
        <div className="grid size-12 place-items-center rounded-[13px] bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-brand-ink">
          <Ico size={24} />
        </div>
        {count != null && count > 0 && (
          <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[11.5px] font-semibold text-muted">{count} tool{count > 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="text-[1.05rem] font-semibold tracking-tight text-ink">{section.title}</div>
      <p className="mt-1 text-[13px] leading-snug text-muted">{section.desc}</p>
      <div className="mt-4 flex items-center gap-1 text-[13px] font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
        Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </div>
      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
    </Link>
  );
}

/** Compact card for a single tool inside a section hub. */
export function ToolCard({ item }: { item: Item }) {
  const Ico: Icon = item.icon;
  return (
    <Link href={item.href}
      className="group flex items-center gap-3.5 rounded-[13px] border border-line bg-surface p-4 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-px hover:border-brand/30 hover:shadow-[var(--shadow)]">
      <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-surface-2 text-muted transition-colors group-hover:bg-brand-soft group-hover:text-brand">
        <Ico size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium leading-tight text-ink line-clamp-2">{item.label}</div>
        {item.hint && <div className="truncate text-[12.5px] text-muted">{item.hint}</div>}
      </div>
      <ArrowRight size={16} className="shrink-0 text-faint transition-all group-hover:translate-x-0.5 group-hover:text-brand" />
    </Link>
  );
}

export const cardGrid = (cols = "sm:grid-cols-2 lg:grid-cols-3") => cx("grid grid-cols-1 gap-3.5", cols);
