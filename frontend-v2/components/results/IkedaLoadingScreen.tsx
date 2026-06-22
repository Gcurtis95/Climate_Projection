"use client";

import { useEffect, useRef, useState } from "react";
import { Space_Mono } from "next/font/google";
import type { Stage } from "@/components/results/AnalysingStatus";

const mono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"] });

type BarLayer  = { type: "bars"; minW: number; maxW: number; speedMul: number; alphaMul: number };
type TextLayer = { type: "text"; speedMul: number; alphaMul: number; bold: boolean };
type LayerCfg  = BarLayer | TextLayer;

const SUBLAYERS: LayerCfg[] = [
  { type: "bars", minW: 1,  maxW: 1,  speedMul: 1.00, alphaMul: 0.55 },
  { type: "bars", minW: 1,  maxW: 4,  speedMul: 0.72, alphaMul: 0.72 },
  { type: "text",                      speedMul: 0.55, alphaMul: 0.85, bold: false },
  { type: "bars", minW: 6,  maxW: 18, speedMul: 0.30, alphaMul: 0.90 },
  { type: "text",                      speedMul: 0.18, alphaMul: 0.80, bold: true  },
  { type: "bars", minW: 28, maxW: 70, speedMul: 0.07, alphaMul: 0.62 },
];
const N_LAYERS = SUBLAYERS.length;

const ZONE_TEXT: [string, string][] = [
  [
    "PIPELINE INITIALISED · STREAM OPEN · NDJSON PROTOCOL · STATUS 200 OK · AUTHENTICATION PASSED · ",
    "REQUEST RECEIVED · LAT · LON · SEASON · TARGET YEAR · SSP2-4.5 · FORWARDING TO BACKEND · ",
  ],
  [
    "NASA NEX-GDDP-CMIP6 · MEAN TEMPERATURE · MIN TEMPERATURE · MAX TEMPERATURE · PRECIPITATION · HUMIDITY · WIND SPEED · ",
    "BASELINE 1985–2015 · PROJECTION WINDOW ±15 YEARS · SSP2-4.5 · 25 km RESOLUTION · POINT REDUCTION · BIAS CORRECTED · ",
  ],
  [
    "MODEL BIAS EVALUATION · REGIONAL LITERATURE · PEER-REVIEWED FINDINGS · VECTOR SEMANTIC SEARCH · ",
    "GEMINI WEB GROUNDING · IPCC REGIONAL REPORTS · 2024–2025 RESEARCH · CITATION RETRIEVAL · RAG PIPELINE · ",
  ],
  [
    "GPT-4.1 STRUCTURED SYNTHESIS · ΔTEMPERATURE · ΔPRECIPITATION · ΔWIND SPEED · UNCERTAINTY ANALYSIS · ",
    "AGRICULTURE · WATER AVAILABILITY · HEAT STRESS · FLOODING · ECOSYSTEM · ENERGY · INFRASTRUCTURE · ",
  ],
];

const ZONES = [
  { label: "00  CONNECTING",              sub: "OPENING STREAM · AUTHENTICATING PIPELINE" },
  { label: "01  GOOGLE EARTH ENGINE ",    sub: "NASA NEX-GDDP-CMIP6 · SSP2-4.5 · 30-YEAR WINDOW · 25 km" },
  { label: "02  RESEARCH",   sub: "MODEL BIAS LITERATURE · REGIONAL CLIMATE FINDINGS" },
  { label: "03  SUMMERISE",               sub: "STRUCTURED IMPACT ASSESSMENT · GPT-4.1" },
];

type Props = {
  stage: Stage | null;
  lon: string; lat: string; season: string; year: string; address: string;
};

type Bar = { w: number; bright: number };

