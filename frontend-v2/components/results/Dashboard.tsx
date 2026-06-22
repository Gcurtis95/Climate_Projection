"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Space_Mono } from "next/font/google";
import { formatClimateValue } from "@/lib/formatClimateValue";
import type { ClimateSummary, DisplayFormat } from "@/types/climate";

// Delta values are differences, so offset-based formats (kelvin, celsius) must
// NOT subtract 273.15 — ΔK = Δ°C, so just show the raw number as °C.
function formatDelta(absDelta: number, unit: string, displayFormat?: DisplayFormat): string {
  if (displayFormat === "kelvin" || displayFormat === "celsius")
    return `${absDelta.toFixed(1)}°C`;
  return formatClimateValue(absDelta, unit, displayFormat);
}

const mono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

// ── Styling ──────────────────────────────────────────────────────────
const FG          = "#ffffff";
const BORDER      = "rgba(255,255,255,0.75)";
// Stronger double-shadow so text reads against the moving hurricane texture + CRT glitch overlay
const TEXT_SHADOW = "0 1px 14px rgba(0,0,0,1), 0 0 30px rgba(0,0,0,0.95)";
const HR: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid rgba(255,255,255,0.18)",
  margin: 0,
};
const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "0.64rem",
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  color: FG,
  opacity: 0.75,
  marginBottom: "0.55rem",
  textShadow: TEXT_SHADOW,
};
const SEC: React.CSSProperties = { padding: "0.85rem 0" };

// ── Reveal schedule ──────────────────────────────────────────────────
type ItemKind = "overview" | "takeaway" | "row" | "impact" | "citation";
type ScheduleItem = {
  id: string;
  kind: ItemKind;
  startStep: number;
  endStep: number;
  text?: string;
  idx?: number;
};

function buildSchedule(summary: ClimateSummary): ScheduleItem[] {
  const out: ScheduleItem[] = [];
  let s = 0;
  const P  = 12;
  const PL = 32;
  const RG = 22;

  const ov = summary.overview.summary;
  out.push({ id: "overview", kind: "overview", startStep: s, endStep: s + ov.length, text: ov });
  s += ov.length + PL;

  summary.overview.key_takeaways.forEach((t, i) => {
    out.push({ id: `t${i}`, kind: "takeaway", startStep: s, endStep: s + t.length, text: t, idx: i });
    s += t.length + P;
  });

  s += PL;
  (summary.data_table ?? []).forEach((_, i) => {
    out.push({ id: `r${i}`, kind: "row", startStep: s, endStep: s + 1, idx: i });
    s += RG;
  });

  s += PL;
  summary.impacts.bullets.forEach((t, i) => {
    out.push({ id: `i${i}`, kind: "impact", startStep: s, endStep: s + t.length, text: t, idx: i });
    s += t.length + P;
  });

  if (summary.citations?.length) {
    s += PL;
    summary.citations.forEach((c, i) => {
      const t = c.title;
      out.push({ id: `c${i}`, kind: "citation", startStep: s, endStep: s + t.length, text: t, idx: i });
      s += t.length + P;
    });
  }

  return out;
}

