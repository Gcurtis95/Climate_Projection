"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type FlowShaderParams = {
  /** 0 = cool teal/blue, 1 = warm amber/red */
  warmth: number;
  /** noise speed + frequency multiplier */
  turbulence: number;
  /** density of the secondary speckle layer, 0-1 */
  density: number;
};

const DEFAULT_PARAMS: FlowShaderParams = { warmth: 0.25, turbulence: 0.4, density: 0.35 };

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Compact 2D simplex noise (Ashima/McEwan, MIT) used for the flow field.
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

  float fbm(vec2 p, float time) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * snoise(p + time);
      p *= 2.02;
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
  uniform float uWarmth;
  uniform float uTurbulence;
  uniform float uDensity;

  ${NOISE_GLSL}

  vec3 palette(float t, float warmth) {
    vec3 cool = mix(vec3(0.02, 0.05, 0.12), vec3(0.06, 0.28, 0.34), t);
    vec3 warm = mix(vec3(0.10, 0.04, 0.05), vec3(0.42, 0.18, 0.08), t);
    return mix(cool, warm, warmth);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

    vec2 mouseInfluence = (uMouse - 0.5) * vec2(aspect, 1.0) * 0.4;
    float speed = 0.04 + uTurbulence * 0.10;
    float scale = 1.4 + uTurbulence * 1.6;

    float flow = fbm(p * scale + mouseInfluence, uTime * speed);
    float flow2 = fbm(p * scale * 1.7 - mouseInfluence * 0.5, uTime * speed * 0.7 + 4.0);

    float t = 0.5 + 0.5 * flow;
    vec3 color = palette(t, uWarmth);

    float speckle = fbm(p * 9.0, uTime * 0.02);
    float dots = smoothstep(1.0 - uDensity * 0.6, 1.0, speckle * 0.5 + 0.5 + flow2 * 0.15);
    color += dots * 0.06;

    float vignette = smoothstep(1.1, 0.2, length(p));
    color *= vignette * 0.9 + 0.1;

    gl_FragColor = vec4(color, 1.0);
  }
`;

type FlowShaderBackgroundProps = {
  params?: Partial<FlowShaderParams>;
  interactive?: boolean;
  className?: string;
};

export default function FlowShaderBackground({
  params,
  interactive = false,
  className,
}: FlowShaderBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const uniformsRef = useRef<{
    uTime: { value: number };
    uResolution: { value: THREE.Vector2 };
    uMouse: { value: THREE.Vector2 };
    uWarmth: { value: number };
    uTurbulence: { value: number };
    uDensity: { value: number };
  } | null>(null);

  // Keep the live shader params in sync without re-mounting the WebGL context.
  useEffect(() => {
    const merged = { ...DEFAULT_PARAMS, ...params };
    const uniforms = uniformsRef.current;
    if (!uniforms) return;
    uniforms.uWarmth.value = merged.warmth;
    uniforms.uTurbulence.value = merged.turbulence;
    uniforms.uDensity.value = merged.density;
  }, [params]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const merged = { ...DEFAULT_PARAMS, ...params };

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uWarmth: { value: merged.warmth },
      uTurbulence: { value: merged.turbulence },
      uDensity: { value: merged.density },
    };
    uniformsRef.current = uniforms;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    function resize() {
      const width = container!.clientWidth;
      const height = container!.clientHeight;
      renderer.setSize(width, height);
      uniforms.uResolution.value.set(width, height);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function onPointerMove(event: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      uniforms.uMouse.value.set(
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height
      );
    }
    if (interactive) {
      window.addEventListener("pointermove", onPointerMove);
    }

    let frameId = 0;
    let running = !prefersReducedMotion;
    const clock = new THREE.Clock();

    function renderOnce() {
      renderer.render(scene, camera);
    }

    function tick() {
      if (!running) return;
      uniforms.uTime.value += clock.getDelta();
      renderOnce();
      frameId = requestAnimationFrame(tick);
    }

    if (running) {
      frameId = requestAnimationFrame(tick);
    } else {
      renderOnce();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!prefersReducedMotion) {
        running = true;
        clock.getDelta();
        frameId = requestAnimationFrame(tick);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (interactive) {
        window.removeEventListener("pointermove", onPointerMove);
      }
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container!.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className ?? ""}`}
    />
  );
}
