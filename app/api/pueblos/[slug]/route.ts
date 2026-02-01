import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/pueblos/${encodeURIComponent(slug)}`;
  const r = await fetch(upstreamUrl, { cache: "no-store" });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
  });
}
