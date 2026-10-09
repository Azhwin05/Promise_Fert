import { refresh, saveRow } from "./q";
import { supabase } from "./supabase";

export type VitItem = {
  id: string; vitrification_id: string; embryo_id: string | null; unit_id: string | null; position: number | null; grade: string | null;
  status: string; thawed_at: string | null; thawed_by: string | null; version: number;
  embryos: { oocyte_no: number } | null; storage_units: { label: string; kind: string; colour: string | null } | null;
};
export type Vit = {
  id: string; cycle_id: string; kind: "embryo" | "oocyte"; vit_date: string; done_by: string | null; item_count: number; contract_ref: string | null;
  renewal_due: string | null; status: string; version: number; vitrified_items: VitItem[];
  cycles?: { cycle_no: number; couples: { couple_no: string; female: { full_name: string; mrn: string }; male: { full_name: string } | null } };
};

export const VIT_SELECT = "*, vitrified_items(*, embryos(oocyte_no), storage_units(label,kind,colour))";
export const VIT_SELECT_FULL = `${VIT_SELECT}, cycles(cycle_no, couples(couple_no, female:patients!couples_female_id_fkey(full_name,mrn), male:patients!couples_male_id_fkey(full_name)))`;

export async function thawItem(item: VitItem, by: string) {
  await saveRow("vitrified_items", { status: "thawed", thawed_at: new Date().toISOString(), thawed_by: by }, item.id, item.version);
  if (item.embryo_id) await saveRow("embryos", { status: "thawed" }, item.embryo_id);
  const { data } = await supabase.from("vitrified_items").select("status").eq("vitrification_id", item.vitrification_id);
  if (data && data.every((x) => x.status !== "stored")) await saveRow("vitrifications", { status: "released" }, item.vitrification_id);
  refresh("vit", "embryos:", "worklist");
}

export async function renewVit(v: Vit, contract?: string) {
  const base = v.renewal_due && new Date(v.renewal_due) > new Date() ? new Date(v.renewal_due) : new Date();
  base.setFullYear(base.getFullYear() + 1);
  await saveRow("vitrifications", { renewal_due: base.toISOString().slice(0, 10), ...(contract ? { contract_ref: contract } : {}) }, v.id, v.version);
  refresh("vit", "worklist");
}
