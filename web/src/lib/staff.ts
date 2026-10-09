"use client";
import { useQ } from "./q";
import { supabase } from "./supabase";

/** id -> full name for "Recorded By" columns. */
export function useStaffMap() {
  const q = useQ<{ id: string; full_name: string }[]>("staff-map", () => supabase.from("profiles").select("id, full_name") as never);
  const m = new Map((q.data ?? []).map((s) => [s.id, s.full_name]));
  return (id?: string | null) => (id ? m.get(id) ?? "—" : "—");
}
