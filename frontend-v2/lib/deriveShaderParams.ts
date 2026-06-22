import type { ClimateTableRow, ShaderParams } from "@/types/climate";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Fallback: derives shader params from data_table when the backend doesn't
 * include shader_params (e.g., old API response or network error).
 */
export function deriveShaderParams(rows: ClimateTableRow[]): ShaderParams {
  const byKey = new Map(rows.map((row) => [row.key, row]));

  const tempRow = byKey.get("tas") ?? byKey.get("tasmax") ?? byKey.get("tasmin");
  const tempDelta = tempRow ? tempRow.projected.value - tempRow.baseline.value : 0;
  const warmth = clamp(0.25 + tempDelta / 6, 0, 1);

  const windRow = byKey.get("sfcWind");
  const windDelta = windRow ? Math.abs(windRow.projected.value - windRow.baseline.value) : 0;
  const turbulence = clamp(0.2 + windDelta / 4, 0.12, 1);

  const precipRow = byKey.get("pr");
  let relativePrecipChange = 0;
  if (precipRow) {
    const baseline = precipRow.baseline.value;
    const delta = Math.abs(precipRow.projected.value - baseline);
    relativePrecipChange = baseline !== 0 ? delta / Math.abs(baseline) : delta;
  }
  const aridity = clamp(0.2 + relativePrecipChange, 0.12, 0.9);

  return { warmth, turbulence, aridity };
}
