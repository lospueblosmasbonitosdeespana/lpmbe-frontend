import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const upstream = getApiUrl();
  const res = await fetch(`${upstream}/global-promotion/active`, {
    cache: "no-store",
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
