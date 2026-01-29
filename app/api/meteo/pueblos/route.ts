import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendBase() {
  // Preferir variable de servidor (no pública) si existe
  const a = process.env.API_BASE_URL;
  const b = process.env.NEXT_PUBLIC_API_URL;
  const base = a ?? b;
  if (!base) {
    throw new Error("Missing API_BASE_URL or NEXT_PUBLIC_API_URL");
  }
  return base.replace(/\/$/, "");
}

export async function GET() {
  const base = getBackendBase();
  const url = `${base}/public/meteo/pueblos`;
  
  console.log("[api/meteo/pueblos] Fetching:", url);
  
  try {
    const r = await fetch(url, { cache: "no-store" });
    const text = await r.text();
    
    console.log("[api/meteo/pueblos] Backend response:", r.status);
    
    if (!r.ok) {
      console.error("[api/meteo/pueblos] Backend error:", text.substring(0, 500));
    }
    
    return new NextResponse(text, {
      status: r.status,
      headers: {
        "content-type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err: any) {
    console.error("[api/meteo/pueblos] Fetch error:", err.message);
    return new NextResponse(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
