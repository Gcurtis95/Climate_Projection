"use client";

import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import dynamic from "next/dynamic";

const RadarBackground = dynamic(
  () => import("../../../components/design-test/RadarBackground"),
  { ssr: false }
);

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

const AMBER = "#ffb347";
const AMBER_BRIGHT = "#ffd180";
const BG = "#0d0a00";
const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const DIVIDER_SHORT = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const DIVIDER_BTN = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

const s = {
  page: {
    position: "relative" as const,
    minHeight: "100vh",
    background: BG,
    color: AMBER,
    fontFamily: mono.style.fontFamily,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "48px 0 120px",
    boxSizing: "border-box" as const,
  },
  col: {
    position: "relative" as const,
    zIndex: 1,
    width: "640px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "32px",
  },
  sectionLabel: {
    fontSize: "0.6rem",
    letterSpacing: "0.4em",
    color: AMBER,
    opacity: 0.6,
    marginBottom: "6px",
  },
  divider: {
    color: AMBER,
    opacity: 0.4,
    fontSize: "0.75rem",
    letterSpacing: 0,
    margin: 0,
    lineHeight: 1.4,
    userSelect: "none" as const,
  },
  row: {
    display: "flex" as const,
    gap: "16px",
    alignItems: "baseline",
  },
  label: {
    fontSize: "0.75rem",
    opacity: 0.55,
    width: "60px",
    flexShrink: 0,
  },
  value: {
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  seasonRow: {
    display: "flex" as const,
    gap: "20px",
    alignItems: "baseline",
    fontSize: "0.875rem",
  },
  seasonSelected: {
    color: AMBER_BRIGHT,
    fontWeight: 500,
  },
  seasonUnselected: {
    color: AMBER,
    opacity: 0.4,
    fontWeight: 400,
  },
  yearTrack: {
    fontSize: "0.875rem",
    letterSpacing: "0.02em",
    color: AMBER,
  },
  btnWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 0,
  },
  btn: {
    background: "transparent",
    border: "none",
    color: AMBER,
    fontFamily: "inherit",
    fontSize: "0.9375rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    cursor: "pointer",
    padding: "12px 0",
    textAlign: "left" as const,
    width: "100%",
    transition: "background 0.1s, color 0.1s",
  },
  status: {
    position: "fixed" as const,
    bottom: 0,
    left: "50%",
    transform: "translateX(-50%)",
    width: "640px",
    zIndex: 2,
    background: BG,
    borderTop: `1px solid rgba(255,179,71,0.2)`,
    padding: "10px 0 14px",
    fontSize: "0.7rem",
    letterSpacing: "0.06em",
    color: AMBER,
    opacity: 0.75,
    fontFamily: "inherit",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end" as const,
    marginTop: "24px",
  },
  footerLink: {
    color: AMBER,
    opacity: 0.5,
    fontSize: "0.75rem",
    textDecoration: "none",
    letterSpacing: "0.06em",
  },
};

function SectionLabel({ children }: { children: string }) {
  return <div style={s.sectionLabel}>{children}</div>;
}

function Divider({ full }: { full?: boolean }) {
  return (
    <div style={s.divider}>{full ? DIVIDER : DIVIDER_SHORT}</div>
  );
}

export default function Page() {
  return (
    <div style={s.page}>
      <RadarBackground />

      <div style={s.col}>
        {/* Header */}
        <header
          style={{
            borderBottom: "1px solid rgba(255,179,71,0.3)",
            paddingBottom: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "4px",
              fontSize: "0.9375rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
            }}
          >
            <span>CLIMATE.INSTRUMENT</span>
            <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>v0.1.0-beta</span>
          </div>
          <div style={s.divider}>{DIVIDER}</div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              display: "flex",
              gap: "24px",
              opacity: 0.7,
            }}
          >
            <span>SYS: <span style={{ color: AMBER_BRIGHT, opacity: 1 }}>OPERATIONAL</span></span>
            <span>MODEL: CMIP6/GDDP</span>
            <span>SCEN: SSP2-4.5</span>
            <span>PROJ: 25Y</span>
          </div>
        </header>

        {/* Location */}
        <section>
          <SectionLabel>INPUT COORDINATES</SectionLabel>
          <Divider />
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              ["LAT.", "48.8566° N"],
              ["LON.", "02.3522° E"],
              ["ADDR.", "Paris, France"],
            ].map(([label, value]) => (
              <div key={label} style={s.row}>
                <span style={s.label}>{label}</span>
                <span style={s.value}>{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Parameters */}
        <section>
          <SectionLabel>INPUT PARAMETERS</SectionLabel>
          <Divider />
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Season selector */}
            <div style={s.row}>
              <span style={s.label}>SEASON</span>
              <div style={s.seasonRow}>
                <span style={s.seasonSelected}>[ SUMMER ]</span>
                {["WINTER", "SPRING", "AUTUMN"].map((s_) => (
                  <span key={s_} style={s.seasonUnselected}>{s_}</span>
                ))}
              </div>
            </div>

            {/* Year track */}
            <div style={s.row}>
              <span style={s.label}>YEAR</span>
              <span style={s.yearTrack}>
                {"[ 2050 ]"}
                {"────────────────────"}
                {"[ 2100 ]"}
              </span>
            </div>
          </div>
        </section>

        {/* Execute button */}
        <div style={s.btnWrap}>
          <div style={s.divider}>{DIVIDER_BTN}</div>
          <button
            style={s.btn}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = AMBER;
              (e.currentTarget as HTMLButtonElement).style.color = BG;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = AMBER;
            }}
          >
            {">_ EXECUTE ANALYSIS"}
          </button>
          <div style={s.divider}>{DIVIDER_BTN}</div>
        </div>

        {/* Footer */}
        <div style={s.footer}>
          <Link href="/design-test" style={s.footerLink}>
            ← DESIGN LAB
          </Link>
        </div>
      </div>

      {/* Status bar */}
      <div style={s.status}>
        STATUS: STANDBY{"   "}AWAITING COORDINATE INPUT{"   "}
        {"[████░░░░░░]"} 0%
      </div>
    </div>
  );
}
