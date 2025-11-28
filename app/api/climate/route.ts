'server-only'
import { NextResponse } from "next/server";



export async function GET(request: Request){

    const { searchParams } = new URL(request.url);

    const lon = searchParams.get("lon");
    const lat = searchParams.get("lat");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const address = searchParams.get("address");

    const url = "http://127.0.0.1:8000/climate"
    const options = {
        method: 'POST',
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
            'lon': `${lon}`,
            'lat': `${lat}`,
            'month': `${month}`,
            'year': `${year}`,
            'address': `${address}`
        })
    };

    const response = await fetch(url, options)


    if(!response.ok){
        return NextResponse.json(
            { ok: false, error: "Backend API error" },
            { status: 502 }
        );
    }
	const result = await response.json();
	return NextResponse.json({ ok: true, result });

    

}