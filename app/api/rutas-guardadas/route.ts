import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Debes iniciar sesión para ver tus rutas guardadas' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/rutas-guardadas`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error al cargar rutas' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { message: 'Debes iniciar sesión para guardar rutas. Crea una cuenta o inicia sesión.' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Datos inválidos' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/rutas-guardadas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error al guardar la ruta' },
      { status: 500 }
    );
  }
}
