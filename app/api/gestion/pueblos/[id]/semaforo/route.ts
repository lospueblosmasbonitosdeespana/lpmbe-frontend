import { NextResponse } from 'next/server';
import { getTokenFromCookies } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getTokenFromCookies();

  if (!token) {
    return NextResponse.json({ ok: false, message: 'No autenticado' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Body inválido' }, { status: 400 });
  }

  // Normalizar strings (trim)
  const s = (v: any) => (typeof v === 'string' ? v.trim() : v);

  const estado = s(body?.estado);
  const motivo = s(body?.motivo);
  const mensajePublico = s(body?.mensajePublico);
  const mensaje = s(body?.mensaje);

  // Backend espera programadoInicio/programadoFin (no fechaInicio/fechaFin)
  const inicioRaw = s(body?.programadoInicio) || s(body?.inicioProgramado);
  const finRaw = s(body?.programadoFin) || s(body?.finProgramado);

  // Validar estado
  if (!estado || !['VERDE', 'AMARILLO', 'ROJO'].includes(estado)) {
    return NextResponse.json(
      { ok: false, message: 'Estado debe ser VERDE, AMARILLO o ROJO' },
      { status: 400 }
    );
  }

  // Construir payload con allowlist estricta (nombres que acepta el backend DTO)
  const payload: any = { estado };

  if (motivo) payload.motivo = motivo;
  if (mensajePublico) payload.mensajePublico = mensajePublico;
  if (mensaje) payload.mensaje = mensaje;

  // Backend DTO usa programadoInicio/programadoFin
  const isIso = (x: string) => /^\d{4}-\d{2}-\d{2}T/.test(x);
  if (inicioRaw && isIso(inicioRaw)) payload.programadoInicio = inicioRaw;
  if (finRaw && isIso(finRaw)) payload.programadoFin = finRaw;

  const API_BASE = getApiUrl();

  // Debug temporal
  console.log('[semaforo proxy] payload =>', payload);

  try {
    // Convertir POST a PUT para el backend
    const res = await fetch(`${API_BASE}/pueblos/${id}/semaforo`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      let errorData: any = null;
      try {
        errorData = text ? JSON.parse(text) : null;
      } catch {
        errorData = null;
      }

      // Debug temporal
      console.log('[semaforo proxy] backend error', res.status, text);

      return NextResponse.json(
        { ok: false, message: errorData?.message || errorData?.error || text || `HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

