"use client";

import { useState } from "react";
import { Space_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import SubmitControl from "@/components/home/SubmitControl";
import type { Season } from "@/types/climate";

const Globe              = dynamic(() => import("@/components/home/Globe"),              { ssr: false });
const SatelliteParticles = dynamic(() => import("@/components/home/SatelliteParticles"), { ssr: false });
const IkedaBoxes         = dynamic(() => import("@/components/home/IkedaBoxes"),         { ssr: false });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });

const FG     = "#ffffff";
const BG     = "#000000";
const BORDER = "rgba(255, 255, 255, 0.75)";

const GLASS: React.CSSProperties = { background: "rgba(0,0,0,0.28)" };

const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "0.64rem",
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  color: FG,
  opacity: 0.75,
  marginBottom: "0.55rem",
};

const HR: React.CSSProperties = {
  border: "none",
  borderTop: `1px solid rgba(255,255,255,0.2)`,
  margin: 0,
};

// Stronger shadow so text reads clearly against the animated satellite texture
const TEXT_SHADOW = "0 1px 14px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.95)";

const SECTION: React.CSSProperties = { padding: "1.1rem 0" };

const SEASONS: Season[] = ["Summer", "Winter", "Spring", "Autumn"];
const MIN_YEAR = 2025;
const MAX_YEAR = 2100;

function climateZone(lat: number): string {
  const a = Math.abs(lat);
  if (a > 66.5) return "Polar";
  if (a > 55)   return "Subarctic";
  if (a > 40)   return "Continental";
  if (a > 23.5) return "Temperate";
  if (a > 10)   return "Subtropical";
  return "Tropical";
}

function utcEst(lon: number): string {
  const off = Math.round(lon / 15);
  return off >= 0 ? `UTC +${off}` : `UTC ${off}`;
}