export default function IkedaLoadingScreen({ stage, lon, lat, season, year, address }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountRef  = useRef(performance.now());
  const seenRef   = useRef(new Set<string>());
  const zone0Ref  = useRef(false);
  const [elapsed, setElapsed]       = useState("0:00.0");
  const [contextStep, setContextStep] = useState(0);

  const ZONE_CONTEXT: string[][] = [
    [
      "OPENING NDJSON STREAM TO BACKEND...",
      "PIPELINE READY · FORWARDING CLIMATE QUERY...",
    ],
    [
      `QUERYING 1985–2015 HISTORICAL BASELINE AT ${Math.abs(Number(lat)).toFixed(2)}°${Number(lat) >= 0 ? "N" : "S"}, ${Math.abs(Number(lon)).toFixed(2)}°${Number(lon) >= 0 ? "E" : "W"}...`,
      `BUILDING ${year} ±15 YEAR PROJECTION WINDOW UNDER SSP2-4.5...`,
      "EXTRACTING TEMPERATURE · PRECIPITATION · WIND · HUMIDITY AT 25 km RESOLUTION...",
      "REDUCING 30-YEAR CMIP6 ENSEMBLE MEAN TO A SINGLE POINT...",
      "COMPUTING DELTAS AGAINST HISTORICAL BASELINE · CALCULATING UNCERTAINTY (σ)...",
    ],
    [
      "SEARCHING PEER-REVIEWED CMIP6 MODEL EVALUATION LITERATURE...",
      "RETRIEVING REGIONAL BIAS FINDINGS FROM RESEARCH DATABASE...",
      `RUNNING GEMINI WEB SEARCH · ${season.toUpperCase()} CLIMATE SIGNALS FOR THIS REGION...`,
    ],
    [
      "SYNTHESISING SATELLITE DATA WITH RESEARCH FINDINGS...",
      `STRUCTURING IMPACT ASSESSMENT FOR ${season.toUpperCase()} ${year} UNDER SSP2-4.5...`,
      "QUANTIFYING SECTOR IMPACTS · AGRICULTURE · WATER · ENERGY · INFRASTRUCTURE...",
    ],
  ];

  useEffect(() => {
    const id = setInterval(() => {
      const ms = performance.now() - mountRef.current;
      const m  = Math.floor(ms / 60000);
      const s  = Math.floor((ms % 60000) / 1000);
      const t  = Math.floor((ms % 1000) / 100);
      setElapsed(`${m}:${String(s).padStart(2, "0")}.${t}`);
    }, 100);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { zone0Ref.current = true; }, 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setContextStep(n => n + 1), 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (stage) seenRef.current.add(stage);
  }, [stage]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = window.devicePixelRatio || 1;

    const barPatterns: Map<number, Bar[]> = new Map();
    SUBLAYERS.forEach((sl, li) => {
      if (sl.type !== "bars") return;
      const bars: Bar[] = [];
      for (let i = 0; i < 2000; i++) {
        const b = sl as BarLayer;
        bars.push({
          w:      Math.floor(Math.random() * (b.maxW - b.minW + 1)) + b.minW,
          bright: 0.60 + Math.random() * 0.40,
        });
      }
      barPatterns.set(li, bars);
    });

    const textLayerIndices: number[] = [];
    SUBLAYERS.forEach((sl, li) => { if (sl.type === "text") textLayerIndices.push(li); });

    const barOffsets:  number[][] = ZONES.map(() => SUBLAYERS.map(() => 0));
    const textOffsets: number[][] = ZONES.map(() => [0, 0]);
    const textWidths:  number[][] = ZONES.map(() => [0, 0]);

    let frameId: number;

    const resize = () => {
      canvas.width  = Math.floor(window.innerWidth  * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width  = "100vw";
      canvas.style.height = "100vh";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    function getResolved() {
      const seen = seenRef.current;
      return [
        zone0Ref.current,
        seen.size >= 1,
        (seen.has("rag") && seen.has("web")) || seen.has("summary"),
        seen.has("summary"),
      ];
    }

    const tick = (now: number) => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const resolved  = getResolved();
      const activeIdx = resolved.findIndex(r => !r);

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const zoneH  = H / ZONES.length;
      const layerH = Math.floor(zoneH / N_LAYERS);

      ZONES.forEach((_, zi) => {
        const isResolved = resolved[zi];
        const isActive   = zi === activeIdx;
        const y0         = zi * zoneH;
        let   textSlot   = 0;

        SUBLAYERS.forEach((sl, li) => {
          const ly0   = y0 + li * layerH;
          const alpha = isResolved ? sl.alphaMul
                      : isActive   ? sl.alphaMul
                      :              sl.alphaMul * 0.22;

          if (sl.type === "bars") {
            const bars   = barPatterns.get(li)!;
            const totalW = bars.reduce((a, b) => a + b.w, 0);
            const speed  = isResolved ? sl.speedMul * 0.15
                         : isActive   ? sl.speedMul * 0.85
                         :              sl.speedMul * 0.32;
            barOffsets[zi][li] += speed;

            ctx.shadowColor = "rgba(255,255,255,0.7)";
            ctx.shadowBlur  = isActive ? 12 : isResolved ? 5 : 2;

            let x = -(barOffsets[zi][li] % totalW), white = true, bi = 0;
            while (x < W) {
              const bar = bars[bi % bars.length];
              if (white) {
                ctx.fillStyle = `rgba(255,255,255,${alpha * bar.bright})`;
                ctx.fillRect(x, ly0, bar.w, layerH);
              }
              x += bar.w; bi++; white = !white;
            }

            ctx.shadowBlur = 0;
          } else {
            const slot  = textSlot;
            textSlot++;
            const tl    = sl as TextLayer;
            const str   = ZONE_TEXT[zi][slot] ?? "";
            const font  = tl.bold ? "bold 7px 'Space Mono',monospace" : "7px 'Space Mono',monospace";
            ctx.font    = font;

            if (!textWidths[zi][slot]) {
              textWidths[zi][slot] = ctx.measureText(str).width || 1;
            }
            const strW = textWidths[zi][slot];

            const speed = isResolved ? tl.speedMul * 0.15
                        : isActive   ? tl.speedMul * 0.70
                        :              tl.speedMul * 0.30;
            textOffsets[zi][slot] = (textOffsets[zi][slot] + speed) % strW;

            ctx.shadowColor  = "rgba(255,40,40,0.95)";
            ctx.shadowBlur   = isActive ? 16 : isResolved ? 10 : 4;
            ctx.fillStyle    = `rgba(255,40,40,${alpha})`;
            ctx.textBaseline = "top";
            const textY = ly0 + Math.max(0, (layerH - 8) * 0.5);
            let tx = -textOffsets[zi][slot];
            while (tx < W) { ctx.fillText(str, tx, textY); tx += strW; }

            ctx.shadowBlur = 0;
          }
        });

        if (isActive) {
          const scanY = y0 + zoneH * ((now * 0.00010) % 1);
          const pulse = Math.sin(now * 0.0012) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255,255,255,${0.14 + pulse * 0.14})`;
          ctx.fillRect(0, scanY, W, 3);
        }

        ctx.fillStyle = isResolved ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.09)";
        ctx.fillRect(0, y0 + zoneH - 1, W, 1);
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener("resize", resize); };
  }, []);

  const seen = seenRef.current;
  const resolved = [
    zone0Ref.current,
    seen.size >= 1,
    (seen.has("rag") && seen.has("web")) || seen.has("summary"),
    seen.has("summary"),
  ];
  const activeIdx = resolved.findIndex(r => !r);

  return (
    <main
      className={mono.className}
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}
    >
      <div style={{ position: "absolute", inset: 0, zIndex: 1, mixBlendMode: "screen" }}>
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>

      <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        {ZONES.map((zone, zi) => {
          const isResolved = resolved[zi];
          const isActive   = zi === activeIdx;
          const ta         = isResolved ? 0.75 : isActive ? 1 : 0.2;
          const top        = `${(zi / ZONES.length) * 100}%`;
          const dotCount   = Math.floor(Date.now() / 400) % 4;

          return (
            <div
              key={zi}
              style={{
                position: "absolute", top, left: 0, right: 0,
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                padding: "10px 16px 24px",
                background: isActive
                  ? "linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 55%, transparent 100%)"
                  : "linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.20) 60%, transparent 100%)",
              }}
            >
              <div style={{ textShadow: "0 0 16px #000, 0 0 8px #000, 0 1px 3px #000" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", color: `rgba(255,255,255,${ta})` }}>
                  {zone.label}
                </div>
                <div style={{ fontSize: "9px", letterSpacing: "0.13em", marginTop: "4px", color: `rgba(255,255,255,${ta * 0.75})` }}>
                  {zone.sub}
                </div>
                {isActive && (
                  <div style={{
                    fontSize: "10px",
                    letterSpacing: "0.11em",
                    marginTop: "10px",
                    color: "rgba(255,255,255,1)",
                    textShadow: "0 0 16px #000, 0 0 8px #000, 0 0 20px rgba(255,255,255,0.4)",
                    maxWidth: "62vw",
                  }}>
                    {ZONE_CONTEXT[zi][contextStep % ZONE_CONTEXT[zi].length]}
                  </div>
                )}
              </div>
              <div style={{ textShadow: "0 0 16px #000, 0 0 8px #000", textAlign: "right" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.15em", color: isResolved ? "rgba(255,255,255,0.65)" : isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.30)" }}>
                  {isResolved ? "● COMPLETE" : isActive ? `● PROCESSING${".".repeat(dotCount)}` : "○ QUEUED"}
                </div>
              </div>
            </div>
          );
        })}

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "36px",
          borderTop: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 14px",
        }}>
          <span style={{ fontSize: "9.5px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)" }}>
            {address}
          </span>
          <span style={{ fontSize: "9.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.38)" }}>
            {Math.abs(Number(lat)).toFixed(4)}°{Number(lat) >= 0 ? "N" : "S"}&nbsp;&nbsp;
            {Math.abs(Number(lon)).toFixed(4)}°{Number(lon) >= 0 ? "E" : "W"}
            &nbsp;&nbsp;·&nbsp;&nbsp;{season.toUpperCase()}&nbsp;&nbsp;·&nbsp;&nbsp;{year}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.22em", color: "rgba(255,255,255,0.80)", fontVariantNumeric: "tabular-nums" }}>
            {elapsed}
          </span>
        </div>
      </div>
    </main>
  );
}
