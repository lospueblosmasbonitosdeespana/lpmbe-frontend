// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const API_BASE = getApiUrl();
    const upstream = await fetch(`${API_BASE}/usuarios/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    // Si el backend devuelve 401/403, devolver ese status
    if (upstream.status === 401 || upstream.status === 403) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: upstream.status });
    }

    // Si hay error, devolver el error del backend
    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    // Si todo OK, devolver los datos
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    // Error inesperado (red, parseo, etc.)
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}

