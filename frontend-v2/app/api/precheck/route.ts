import { NextResponse } from "next/server";
import { fetchJson, HttpError } from "@/lib/http";
import { ISITWATER_KEY, MAPBOX_TOKEN } from "@/lib/env";
import type { PrecheckResult } from "@/types/climate";

type WaterResponse = { water: boolean };
type GeocodeResponse = {
  features: { properties: { full_address?: string } }[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lon = searchParams.get("lon");
  const lat = searchParams.get("lat");

  if (!lon || !lat) {
    return NextResponse.json(
      { ok: false, error: "lon and lat are required" },
      { status: 400 }
    );
  }

  try {
    const [water, geocode] = await Promise.all([
      fetchJson<WaterResponse>(
        `https://isitwater-com.p.rapidapi.com/?latitude=${lat}&longitude=${lon}`,
        {
          timeoutMs: 8000,
          headers: {
            "x-rapidapi-key": ISITWATER_KEY,
            "x-rapidapi-host": "isitwater-com.p.rapidapi.com",
          },
        }
      ),
      fetchJson<GeocodeResponse>(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lon}&latitude=${lat}&access_token=${MAPBOX_TOKEN}`,
        { timeoutMs: 8000 }
      ),
    ]);

    const result: PrecheckResult = {
      isWater: water.water,
      address: geocode.features[0]?.properties.full_address ?? null,
    };

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Precheck failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
