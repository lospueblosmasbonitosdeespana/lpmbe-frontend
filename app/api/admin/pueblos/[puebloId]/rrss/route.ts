import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_BASE = getApiUrl();

async function proxy(
  puebloId: string,
  method: string,
  token: string | null,
  body?: unknown
) {
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const path = `${API_BASE}/admin/pueblos/${puebloId}/rrss`;

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  const { puebloId } = await params;
  return proxy(puebloId, "GET", token);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  const { puebloId } = await params;
  const body = await req.json().catch(() => ({}));
  return proxy(puebloId, "PATCH", token, body);
}