export default function Dashboard({ summary }: { summary: ClimateSummary }) {
  const [step, setStep]       = useState(0);
  const [cursorOn, setCursor] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setStep(n => n + 1), 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCursor(b => !b), 530);
    return () => clearInterval(id);
  }, []);

  const schedule = useMemo(() => buildSchedule(summary), [summary]);

  const activeId = schedule.find(
    item => item.text && step >= item.startStep && step < item.endStep
  )?.id ?? null;

  function getTyped(id: string): { shown: string; cursor: boolean } {
    const item = schedule.find(i => i.id === id);
    if (!item || !item.text || step < item.startStep) return { shown: "", cursor: false };
    const chars = Math.min(step - item.startStep, item.text.length);
    const done  = chars >= item.text.length;
    return {
      shown:  item.text.slice(0, chars),
      cursor: !done && id === activeId && cursorOn,
    };
  }

  const visible = (id: string) => {
    const item = schedule.find(i => i.id === id);
    return item ? step >= item.startStep : false;
  };

  const rows     = summary.data_table ?? [];
  const location = summary.location;
  const maxDelta = Math.max(1e-9, ...rows.map(r => Math.abs(r.projected.value - r.baseline.value)));

  const overview = getTyped("overview");

  return (
    <div
      className={mono.className}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        color: FG,
      }}
    >
      {/* ── Header ── */}
      <header style={{
        flexShrink: 0,
        height: "40px",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.1rem" }}>
          <Link
            href="/"
            style={{
              fontSize: "0.66rem",
              letterSpacing: "0.16em",
              color: FG,
              opacity: 0.75,
              textDecoration: "none",
              textShadow: TEXT_SHADOW,
              transition: "opacity 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.75")}
          >
            ← BACK
          </Link>
          <span style={{ fontSize: "0.60rem", opacity: 0.28, textShadow: TEXT_SHADOW }}>|</span>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.28em", textShadow: TEXT_SHADOW }}>
            CLIMATE PROJECTIONS
          </span>
        </div>
        <span style={{ fontSize: "0.62rem", letterSpacing: "0.13em", opacity: 0.90, textShadow: TEXT_SHADOW }}>
          {location?.name ?? ""}
          {location?.country_region ? ` · ${location.country_region}` : ""}
          {" · "}
          {Math.abs(location?.lat ?? 0).toFixed(4)}°{(location?.lat ?? 0) >= 0 ? "N" : "S"}
          &nbsp;
          {Math.abs(location?.lon ?? 0).toFixed(4)}°{(location?.lon ?? 0) >= 0 ? "E" : "W"}
        </span>
        <span style={{ fontSize: "0.60rem", letterSpacing: "0.12em", opacity: 0.55, textShadow: TEXT_SHADOW }}>
          SSP2-4.5 · NASA NEX-GDDP-CMIP6
        </span>
      </header>

      {/* ── Middle row ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left panel: Data table ── */}
        <div style={{
          width: "300px",
          flexShrink: 0,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "1.2rem", display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={LABEL}>Variables · Baseline → Projected</span>

            <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
              {rows.map((row, i) => {
                if (!visible(`r${i}`)) return null;
                const delta    = row.projected.value - row.baseline.value;
                const isPos    = delta >= 0;
                const pct      = Math.min(Math.abs(delta) / maxDelta, 1);
                const deltaCol = isPos ? "rgba(251,191,36,1)" : "rgba(147,197,253,1)";
                const barCol   = isPos ? "rgba(251,191,36,0.75)" : "rgba(147,197,253,0.75)";
                const baseFmt  = formatClimateValue(row.baseline.value,  row.unit, row.display_format);
                const projFmt  = formatClimateValue(row.projected.value, row.unit, row.display_format);
                const delFmt   = formatDelta(Math.abs(delta), row.unit, row.display_format);


                return (
                  <div key={row.key} style={{ paddingBottom: "0.70rem", marginBottom: "0.70rem", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                    {/* Line 1: code + label */}
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.55rem", marginBottom: "0.22rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0, textShadow: TEXT_SHADOW }}>{row.key}</span>
                      <span style={{ fontSize: "0.60rem", opacity: 0.62, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textShadow: TEXT_SHADOW }}>{row.label}</span>
                    </div>
                    {/* Line 2: values + delta */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.67rem", opacity: 0.75, textShadow: TEXT_SHADOW }}>
                        {baseFmt}
                        <span style={{ opacity: 0.40, margin: "0 0.4rem" }}>→</span>
                        {projFmt}
                      </span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: deltaCol, textShadow: "0 1px 14px rgba(0,0,0,1)" }}>
                        {isPos ? "▲" : "▼"} {delFmt}
                      </span>
                    </div>
                    {/* Delta bar */}
                    <div style={{ marginTop: "0.40rem", height: "3px", background: "rgba(255,255,255,0.15)", position: "relative", borderRadius: "2px" }}>
                      <div style={{
                        position: "absolute", top: 0, height: "100%", borderRadius: "1px", background: barCol,
                        left: isPos ? "50%" : `${50 - pct * 50}%`,
                        width: `${pct * 50}%`,
                      }} />
                      <div style={{ position: "absolute", top: "-1px", left: "50%", width: "1px", height: "5px", background: "rgba(255,255,255,0.50)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Centre: All text content ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1.2rem 2rem", display: "flex", flexDirection: "column", flex: 1, overflowY: "auto", overflowX: "hidden" }}>

            {/* Title */}
            <div style={{ paddingBottom: "0.85rem" }}>
              <p style={{ margin: 0, fontSize: "0.66rem", letterSpacing: "0.14em", opacity: 0.70, lineHeight: 1.5, textShadow: TEXT_SHADOW }}>
                {summary.title}
              </p>
            </div>

            <hr style={HR} />

            {/* Overview */}
            <div style={{ ...SEC }}>
              <span style={LABEL}>Analysis</span>
              <p style={{ margin: 0, fontSize: "0.74rem", lineHeight: 1.95, opacity: 0.92, textShadow: TEXT_SHADOW }}>
                {overview.shown}
                {overview.cursor && <span style={{ opacity: 0.85 }}>▌</span>}
              </p>
            </div>

            <hr style={HR} />

            {/* Key takeaways */}
            <div style={{ ...SEC }}>
              <span style={LABEL}>Key Points</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {summary.overview.key_takeaways.map((_, i) => {
                  if (!visible(`t${i}`)) return null;
                  const { shown, cursor } = getTyped(`t${i}`);
                  return (
                    <div key={i} style={{ display: "flex", gap: "0.45rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.64rem", opacity: 0.50, flexShrink: 0, lineHeight: 1.85, textShadow: TEXT_SHADOW }}>›</span>
                      <span style={{ fontSize: "0.72rem", opacity: 0.92, lineHeight: 1.85, textShadow: TEXT_SHADOW }}>
                        {shown}
                        {cursor && <span style={{ opacity: 0.85 }}>▌</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <hr style={HR} />

            {/* Impacts */}
            <div style={{ ...SEC }}>
              <span style={LABEL}>Likely Impacts</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {summary.impacts.bullets.map((_, i) => {
                  if (!visible(`i${i}`)) return null;
                  const { shown, cursor } = getTyped(`i${i}`);
                  return (
                    <div key={i} style={{ display: "flex", gap: "0.45rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.62rem", opacity: 0.60, flexShrink: 0, lineHeight: 1.80, textShadow: TEXT_SHADOW }}>⚠</span>
                      <span style={{ fontSize: "0.72rem", opacity: 0.92, lineHeight: 1.80, textShadow: TEXT_SHADOW }}>
                        {shown}
                        {cursor && <span style={{ opacity: 0.85 }}>▌</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Right panel: Sources ── */}
        <div style={{
          width: "240px",
          flexShrink: 0,
          borderLeft: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "1.2rem", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

            {/* Model chip */}
            <div style={{ ...SEC }}>
              <span style={LABEL}>CMIP6 Model</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", opacity: 0.95, textShadow: TEXT_SHADOW }}>
                {summary.model_name ?? "—"}
              </span>
            </div>

            <hr style={HR} />

            {/* Condensed legend */}
            <div style={{ ...SEC }}>
              <span style={LABEL}>About This Data</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {([
                  ["SSP2-4.5",  "Middle-of-road emissions pathway, ~4.5 W/m² forcing by 2100"],
                  ["▲ Amber",   "Projected increase from baseline (1985–2015)"],
                  ["▼ Blue",    "Projected decrease from baseline"],
                  ["Scale",     "25 km resolution · single-point extraction"],
                ] as [string, string][]).map(([term, desc]) => (
                  <div key={term}>
                    <span style={{ display: "block", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.10em", opacity: 0.95, textShadow: TEXT_SHADOW }}>{term}</span>
                    <span style={{ fontSize: "0.58rem", opacity: 0.68, lineHeight: 1.7, textShadow: TEXT_SHADOW }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <hr style={HR} />

            <div style={{ ...SEC, flex: 1, overflow: "hidden" }}>
              <span style={LABEL}>Sources</span>
              {!summary.citations?.length && (
                <span style={{ fontSize: "0.60rem", opacity: 0.38, textShadow: TEXT_SHADOW }}>—</span>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", overflow: "hidden" }}>
                {summary.citations?.map((citation, i) => {
                  if (!visible(`c${i}`)) return null;
                  const { shown, cursor } = getTyped(`c${i}`);
                  const inner = (
                    <>
                      {shown}
                      {cursor && <span style={{ opacity: 0.85 }}>▌</span>}
                    </>
                  );
                  const textStyle: React.CSSProperties = {
                    fontSize: "0.60rem",
                    lineHeight: 1.72,
                    color: "inherit",
                    textDecoration: "none",
                    opacity: 0.78,
                    textShadow: TEXT_SHADOW,
                  };
                  return (
                    <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "0.54rem", opacity: 0.50, flexShrink: 0, lineHeight: 1.80, textShadow: TEXT_SHADOW }}>[{i + 1}]</span>
                      {citation.url
                        ? <a href={citation.url} target="_blank" rel="noreferrer" style={textStyle}>{inner}</a>
                        : <span style={textStyle}>{inner}</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <footer style={{
        flexShrink: 0,
        height: "34px",
        borderTop: `1px solid ${BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.75rem",
      }}>
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.14em", opacity: 0.68, textShadow: TEXT_SHADOW }}>
          NASA NEX-GDDP-CMIP6 · CMIP6 · SSP2-4.5 · 25 km resolution
        </span>
        <span style={{ fontSize: "0.58rem", letterSpacing: "0.10em", opacity: 0.50, textShadow: TEXT_SHADOW }}>
        </span>
      </footer>
    </div>
  );
}
