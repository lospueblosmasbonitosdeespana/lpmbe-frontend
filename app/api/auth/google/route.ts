// app/api/auth/google/route.ts
// Recibe idToken de Google (credential) y lo envía al backend.
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';

function getApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  if (!raw) {
    console.error('[api/auth/google] NEXT_PUBLIC_API_URL no está definida');
    return null;
  }
  // Permitir http en desarrollo local
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    console.error('[api/auth/google] NEXT_PUBLIC_API_URL debe ser HTTP o HTTPS');
    return null;
  }
  return raw;
}

export async function POST(req: Request) {
  const API_BASE = getApiBase();
  if (!API_BASE) {
    return NextResponse.json(
      { message: 'Configuración de API no válida (NEXT_PUBLIC_API_URL)' },
      { status: 500 }
    );
  }

  console.log('[api/auth/google] API_BASE =', API_BASE);

  let body: { idToken?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Cuerpo inválido' }, { status: 400 });
  }

  const idToken = body?.idToken;
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ message: 'idToken requerido' }, { status: 400 });
  }

  console.log('[api/auth/google] idToken presente = true');

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch (err) {
    console.error('[api/auth/google] fetch error:', err);
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 }
    );
  }

  console.log('[api/auth/google] backend status =', upstream.status);

  const data = await upstream.json().catch(() => ({}));
  console.log('[api/auth/google] backend response keys =', Object.keys(data));

  if (!upstream.ok) {
    console.log('[api/auth/google] backend error:', data?.message ?? data);
    return NextResponse.json(
      data?.message ? { message: data.message } : data,
      { status: upstream.status }
    );
  }

  const token = pickToken(data);
  if (!token) {
    console.log('[api/auth/google] backend OK pero no vino token');
    return NextResponse.json(
      { message: 'Google OK pero no vino access_token' },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  console.log('[api/auth/google] cookie seteada =', AUTH_COOKIE_NAME);

  return res;
}
