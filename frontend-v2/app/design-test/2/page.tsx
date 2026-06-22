"use client";

import { DM_Serif_Display, Inter } from "next/font/google";
import Link from "next/link";
import FluidBackground from "@/components/design-test/FluidBackground";

const serif = DM_Serif_Display({ weight: "400", style: "italic", subsets: ["latin"] });
const sans = Inter({ weight: ["300", "400"], subsets: ["latin"] });

const C = {
  bg: "#0a0a0a",
  text: "#f0ebe0",
  amber: "#c87533",
  rule: "rgba(240,235,224,0.15)",
  muted: "rgba(240,235,224,0.5)",
  dim: "rgba(240,235,224,0.35)",
} as const;

const label: React.CSSProperties = {
  fontFamily: sans.style.fontFamily,
  fontWeight: 300,
  fontSize: "0.65rem",
  letterSpacing: "0.35em",
  textTransform: "uppercase",
  color: C.muted,
};

export default function DesignTest2() {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        backgroundColor: C.bg,
        color: C.text,
        overflow: "hidden",
      }}
    >
      <FluidBackground />

      {/* Content layer */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

        {/* Top strip */}
        <div
          style={{
            borderBottom: `1px solid ${C.rule}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1.1rem 2rem",
          }}
        >
          <span style={label}>Climate Projections</span>
          <span style={label}>NASA / GDDP-CMIP6 · SSP2-4.5</span>
        </div>

        {/* Hero */}
        <div style={{ padding: "6rem 2rem 3rem", flex: "1 0 auto" }}>
          <h1
            className={serif.className}
            style={{
              fontSize: "clamp(3rem, 6vw, 5rem)",
              lineHeight: 0.95,
              margin: "0 0 2.5rem",
              maxWidth: 700,
              fontWeight: 400,
            }}
          >
            How will the<br />climate shift?
          </h1>

          <p
            style={{
              fontFamily: sans.style.fontFamily,
              fontWeight: 300,
              fontSize: "0.8rem",
              color: C.muted,
              maxWidth: 360,
              lineHeight: 1.8,
              margin: "0 0 5rem",
            }}
          >
            Drop a pin on any location, choose a season and year,
            and receive an AI-assisted projection drawn from
            25 years of CMIP6 model data.
          </p>

          {/* Two-column data row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1px 1fr",
              gap: "0 2.5rem",
              maxWidth: 680,
              marginBottom: "4rem",
            }}
          >
            {/* Left col */}
            <div>
              <div style={{ ...label, marginBottom: "0.75rem" }}>Location</div>
              <div
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: "1rem",
                  color: C.amber,
                  letterSpacing: "0.04em",
                  marginBottom: "0.35rem",
                }}
              >
                48.8566° N / 2.3522° E
              </div>
              <div
                style={{
                  fontFamily: sans.style.fontFamily,
                  fontWeight: 300,
                  fontSize: "0.75rem",
                  color: C.dim,
                  letterSpacing: "0.05em",
                }}
              >
                Paris, France
              </div>
            </div>

            {/* Vertical rule */}
            <div style={{ backgroundColor: C.rule, width: 1 }} />

            {/* Right col */}
            <div style={{ paddingLeft: "1rem" }}>
              <div style={{ ...label, marginBottom: "0.75rem" }}>Parameters</div>
              <div
                style={{
                  fontFamily: sans.style.fontFamily,
                  fontWeight: 300,
                  fontSize: "1.6rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.text,
                  lineHeight: 1,
                }}
              >
                Summer 2050
              </div>
            </div>
          </div>

          {/* Full-width rule + CTA */}
          <div style={{ borderTop: `1px solid ${C.rule}`, paddingTop: "2rem", maxWidth: 680 }}>
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontFamily: sans.style.fontFamily,
                fontWeight: 400,
                fontSize: "0.75rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: C.text,
              }}
            >
              Analyse Location →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom strip — fixed */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          borderTop: `1px solid ${C.rule}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.9rem 2rem",
          backgroundColor: "rgba(10,10,10,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span style={label}>Status — Awaiting Input</span>
        <Link
          href="/design-test"
          style={{
            ...label,
            color: C.muted,
            textDecoration: "none",
          }}
        >
          ← Design Lab
        </Link>
      </div>
    </div>
  );
}
