import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

/**
 * PATCH /api/admin/fotos/:fotoId/rotation
 * Actualiza la rotación de una foto específica
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fotoId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { fotoId } = await params;
  const body = await req.json();

  console.log("[next api] rotation route", { fotoId, body });

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/fotos/${fotoId}/rotation`;

  console.log("[admin/fotos/rotation PATCH] upstreamUrl:", upstreamUrl);
  console.log("[admin/fotos/rotation PATCH] body:", body);

  try {
    const res = await fetch(upstreamUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    
    console.log("[admin/fotos/rotation PATCH] status:", res.status);
    console.log("[admin/fotos/rotation PATCH] response:", text);

    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[admin/fotos/rotation PATCH] error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
