import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_BASE = getApiUrl();
const UNAUTHORIZED_ERROR = "UNAUTHORIZED";

async function ensureToken() {
  const token = await getToken();
  if (!token) {
    throw new Error(UNAUTHORIZED_ERROR);
  }
  return token;
}

export async function GET() {
  try {
    const token = await ensureToken();
    const res = await fetch(`${API_BASE}/featured-banners`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(data ?? { error: "Error obteniendo banners" }, { status: res.status });
    }
    return NextResponse.json(data ?? []);
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await ensureToken();
    const body = await req.json();

    const res = await fetch(`${API_BASE}/featured-banners`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(data ?? { error: "Error creando banner" }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
