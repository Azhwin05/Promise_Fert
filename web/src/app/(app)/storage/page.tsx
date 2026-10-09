"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Alert, Badge, Button, Card, Field, Input, Modal, PageHeader, Select, Spinner, useToast } from "@/components/ui";
import { refresh, saveRow, useQ } from "@/lib/q";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { StorageUnit } from "@/lib/types";

// Colour labels observed in the source storage configuration screen.
const COLOURS = ["RED", "ORANGE", "YELLOW", "BLUE", "GREEN", "WHITE", "SEAGREEN", "PURPLE", "BLACK", "PINK"];
const KINDS = ["CANISTER", "GOBLET", "HEXATUBE"];
const CSS: Record<string, string> = { RED: "#dc2626", ORANGE: "#ea580c", YELLOW: "#eab308", BLUE: "#2563eb", GREEN: "#16a34a", WHITE: "#f1f5f9", SEAGREEN: "#2e8b57", PURPLE: "#7c3aed", BLACK: "#111827", PINK: "#ec4899" };

type Occ = { unit_id: string; position: number | null };

export default function StoragePage() {
  const toast = useToast();
  const { can } = useAuth();
  const units = useQ<StorageUnit[]>("storage_units", () => supabase.from("storage_units").select("*").order("label") as never);
  const occ = useQ<Occ[]>("storage:occupancy", () => supabase.from("vitrified_items").select("unit_id,position").eq("status", "stored").not("unit_id", "is", null) as never);
  const [e, setE] = useState<Partial<StorageUnit> | null>(null);
  const [busy, setBusy] = useState(false);
  const canEdit = can("embryologist");

  async function save() {
    if (!e?.kind || !e.label) return toast("Type and label are required", "danger");
    setBusy(true);
    try {
      await saveRow("storage_units", { kind: e.kind, label: e.label, colour: e.colour || null, positions: Number(e.positions) || 8, parent_id: e.parent_id || null }, e.id);
      toast("Storage unit saved"); refresh("storage_units"); setE(null);
    } catch (x) { toast((x as Error).message, "danger"); }
    setBusy(false);
  }
  const used = (id: string) => new Set((occ.data ?? []).filter((o) => o.unit_id === id).map((o) => o.position));
  const countIn = (id: string) => (occ.data ?? []).filter((o) => o.unit_id === id).length;

  return (
    <>
      <PageHeader title="IVF Storage" subtitle="Storage configuration and live occupancy"
        actions={canEdit ? <Button variant="primary" onClick={() => setE({ kind: "CANISTER", positions: 8 })}><Plus size={18} /> Add unit</Button> : undefined} />
      <div className="mb-4"><Alert>Capacity, position rules and the relationship between container type and colour were not fully shown in the source recording. Treat this layout as provisional until confirmed by the lab.</Alert></div>
      {units.isLoading && !units.data ? <Spinner /> : !(units.data ?? []).length ? (
        <Card><p className="text-muted">No storage units configured yet.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {units.data!.map((u) => (
            <Card key={u.id} title={`${u.kind} ${u.label}`} actions={<>
              <Badge tone="brand">{countIn(u.id)}/{u.positions} used</Badge>
              {canEdit && <Button size="sm" onClick={() => setE(u)}>Edit</Button>}</>}>
              <div className="mb-3 flex items-center gap-2 text-sm text-muted">
                {u.colour && <span className="inline-block size-4 rounded-full border border-line" style={{ background: CSS[u.colour] ?? u.colour }} />}{u.colour ?? "No colour"}
              </div>
              <div className="flex flex-wrap gap-2" role="list" aria-label="Positions">
                {Array.from({ length: u.positions }, (_, i) => i + 1).map((n) => {
                  const on = used(u.id).has(n);
                  return (
                    <span key={n} role="listitem" aria-label={`Position ${n} ${on ? "occupied" : "free"}`}
                      className={`grid size-11 place-items-center rounded-lg border text-sm font-medium ${on ? "border-brand bg-brand text-brand-ink" : "border-line bg-bg text-muted"}`}>{n}</span>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!e} onClose={() => setE(null)} title={e?.id ? "Edit storage unit" : "Add storage unit"}
        footer={<><Button onClick={() => setE(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={save}>Save</Button></>}>
        {e && (
          <div className="space-y-4">
            <Field label="Type"><Select options={KINDS} value={e.kind ?? ""} onChange={(x) => setE({ ...e, kind: x.target.value })} /></Field>
            <Field label="Label"><Input value={e.label ?? ""} onChange={(x) => setE({ ...e, label: x.target.value })} /></Field>
            <Field label="Colour"><Select options={COLOURS} value={e.colour ?? ""} onChange={(x) => setE({ ...e, colour: x.target.value })} /></Field>
            <Field label="Number of positions"><Input type="number" min={1} max={100} value={e.positions ?? 8} onChange={(x) => setE({ ...e, positions: Number(x.target.value) })} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}
