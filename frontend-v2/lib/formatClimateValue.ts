import type { DisplayFormat } from "@/types/climate";

export function formatClimateValue(
  value: number,
  unit: string,
  displayFormat?: DisplayFormat
): string {
  switch (displayFormat) {
    case "kelvin":
      return `${(value - 273.15).toFixed(1)}°C`;
    case "celsius":
      return `${value.toFixed(1)}°C`;
    case "percent":
      return `${value.toFixed(1)}%`;
    case "w_m2":
      return `${value.toFixed(1)} W/m²`;
    case "m_s":
      return `${value.toFixed(2)} m/s`;
    case "kg_m2_s":
      return `${value.toExponential(2)} kg/m²/s`;
    case "mm_day":
      return `${value.toFixed(2)} mm/day`;
    case "scientific":
      return value.toExponential(2);
    default:
      return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
  }
}
