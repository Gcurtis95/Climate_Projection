"use client";

import { Space_Mono } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import CRTBackground from "@/components/design-test/CRTBackground";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const BG = "#faf9f5";
const FG = "#1a1a14";

const LABEL: React.CSSProperties = {
  fontSize: "0.65rem",
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: FG,
  opacity: 0.45,
};

const HR: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid ${FG}`,
  opacity: 0.15,
  margin: 0,
};

const SEASONS = ["SUMMER", "WINTER", "SPRING", "AUTUMN"] as const;
type Season = (typeof SEASONS)[number];

export default function ScientificTerminalPage() {
  const [season, setSeason] = useState<Season>("SUMMER");
  const [year, setYear] = useState("2050");
  const [hoverAnalyse, setHoverAnalyse] = useState(false);

  return (
    <div
      className={spaceMono.className}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: BG,
        color: FG,
        overflowX: "hidden",
      }}
    >
      <CRTBackground />

      {/* Content layer */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 1.5rem 4rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "680px", display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Header bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              paddingBottom: "1.25rem",
            }}
          >
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", opacity: 0.5 }}>
              NASA / GDDP-CMIP6
            </span>
            <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", opacity: 0.35 }}>
              v0.1.0
            </span>
          </div>

          <hr style={HR} />

          {/* Title block */}
          <div style={{ padding: "2.5rem 0 2rem" }}>
            <h1
              style={{
                fontSize: "1.35rem",
                fontWeight: 700,
                letterSpacing: "0.05em",
                margin: "0 0 0.75rem",
                lineHeight: 1.2,
              }}
            >
              CLIMATE PROJECTIONS
            </h1>
            <p
              style={{
                fontSize: "0.8rem",
                fontWeight: 400,
                opacity: 0.55,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              a tool for understanding how a location&apos;s climate
              <br />
              may change under SSP2-4.5
            </p>
          </div>

          <hr style={HR} />

          {/* Form rows */}
          <div style={{ padding: "2rem 0", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

            {/* Location row */}
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "1rem", alignItems: "start" }}>
              <span style={LABEL}>Location</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.85rem", letterSpacing: "0.04em" }}>
                  48.8566° N, 2.3522° E
                </span>
                <span style={{ fontSize: "0.75rem", opacity: 0.45, letterSpacing: "0.04em" }}>
                  Paris, France
                </span>
              </div>
            </div>

            {/* Season row */}
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "1rem", alignItems: "center" }}>
              <span style={LABEL}>Season</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {SEASONS.map((s) => {
                  const active = s === season;
                  return (
                    <button
                      key={s}
                      onClick={() => setSeason(s)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "0.75rem",
                        letterSpacing: "0.1em",
                        color: active ? FG : `${FG}55`,
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {active ? `[ ${s} ]` : s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year row */}
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "1rem", alignItems: "center" }}>
              <span style={LABEL}>Target Year</span>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.75rem", opacity: 0.4, letterSpacing: "0.05em" }}>[ </span>
                <input
                  type="number"
                  min={2025}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${FG}`,
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: FG,
                    width: "4ch",
                    textAlign: "center",
                    padding: "0 0 0.1rem",
                    opacity: 0.9,
                    MozAppearance: "textfield",
                  }}
                />
                <span style={{ fontSize: "0.75rem", opacity: 0.4, letterSpacing: "0.05em" }}> ]</span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    flexGrow: 1,
                    borderBottom: `1px solid ${FG}`,
                    marginBottom: "0.05rem",
                    opacity: 0.12,
                  }}
                />
                <span style={{ fontSize: "0.65rem", opacity: 0.3, letterSpacing: "0.1em" }}>
                  2100
                </span>
              </div>
            </div>

          </div>

          <hr style={HR} />

          {/* Analyse button */}
          <div style={{ padding: "2rem 0" }}>
            <button
              onMouseEnter={() => setHoverAnalyse(true)}
              onMouseLeave={() => setHoverAnalyse(false)}
              style={{
                fontFamily: "inherit",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.25em",
                color: hoverAnalyse ? BG : FG,
                background: hoverAnalyse ? FG : "transparent",
                border: `1px solid ${FG}`,
                borderRadius: 0,
                padding: "0.75rem 2rem",
                cursor: "pointer",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              ANALYSE →
            </button>
          </div>

          <hr style={HR} />

          {/* Status bar */}
          <div
            style={{
              paddingTop: "1.25rem",
              display: "flex",
              gap: "0.75rem",
              alignItems: "baseline",
            }}
          >
            <span style={{ ...LABEL, opacity: 0.3 }}>Status</span>
            <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", opacity: 0.4 }}>
              AWAITING INPUT
            </span>
          </div>

        </div>

        {/* Footer */}
        <div style={{ marginTop: "auto", paddingTop: "4rem" }}>
          <Link
            href="/design-test"
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.25em",
              color: FG,
              opacity: 0.3,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            ← DESIGN LAB
          </Link>
        </div>
      </div>
    </div>
  );
}
