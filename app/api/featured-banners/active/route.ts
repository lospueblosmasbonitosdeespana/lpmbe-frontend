import { NextResponse } from "next/server";
import { getApiUrl } from "@/lib/api";

const API_BASE = getApiUrl();

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/featured-banners/active`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return NextResponse.json(data ?? { error: "Error obteniendo banners activos" }, { status: res.status });
    }
    const data = await res.json().catch(() => []);
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
