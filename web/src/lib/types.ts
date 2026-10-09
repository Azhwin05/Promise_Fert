export type PatientLite = { id: string; mrn: string; full_name: string; gender: string; dob: string | null; phone: string | null; allergies?: string | null };
export type CycleFull = {
  id: string; couple_id: string; cycle_no: number; cycle_ref: string | null; start_date: string | null; treatment_type: string;
  ovum_source: string | null; sperm_source: string | null; protocol_name: string | null; daily_dose: string | null; status: string; notes: string | null; version: number;
  couples: { id: string; couple_no: string; referred_by: string | null; allergies: string | null; female: PatientLite; male: PatientLite | null };
};
export type StimDay = {
  id: string; cycle_id: string; day_no: number; day_date: string; hmg_mg: number | null; rfsh_mg: number | null; antagonist_mg: number | null;
  timing: string | null; right_follicles: string | null; left_follicles: string | null; endo_thickness_mm: number | null; endo_doppler: string | null;
  e2: number | null; p4: number | null; medications: Med[]; advice: string | null; version: number;
};
export type Med = { name: string; generic?: string; dosage?: string; qty?: string; remarks?: string };
export type Opu = {
  id: string; cycle_id: string; consent_obtained: boolean; opu_at: string | null; surgeon: string | null; assistant_surgeon: string | null;
  primary_embryologist: string | null; secondary_embryologist: string | null; trigger_on: string | null; trigger_at: string | null;
  mature_oocytes: number | null; immature_oocytes: number | null; metaphase_ii: number | null; metaphase_i: number | null; microinjected: number | null;
  others: number | null; fert_2pn: number | null; fert_1pn: number | null; fert_3pn: number | null; embryos_obtained: number | null; notes: string | null; version: number;
};
export type Fert = {
  id: string; cycle_id: string; fert_date: string | null; inseminated_at: string | null; method: string | null; semen_sample_id: string | null;
  embryologist1: string | null; embryologist2: string | null; incubator: string | null; successful: boolean | null; notes: string | null; version: number;
};
export type Embryo = {
  id: string; fertilisation_id: string; oocyte_no: number; sample: string | null; polar_body: string | null; breakage: string | null; attempts: number | null;
  spz_morpho: string | null; spz_location: string | null; embryo_source: string | null; stage: string | null; survival: string | null; comments: string | null;
  growth: Record<string, string>; image_paths: string[]; status: string; version: number;
};
export type Outcome = {
  id: string; cycle_id: string; transfer_date: string | null; gestation: string | null; pregnancy: boolean | null; beta_hcg_value: number | null;
  beta_hcg_date: string | null; clinical_pregnancy: boolean | null; clinical_pregnancy_date: string | null; location: string | null; sacs_seen: number | null;
  notes: string | null; version: number; created_at: string;
};
export type StorageUnit = { id: string; kind: string; label: string; colour: string | null; positions: number; parent_id: string | null };
