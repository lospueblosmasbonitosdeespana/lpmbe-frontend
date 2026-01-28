import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

/**
 * POST /api/admin/fotos/swap
 * Intercambia el orden de dos fotos
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { aId: rawAId, bId: rawBId } = body;

    if (!rawAId || !rawBId) {
      return NextResponse.json(
        { message: "Se requieren aId y bId" },
        { status: 400 }
      );
    }

    // Normalizar IDs: "legacy-1948" → "1948"
    const normalizeId = (id: string | number): string | number => {
      if (typeof id === 'string' && id.startsWith('legacy-')) {
        return id.replace(/^legacy-/, '');
      }
      return id;
    };

    const aId = normalizeId(rawAId);
    const bId = normalizeId(rawBId);

    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/admin/fotos/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ aId, bId }),
      cache: "no-store",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Error" }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[POST /api/admin/fotos/swap] error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
