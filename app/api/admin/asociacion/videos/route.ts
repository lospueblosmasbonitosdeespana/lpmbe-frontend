import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_BASE = getApiUrl();

async function proxy(method: string, token: string | null, body?: unknown, id?: string) {
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const path = id
    ? `${API_BASE}/admin/asociacion/videos/${id}`
    : `${API_BASE}/admin/asociacion/videos`;

  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      const err = JSON.parse(text);
      return NextResponse.json(err, { status: res.status });
    } catch {
      return NextResponse.json({ error: text }, { status: res.status });
    }
  }

  try {
    return NextResponse.json(text ? JSON.parse(text) : {});
  } catch {
    return NextResponse.json({});
  }
}

export async function GET() {
  const token = await getToken();
  return proxy("GET", token);
}

export async function POST(req: Request) {
  const token = await getToken();
  const body = await req.json().catch(() => ({}));
  return proxy("POST", token, body);
}
