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

const NOISE_GLSL = /* glsl */ `
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * snoise(p * frequency);
      frequency *= 2.01;
      amplitude *= 0.5;
    }
    return value;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;

  ${NOISE_GLSL}

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    // Mouse influence — subtle pull toward cursor
    vec2 mouse = (uMouse - 0.5) * vec2(aspect, 1.0);
    vec2 toMouse = mouse - p;
    float mouseDist = length(toMouse);
    vec2 mouseWarp = toMouse * 0.08 * exp(-mouseDist * 2.5);

    float t = uTime * 0.028;

    // Domain warping: warp the coordinate with fbm, then sample fbm again
    vec2 q = vec2(
      fbm(p * 1.2 + mouseWarp + vec2(0.0, 0.0), 5),
      fbm(p * 1.2 + mouseWarp + vec2(5.2, 1.3), 5)
    );

    vec2 r = vec2(
      fbm(p * 1.1 + 4.0 * q + vec2(1.7 + t * 0.15, 9.2 + t * 0.05), 5),
      fbm(p * 1.1 + 4.0 * q + vec2(8.3 + t * 0.05, 2.8 + t * 0.15), 5)
    );

    float f = fbm(p + 3.5 * r + t * 0.04, 6);
    f = f * 0.5 + 0.5;

    // Dark amber/oil colour palette — very near-black
    vec3 darkBase   = vec3(0.039, 0.039, 0.039); // #0a0a0a
    vec3 darkAmber1 = vec3(0.102, 0.063, 0.0);   // #1a1000
    vec3 darkAmber2 = vec3(0.165, 0.094, 0.0);   // #2a1800

    vec3 color = mix(darkBase, darkAmber1, smoothstep(0.35, 0.6, f));
    color = mix(color, darkAmber2, smoothstep(0.55, 0.75, f) * 0.6);

    // Drifting amber speck — a single warm focal point deep in the fluid
    float speckT = uTime * 0.012;
    vec2 speckCenter = vec2(
      cos(speckT * 0.7 + 1.3) * 0.22 * aspect,
      sin(speckT * 0.5 + 0.8) * 0.18
    );
    // Add subtle domain warp to the speck path
    vec2 speckWarp = vec2(
      fbm(speckCenter * 0.8 + vec2(t * 0.06), 3),
      fbm(speckCenter * 0.8 + vec2(3.1, t * 0.06), 3)
    ) * 0.12;
    float speckDist = length(p - speckCenter - speckWarp);
    float speck = exp(-speckDist * speckDist * 18.0);
    vec3 amberSpeck = vec3(0.784, 0.459, 0.2); // #c87533
    color += amberSpeck * speck * 0.15;

    // Vignette — stronger at edges
    float vign = smoothstep(1.3, 0.3, length(p / vec2(aspect, 1.0) * 1.4));
    color *= vign * 0.85 + 0.05;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function FluidBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
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

    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      uniforms.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
    }
    window.addEventListener("pointermove", onPointerMove);

    let frameId = 0;
    let running = !prefersReducedMotion;
    const clock = new THREE.Clock();

    function tick() {
      if (!running) return;
      uniforms.uTime.value += clock.getDelta();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    }

    if (running) {
      frameId = requestAnimationFrame(tick);
    } else {
      renderer.render(scene, camera);
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!prefersReducedMotion) {
        running = true;
        clock.getDelta();
        frameId = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container!.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}
