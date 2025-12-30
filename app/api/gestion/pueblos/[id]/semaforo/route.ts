import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { getApiUrl } from "@/lib/api";

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 });
  }

  // Aceptar JSON o FormData
  let estado: string;
  let mensaje: string | null;
  let mensajePublico: string | null;
  let motivo: string | null;
  let inicioProgramado: string | null;
  let finProgramado: string | null;

  const contentType = req.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, message: "Body requerido" }, { status: 400 });
    }
    estado = String(body.estado ?? "").trim().toUpperCase();
    mensaje = body.mensaje ? String(body.mensaje).trim() || null : null;
    mensajePublico = body.mensajePublico ? String(body.mensajePublico).trim() || null : null;
    motivo = body.motivo ? String(body.motivo).trim() || null : null;
    inicioProgramado = body.inicioProgramado ? String(body.inicioProgramado).trim() || null : null;
    finProgramado = body.finProgramado ? String(body.finProgramado).trim() || null : null;
  } else {
    const form = await req.formData();
    estado = String(form.get("estado") ?? "").trim().toUpperCase();
    const mensajeRaw = form.get("mensaje");
    mensaje = mensajeRaw ? String(mensajeRaw).trim() || null : null;
    const mensajePublicoRaw = form.get("mensajePublico");
    mensajePublico = mensajePublicoRaw ? String(mensajePublicoRaw).trim() || null : null;
    const motivoRaw = form.get("motivo");
    motivo = motivoRaw ? String(motivoRaw).trim() || null : null;
    const inicioProgramadoRaw = form.get("inicioProgramado");
    inicioProgramado = inicioProgramadoRaw ? String(inicioProgramadoRaw).trim() || null : null;
    const finProgramadoRaw = form.get("finProgramado");
    finProgramado = finProgramadoRaw ? String(finProgramadoRaw).trim() || null : null;
  }

  // Validar estado: debe ser VERDE, AMARILLO o ROJO exactamente
  const estadosValidos = ["VERDE", "AMARILLO", "ROJO"];
  
  if (!estadosValidos.includes(estado)) {
    return NextResponse.json(
      { 
        ok: false,
        error: "Estado inválido", 
        message: `El estado debe ser uno de: ${estadosValidos.join(", ")}. Recibido: "${estado}"` 
      },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();

  const payload: any = { estado };
  if (mensaje !== null) payload.mensaje = mensaje;
  if (mensajePublico !== null) payload.mensajePublico = mensajePublico;
  if (motivo !== null) payload.motivo = motivo;
  if (inicioProgramado !== null) payload.inicioProgramado = inicioProgramado;
  if (finProgramado !== null) payload.finProgramado = finProgramado;

  const res = await fetch(`${API_BASE}/pueblos/${id}/semaforo`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // Si hay error, devolverlo tal cual (NO redirigir)
  if (!res.ok) {
    return NextResponse.json(
      { 
        ok: false,
        error: "Error del backend", 
        status: res.status, 
        message: data?.message ?? data?.error ?? text ?? "Error desconocido",
        data 
      },
      { status: res.status }
    );
  }

  // Si todo OK, devolver JSON (NO redirect)
  return NextResponse.json({ ok: true });
}

