"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SAMPLE_RES = 320;
const ZOOM       = 1.55;
const X_OFFSET   = 0.09; // fraction of viewW — shifts cloud left to balance right-heavy image

// No wave animation — particles stay put unless mouse is nearby.
// Bloom is achieved via AdditiveBlending + soft inner glow in the fragment shader.
const VERTEX = /* glsl */`
  uniform vec3  uMouse;
  uniform float uRadius;
  uniform float uStrength;

  attribute vec3  aColor;
  varying   vec3  vColor;
  varying   float vInfluence;

  void main() {
    vec3 pos = position;

    vec2  delta     = pos.xy - uMouse.xy;
    float dist      = length(delta);
    float influence = smoothstep(uRadius, 0.0, dist);
    pos.xy         += normalize(delta + vec2(0.0001)) * influence * uStrength;

    vColor     = aColor;
    vInfluence = influence;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 5.5 * (5.0 / -mv.z);
    gl_Position  = projectionMatrix * mv;
  }
`;

// Square particle with a bright additive centre — bloom comes from AdditiveBlending
// overlapping particles summing toward white.
const FRAGMENT = /* glsl */`
  varying vec3  vColor;
  varying float vInfluence;

  void main() {
    vec2  uv   = gl_PointCoord - 0.5;
    float d    = max(abs(uv.x), abs(uv.y)); // square distance
    if (d > 0.5) discard;

    // Inner bloom: centre is brighter, edges fade
    float glow  = 1.0 - smoothstep(0.0, 0.48, d);
    vec3  color = vColor + vColor * glow * 1.2;
    float alpha = mix(0.75, 0.30, vInfluence) * (1.0 - smoothstep(0.30, 0.50, d));

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function SatelliteParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth  || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const fov    = 60;
    const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 100);
    camera.position.z = 5;

    const viewH = 2 * Math.tan((fov * Math.PI) / 360) * camera.position.z;
    const viewW = viewH * (W / H);

    const uniforms = {
      uMouse:    { value: new THREE.Vector3(9999, 9999, 0) },
      uRadius:   { value: 1.5 },
      uStrength: { value: 0.60 },
    };

    const img = new Image();
    img.src = "/northamerica_geos5_20222364.webp";
    img.onload = () => {
      const SR  = SAMPLE_RES;
      const cvs = document.createElement("canvas");
      cvs.width = SR; cvs.height = SR;
      const ctx = cvs.getContext("2d")!;
      ctx.drawImage(img, 0, 0, SR, SR);
      const data = ctx.getImageData(0, 0, SR, SR).data;

      const pos: number[] = [];
      const col: number[] = [];

      for (let py = 0; py < SR; py++) {
        for (let px = 0; px < SR; px++) {
          const idx = (py * SR + px) * 4;
          const r   = data[idx]     / 255;
          const g   = data[idx + 1] / 255;
          const b   = data[idx + 2] / 255;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          if (lum < 0.03) continue;
          if (Math.random() > lum * 1.02 + 0.10) continue;

          pos.push(
            (px / SR - 0.5) * viewW * ZOOM + viewW * X_OFFSET,
            -(py / SR - 0.5) * viewH * ZOOM,
            (Math.random() - 0.5) * 1.0,
          );
          col.push(r, g, b);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("aColor",   new THREE.Float32BufferAttribute(col, 3));

      const mat = new THREE.ShaderMaterial({
        vertexShader:   VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
        transparent:  true,
        depthWrite:   false,
        blending:     THREE.AdditiveBlending, // overlapping particles sum → bloom
      });

      scene.add(new THREE.Points(geo, mat));
    };

    const onMouseMove = (e: MouseEvent) => {
      const nx =  (e.clientX / W) * 2 - 1;
      const ny = -(e.clientY / H) * 2 + 1;
      uniforms.uMouse.value.set(nx * viewW * 0.5, ny * viewH * 0.5, 0);
    };
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      const nW = container.clientWidth;
      const nH = container.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    window.addEventListener("resize", onResize);

    let frameId = 0;
    const tick = () => {
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
    />
  );
}
