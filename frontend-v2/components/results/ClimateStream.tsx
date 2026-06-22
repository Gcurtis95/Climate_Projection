"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Dashboard from "@/components/results/Dashboard";
import ErrorPanel from "@/components/results/ErrorPanel";
import IkedaLoadingScreen from "@/components/results/IkedaLoadingScreen";
import CRTBackground from "@/components/design-test/CRTBackground";
import { type Stage } from "@/components/results/AnalysingStatus";
import type { ClimateSummary } from "@/types/climate";
import type { VisualisationSearchParams } from "@/lib/getClimateData";

const WarpedTextureBackground = dynamic(
  () => import("@/components/shared/WarpedTextureBackground"),
  { ssr: false }
);

type StreamEvent = { type: Stage; data: unknown };

export default function ClimateStream({ params }: { params: VisualisationSearchParams }) {
  const { lon, lat, season, year, address } = params;
  const [stage, setStage] = useState<Stage | null>(null);
  const [summary, setSummary] = useState<ClimateSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        const query = new URLSearchParams({ lon, lat, season, year, address });
        const response = await fetch(`/api/climate?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.error ?? "Failed to reach the climate backend.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (!line) continue;

            const event = JSON.parse(line) as StreamEvent;
            setStage(event.type);
            if (event.type === "summary") {
              setSummary(event.data as ClimateSummary);
            }
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      }
    }

    run();
    return () => controller.abort();
  }, [lon, lat, season, year, address]);


  if (error) {
    return <ErrorPanel message={error} />;
  }

  if (!summary) {
    return (
      <IkedaLoadingScreen
        stage={stage}
        lon={lon}
        lat={lat}
        season={season}
        year={year}
        address={address}
      />
    );
  }

  return (
    <div style={{ position: "relative", height: "100vh", overflow: "hidden", background: "#0a0a08" }}>
      {/* Layer 1: warped hurricane satellite texture — no colour tint */}
      <WarpedTextureBackground texturePath="/hurricanerafael.jpg" />

      {/* Layer 2: dark overlay to keep text readable */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.62)", pointerEvents: "none" }} />

      {/* Layer 3: CRT scanlines — glitch mode for results screen */}
      {/* <CRTBackground glitch /> */}

      {/* Content — sits above all background layers */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
        <Dashboard summary={summary} />
      </div>
    </div>
  );
}
