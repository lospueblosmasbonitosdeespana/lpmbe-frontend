import { NextResponse } from "next/server";
import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

/**
 * POST /api/admin/uploads/video
 * Sube un video a R2 (videos de la asociación).
 * FormData: file (video mp4/webm/mov), folder opcional.
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No se recibió ningún archivo" },
        { status: 400 }
      );
    }

    const body = new FormData();
    body.append("file", file, file instanceof File ? file.name : "video.mp4");
    const folder = formData.get("folder");
    if (folder && typeof folder === "string") {
      body.append("folder", folder);
    }

    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/media/upload-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.message ?? data?.error ?? "Error subiendo video";
      return NextResponse.json(
        { error: typeof msg === "string" ? msg : "Error subiendo video" },
        { status: res.status }
      );
    }

    const url = data?.publicUrl ?? data?.url;
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Upload OK pero falta URL en respuesta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url, publicUrl: url });
  } catch (err: unknown) {
    console.error("[upload video] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error interno" },
      { status: 500 }
    );
  }
}
