import type { ClimateTableRow } from "@/types/climate";
import { formatClimateValue } from "@/lib/formatClimateValue";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function DeltaBar({ row }: { row: ClimateTableRow }) {
  const { baseline, projected, unit, display_format: displayFormat } = row;
  const delta = projected.value - baseline.value;
  const magnitude = Math.max(Math.abs(baseline.value), Math.abs(projected.value), 1e-9);
  const baselinePct = clamp((baseline.value / magnitude) * 50, -50, 50);
  const projectedPct = clamp((projected.value / magnitude) * 50, -50, 50);
  const increasing = delta >= 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-white/85">{row.label}</p>
        <p
          className={`text-xs font-semibold ${
            increasing ? "text-amber-300" : "text-sky-300"
          }`}
        >
          {increasing ? "▲" : "▼"} {formatClimateValue(Math.abs(delta), unit, displayFormat)}
        </p>
      </div>

      <div className="relative mt-3 h-2 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
        <div
          className="absolute inset-y-0 rounded-full bg-sky-300/70"
          style={{
            left: `${50 + Math.min(baselinePct, projectedPct)}%`,
            width: `${Math.abs(projectedPct - baselinePct)}%`,
          }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-sky-200 shadow"
          style={{ left: `calc(${50 + baselinePct}% - 5px)` }}
          title="Baseline (1985–2015)"
        />
        <div
          className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full shadow ${
            increasing ? "bg-amber-300" : "bg-sky-400"
          }`}
          style={{ left: `calc(${50 + projectedPct}% - 5px)` }}
          title="Projected"
        />
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-white/45">
        <span>baseline {formatClimateValue(baseline.value, unit, displayFormat)}</span>
        <span>projected {formatClimateValue(projected.value, unit, displayFormat)}</span>
      </div>
    </div>
  );
}
