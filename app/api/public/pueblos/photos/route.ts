import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/pueblos/photos?ids=1,2,3,...
 * 
 * Proxy a backend para obtener fotos de múltiples pueblos.
 * Evita CORS y problemas de env vars en cliente.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    console.error("[api/public/pueblos/photos] Missing 'ids' parameter");
    return NextResponse.json(
      { error: "Missing 'ids' query parameter" },
      { status: 400 }
    );
  }

  // Backend URL (server-side, no CORS)
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const url = `${BACKEND_URL}/public/pueblos/photos?ids=${idsParam}`;

  console.log(`[api/public/pueblos/photos] Fetching from backend: ${url}`);
  console.log(`[api/public/pueblos/photos] IDs count: ${idsParam.split(',').length}`);

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    const text = await res.text();
    
    if (!res.ok) {
      console.error(
        `[api/public/pueblos/photos] Backend error ${res.status}:`,
        text.substring(0, 500)
      );
      return new Response(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[api/public/pueblos/photos] Success ${res.status}, body length: ${text.length}`
    );

    // Parsear para contar fotos (solo en dev)
    if (process.env.NODE_ENV === "development") {
      try {
        const data = JSON.parse(text);
        const withPhoto = Object.values(data).filter((v: any) => v?.url).length;
        console.log(`[api/public/pueblos/photos] Photos with URL: ${withPhoto}/${Object.keys(data).length}`);
      } catch {}
    }

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[api/public/pueblos/photos] Fetch error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch from backend", details: err.message },
      { status: 500 }
    );
  }
}
