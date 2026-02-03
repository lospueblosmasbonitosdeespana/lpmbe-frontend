import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

const API_BASE = getApiUrl();
const UNAUTHORIZED_ERROR = "UNAUTHORIZED";

async function ensureToken() {
  const token = await getToken();
  if (!token) throw new Error(UNAUTHORIZED_ERROR);
  return token;
}

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_req: Request, { params }: Params) {
  try {
    const token = await ensureToken();
    const res = await fetch(`${API_BASE}/featured-banners/${params.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(data ?? { error: "Error obteniendo banner" }, { status: res.status });
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

export async function PATCH(req: Request, { params }: Params) {
  try {
    const token = await ensureToken();
    const body = await req.json();

    const res = await fetch(`${API_BASE}/featured-banners/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(data ?? { error: "Error actualizando banner" }, { status: res.status });
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

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const token = await ensureToken();
    const res = await fetch(`${API_BASE}/featured-banners/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return NextResponse.json(data ?? { error: "Error eliminando banner" }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === UNAUTHORIZED_ERROR) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
