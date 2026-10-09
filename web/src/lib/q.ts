"use client";
import useSWR, { mutate as globalMutate } from "swr";
import { supabase } from "./supabase";

type Res<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

/** Cached, revalidating query. Key must uniquely describe the query. */
export function useQ<T>(key: string | null, fn: () => Res<T>) {
  return useSWR<T>(
    key,
    async () => {
      const { data, error } = await fn();
      if (error) throw new Error(error.message);
      return data as T;
    },
    { keepPreviousData: true, revalidateOnFocus: true, dedupingInterval: 2000 },
  );
}

/** Revalidate every cached query whose key starts with any prefix. */
export const refresh = (...prefixes: string[]) =>
  globalMutate((k) => typeof k === "string" && prefixes.some((p) => k.startsWith(p)));

export const esc = (s: string) => s.replace(/[%,()]/g, " ").trim();

export async function uploadDoc(path: string, file: File) {
  const clean = file.name.replace(/[^\w.\-]+/g, "_");
  const full = `${path}/${Date.now()}-${clean}`;
  const { error } = await supabase.storage.from("documents").upload(full, file, { contentType: file.type });
  if (error) throw new Error(error.message);
  return full;
}

export async function signedUrl(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 120);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

/** Optimistic-concurrency update: fails if someone else saved first. */
export async function saveRow(table: string, row: Record<string, unknown>, id?: string, version?: number) {
  if (!id) {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  let q = supabase.from(table).update(row).eq("id", id);
  if (version != null) q = q.eq("version", version);
  const { data, error } = await q.select();
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("This record was changed by someone else. Reload and try again.");
  return data[0];
}
