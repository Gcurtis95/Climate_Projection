"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  attribute float aIndex;

  void main() {
    float t = uTime * 0.15;
    float idx = aIndex;

    // Per-point oscillation offset
    float phase = idx * 0.4123;
    float osc = sin(uTime * 0.8 + phase) * 0.04;

    // Rotate around Y axis
    float cosT = cos(t);
    float sinT = sin(t);
    vec3 p = position;
    vec3 rotated = vec3(
      p.x * cosT + p.z * sinT,
      p.y,
      -p.x * sinT + p.z * cosT
    );
    rotated.y += osc;

    // Mouse repulsion in NDC space — project mouse to rough world plane
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(rotated, 1.0);
    vec2 ndc = clip.xy / clip.w;
    vec2 mouseNdc = uMouse * 2.0 - 1.0;
    float dist = length(ndc - mouseNdc);
    float influence = smoothstep(0.6, 0.0, dist) * 0.18;
    vec2 dir = normalize(ndc - mouseNdc + vec2(0.0001));
    rotated.x += dir.x * influence;
    rotated.y += dir.y * influence;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(rotated, 1.0);
    gl_PointSize = 1.5;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  void main() {
    // Soft circular point
    vec2 c = gl_PointCoord - 0.5;
    float r = dot(c, c);
    if (r > 0.25) discard;
    float alpha = 0.35 * (1.0 - r * 4.0);
    gl_FragColor = vec4(1.0, 0.702, 0.278, alpha);
  }
`;

export default function RadarBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0d0a00, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 3);
    camera.lookAt(0, 0, 0);

    // --- Particle system ---
    const COUNT = 1500;
    const positions = new Float32Array(COUNT * 3);
    const indices = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Fibonacci sphere distribution
      const phi = Math.acos(1 - (2 * (i + 0.5)) / COUNT);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 1.3 + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      indices[i] = i;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));

    const mouseUniform = { value: new THREE.Vector2(0.5, 0.5) };
    const timeUniform = { value: 0 };

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: timeUniform,
        uMouse: mouseUniform,
      },
      transparent: true,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // --- Faint grid ---
    const GRID_SIZE = 6;
    const GRID_DIVS = 10;
    const step = GRID_SIZE / GRID_DIVS;
    const half = GRID_SIZE / 2;
    const gridVerts: number[] = [];

    for (let i = 0; i <= GRID_DIVS; i++) {
      const pos = -half + i * step;
      // horizontal lines
      gridVerts.push(-half, 0, pos, half, 0, pos);
      // vertical lines
      gridVerts.push(pos, 0, -half, pos, 0, half);
    }

    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(gridVerts), 3)
    );
    const gridMat = new THREE.LineBasicMaterial({
      color: 0xffb347,
      opacity: 0.08,
      transparent: true,
    });
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    grid.rotation.x = Math.PI / 8;
    grid.position.y = -1.2;
    scene.add(grid);

    // --- Resize ---
    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // --- Mouse ---
    function onPointerMove(e: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      mouseUniform.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
    }
    window.addEventListener("pointermove", onPointerMove);

    // --- Animation ---
    const clock = new THREE.Clock();
    let frameId = 0;
    let running = !prefersReducedMotion;

    function tick() {
      if (!running) return;
      timeUniform.value += clock.getDelta();
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
      geo.dispose();
      mat.dispose();
      gridGeo.dispose();
      gridMat.dispose();
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
