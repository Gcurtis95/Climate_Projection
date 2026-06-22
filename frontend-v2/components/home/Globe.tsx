"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type GlobeProps = {
  onLocationChange: (lon: number, lat: number) => void;
};

const INITIAL_LNG_LAT: [number, number] = [-0.1276, 51.5072];

function toFourDecimalPlaces(num: number) {
  return Math.round(num * 10000) / 10000;
}

export default function Globe({ onLocationChange }: GlobeProps) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: INITIAL_LNG_LAT,
      zoom: 1.6,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      map.setProjection({ type: "globe" });

      // Zero the background layer so the area outside the sphere is transparent
      if (map.getLayer("background")) {
        map.setPaintProperty("background", "background-opacity", 0.8);
      }

      // Force all non-background layers to full opacity so land/countries
      // stay solid even without the opaque background behind them
      map.getStyle().layers.forEach(layer => {
        if (layer.id === "background") return;
        const prop = `${layer.type}-opacity` as Parameters<typeof map.setPaintProperty>[1];
        try { map.setPaintProperty(layer.id, prop, 1); } catch (_) {}
      });
    });

    const marker = new maplibregl.Marker({
      scale: 0.85,
      color: "#e8e8d8",
      draggable: true,
    })
      .setLngLat(INITIAL_LNG_LAT)
      .addTo(map);

    function onDragEnd() {
      const lngLat = marker.getLngLat();
      const lon = toFourDecimalPlaces(lngLat.lng);
      const lat = toFourDecimalPlaces(lngLat.lat);
      onLocationChange(lon, lat);
    }

    marker.on("dragend", onDragEnd);
    onLocationChange(INITIAL_LNG_LAT[0], INITIAL_LNG_LAT[1]);

    return () => {
      marker.off("dragend", onDragEnd);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden", background: "#00000000" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
