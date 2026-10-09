import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type Role = "admin" | "doctor" | "nurse" | "embryologist" | "lab" | "front_desk" | "billing";
export type Profile = { id: string; full_name: string; email: string | null; role: Role; active: boolean };
