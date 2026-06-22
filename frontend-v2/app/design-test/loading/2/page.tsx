"use client";

import { useEffect, useRef } from "react";

const CHAR_W  = 10; // px per character cell
const CHAR_H  = 16;
const FONT    = `${CHAR_H * 0.75}px monospace`;
const BIN     = "01";
const HEX     = "0123456789ABCDEF";

// Data that materialises column-by-column as stages resolve
const STAGE_DATA: string[][] = [
  // stage 0 (querying EE): columns 0-3
  ["47.3410°N", "3.5264°E", "YEAR:2050", "SSP2-4.5"],
  // stage "rag": columns 4-7
  ["MPI-ESM1-2", "RAG:CMIP6", "CHROMA:OK", "EMBED:t3s"],
  // stage "web": columns 8-11
  ["WEB:SEARCH", "GEM:2.5F", "DOCS:14", "GRND:OK"],
  // stage "summary": columns 12-15
  ["TAS:+2.1°C", "PR:-12.4%", "WIND:-3%", "SYNTH:OK"],
];

export default function DataColumnsLoading() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef  = useRef(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const advance = () => {
      stageRef.current = Math.min(stageRef.current + 1, 4);
      if (stageRef.current < 4) t = setTimeout(advance, 2500);
    };
    t = setTimeout(advance, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const dpr    = window.devicePixelRatio || 1;

    let cols = 0, rows = 0;
    // Grid state: char per cell
    let grid: string[][] = [];
    // Per-column update rates (ms between character changes)
    let colRates: number[] = [];

    const resize = () => {
      canvas.width  = Math.floor(window.innerWidth  * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width  = "100vw";
      canvas.style.height = "100vh";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(window.innerWidth  / CHAR_W);
      rows = Math.floor(window.innerHeight / CHAR_H);
      grid = Array.from({ length: cols }, () =>
        Array.from({ length: rows }, () => BIN[Math.floor(Math.random() * BIN.length)])
      );
      colRates = Array.from({ length: cols }, () => 30 + Math.random() * 120);
    };
    resize();
    window.addEventListener("resize", resize);

    // Character update timers per column
    const lastUpdates = Array.from({ length: 500 }, () => 0);

    let frameId: number;
    let lastFrame = 0;

    const tick = (now: number) => {
      const dt     = now - lastFrame;
      lastFrame    = now;
      const si     = stageRef.current;
      const W      = window.innerWidth;
      const H      = window.innerHeight;

      ctx.fillStyle = "rgba(0,0,0,0.18)"; // trail fade
      ctx.fillRect(0, 0, W, H);

      ctx.font = FONT;

      for (let c = 0; c < Math.min(cols, grid.length); c++) {
        // Which stage group does this column belong to?
        const groupCols = Math.max(1, Math.floor(cols / 4));
        const group = Math.floor(c / groupCols); // 0-3
        const resolved = group < si;

        lastUpdates[c] = (lastUpdates[c] || 0) + dt;

        // Update column characters (skip if resolved — freeze)
        if (!resolved && lastUpdates[c] > colRates[c]) {
          lastUpdates[c] = 0;
          // Shift column down
          if (grid[c]) {
            for (let r = rows - 1; r > 0; r--) {
              grid[c][r] = grid[c][r - 1];
            }
            // New char at top: mostly binary, occasionally hex
            const charset = Math.random() < 0.15 ? HEX : BIN;
            grid[c][0] = charset[Math.floor(Math.random() * charset.length)];
          }
        }

        // Draw column
        for (let r = 0; r < Math.min(rows, grid[c]?.length ?? 0); r++) {
          const ch = grid[c]?.[r] ?? "0";

          if (resolved && r < STAGE_DATA[group]?.length) {
            // Show stage data text in resolved columns
            const dataStr = STAGE_DATA[group]?.[c % STAGE_DATA[group].length] ?? "";
            if (r === Math.floor(rows / 2)) {
              ctx.fillStyle = "#ffffff";
              ctx.font = `700 ${CHAR_H * 0.75}px monospace`;
              ctx.fillText(dataStr, c * CHAR_W, (r + 1) * CHAR_H);
              ctx.font = FONT;
              continue;
            }
          }

          // Brightness: lead character bright, fade down
          const distFromTop = r / rows;
          const brightness = resolved
            ? 0.12
            : (1 - distFromTop) * 0.7 + 0.05;
          ctx.fillStyle = `rgba(255,255,255,${brightness})`;
          ctx.font = FONT;
          ctx.fillText(ch, c * CHAR_W, (r + 1) * CHAR_H);
        }
      }

      // Stage label overlay (bottom)
      const stageLabels = [
        "QUERYING EARTH ENGINE",
        "RAG CORPUS",
        "WEB GROUNDING",
        "SYNTHESIS",
      ];
      const resolvedCount = Math.min(si, 4);
      const labelY = H - 20;
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, H - 40, W, 40);
      for (let i = 0; i < 4; i++) {
        const alpha = i < resolvedCount ? 0.9 : i === resolvedCount ? 1 : 0.2;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.font = i < resolvedCount ? "700 9px monospace" : "400 9px monospace";
        const label = `${i < resolvedCount ? "●" : "○"} ${stageLabels[i]}`;
        ctx.fillText(label, 14 + i * Math.floor(W / 4), labelY);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ display: "block", background: "#000" }} />;
}
