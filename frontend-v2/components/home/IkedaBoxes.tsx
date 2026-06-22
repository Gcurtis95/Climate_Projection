"use client";

import { useEffect, useRef } from "react";

const BOX_COUNT = 6;
const CROSS = 10; // center crosshair half-length px

type Box = {
  x: number; y: number;
  w: number; h: number;
  vx: number; vy: number;
  id: number;
};

function makeBoxes(W: number, H: number): Box[] {
  return Array.from({ length: BOX_COUNT }, (_, i) => {
    const w     = 72 + Math.random() * 110;
    const h     = 48 + Math.random() * 72;
    const angle = Math.random() * Math.PI * 2;
    const spd   = 0.22 + Math.random() * 0.28;
    return {
      x:  Math.random() * (W - w),
      y:  Math.random() * (H - h),
      w, h,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      id: i + 1,
    };
  });
}

export default function IkedaBoxes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = W;
      canvas.height = H;
    };
    resize();

    const boxes = makeBoxes(W, H);

    const onResize = () => {
      resize();
      // Keep boxes in bounds after resize
      boxes.forEach(b => {
        b.x = Math.min(b.x, W - b.w);
        b.y = Math.min(b.y, H - b.h);
      });
    };
    window.addEventListener("resize", onResize);

    let frameId: number;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      // ── Update positions + bounce ─────────────────────────────────────
      boxes.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0)       { b.x = 0;       b.vx =  Math.abs(b.vx); }
        if (b.x + b.w > W) { b.x = W - b.w; b.vx = -Math.abs(b.vx); }
        if (b.y < 0)       { b.y = 0;       b.vy =  Math.abs(b.vy); }
        if (b.y + b.h > H) { b.y = H - b.h; b.vy = -Math.abs(b.vy); }
      });

      // ── Connecting lines between all pairs ────────────────────────────
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth   = 0.75;
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a  = boxes[i];
          const b  = boxes[j];
          ctx.beginPath();
          ctx.moveTo(a.x + a.w / 2, a.y + a.h / 2);
          ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── Draw each box ─────────────────────────────────────────────────
      boxes.forEach(b => {
        const cx = b.x + b.w / 2;
        const cy = b.y + b.h / 2;

        // Border
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.88)";
        ctx.lineWidth   = 1;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.restore();

        // Center crosshair
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - CROSS, cy); ctx.lineTo(cx + CROSS, cy);
        ctx.moveTo(cx, cy - CROSS); ctx.lineTo(cx, cy + CROSS);
        ctx.stroke();
        ctx.restore();

        // Center dot
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ID label — top-left inside corner
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.38)";
        ctx.font      = "7px 'Space Mono',monospace";
        ctx.fillText(`◦ ${String(b.id).padStart(2, "0")}`, b.x + 5, b.y + 11);
        ctx.restore();
      });

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset:    0,
        zIndex:   20,
        pointerEvents: "none",
      }}
    />
  );
}
