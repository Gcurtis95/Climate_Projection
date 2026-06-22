import type { ClimateTableRow } from "@/types/climate";
import DeltaBar from "@/components/results/DeltaBar";

export default function ComparisonTable({ rows }: { rows: ClimateTableRow[] }) {
  if (!rows?.length) return null;

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
        Baseline vs. projected
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <DeltaBar key={row.key} row={row} />
        ))}
      </div>
    </div>
  );
}
