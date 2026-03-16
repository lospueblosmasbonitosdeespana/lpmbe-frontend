import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-safe";

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
    const r = await fetchWithTimeout(url, { cache: "no-store", timeoutMs: 7000, retries: 0 });
    const text = await r.text();
    
    console.log("[api/meteo/pueblos] Backend response:", r.status);
    
    if (!r.ok) {
      console.error("[api/meteo/pueblos] Backend error:", text.substring(0, 500));
      // Evita 5XX/timeout hacia el frontend y crawlers: devolvemos lista vacía temporal.
      return NextResponse.json([], {
        status: 200,
        headers: { "x-meteo-fallback": `backend-${r.status}` },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "content-type": r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err: any) {
    console.error("[api/meteo/pueblos] Fetch error:", err.message);
    return NextResponse.json([], {
      status: 200,
      headers: { "x-meteo-fallback": "exception" },
    });
  }
}
