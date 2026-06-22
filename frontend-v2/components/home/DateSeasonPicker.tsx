"use client";

import type { Season } from "@/types/climate";

const SEASONS: { value: Season; label: string; icon: string }[] = [
  { value: "Winter", label: "Winter", icon: "❄" },
  { value: "Spring", label: "Spring", icon: "✿" },
  { value: "Summer", label: "Summer", icon: "☀" },
  { value: "Autumn", label: "Autumn", icon: "🍂" },
];

const MIN_YEAR = 2025;
const MAX_YEAR = 2100;

type DateSeasonPickerProps = {
  season: Season;
  year: number;
  onSeasonChange: (season: Season) => void;
  onYearChange: (year: number) => void;
};

export default function DateSeasonPicker({
  season,
  year,
  onSeasonChange,
  onYearChange,
}: DateSeasonPickerProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-white/50">
          Season
        </p>
        <div className="grid grid-cols-4 gap-2">
          {SEASONS.map((s) => {
            const active = s.value === season;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onSeasonChange(s.value)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-teal-300/60 bg-teal-300/15 text-teal-100"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white/90"
                }`}
              >
                <span className="text-base leading-none">{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Target year
          </p>
          <p className="text-sm font-semibold text-teal-100">{year}</p>
        </div>
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          step={1}
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="w-full accent-teal-300"
        />
        <div className="mt-1 flex justify-between text-[11px] text-white/40">
          <span>{MIN_YEAR}</span>
          <span>{MAX_YEAR}</span>
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-white/40">
          Averaged over a 30-year window centred on {year} (SSP2-4.5), compared against the
          1985–2015 baseline.
        </p>
      </div>
    </div>
  );
}
