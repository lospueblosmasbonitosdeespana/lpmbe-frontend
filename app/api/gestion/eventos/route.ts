import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

async function getPuebloIdBySlug(slug: string): Promise<number> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error obteniendo pueblo (slug=${slug}): ${res.status} ${text.slice(0, 200)}`);
  }
  
  const pueblo = await res.json();
  if (!pueblo?.id) {
    throw new Error(`Pueblo no encontrado o sin ID (slug=${slug})`);
  }
  
  return pueblo.id;
}

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const url = new URL(req.url);
  const puebloSlug = url.searchParams.get('puebloSlug');
  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });

  try {
    const puebloId = await getPuebloIdBySlug(puebloSlug);
    const API_BASE = getApiUrl();
    
    const upstream = await fetch(`${API_BASE}/pueblos/${puebloId}/eventos`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const text = await upstream.text();
    let data: any = [];
    try {
      data = text ? JSON.parse(text) : [];
    } catch {}

    if (!upstream.ok) {
      console.log('[EVENTOS PUEBLO GET] error', upstream.status, text.slice(0, 500));
    }

    return NextResponse.json(Array.isArray(data) ? data : data.items ?? data.data ?? [], { 
      status: upstream.status 
    });
  } catch (e: any) {
    console.error('[EVENTOS PUEBLO GET]', e);
    return NextResponse.json({ message: e?.message ?? 'Error obteniendo pueblo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const puebloSlug = body?.puebloSlug;
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const descripcion = typeof body?.descripcion === 'string' ? body.descripcion.trim() : '';
  const fechaInicio = body?.fecha_inicio || body?.fechaInicio || null;
  const fechaFin = body?.fecha_fin || body?.fechaFin || null;

  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });
  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });
  if (!descripcion || descripcion.trim() === '') {
    return NextResponse.json({ message: 'descripcion requerida' }, { status: 400 });
  }
  if (!fechaInicio) return NextResponse.json({ message: 'fecha_inicio requerida' }, { status: 400 });

  try {
    const puebloId = await getPuebloIdBySlug(puebloSlug);
    const API_BASE = getApiUrl();
    
    // Convertir fechas de YYYY-MM-DD a ISO si vienen del input type="date"
    let fechaInicioISO = fechaInicio;
    let fechaFinISO = fechaFin;
    
    if (fechaInicio && !fechaInicio.includes('T')) {
      fechaInicioISO = new Date(fechaInicio + 'T00:00:00.000Z').toISOString();
    }
    
    if (fechaFin && !fechaFin.includes('T')) {
      fechaFinISO = new Date(fechaFin + 'T00:00:00.000Z').toISOString();
    }
    
    const upstream = await fetch(`${API_BASE}/pueblos/${puebloId}/eventos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        titulo, 
        descripcion,
        fecha_inicio: fechaInicioISO,
        fecha_fin: fechaFinISO || undefined,
      }),
      cache: 'no-store',
    });

    const text = await upstream.text();
    console.log('[EVENTOS PUEBLO POST] status', upstream.status);
    console.log('[EVENTOS PUEBLO POST] body', text.slice(0, 500));
    console.log('[EVENTOS PUEBLO POST] payload', { titulo, descripcion, fecha_inicio: fechaInicioISO, fecha_fin: fechaFinISO, puebloId });

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error('[EVENTOS PUEBLO POST]', e);
    return NextResponse.json({ message: e?.message ?? 'Error obteniendo pueblo' }, { status: 500 });
  }
}





