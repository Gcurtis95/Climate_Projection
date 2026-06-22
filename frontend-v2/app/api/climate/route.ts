import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/env";

// The backend streams NDJSON (one {"type": "rag"|"web"|"summary", "data": ...}
// object per line) rather than a single JSON payload, so this proxies the
// response body straight through instead of buffering/parsing it.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lon = searchParams.get("lon");
  const lat = searchParams.get("lat");
  const season = searchParams.get("season");
  const year = searchParams.get("year");
  const address = searchParams.get("address");

  if (!lon || !lat || !season || !year || !address) {
    return NextResponse.json(
      { ok: false, error: "lon, lat, season, year and address are required" },
      { status: 400 }
    );
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/climate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lon, lat, season, year, address }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach the climate backend";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  if (!response.ok || !response.body) {
    const body = await response.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: body || `Climate backend responded with ${response.status}` },
      { status: response.status || 502 }
    );
  }

  return new Response(response.body, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
