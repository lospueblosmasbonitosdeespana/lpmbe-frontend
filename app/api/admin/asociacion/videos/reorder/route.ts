import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_BASE = getApiUrl();

export async function PATCH(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${API_BASE}/admin/asociacion/videos/reorder`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
