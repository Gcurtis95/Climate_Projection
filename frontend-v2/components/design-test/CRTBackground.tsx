"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2  uResolution;
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uGlitch; // 0 = subtle homepage, 1 = full glitch results page

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),             hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  void main() {
    vec2 uv = vUv;
    float ar = uResolution.x / uResolution.y;

    // ── 1. Horizontal tear glitch (glitch mode only) ──────────────────
    // Occasional burst where horizontal bands of pixels shift left/right.
    float tearCycle   = mod(uTime * 0.55, 6.0);
    float tearActive  = step(tearCycle, 0.8); // active ~13 % of the time
    float tearRow     = floor(uv.y * 48.0);
    float tearSeed    = floor(uTime * 4.0);
    float tearH       = hash(vec2(tearRow, tearSeed));
    float tearOff     = (hash(vec2(tearRow * 3.7, tearSeed + 1.0)) * 2.0 - 1.0)
                        * 0.045 * tearActive * uGlitch;
    // Fine-grained jitter on top of the tear
    float microJitter = (hash(vec2(tearRow * 7.1, tearSeed * 2.0)) * 2.0 - 1.0)
                        * 0.012 * step(0.7, tearH) * tearActive * uGlitch;
    uv.x = fract(uv.x + tearOff + microJitter);

    // ── 2. Mouse magnetic warp ────────────────────────────────────────
    vec2 mouseW  = uMouse   * vec2(ar, 1.0);
    vec2 pixelW  = uv       * vec2(ar, 1.0);
    vec2 toMouse = pixelW - mouseW;
    float mDist  = length(toMouse);
    float warpStr = 0.028 * smoothstep(0.5, 0.0, mDist);
    vec2  warpDir = normalize(toMouse + 0.0001);
    vec2  wUv = uv + warpDir * vec2(warpStr / ar, warpStr);

    // ── 3. Per-scanline horizontal jitter ─────────────────────────────
    float jitterAmt = mix(0.0018, 0.008, uGlitch);
    float jitter = (hash(vec2(floor(wUv.y * 200.0), floor(uTime * 1.8))) * 2.0 - 1.0) * jitterAmt;
    vec2  jUv = vec2(wUv.x + jitter, wUv.y);

    // ── 4. Base cream + scanlines ─────────────────────────────────────
    vec3 color = vec3(0.980, 0.976, 0.961);

    float lineSpacing = mix(3.5, 2.5, uGlitch);
    float screenY  = wUv.y * uResolution.y;
    float scanline = mod(screenY, lineSpacing) / lineSpacing;
    float scanDepth = mix(0.07, 0.18, uGlitch);
    float scanDark = smoothstep(0.0, 0.25, scanline) * (1.0 - smoothstep(0.75, 1.0, scanline));
    color *= 1.0 - (1.0 - scanDark) * scanDepth;

    // ── 5. Slow smooth grain ──────────────────────────────────────────
    float grainAmt = mix(0.016, 0.032, uGlitch);
    float grain = noise(jUv * uResolution * 0.5 + uTime * 0.45) * 2.0 - 1.0;
    color += grain * grainAmt;

    // ── 6. Fast animated static ───────────────────────────────────────
    float staticAmt = mix(0.009, 0.028, uGlitch);
    float frameSeed = floor(uTime * 18.0);
    float staticFast = hash(vec2(
      floor(jUv.x * uResolution.x * 0.5),
      floor(jUv.y * uResolution.y * 0.5) + frameSeed * 91.7
    )) * 2.0 - 1.0;
    color += staticFast * staticAmt;

    // ── 7. Digital noise burst block (glitch mode) ────────────────────
    float burstCycle  = mod(uTime * 0.4, 9.0);
    float burstActive = step(burstCycle, 0.25);
    float blockY0 = hash(vec2(floor(uTime * 0.4), 13.0));
    float blockH  = 0.04 + hash(vec2(floor(uTime * 0.4), 77.0)) * 0.18;
    float inBlock = step(blockY0, wUv.y) * step(wUv.y, blockY0 + blockH);
    float blockNoise = hash(vec2(floor(jUv.x * uResolution.x * 0.3), floor(uTime * 60.0)));
    color = mix(color, vec3(blockNoise), inBlock * burstActive * uGlitch * 0.75);

    // ── 8. Periodic interference band ────────────────────────────────
    float bandPeriod = mix(8.0, 3.5, uGlitch);
    float bandDur    = mix(2.0, 1.0, uGlitch);
    float tCycle     = mod(uTime, bandPeriod);
    float bandLive   = step(tCycle, bandDur);
    float bandY      = tCycle / bandDur;
    float bandDist   = abs(wUv.y - bandY);
    float bandWidth  = mix(0.045, 0.075, uGlitch);
    float bandShape  = smoothstep(bandWidth, 0.0, bandDist) * bandLive;
    float bandStr    = mix(0.065, 0.14, uGlitch);
    float bandStatic = hash(vec2(
      floor(jUv.x * uResolution.x * 0.4),
      floor(uTime * 40.0)
    )) * 2.0 - 1.0;
    color += bandStatic * bandShape * bandStr;

    // ── 9. Rolling phosphor band ──────────────────────────────────────
    float rollY    = mod(uTime * 0.071, 1.0);
    float rollDist = abs(mod(wUv.y - rollY + 0.5, 1.0) - 0.5);
    color += exp(-rollDist * rollDist * 1800.0) * 0.038;

    // ── 10. Temporal flicker ──────────────────────────────────────────
    float flickerRate = mix(6.3, 18.0, uGlitch);
    float flickerAmt  = mix(0.012, 0.06, uGlitch);
    float flicker = 1.0 - flickerAmt + hash(vec2(floor(uTime * flickerRate), 17.0)) * flickerAmt;
    color *= flicker;

    // ── 11. Vignette ─────────────────────────────────────────────────
    vec2 centered = (uv - 0.5) * 2.0;
    float vig = 1.0 - dot(centered * vec2(0.65, 0.75), centered * vec2(0.65, 0.75));
    color *= mix(1.0, clamp(vig, 0.0, 1.0), 0.22);

    // ── 12. Chromatic aberration (mouse-reactive + glitch spike) ─────
    float edgeDist        = length(centered * vec2(ar, 1.0)) / length(vec2(ar, 1.0));
    float mouseLocalBoost = smoothstep(0.3, 0.0, mDist) * 0.005;
    float aberrBase       = smoothstep(0.45, 1.0, edgeDist) * 0.0045 + mouseLocalBoost;

    // Glitch spike: random chromatic burst
    float spikeTime   = mod(uTime * 0.8, 5.0);
    float spikeActive = step(spikeTime, 0.15);
    float spikeStr    = hash(vec2(floor(uTime * 0.8), 55.0)) * 0.04 * spikeActive * uGlitch;

    float aberrStr = aberrBase + mix(0.0, aberrBase * 4.0 + spikeStr, uGlitch);

    vec2 mouseVec  = (uMouse - 0.5) * 2.0;
    vec2 aberrDir  = mix(centered, mouseVec, 0.4);
    vec2 aberrOff  = normalize(aberrDir + 0.001) * aberrStr;

    vec2 redUv  = uv + aberrOff;
    vec2 blueUv = uv - aberrOff;

    float grainR = noise(redUv  * uResolution * 0.5 + uTime * 0.45) * 2.0 - 1.0;
    float grainB = noise(blueUv * uResolution * 0.5 + uTime * 0.45) * 2.0 - 1.0;

    vec2 cR = (redUv  - 0.5) * 2.0;
    vec2 cB = (blueUv - 0.5) * 2.0;
    float vigR = mix(1.0, clamp(1.0-dot(cR*vec2(0.65,0.75),cR*vec2(0.65,0.75)),0.0,1.0),0.22);
    float vigB = mix(1.0, clamp(1.0-dot(cB*vec2(0.65,0.75),cB*vec2(0.65,0.75)),0.0,1.0),0.22);

    float syR  = redUv.y  * uResolution.y;
    float syB  = blueUv.y * uResolution.y;
    float darkR = smoothstep(0.0,0.25,mod(syR,lineSpacing)/lineSpacing)*(1.0-smoothstep(0.75,1.0,mod(syR,lineSpacing)/lineSpacing));
    float darkB = smoothstep(0.0,0.25,mod(syB,lineSpacing)/lineSpacing)*(1.0-smoothstep(0.75,1.0,mod(syB,lineSpacing)/lineSpacing));

    float rollR = exp(-abs(mod(redUv.y  -rollY+0.5,1.0)-0.5)*abs(mod(redUv.y  -rollY+0.5,1.0)-0.5)*1800.0)*0.038;
    float rollB = exp(-abs(mod(blueUv.y -rollY+0.5,1.0)-0.5)*abs(mod(blueUv.y -rollY+0.5,1.0)-0.5)*1800.0)*0.038;

    float baseR = ((0.980 + grainR*grainAmt) * (1.0-(1.0-darkR)*scanDepth) + rollR) * flicker * vigR;
    float baseB = ((0.961 + grainB*grainAmt) * (1.0-(1.0-darkB)*scanDepth) + rollB) * flicker * vigB;

    float blend = aberrStr * 220.0;
    float r = mix(color.r, baseR, blend);
    float b = mix(color.b, baseB, blend);

    float alpha = mix(0.07, 0.52, uGlitch);
    gl_FragColor = vec4(clamp(vec3(r, color.g, b), 0.0, 1.0), alpha);
  }
`;

type Props = {
  glitch?: boolean;
};

export default function CRTBackground({ glitch = false }: Props = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
      uGlitch:     { value: glitch ? 1.0 : 0.0 },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
    });
    scene.add(new THREE.Mesh(geometry, material));

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let targetX = 0.5, targetY = 0.5;
    let currentX = 0.5, currentY = 0.5;

    function onMouseMove(e: PointerEvent) {
      targetX = e.clientX / window.innerWidth;
      targetY = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener("pointermove", onMouseMove);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0, running = true, lastTime = performance.now();

    function tick() {
      if (!running) return;
      const now = performance.now();
      const dt  = (now - lastTime) * 0.001;
      lastTime  = now;

      if (!prefersReduced) {
        uniforms.uTime.value += dt;
        const ease = 1.0 - Math.pow(0.04, dt);
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;
        uniforms.uMouse.value.set(currentX, currentY);
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    function onVisibility() {
      if (document.hidden) { running = false; cancelAnimationFrame(frameId); }
      else { running = true; lastTime = performance.now(); frameId = requestAnimationFrame(tick); }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMouseMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container!.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
    />
  );
}
