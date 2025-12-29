// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

// AJUSTA SOLO si el endpoint real es otro
const REGISTER_PATH = '/usuarios/register';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Email y password requeridos' },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_BASE}${REGISTER_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // nombre opcional (si backend lo ignora, ok)
    body: JSON.stringify({
      email,
      password,
      nombre: body?.nombre ?? null,
    }),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(
      { message: data?.message ?? 'No se pudo registrar' },
      { status: upstream.status },
    );
  }

  // Si backend devuelve token, auto-login.
  const token = pickToken(data);
  if (token) {
    const res = NextResponse.json({ ok: true, autoLogin: true });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  }

  // Si no devuelve token, registro OK y luego login manual
  return NextResponse.json({ ok: true, autoLogin: false });
}

