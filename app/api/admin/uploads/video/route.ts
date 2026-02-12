import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

/**
 * POST /api/admin/uploads/video
 * Proxy streaming al backend para subir videos a R2.
 * Usa streaming para no topar con el límite de body de Vercel.
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type");
  if (!contentType || !contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Se espera multipart/form-data" }, { status: 400 });
  }

  try {
    const API_BASE = getApiUrl();
    // Streaming: no leer el body para evitar límite de Vercel
    const upstream = await fetch(`${API_BASE}/media/upload-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
      },
      body: req.body,
      ...(req.body && { duplex: "half" } as Record<string, string>),
    });

    const raw = await upstream.text();

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Backend no devolvió JSON", raw: raw.slice(0, 200) },
        { status: 500 },
      );
    }

    if (!upstream.ok) {
      const msg = data?.message ?? data?.error ?? "Error subiendo video";
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Error subiendo video" },
        { status: upstream.status },
      );
    }

    const url = data?.publicUrl ?? data?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Upload OK pero falta URL en respuesta" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url, publicUrl: url });
  } catch (err: unknown) {
    console.error("[upload video] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 },
    );
  }
}
