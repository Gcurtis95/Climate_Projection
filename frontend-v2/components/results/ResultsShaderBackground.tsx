"use client";

import { useMemo } from "react";
import FlowShaderBackground from "@/components/shared/FlowShaderBackground";
import { deriveShaderParams } from "@/lib/deriveShaderParams";
import type { ClimateTableRow } from "@/types/climate";

// Unused — results page now uses WarpedTextureBackground via ClimateStream.
// Kept to avoid deleting the FlowShaderBackground integration; remove when confirmed.
export default function ResultsShaderBackground({ rows }: { rows: ClimateTableRow[] }) {
  const { warmth, turbulence, aridity } = useMemo(() => deriveShaderParams(rows ?? []), [rows]);
  return <FlowShaderBackground params={{ warmth, turbulence, density: aridity }} />;
}
