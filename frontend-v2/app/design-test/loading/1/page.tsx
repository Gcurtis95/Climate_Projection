"use client";

import { useEffect, useRef } from "react";

const ZONES = [
  { label: "00  SELECTING MODEL · QUERYING EARTH ENGINE", sub: "NASA/GDDP-CMIP6 · ssp245 · 47.3410°N 3.5264°E · 2050" },
  { label: "01  RAG CORPUS", sub: "CMIP6 LITERATURE · CHROMA CLOUD · text-embedding-3-small" },
  { label: "02  WEB GROUNDING", sub: "GEMINI GROUNDING · RECENT CLIMATE RESEARCH" },
  { label: "03  SYNTHESIS", sub: "GPT-4.1 · STRUCTURED IMPACT SUMMARY · JSON_SCHEMA" },
];

export default function TestPatternLoading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef  = useRef(0);

  // Demo: auto-advance stage every 2.5 s
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const advance = () => {
      stageRef.current = (stageRef.current + 1) % (ZONES.length + 1);
      t = setTimeout(advance, 2500);
    };
    t = setTimeout(advance, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = window.devicePixelRatio || 1;

    // Pre-generate random bar-width sequences per zone
    const patterns = ZONES.map(() => {
      const bars: number[] = [];
      for (let i = 0; i < 800; i++) bars.push(Math.floor(Math.random() * 14) + 1);
      return bars;
    });
    const offsets = [0, 0, 0, 0];
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

    const tick = () => {
      const W  = window.innerWidth;
      const H  = window.innerHeight;
      const si = stageRef.current;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const zoneH  = Math.floor(H / ZONES.length);
      const labelW = 340;

      ZONES.forEach((zone, i) => {
        const resolved = i < si;
        const active   = i === si;
        const y0 = i * zoneH;
        const barcodeH = zoneH - 1;

        // Scroll the barcode
        offsets[i] += resolved ? 0 : active ? 2.2 : 0.25;

        const bars    = patterns[i];
        const totalW  = bars.reduce((a, b) => a + b, 0);
        const alpha   = resolved ? 1 : active ? 0.9 : 0.12;
        let   x       = labelW - (offsets[i] % totalW);
        let   white   = true;
        let   bi      = 0;

        while (x < W) {
          const bw = bars[bi % bars.length];
          if (white) {
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.fillRect(x, y0, bw, barcodeH);
          }
          x  += bw;
          bi++;
          white = !white;
        }

        // Label strip dark background
        ctx.fillStyle = "rgba(0,0,0,0.92)";
        ctx.fillRect(0, y0, labelW, barcodeH);

        // Primary label
        const ta = resolved ? 0.85 : active ? 1 : 0.28;
        ctx.fillStyle = `rgba(255,255,255,${ta})`;
        ctx.font = `700 10px monospace`;
        ctx.fillText(zone.label, 14, y0 + 22);

        // Sub-label
        ctx.fillStyle = `rgba(255,255,255,${ta * 0.5})`;
        ctx.font = `400 9px monospace`;
        ctx.fillText(zone.sub, 14, y0 + 38);

        // Status (top-right)
        const now   = Date.now();
        const dots  = ".".repeat(Math.floor(now / 350) % 4);
        const status = resolved ? "● COMPLETE" : active ? `● PROCESSING${dots}` : "○ QUEUED";
        ctx.fillStyle = `rgba(255,255,255,${ta})`;
        ctx.font = `400 9px monospace`;
        const sw = ctx.measureText(status).width;
        ctx.fillText(status, W - sw - 14, y0 + 22);

        // Separator
        ctx.fillStyle = resolved ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.08)";
        ctx.fillRect(0, y0 + barcodeH, W, 1);

        // Vertical rule between label strip and barcode
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillRect(labelW - 1, y0, 1, barcodeH);
      });

      // Timestamp top-right
      const ts = new Date().toISOString().replace("T", "  ").substring(0, 23);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "400 9px monospace";
      ctx.fillText(ts, W - ctx.measureText(ts).width - 14, 14);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block", background: "#000" }} />;
}
