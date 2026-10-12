import {
  Activity, BarChart3, Baby, CalendarDays, ClipboardList, Container, Download, FileCheck, FileText, FlaskConical, Flame,
  HeartHandshake, Inbox, LayoutDashboard, LayoutTemplate, MessagesSquare, Microscope, Pill, Receipt, ReceiptText,
  RefreshCw, Send, Settings, Stethoscope, TestTube2, Users, UserPlus, Wallet, FolderOpen, Boxes, LineChart, ShieldCheck,
} from "lucide-react";
import type { Role } from "./supabase";

export type Icon = typeof LayoutDashboard;
export type Item = { label: string; href: string; roles?: Role[]; icon: Icon; hint?: string };
export type Section = { key: string; title: string; icon: Icon; desc: string; href?: string; items: Item[] };

const clinical: Role[] = ["doctor", "nurse"];
const lab: Role[] = ["embryologist", "lab", "doctor"];
const fin: Role[] = ["billing", "front_desk"];

export const SECTIONS: Section[] = [
  {
    key: "dashboard", title: "Dashboard", icon: LayoutDashboard, href: "/dashboard",
    desc: "Live figures & 90-day conversion", items: [],
  },
  {
    key: "front-desk", title: "Front Desk", icon: Users, desc: "Registration, visits & appointments",
    items: [
      { label: "Register Patient Visit", href: "/patients/new", roles: ["front_desk", ...clinical], icon: UserPlus },
      { label: "Today's Registrations", href: "/registrations", icon: ClipboardList },
      { label: "Schedule Appointments", href: "/appointments", roles: ["front_desk", ...clinical], icon: CalendarDays },
      { label: "Patient Visits", href: "/patients", icon: Users },
      { label: "Open EMR", href: "/patients", icon: FolderOpen },
    ],
  },
  {
    key: "ivf", title: "IVF Worklists", icon: Activity, desc: "Counselling, OPU, ET & IUI lists",
    items: [
      { label: "Counsel Infertility Patients", href: "/counselling", roles: clinical, icon: MessagesSquare },
      { label: "Patients for OPU", href: "/worklists/opu", roles: [...clinical, "embryologist"], icon: Stethoscope },
      { label: "Patients for ET", href: "/worklists/et", roles: [...clinical, "embryologist"], icon: Baby },
      { label: "Patients for IUI", href: "/worklists/iui", roles: clinical, icon: Stethoscope },
      { label: "Hospital Surgeries for Today", href: "/worklists/surgeries", roles: [...clinical, "embryologist"], icon: Activity },
    ],
  },
  {
    key: "embryology", title: "Embryology", icon: Microscope, desc: "Fertilisation, vitrification, storage & PGD",
    items: [
      { label: "Prepare Embryos", href: "/worklists/prepare-embryos", roles: lab, icon: FlaskConical },
      { label: "Monitor Embryos", href: "/worklists/monitor-embryos", roles: lab, icon: Microscope },
      { label: "Semen Samples", href: "/semen", roles: lab, icon: TestTube2 },
      { label: "Vitrify Embryos", href: "/worklists/vitrify", roles: lab, icon: Container },
      { label: "Thaw Embryos", href: "/worklists/thaw", roles: lab, icon: Flame },
      { label: "Renew Embryo Vitrifications", href: "/worklists/renew", roles: lab, icon: RefreshCw },
      { label: "Send Embryo Samples for PGD", href: "/worklists/pgd-send", roles: lab, icon: Send },
      { label: "Receive PGD Results", href: "/worklists/pgd-receive", roles: lab, icon: Inbox },
      { label: "Fertilise Donor Oocyte and Sperm", href: "/worklists/donor-fertilise", roles: lab, icon: FlaskConical },
      { label: "View Donor Fertilisations", href: "/worklists/donor-fertilisations", roles: lab, icon: FlaskConical },
      { label: "View Embryo Vitrifications", href: "/worklists/vitrifications", roles: lab, icon: Container },
      { label: "View Vitrified Embryos", href: "/worklists/vitrified-embryos", roles: lab, icon: Container },
      { label: "View Vitrified Oocytes", href: "/worklists/vitrified-oocytes", roles: lab, icon: Container },
      { label: "IVF Storage", href: "/storage", roles: lab, icon: Boxes },
    ],
  },
  {
    key: "donors", title: "Donors", icon: HeartHandshake, desc: "Match & manage ovum / semen donors",
    items: [
      { label: "Match Semen Donors", href: "/donors?kind=semen", roles: [...clinical, "embryologist"], icon: HeartHandshake },
      { label: "Match Ovum Donors", href: "/donors?kind=ovum", roles: [...clinical, "embryologist"], icon: HeartHandshake },
      { label: "View Ovum Donors", href: "/donors?kind=ovum", roles: [...clinical, "embryologist"], icon: HeartHandshake },
    ],
  },
  {
    key: "billing", title: "Billing", icon: Receipt, desc: "Bills, receipts & vitrification billing",
    items: [
      { label: "Create Vitrification Bills", href: "/billing/new?kind=Vitrification", roles: fin, icon: ReceiptText },
      { label: "My Today's Bills", href: "/billing?scope=today", roles: fin, icon: Receipt },
      { label: "My Today's Receipts", href: "/billing/receipts", roles: fin, icon: Wallet },
      { label: "All Bills", href: "/billing", roles: fin, icon: Receipt },
    ],
  },
  {
    key: "documents", title: "Documents", icon: FileText, desc: "Patient files, templates & consents",
    items: [
      { label: "Attach Patient Documents", href: "/documents?attach=1", icon: FileText },
      { label: "Patient Documents", href: "/documents", icon: FileText },
      { label: "Document Templates", href: "/templates", icon: LayoutTemplate },
      { label: "Configure Document Templates", href: "/templates?configure=1", roles: ["doctor"], icon: LayoutTemplate },
      { label: "Consent Forms", href: "/consents", icon: FileCheck },
    ],
  },
  {
    key: "inventory", title: "Inventory", icon: Pill, desc: "Drug formulary & stock",
    items: [
      { label: "Drug Formulary", href: "/inventory", roles: ["nurse", "billing"], icon: Pill },
      { label: "Record Opening Stock", href: "/inventory?stock=1", roles: ["nurse", "billing"], icon: Boxes },
    ],
  },
  {
    key: "insights", title: "Insights", icon: LineChart, desc: "Reports, analytics & data export",
    items: [
      { label: "Reports", href: "/reports", roles: ["doctor"], icon: BarChart3 },
      { label: "Analytics", href: "/reports?tab=analytics", roles: ["doctor"], icon: LineChart },
      { label: "Data Export", href: "/export", roles: ["doctor"], icon: Download },
    ],
  },
  {
    key: "admin", title: "Administration", icon: ShieldCheck, desc: "Users, setup & audit log",
    items: [
      { label: "Settings & Users", href: "/settings", roles: [], icon: ShieldCheck },
      { label: "Setup", href: "/settings?tab=setup", roles: [], icon: Settings },
    ],
  },
];

export const ALL_ITEMS: Item[] = SECTIONS.flatMap((s) => s.items);
const base = (href: string) => href.split("?")[0];
export const iconFor = (href: string): Icon => ALL_ITEMS.find((i) => i.href === href)?.icon
  ?? ALL_ITEMS.find((i) => base(i.href) === base(href))?.icon ?? FileText;

/** can: role checker from useAuth (admin passes all) */
export const visibleItems = (s: Section, can: (...r: Role[]) => boolean) =>
  s.items.filter((i) => !i.roles || can(...i.roles));
export const sectionVisible = (s: Section, can: (...r: Role[]) => boolean) =>
  !!s.href || visibleItems(s, can).length > 0;
export const findSection = (key: string) => SECTIONS.find((s) => s.key === key);
