"use client";

import { useEffect, useState } from "react";

export type Stage = "rag" | "web" | "summary";

const STAGE_MESSAGES: Record<Stage, string> = {
  rag: "Cross-referencing CMIP6 model literature…",
  web: "Searching recent climate research and reports…",
  summary: "Summarising the projection…",
};

const PRE_STREAM_MESSAGE =
  "Selecting the best CMIP6 model and querying NASA/GDDP-CMIP6 on Google Earth Engine…";

function formatElapsed(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AnalysingStatus({ stage }: { stage: Stage | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const message = stage ? STAGE_MESSAGES[stage] : PRE_STREAM_MESSAGE;

  return (
    <div className="flex flex-col items-center gap-2">
      <p
        key={message}
        className="max-w-xs text-center text-xs leading-relaxed text-white/55 transition-opacity"
      >
        {message}
      </p>
      <p className="text-[11px] tabular-nums text-white/30">{formatElapsed(elapsed)} elapsed</p>
    </div>
  );
}
