// app/api/auth/apple/route.ts
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';

function getApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  if (!raw) {
    console.error('[api/auth/apple] NEXT_PUBLIC_API_URL no está definida');
    return null;
  }
  if (!raw.startsWith('https://')) {
    console.error('[api/auth/apple] NEXT_PUBLIC_API_URL debe ser HTTPS (no localhost ni http)');
    return null;
  }
  return raw;
}

export async function POST(req: Request) {
  const API_BASE = getApiBase();
  if (!API_BASE) {
    return NextResponse.json(
      { message: 'Configuración de API no válida (NEXT_PUBLIC_API_URL)' },
      { status: 500 },
    );
  }

  const backendDomain = new URL(API_BASE).hostname;
  console.log('[api/auth/apple] backend url (dominio):', backendDomain);

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

  const upstream = await fetch(`${API_BASE}/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const status = upstream.status;
  console.log('[api/auth/apple] backend status:', status);

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(
      data?.message ? { message: data.message } : data,
      { status: upstream.status },
    );
  }

  const token = pickToken(data);
  if (!token) {
    return NextResponse.json(
      { message: 'Apple OK pero no vino access_token' },
      { status: 500 },
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

  return res;
}
