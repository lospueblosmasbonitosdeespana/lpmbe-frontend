import { NextRequest, NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

/**
 * GET /api/multiexperiencias/[mxId]/paradas
 * Proxy público para obtener paradas fusionadas (legacy + overrides + custom)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mxId: string }> }
) {
  const { mxId } = await context.params;

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/multiexperiencias/${mxId}/paradas`;

  console.log("[GET /api/multiexperiencias/:mxId/paradas] upstream:", upstreamUrl);

  try {
    const res = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();
    console.log("[GET /api/multiexperiencias/:mxId/paradas] status:", res.status);

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[GET /api/multiexperiencias/:mxId/paradas] error:", err);
    return NextResponse.json(
      { error: err.message ?? "Error connecting to backend" },
      { status: 500 }
    );
  }
}
