import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ puebloId: string }> }
) {
  const { puebloId } = await ctx.params;

  const apiBase = getApiUrl();
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const upstream = `${apiBase}/pueblos/${encodeURIComponent(puebloId)}/meteo`;

  try {
    const res = await fetch(upstream, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await res.json()
      : await res.text();

    return NextResponse.json(body, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: "upstream_fetch_failed", upstream, detail: err?.message || String(err) },
      { status: 502 }
    );
  }
}













