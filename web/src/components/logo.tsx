import { cx } from "./ui";

// Original monochrome emblem for the Promise Fertility system: a cradle holding new life,
// inside a badge. Drawn with evenodd cut-outs so a single `currentColor` fill works on both
// light (emerald → white cut-outs) and dark (white → dark cut-outs) surfaces.
const EMBLEM =
  "M2 60 A58 58 0 1 0 118 60 A58 58 0 1 0 2 60 Z " + // outer badge
  "M30 37 C46 28 74 28 90 37 C74 32 46 32 33 41 Z " + // swoosh highlight
  "M26 71 C35 94 85 94 94 71 C85 83 35 83 26 71 Z " + // outer cradling hand
  "M41 63 C48 77 72 77 79 63 C72 70 48 70 41 63 Z " + // inner cradling hand
  "M60 43 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 Z";  // cradled life

/** Official Promise Fertility logo (white variant) — for dark surfaces. */
export function LogoWhite({ className }: { className?: string }) {
  return <img src="/logo-white.png" alt="Promise Fertility Center" className={cx("w-auto object-contain", className)} />;
}

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="currentColor" role="img" aria-label="Promise Fertility">
      <path fillRule="evenodd" d={EMBLEM} />
    </svg>
  );
}

export function Logo({ className, sub = true, size = "md" }: { className?: string; sub?: boolean; size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className={cx("inline-flex items-center", big ? "gap-3.5" : "gap-2.5", className)}>
      <Mark className={cx("shrink-0", big ? "size-12" : "size-9")} />
      <span className="leading-[1.04]">
        <span className={cx("block font-extrabold tracking-[-0.02em]", big ? "text-[1.7rem]" : "text-[1.12rem]")}>PROMISE</span>
        <span className={cx("block font-bold tracking-[0.05em]", big ? "text-[0.95rem]" : "text-[0.7rem]")}>FERTILITY CENTER</span>
        {sub && <span className={cx("mt-1 block font-medium opacity-60", big ? "text-[0.72rem]" : "text-[0.55rem]")}>A Unit of Sri Kumaran Hospital</span>}
      </span>
    </span>
  );
}
