import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

/**
 * PATCH /api/admin/pueblos/:puebloId/foto-destacada
 * Actualiza foto_destacada (hero + tarjeta). Body: { url: string }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { puebloId } = await params;
  const body = await req.json().catch(() => null);

  if (body === null || body === undefined) {
    return NextResponse.json(
      { message: "Bad Request: body required" },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/foto-destacada`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: body.url ?? null }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "Error desconocido");
      return NextResponse.json(
        { error: errorText },
        { status: upstream.status }
      );
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
