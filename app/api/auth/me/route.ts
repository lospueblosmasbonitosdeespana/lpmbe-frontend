// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function GET() {
  const cookieStore = await cookies(); // 👈 Next 16: cookies() puede ser Promise
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  console.log('[api/auth/me] cookie recibida? =', Boolean(token));
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const upstream = await fetch(`${API_BASE}/usuarios/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

