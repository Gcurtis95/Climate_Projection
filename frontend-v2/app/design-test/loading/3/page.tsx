"use client";

import { useEffect, useRef } from "react";

const CHANNELS = [
  { code: "tas",     unit: "°C",  freq: 0.42, phase: 0.0,  resolved: "+2.1°C",  color: "255,255,255" },
  { code: "tasmin",  unit: "°C",  freq: 0.67, phase: 1.1,  resolved: "+1.6°C",  color: "255,255,255" },
  { code: "tasmax",  unit: "°C",  freq: 0.31, phase: 2.3,  resolved: "+2.8°C",  color: "255,255,255" },
  { code: "pr",      unit: "%",   freq: 0.88, phase: 0.7,  resolved: "−12.4%",  color: "255,255,255" },
  { code: "hurs",    unit: "%",   freq: 0.55, phase: 1.9,  resolved: "+1.8%",   color: "255,255,255" },
  { code: "sfcWind", unit: "m/s", freq: 0.73, phase: 3.1,  resolved: "−3.2%",   color: "255,255,255" },
];

const LABEL_W = 110;
const VALUE_W = 90;

export default function OscilloscopeLoading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef  = useRef(0); // 0=querying, 1=rag, 2=web, 3=summary done

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const advance = () => {
      stageRef.current = Math.min(stageRef.current + 1, 3);
      if (stageRef.current < 3) t = setTimeout(advance, 2500);
    };
    t = setTimeout(advance, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = window.devicePixelRatio || 1;

    let frameId: number;
    let t = 0;

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
      t += 0.012;
      const W  = window.innerWidth;
      const H  = window.innerHeight;
      const si = stageRef.current;
      const summaryDone = si >= 3;

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const N      = CHANNELS.length;
      const rowH   = Math.floor(H / (N + 1)); // +1 for header row
      const waveW  = W - LABEL_W - VALUE_W;

      // Header row
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "400 9px monospace";
      ctx.fillText("CLIMATE PROJECTION · 47.3410°N 3.5264°E · SSP2-4.5 · 2050", LABEL_W, 22);
      const ts = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
      const tsW = ctx.measureText(ts).width;
      ctx.fillText(ts, W - tsW - VALUE_W - 12, 22);

      // Stage progress bar
      const pct = si / 3;
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(LABEL_W, rowH - 6, waveW, 1);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(LABEL_W, rowH - 6, waveW * pct, 1);

      const stageNames = ["QUERYING MODEL", "RAG CORPUS", "WEB GROUNDING", "SYNTHESIS COMPLETE"];
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "700 9px monospace";
      ctx.fillText(stageNames[si] ?? "", LABEL_W, rowH - 14);

      // Separator below header
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(0, rowH, W, 1);

      CHANNELS.forEach((ch, i) => {
        const y0   = rowH + i * rowH;
        const cy   = y0 + Math.floor(rowH / 2); // centre line
        const amp  = Math.floor(rowH * 0.38);

        // Noise level decreases as stages progress
        const noiseAmt = summaryDone ? 0 : Math.max(0, 1 - si * 0.28);

        // Draw centre axis
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(LABEL_W, cy, waveW, 1);

        // Draw sine wave
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth   = 1;

        for (let px = 0; px < waveW; px++) {
          const tOffset = t - px * 0.012;
          const noise   = noiseAmt * (Math.random() * 2 - 1) * amp * 0.55;
          const y = cy + Math.sin(tOffset * ch.freq * 6.28 + ch.phase) * amp * (summaryDone ? 0.6 : 0.75) + noise;
          if (px === 0) ctx.moveTo(LABEL_W + px, y);
          else          ctx.lineTo(LABEL_W + px, y);
        }
        ctx.stroke();

        // Channel separator
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(0, y0 + rowH - 1, W, 1);

        // Label (left)
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "700 11px monospace";
        ctx.fillText(ch.code, 12, cy - 4);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "400 9px monospace";
        ctx.fillText(ch.unit, 12, cy + 14);

        // Vertical separator
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(LABEL_W - 1, y0, 1, rowH);

        // Value (right)
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(W - VALUE_W, y0, 1, rowH);

        if (summaryDone) {
          ctx.fillStyle = "#fff";
          ctx.font = "700 11px monospace";
          ctx.fillText(ch.resolved, W - VALUE_W + 10, cy - 4);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = "400 9px monospace";
          ctx.fillText("ΔBASELINE", W - VALUE_W + 10, cy + 14);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.25)";
          ctx.font = "400 10px monospace";
          const blink = Math.floor(Date.now() / 600) % 2 === 0;
          ctx.fillText(blink ? "——.——" : "      ", W - VALUE_W + 10, cy + 4);
        }
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block", background: "#000" }} />;
}
