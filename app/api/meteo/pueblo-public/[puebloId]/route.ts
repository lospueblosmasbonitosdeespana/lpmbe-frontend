import { NextResponse } from "next/server";
import { fetchWithTimeout } from "@/lib/fetch-safe";

export const dynamic = "force-dynamic";

function getBackendBase() {
  const a = process.env.API_BASE_URL;
  const b = process.env.NEXT_PUBLIC_API_URL;
  const base = a ?? b;
  if (!base) throw new Error("Missing API_BASE_URL or NEXT_PUBLIC_API_URL");
  return base.replace(/\/$/, "");
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ puebloId: string }> }
) {
  const { puebloId } = await ctx.params;
  const base = getBackendBase();
  const url = `${base}/public/pueblos/${encodeURIComponent(puebloId)}/meteo`;

  try {
    const r = await fetchWithTimeout(url, { cache: "no-store", timeoutMs: 12000, retries: 0 });

    if (!r.ok) {
      return NextResponse.json(
        { error: `backend_${r.status}` },
        { status: r.status >= 500 ? 502 : r.status }
      );
    }

    const data = await r.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "upstream_fetch_failed", detail: err?.message ?? "unknown" },
      { status: 502 }
    );
  }
}
