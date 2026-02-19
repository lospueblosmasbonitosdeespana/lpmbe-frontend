// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetch-safe';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Email y password requeridos' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetchWithTimeout(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
  } catch (error: any) {
    const msg = error?.name === 'AbortError'
      ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
      : 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    return NextResponse.json({ message: msg }, { status: 504 });
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'Login incorrecto' },
      { status: upstream.status },
    );
  }

  const token = pickToken(data);
  if (!token) {
    return NextResponse.json(
      { message: 'Login OK pero no vino token en la respuesta' },
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

