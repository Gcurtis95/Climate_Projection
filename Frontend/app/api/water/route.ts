'server-only'
import { NextResponse } from "next/server";


export async function GET(request: Request){

    const { searchParams } = new URL(request.url);

    const lon = searchParams.get("lon");
    const lat = searchParams.get("lat");
    
    const url = `https://isitwater-com.p.rapidapi.com/?latitude=${lat}&longitude=${lon}`;
    const options = {
	method: 'GET',
    headers: {
        'x-rapidapi-key': process.env.ISITWATER ?? '',
        'x-rapidapi-host': 'isitwater-com.p.rapidapi.com'
    }
    };

	const response = await fetch(url, options);


    if(!response.ok){
        return NextResponse.json(
            { ok: false, error: "Upstream API error" },
            { status: 502 }
        );
    }
	const result = await response.json();
	return NextResponse.json({ ok: true, result });

}