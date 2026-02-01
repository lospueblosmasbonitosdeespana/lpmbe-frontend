import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET() {
  const base = getApiUrl();
  const res = await fetch(`${base}/pueblos`, { cache: "no-store" });
  if (!res.ok) {
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  }
  const pueblos = await res.json();

  const destacados = shuffle(Array.isArray(pueblos) ? pueblos : []).slice(0, 8);
  return NextResponse.json(destacados, { status: 200 });
}
