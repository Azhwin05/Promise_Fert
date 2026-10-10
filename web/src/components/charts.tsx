"use client";
import {
  Area, AreaChart, Bar, BarChart, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Empty } from "./ui";

// Palette aligned with the app tokens (restrained emerald + neutrals + semantic)
export const C = {
  ink: "#14171c", muted: "#5e6a76", faint: "#93a0ac", line: "#e8ecf0",
  brand: "#0a6b5a", brandSoft: "#cfe6e1",
  ok: "#10795a", warn: "#b5842a", danger: "#c0372b", info: "#255fa6", slate: "#425563", teal: "#7aa6a0",
};
export const SERIES = [C.brand, C.ink, C.teal, C.warn, C.info, C.slate, C.danger];

const axis = { stroke: C.faint, fontSize: 11, tickLine: false, axisLine: false };

function TT({ active, payload, label, fmt }: { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown> }[]; label?: string; fmt?: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[10px] border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[var(--shadow-md)]">
      {label != null && <div className="mb-1 font-semibold text-ink">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-muted">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-ink">{fmt ? fmt(Number(p.value)) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export type Point = { label: string; value: number };

export function AreaTrend({ data, fmt, height = 220, color = C.brand }: { data: Point[]; fmt?: (n: number) => string; height?: number; color?: string }) {
  if (!data.length) return <Empty>No data in range.</Empty>;
  const id = `g-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} width={40} allowDecimals={false} />
        <Tooltip content={<TT fmt={fmt} />} cursor={{ stroke: C.line }} />
        <Area type="monotone" dataKey="value" name="Value" stroke={color} strokeWidth={2.4} fill={`url(#${id})`} dot={{ r: 2.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Bars({ data, fmt, height = 240, horizontal = false, colorFn }:
  { data: Point[]; fmt?: (n: number) => string; height?: number; horizontal?: boolean; colorFn?: (p: Point, i: number) => string }) {
  if (!data.length) return <Empty>No data in range.</Empty>;
  const color = (p: Point, i: number) => (colorFn ? colorFn(p, i) : C.brand);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: horizontal ? 8 : -12, bottom: 0 }} barCategoryGap={horizontal ? "28%" : "26%"}>
        {horizontal ? <>
          <XAxis type="number" {...axis} allowDecimals={false} />
          <YAxis type="category" dataKey="label" {...axis} width={110} />
        </> : <>
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={44} allowDecimals={false} />
        </>}
        <Tooltip content={<TT fmt={fmt} />} cursor={{ fill: "rgba(10,107,90,0.06)" }} />
        <Bar dataKey="value" name="Value" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={horizontal ? 22 : 54}>
          {data.map((p, i) => <Cell key={i} fill={color(p, i)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 220, colorFn }: { data: Point[]; height?: number; colorFn?: (p: Point, i: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <Empty>No data in range.</Empty>;
  const color = (p: Point, i: number) => (colorFn ? colorFn(p, i) : SERIES[i % SERIES.length]);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((p, i) => <Cell key={i} fill={color(p, i)} />)}
            </Pie>
            <Tooltip content={<TT />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[1.6rem] font-semibold tabular-nums leading-none">{total}</span>
          <span className="mt-1 text-[11px] uppercase tracking-wide text-faint">Total</span>
        </div>
      </div>
      <ul className="flex-1 space-y-1.5 self-stretch">
        {data.map((p, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color(p, i) }} />
            <span className="truncate text-muted">{p.label}</span>
            <span className="ml-auto font-semibold tabular-nums">{p.value}</span>
            <span className="w-10 text-right text-faint tabular-nums">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Outcome funnel (per cycle) ---------- */
export type Stage = { label: string; value: number; hint?: string };
export function Funnel({ stages }: { stages: Stage[] }) {
  const shown = stages.filter((s) => s.value != null);
  if (!shown.length || shown.every((s) => !s.value)) return <Empty>No outcome data recorded for this cycle yet.</Empty>;
  const top = Math.max(1, shown[0].value || 1);
  return (
    <ol className="space-y-2">
      {shown.map((s, i) => {
        const pct = Math.min(100, Math.round(((s.value || 0) / top) * 100));
        const prev = i > 0 ? shown[i - 1].value : null;
        const step = prev ? Math.round(((s.value || 0) / (prev || 1)) * 100) : null;
        return (
          <li key={s.label} className="flex items-center gap-3">
            <div className="w-40 shrink-0 text-right text-[13px] text-muted">{s.label}</div>
            <div className="relative h-9 flex-1 overflow-hidden rounded-[8px] bg-surface-2">
              <div className="flex h-full items-center rounded-[8px] px-3 text-[13px] font-semibold text-white transition-all"
                style={{ width: `${Math.max(pct, 9)}%`, background: `linear-gradient(90deg, ${C.brand}, ${C.brand}dd)` }}>
                {s.value}
              </div>
            </div>
            <div className="w-14 shrink-0 text-right text-[12px] tabular-nums text-faint">{step != null && i > 0 ? `${step}%` : ""}</div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Stimulation response (per cycle) ---------- */
export type StimPoint = { day: number; follicles: number; endo: number | null; e2: number | null; p4: number | null };
export function StimResponse({ data, height = 260 }: { data: StimPoint[]; height?: number }) {
  if (data.length < 1) return <Empty>No stimulation days recorded yet.</Empty>;
  const hasE2 = data.some((d) => d.e2 != null);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <XAxis dataKey="day" {...axis} tickFormatter={(v) => `D${v}`} />
        <YAxis yAxisId="l" {...axis} width={40} allowDecimals={false} />
        {hasE2 && <YAxis yAxisId="r" orientation="right" {...axis} width={48} />}
        <Tooltip content={<TT />} cursor={{ fill: "rgba(10,107,90,0.05)" }} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} iconType="plainline" />
        <Bar yAxisId="l" dataKey="follicles" name="Follicles" barSize={18} radius={[4, 4, 0, 0]} fill={C.brandSoft} />
        <Line yAxisId="l" type="monotone" dataKey="endo" name="Endometrium (mm)" stroke={C.brand} strokeWidth={2.4} dot={{ r: 2.5 }} connectNulls />
        {hasE2 && <Line yAxisId="r" type="monotone" dataKey="e2" name="E2" stroke={C.warn} strokeWidth={2.2} dot={{ r: 2.5 }} connectNulls />}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
export const follicleCount = (s?: string | null) => (s ? s.split(/[,/ ]+/).filter((x) => x.trim() && !isNaN(Number(x))).length : 0);

export const statusColor = (label: string): string => {
  const v = label.toLowerCase();
  if (/(completed|paid|received|success|stored)/.test(v)) return C.ok;
  if (/(cancel|failed|denied|discard)/.test(v)) return C.danger;
  if (/(pending|planned|stimulation|culture|draft|partial|opu)/.test(v)) return C.warn;
  return C.brand;
};
