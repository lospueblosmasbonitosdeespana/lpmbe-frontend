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
  const r = await fetch(`${base}/public/meteo/pueblos`, { cache: "no-store" });
  const text = await r.text();
  return new NextResponse(text, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
    },
  });
}
