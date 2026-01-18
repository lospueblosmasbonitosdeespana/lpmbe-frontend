import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ items: [] }, { status: 200 });

  const API_BASE = getApiUrl();
  const url = `${API_BASE}/admin/notificaciones/global?tipo=EVENTO&limit=200`;

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';
  const fechaInicio = body?.fecha_inicio || body?.fechaInicio || null;
  const fechaFin = body?.fecha_fin || body?.fechaFin || null;

  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });

  // Convertir fechas de YYYY-MM-DD a ISO si vienen del input type="date"
  let fechaInicioISO = null;
  let fechaFinISO = null;
  
  if (fechaInicio) {
    fechaInicioISO = fechaInicio.includes('T') 
      ? new Date(fechaInicio).toISOString()
      : new Date(fechaInicio + 'T00:00:00.000Z').toISOString();
  }
  
  if (fechaFin) {
    fechaFinISO = fechaFin.includes('T')
      ? new Date(fechaFin).toISOString()
      : new Date(fechaFin + 'T00:00:00.000Z').toISOString();
  }

  const API_BASE = getApiUrl();
  const payload: any = {
    tipo: 'EVENTO',
    titulo,
    contenido: contenido || null,
  };

  // Solo añadir fechas si existen (el endpoint de notificaciones puede no aceptarlas)
  // Si el backend rechaza, quitar estos campos
  if (fechaInicioISO) payload.fecha_inicio = fechaInicioISO;
  if (fechaFinISO) payload.fecha_fin = fechaFinISO;

  const upstream = await fetch(`${API_BASE}/notificaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await upstream.text();
  console.log('[EVENTOS GLOBALES POST] status', upstream.status);
  console.log('[EVENTOS GLOBALES POST] body', text.slice(0, 500));
  console.log('[EVENTOS GLOBALES POST] payload sent', JSON.stringify(payload));

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  return NextResponse.json(data, { status: upstream.status });
}





