import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;

  const upstreamUrl = `http://localhost:3000/pueblos/${encodeURIComponent(slug)}`;
  const r = await fetch(upstreamUrl, { cache: "no-store" });

  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
  });
}
