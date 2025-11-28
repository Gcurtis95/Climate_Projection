'server only'

import { NextResponse } from "next/server";

export async function GET(request: Request){

    const { searchParams } = new URL(request.url);

    const longitude = searchParams.get("lon");
    const latitude = searchParams.get("lat");

    const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${longitude}&latitude=${latitude}&access_token=${process.env.NEXT_PUBLIC_MAPBOX}&types=place`

    const response = await fetch(url)


    if(!response.ok){
        return NextResponse.json(
            { ok: false, error: "Backend API error" },
            { status: 502 }
        );
    }
	const result = await response.json();
	return NextResponse.json({ ok: true, result });

    

}