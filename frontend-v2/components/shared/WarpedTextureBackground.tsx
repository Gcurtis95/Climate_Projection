"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ShaderParams } from "@/types/climate";

const DEFAULT_PARAMS: ShaderParams = { warmth: 0.5, turbulence: 0.5, aridity: 0.0 };

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float     uTime;
  uniform vec2      uMouse;

  // Climate-driven parameters
  uniform float uWarmth;     // 0=cold/polar, 0.5=neutral, 1=hot/tropical
  uniform float uTurbulence; // 0=calm, 1=stormy — scales warp displacement
  uniform float uAridity;    // 0=wet/lush, 1=arid/dry — shifts colour toward ochre

  vec3 _mod289_3(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 _mod289_4(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
  vec4 _perm(vec4 x)    { return _mod289_4(((x*34.0)+10.0)*x); }
  vec4 _taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    vec3 i  = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v - i + dot(i, vec3(C.x));
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.x;
    vec3 x2 = x0 - i2 + C.y;
    vec3 x3 = x0 - 0.5;
    i = _mod289_3(i);
    vec4 p = _perm(_perm(_perm(
        i.z + vec4(0.0,i1.z,i2.z,1.0))
      + i.y + vec4(0.0,i1.y,i2.y,1.0))
      + i.x + vec4(0.0,i1.x,i2.x,1.0));
    vec3 ns = vec3(0.285714285714, -0.928571428571, 0.142857142857);
    vec4 j  = p - 49.0*floor(p*ns.z*ns.z);
    vec4 x_ = floor(j*ns.z);
    vec4 y_ = floor(j - 7.0*x_);
    vec4 xg = x_*ns.x + ns.y;
    vec4 yg = y_*ns.x + ns.y;
    vec4 h  = 1.0 - abs(xg) - abs(yg);
    vec4 b0 = vec4(xg.xy, yg.xy);
    vec4 b1 = vec4(xg.zw, yg.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = _taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m = max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
    m = m*m;
    return 42.0*dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  float fbm(vec3 p){
    float v = 0.0;
    float a = 0.5;
    vec3  s = p;
    for(int i = 0; i < 3; i++){
      v += a * snoise(s);
      s  = s * 2.1 + vec3(31.41);
      a *= 0.5;
    }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float t = uTime;

    vec2 m = uMouse - 0.5;
    vec2 suv = uv * 0.55;

    float qx = fbm(vec3(suv + m * 0.18,                  t * 0.18));
    float qy = fbm(vec3(suv + m * 0.18 + vec2(3.1, 0.7), t * 0.18));

    vec2 q = vec2(qx, qy);
    float rx = fbm(vec3(suv + 1.8*q + m * 0.10 + vec2(0.9, 4.3), t * 0.08));
    float ry = fbm(vec3(suv + 1.8*q + m * 0.10 + vec2(3.7, 1.2), t * 0.08));

    // Turbulence scales how much the domain warp distorts the UV
    float warpScale = 0.12 + uTurbulence * 0.38;
    vec2 wUV = uv + warpScale * vec2(rx, ry);

    vec3 col = texture2D(uTexture, wUV).rgb;
    col = pow(col, vec3(0.85));

    // Warmth tint: 0=cool cyan, 0.5=neutral, 1=hot amber
    float w = (uWarmth - 0.5) * 2.0; // -1 to +1
    vec3 coolTint = vec3(0.68, 0.86, 1.18);
    vec3 warmTint = vec3(1.22, 0.84, 0.50);
    vec3 tint = mix(vec3(1.0), w > 0.0 ? warmTint : coolTint, abs(w) * 0.75);
    col *= tint;

    // Aridity: desaturate toward dry ochre
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 ochre = luma * vec3(0.90, 0.74, 0.44);
    col = mix(col, ochre, uAridity * 0.60);

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Props = {
  params?: Partial<ShaderParams>;
  texturePath?: string;
};

export default function WarpedTextureBackground({ params, texturePath = "/tinydebby.jpg" }: Props = {}) {
  const containerRef  = useRef<HTMLDivElement | null>(null);
  const uniformsRef   = useRef<{
    uWarmth:     { value: number };
    uTurbulence: { value: number };
    uAridity:    { value: number };
  } | null>(null);

  // Sync climate params to live uniforms without remounting WebGL
  useEffect(() => {
    const u = uniformsRef.current;
    if (!u) return;
    const merged = { ...DEFAULT_PARAMS, ...params };
    u.uWarmth.value     = merged.warmth;
    u.uTurbulence.value = merged.turbulence;
    u.uAridity.value    = merged.aridity;
  }, [params]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const merged = { ...DEFAULT_PARAMS, ...params };

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const texture = new THREE.TextureLoader().load(texturePath);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    const uniforms = {
      uTexture:    { value: texture },
      uTime:       { value: 0 },
      uMouse:      { value: new THREE.Vector2(0.5, 0.5) },
      uWarmth:     { value: merged.warmth },
      uTurbulence: { value: merged.turbulence },
      uAridity:    { value: merged.aridity },
    };
    uniformsRef.current = uniforms;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms });
    scene.add(new THREE.Mesh(geo, mat));

    function resize() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      renderer.setSize(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let targetX = 0.5, targetY = 0.5;
    let currentX = 0.5, currentY = 0.5;
    let lastTime = performance.now();

    function onMouseMove(e: PointerEvent) {
      targetX = e.clientX / window.innerWidth;
      targetY = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener("pointermove", onMouseMove);

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frameId = 0, running = true;

    function tick() {
      if (!running) return;
      const now = performance.now();
      const dt  = (now - lastTime) * 0.001;
      lastTime  = now;

      if (!prefersReduced) {
        uniforms.uTime.value += 0.0002;

        const ease = 1.0 - Math.pow(0.012, dt);
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
      geo.dispose(); mat.dispose(); texture.dispose();
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