export default function HomeExperience() {
  const [lon, setLon] = useState(-0.1276);
  const [lat, setLat] = useState(51.5072);
  const [season, setSeason] = useState<Season>("Summer");
  const [year, setYear] = useState(2050);
  const handleLocationChange = (nextLon: number, nextLat: number) => {
    setLon(nextLon);
    setLat(nextLat);
  };

  return (
    <main
      className={spaceMono.className}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: BG,
        color: FG,
      }}
    >
      <SatelliteParticles />
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: "rgba(0,0,0,0.65)", pointerEvents: "none" }} />
      <IkedaBoxes />

      {/* ── Header ── */}
      <header
        style={{
          ...GLASS,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          height: "40px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
        }}
      >
        <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.28em", textShadow: TEXT_SHADOW }}>
          CLIMATE PROJECTIONS
        </span>
        <span style={{ fontSize: "0.62rem", letterSpacing: "0.18em", opacity: 0.85, textShadow: TEXT_SHADOW }}>
          NASA / NEX-GDDP-CMIP6 · SSP2-4.5
        </span>
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.12em", opacity: 0.50, textShadow: TEXT_SHADOW }}>
  
        </span>
      </header>

      {/* ── Middle row ── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left panel ── */}
        <div
          style={{
            ...GLASS,
            width: "300px",
            flexShrink: 0,
            borderRight: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>

            <div style={{ paddingBottom: "1.1rem" }}>
              <p style={{ fontSize: "0.74rem", opacity: 0.92, lineHeight: 1.85, margin: 0, textShadow: TEXT_SHADOW }}>
                Drop a pin anywhere on Earth. Get an AI-powered climate impact assessment for that location under SSP2-4.5.
              </p>
            </div>

            <hr style={HR} />

            {/* Location */}
            <div style={SECTION}>
              <span style={LABEL}>Location</span>
              <p style={{ fontSize: "0.70rem", fontWeight: 400, letterSpacing: "0.04em", margin: "0 0 0.85rem", opacity: 0.65, textShadow: TEXT_SHADOW }}>
                {Math.abs(lat).toFixed(4)}°&thinsp;{lat >= 0 ? "N" : "S"}
                &emsp;
                {Math.abs(lon).toFixed(4)}°&thinsp;{lon >= 0 ? "E" : "W"}
              </p>

              <div style={{ display: "flex", gap: "1.5rem", alignItems: "baseline" }}>
                <div>
                  <span style={{ fontSize: "0.56rem", letterSpacing: "0.18em", opacity: 0.65, display: "block", marginBottom: "0.18rem", textTransform: "uppercase", textShadow: TEXT_SHADOW }}>Climate Zone</span>
                  <span style={{ fontSize: "0.72rem", opacity: 1, textShadow: TEXT_SHADOW }}>{climateZone(lat)}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.56rem", letterSpacing: "0.18em", opacity: 0.65, display: "block", marginBottom: "0.18rem", textTransform: "uppercase", textShadow: TEXT_SHADOW }}>UTC Offset</span>
                  <span style={{ fontSize: "0.72rem", opacity: 1, textShadow: TEXT_SHADOW }}>{utcEst(lon)}</span>
                </div>
              </div>

              <p style={{ fontSize: "0.66rem", opacity: 0.80, margin: "0.8rem 0 0", letterSpacing: "0.08em", textShadow: TEXT_SHADOW }}>
                DRAG THE MARKER TO SET LOCATION
              </p>
            </div>

            <hr style={HR} />

            {/* Season */}
            <div style={SECTION}>
              <span style={LABEL}>Season</span>
              <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
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
                        fontSize: "0.72rem",
                        letterSpacing: "0.1em",
                        color: active ? FG : `${FG}77`,
                        fontWeight: active ? 700 : 400,
                        transition: "color 0.1s",
                        textShadow: TEXT_SHADOW,
                      }}
                    >
                      {active ? `[ ${s.toUpperCase()} ]` : s.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <hr style={HR} />

            {/* Year */}
            <div style={SECTION}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.8rem" }}>
                <span style={{ ...LABEL, marginBottom: 0 }}>Target Year</span>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, letterSpacing: "0.06em", textShadow: TEXT_SHADOW }}>{year}</span>
              </div>
              <input
                type="range"
                min={MIN_YEAR}
                max={MAX_YEAR}
                step={1}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="terminal-range"
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.45rem" }}>
                <span style={{ fontSize: "0.58rem", opacity: 0.42, letterSpacing: "0.1em", textShadow: TEXT_SHADOW }}>{MIN_YEAR}</span>
                <span style={{ fontSize: "0.58rem", opacity: 0.42, letterSpacing: "0.1em", textShadow: TEXT_SHADOW }}>{MAX_YEAR}</span>
              </div>
              <p style={{ fontSize: "0.65rem", opacity: 0.68, marginTop: "0.5rem", lineHeight: 1.65, textShadow: TEXT_SHADOW }}>
                30-yr window centred on {year} vs 1985–2015 baseline
              </p>
            </div>

            <hr style={HR} />

            <div style={{ ...SECTION, flex: 1 }}>
              <SubmitControl query={{ lon, lat, season, year }} />
            </div>

          </div>
        </div>

        {/* ── Globe ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <Globe
            onLocationChange={handleLocationChange}
          />
          {/* Vignette to separate globe from side panels */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.50) 100%)",
          }} />
        </div>

        {/* ── Right panel ── */}
        <div
          style={{
            ...GLASS,
            width: "255px",
            flexShrink: 0,
            borderLeft: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>

            <div style={{ paddingBottom: "1.1rem" }}>
              <span style={LABEL}>How It Works</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {([
                  ["01", "Drop the marker on any land location and choose a season and target year."],
                  ["02", "NASA satellite climate data is fetched across a 30-year window at 25 km resolution."],
                  ["03", "An AI pipeline cross-references peer-reviewed model bias literature and live research to produce a structured impact assessment."],
                ] as [string, string][]).map(([n, text]) => (
                  <div key={n} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.64rem", fontWeight: 700, opacity: 0.38, flexShrink: 0, lineHeight: 1.75, textShadow: TEXT_SHADOW }}>{n}</span>
                    <span style={{ fontSize: "0.68rem", opacity: 0.88, lineHeight: 1.80, textShadow: TEXT_SHADOW }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr style={HR} />

            <div style={SECTION}>
              <span style={LABEL}>Scenario</span>
              <p style={{ fontSize: "0.68rem", opacity: 0.88, lineHeight: 1.80, margin: 0, textShadow: TEXT_SHADOW }}>
                SSP2-4.5 — middle-of-the-road emissions pathway. Neither best nor worst case. ~4.5 W/m² additional radiative forcing by 2100.
              </p>
            </div>

            <hr style={HR} />

            <div style={SECTION}>
              <span style={LABEL}>Data</span>
              <p style={{ fontSize: "0.68rem", opacity: 0.88, lineHeight: 1.80, margin: 0, textShadow: TEXT_SHADOW }}>
                NASA NEX-GDDP-CMIP6 via Google Earth Engine. Bias-corrected daily downscaled projections. Land surface only.
              </p>
              <p style={{ fontSize: "0.60rem", opacity: 0.48, lineHeight: 1.70, margin: "0.7rem 0 0", textShadow: TEXT_SHADOW }}>
       
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer
        style={{
          ...GLASS,
          position: "relative",
          zIndex: 2,
          flexShrink: 0,
          height: "34px",
          borderTop: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.75rem",
        }}
      >
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.14em", opacity: 0.72, textShadow: TEXT_SHADOW }}>
          NASA NEX-GDDP-CMIP6 · CMIP6 · SSP2-4.5 · 25 km resolution
        </span>
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.1em", opacity: 0.50, textShadow: TEXT_SHADOW }}>
      
        </span>
      </footer>

    </main>
  );
}
