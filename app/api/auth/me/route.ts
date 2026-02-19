// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetch-safe';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const upstream = await fetchWithTimeout(`${API_BASE}/usuarios/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json({ message: 'Tiempo de espera agotado' }, { status: 504 });
    }
    return NextResponse.json({ message: 'Error conectando con el servidor' }, { status: 502 });
  }
}

