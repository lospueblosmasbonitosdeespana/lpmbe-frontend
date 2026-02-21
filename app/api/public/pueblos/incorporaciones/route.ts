import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const API_BASE = getApiUrl();
  const url = `${API_BASE}/public/pueblos/incorporaciones`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    if (!res.ok) {
      return new Response(text, {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch from backend", details: err.message },
      { status: 500 }
    );
  }
}
