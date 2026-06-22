"use client";

import { useEffect, useRef } from "react";

// Classic 3D Perlin noise (Ken Perlin's improved reference implementation),
// seeded via a Fisher-Yates shuffle of the permutation table so the same
// seed always reproduces the same flow field.
function makeNoise3D(seed: number) {
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;

  let s = seed >>> 0 || 1;
  function rand() {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967295;
  }
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  function fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  function lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }
  function grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  return function noise3D(x: number, y: number, z: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;
    return lerp(
      w,
      lerp(
        v,
        lerp(u, grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z)),
        lerp(u, grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z))
      ),
      lerp(
        v,
        lerp(u, grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1)),
        lerp(u, grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  };
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  speed: number;
  age: number;
};

const SEED = 19850;
const NOISE_SCALE = 0.0042;
const ENSEMBLE_SPREAD = 0.35;
const FLOW_SPEED = 1.4;
const TRAIL_PERSISTENCE = 0.93;
const CONNECTION_DISTANCE = 30;
const PARTICLE_DENSITY = 0.00022; // particles per pixel of canvas area

const COLOR_COLD = [56, 189, 248]; // sky-400, echoes the teal accents already on this screen
const COLOR_WARM = [251, 191, 36]; // amber-400

function lerpColor(a: number[], b: number[], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export default function ConvectiveMemoryBackground({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    container.appendChild(canvas);
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const ctx = ctx2d;

    const noise3D = makeNoise3D(SEED);
    const octaves = [0, 1, 2].map((i) => ({
      ox: (i * 137.1 + SEED * 0.0001) % 1000,
      oy: (i * 91.7 + SEED * 0.0002) % 1000,
      ot: i * (0.00015 + ENSEMBLE_SPREAD * 0.00009),
      weight: 1 / (i + 1),
    }));

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];

    function makeParticle(): Particle {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        depth: 0,
        speed: 0,
        age: Math.random() * 400,
      };
    }

    function rebuild() {
      const count = Math.round(width * height * PARTICLE_DENSITY);
      particles = Array.from({ length: count }, makeParticle);
    }

    function resize() {
      width = container!.clientWidth;
      height = container!.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#020617"; // slate-950, matches the page background
      ctx.fillRect(0, 0, width, height);
      rebuild();
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function fieldAt(x: number, y: number, t: number) {
      let sx = 0;
      let sy = 0;
      let sw = 0;
      for (const oc of octaves) {
        const n = noise3D((x + oc.ox) * NOISE_SCALE, (y + oc.oy) * NOISE_SCALE, t * oc.ot + oc.ot * 50);
        const angle = n * Math.PI * 4.8;
        sx += Math.cos(angle) * oc.weight;
        sy += Math.sin(angle) * oc.weight;
        sw += oc.weight;
      }
      const depth = (noise3D(x * NOISE_SCALE * 1.7, y * NOISE_SCALE * 1.7, t * 0.0002) + 1) / 2;
      return { angle: Math.atan2(sy / sw, sx / sw), depth };
    }

    let frameId = 0;
    let running = !prefersReducedMotion;
    let frame = 0;

    function step() {
      ctx.fillStyle = `rgba(2, 6, 23, ${1 - TRAIL_PERSISTENCE})`;
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1.1;

      for (const pt of particles) {
        const f = fieldAt(pt.x, pt.y, frame);
        pt.vx += (Math.cos(f.angle) - pt.vx) * 0.35;
        pt.vy += (Math.sin(f.angle) - pt.vy) * 0.35;

        const px = pt.x;
        const py = pt.y;
        pt.x += pt.vx * FLOW_SPEED;
        pt.y += pt.vy * FLOW_SPEED;
        pt.speed = Math.hypot(pt.vx, pt.vy);
        pt.depth = f.depth;
        pt.age++;

        const speedNorm = Math.min(1, pt.speed * 1.4);
        const [r, g, b] = lerpColor(COLOR_COLD, COLOR_WARM, Math.min(1, pt.depth * 0.6 + speedNorm * 0.4));
        const alpha = 0.1 + speedNorm * 0.5;
        ctx.strokeStyle = `rgba(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();

        if (pt.x < 0 || pt.x > width || pt.y < 0 || pt.y > height || pt.age > 900) {
          pt.x = Math.random() * width;
          pt.y = Math.random() * height;
          pt.vx = 0;
          pt.vy = 0;
          pt.age = 0;
        }
      }

      if (CONNECTION_DISTANCE > 0) {
        ctx.lineWidth = 0.6;
        const step = Math.max(1, Math.floor(particles.length / 220));
        for (let i = 0; i < particles.length; i += step) {
          const a = particles[i];
          for (let j = i + step; j < Math.min(particles.length, i + step * 6); j += step) {
            const b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < CONNECTION_DISTANCE) {
              const [r, g, bl] = lerpColor(COLOR_COLD, COLOR_WARM, (a.depth + b.depth) / 2);
              const alpha = (1 - d / CONNECTION_DISTANCE) * 0.2;
              ctx.strokeStyle = `rgba(${r.toFixed(0)}, ${g.toFixed(0)}, ${bl.toFixed(0)}, ${alpha.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      frame++;
    }

    function tick() {
      if (!running) return;
      step();
      frameId = requestAnimationFrame(tick);
    }

    if (running) {
      frameId = requestAnimationFrame(tick);
    } else {
      step();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!prefersReducedMotion) {
        running = true;
        frameId = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();
      container!.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    />
  );
}
