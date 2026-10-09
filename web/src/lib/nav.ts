import type { Role } from "./supabase";

export type NavItem = { label: string; href: string; roles?: Role[] };
export type NavGroup = { title: string; items: NavItem[] };

const clinical: Role[] = ["doctor", "nurse"];
const lab: Role[] = ["embryologist", "lab", "doctor"];
const fin: Role[] = ["billing", "front_desk"];

// roles: undefined = everyone; [] = admin only (admin always passes)
export const NAV: NavGroup[] = [
  { title: "Front Desk", items: [
    { label: "Register Patient Visit", href: "/patients/new", roles: ["front_desk", ...clinical] },
    { label: "Today's Registrations", href: "/registrations" },
    { label: "Schedule Appointments", href: "/appointments", roles: ["front_desk", ...clinical] },
    { label: "Patient Visits", href: "/patients" },
    { label: "Open EMR", href: "/patients" },
  ]},
  { title: "IVF Worklists", items: [
    { label: "IVF Dashboard & 90 Day Conversion", href: "/" },
    { label: "Counsel Infertility Patients", href: "/counselling", roles: clinical },
    { label: "Patients for OPU", href: "/worklists/opu", roles: [...clinical, "embryologist"] },
    { label: "Patients for ET", href: "/worklists/et", roles: [...clinical, "embryologist"] },
    { label: "Patients for IUI", href: "/worklists/iui", roles: clinical },
    { label: "Hospital Surgeries for Today", href: "/worklists/surgeries", roles: [...clinical, "embryologist"] },
  ]},
  { title: "Embryology", items: [
    { label: "Prepare Embryos", href: "/worklists/prepare-embryos", roles: lab },
    { label: "Monitor Embryos", href: "/worklists/monitor-embryos", roles: lab },
    { label: "Semen Samples", href: "/semen", roles: lab },
    { label: "Vitrify Embryos", href: "/worklists/vitrify", roles: lab },
    { label: "Thaw Embryos", href: "/worklists/thaw", roles: lab },
    { label: "Renew Embryo Vitrifications", href: "/worklists/renew", roles: lab },
    { label: "Send Embryo Samples for PGD", href: "/worklists/pgd-send", roles: lab },
    { label: "Receive PGD Results", href: "/worklists/pgd-receive", roles: lab },
    { label: "Fertilise Donor Oocyte and Sperm", href: "/worklists/donor-fertilise", roles: lab },
    { label: "View Donor Fertilisations", href: "/worklists/donor-fertilisations", roles: lab },
    { label: "View Embryo Vitrifications", href: "/worklists/vitrifications", roles: lab },
    { label: "View Vitrified Embryos", href: "/worklists/vitrified-embryos", roles: lab },
    { label: "View Vitrified Oocytes", href: "/worklists/vitrified-oocytes", roles: lab },
    { label: "IVF Storage", href: "/storage", roles: lab },
  ]},
  { title: "Donors", items: [
    { label: "Match Semen Donors", href: "/donors?kind=semen", roles: [...clinical, "embryologist"] },
    { label: "Match Ovum Donors", href: "/donors?kind=ovum", roles: [...clinical, "embryologist"] },
    { label: "View Ovum Donors", href: "/donors?kind=ovum", roles: [...clinical, "embryologist"] },
  ]},
  { title: "Billing", items: [
    { label: "Create Vitrification Bills", href: "/billing/new?kind=Vitrification", roles: fin },
    { label: "My Today's Bills", href: "/billing?scope=today", roles: fin },
    { label: "My Today's Receipts", href: "/billing/receipts", roles: fin },
    { label: "All Bills", href: "/billing", roles: fin },
  ]},
  { title: "Documents", items: [
    { label: "Attach Patient Documents", href: "/documents?attach=1" },
    { label: "Patient Documents", href: "/documents" },
    { label: "Document Templates", href: "/templates" },
    { label: "Configure Document Templates", href: "/templates?configure=1", roles: ["doctor"] },
    { label: "Consent Forms", href: "/consents" },
  ]},
  { title: "Inventory", items: [
    { label: "Drug Formulary", href: "/inventory", roles: ["nurse", "billing"] },
    { label: "Record Opening Stock", href: "/inventory?stock=1", roles: ["nurse", "billing"] },
  ]},
  { title: "Insights", items: [
    { label: "Reports", href: "/reports", roles: ["doctor"] },
    { label: "Analytics", href: "/reports?tab=analytics", roles: ["doctor"] },
    { label: "Data Export", href: "/export", roles: ["doctor"] },
  ]},
  { title: "Admin", items: [
    { label: "Setup", href: "/settings?tab=setup", roles: [] },
    { label: "Settings", href: "/settings", roles: [] },
  ]},
];
