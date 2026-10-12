"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Alert, Empty, PageHeader } from "@/components/ui";
import { useTabTitle } from "@/components/shell";
import { ToolCard, cardGrid } from "@/components/hub";
import { useAuth } from "@/lib/auth";
import { findSection, visibleItems } from "@/lib/sections";

export default function SectionHub() {
  const { section } = useParams<{ section: string }>();
  const { can } = useAuth();
  const sec = findSection(section);
  useTabTitle(sec?.title);

  if (!sec) return <Alert tone="danger">Unknown section.</Alert>;
  const items = visibleItems(sec, can);
  const Ico = sec.icon;

  return (
    <>
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-brand">
        <ChevronLeft size={16} /> Modules
      </Link>
      <PageHeader
        title={sec.title}
        subtitle={<span className="flex items-center gap-2"><Ico size={16} className="text-brand" />{sec.desc}</span>}
      />
      {items.length === 0 ? (
        <Empty>You don&apos;t have access to any tools in this section.</Empty>
      ) : (
        <div className={cardGrid("sm:grid-cols-2 lg:grid-cols-3")}>
          {items.map((it) => <ToolCard key={it.label} item={it} />)}
        </div>
      )}
    </>
  );
}
