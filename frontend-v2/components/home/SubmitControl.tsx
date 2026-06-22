"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PrecheckResult, ProjectionQuery } from "@/types/climate";

const FG = "#ffffff";
const BG = "#0a0a08";

type SubmitControlProps = { query: ProjectionQuery };
type Status = "idle" | "locating" | "water" | "error";

export default function SubmitControl({ query }: SubmitControlProps) {
  const router = useRouter();
  const [status, setStatus]      = useState<Status>("idle");
  const [errorMessage, setError] = useState<string | null>(null);
  const [hover, setHover]        = useState(false);

  async function handleSubmit() {
    setStatus("locating");
    setError(null);
    try {
      const res     = await fetch(`/api/precheck?lon=${query.lon}&lat=${query.lat}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error ?? "Could not resolve that location.");

      const precheck: PrecheckResult = payload.result;
      if (precheck.isWater) { setStatus("water"); return; }
      if (!precheck.address) {
        setStatus("error");
        setError("Couldn't find an address for that location. Try moving the pin.");
        return;
      }
      const params = new URLSearchParams({
        lon: String(query.lon), lat: String(query.lat),
        season: query.season,  year: String(query.year),
        address: precheck.address,
      });
      router.push(`/visualisation?${params.toString()}`);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const isBusy = status === "locating";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isBusy}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          fontFamily:    "inherit",
          fontSize:      "0.7rem",
          fontWeight:    700,
          letterSpacing: "0.25em",
          color:         hover && !isBusy ? BG : FG,
          background:    hover && !isBusy ? FG : "transparent",
          border:        `1px solid ${FG}`,
          borderRadius:  0,
          padding:       "0.75rem 1.5rem",
          cursor:        isBusy ? "wait" : "pointer",
          opacity:       isBusy ? 0.45 : 1,
          transition:    "background 0.12s, color 0.12s",
          width:         "100%",
          textAlign:     "left",
        }}
      >
        {isBusy ? ">_ LOCATING..." : "ANALYSE →"}
      </button>

      {status === "water" && (
        <p style={{ margin: 0, fontSize: "0.65rem", letterSpacing: "0.05em", lineHeight: 1.65, opacity: 0.6 }}>
          NEX-GDDP-CMIP6 covers land only — reposition the marker and try again.
        </p>
      )}
      {status === "error" && errorMessage && (
        <p style={{ margin: 0, fontSize: "0.65rem", letterSpacing: "0.05em", lineHeight: 1.65, opacity: 0.6 }}>
          {errorMessage}
        </p>
      )}
      {status === "idle" && (
        <p style={{ margin: 0, fontSize: "0.58rem", letterSpacing: "0.15em", opacity: 0.3 }}>
          STATUS: AWAITING INPUT
        </p>
      )}
    </div>
  );
}
