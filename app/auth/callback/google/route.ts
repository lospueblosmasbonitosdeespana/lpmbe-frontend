// Callback de Google OAuth 2.0 (redirect flow).
// Google hace GET con ?code=... al redirectUri.
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';

function getApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  if (!raw || !raw.startsWith('https://')) return null;
  return raw;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');

  console.log('[auth/callback/google] code presente =', Boolean(code));

  // Si Google devolvió error (ej: usuario canceló)
  if (errorParam) {
    console.log('[auth/callback/google] Google devolvió error:', errorParam);
    return NextResponse.redirect(
      new URL(`/entrar?error=google_${errorParam}`, request.url),
      303
    );
  }

  if (!code) {
    console.log('[auth/callback/google] FALLO: no hay code en query params');
    return NextResponse.redirect(
      new URL('/entrar?error=google_no_code', request.url),
      303
    );
  }

  const API_BASE = getApiBase();
  const rawEnv = process.env.NEXT_PUBLIC_API_URL ?? '(no definida)';
  console.log('[auth/callback/google] NEXT_PUBLIC_API_URL =', rawEnv);
  console.log('[auth/callback/google] API_BASE =', API_BASE ?? '(null - inválido)');

  if (!API_BASE) {
    console.log('[auth/callback/google] FALLO: API_BASE es null');
    return NextResponse.redirect(
      new URL('/entrar?error=google_config_invalid', request.url),
      303
    );
  }

  // Obtener el redirectUri para que el backend pueda verificar
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? '';

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri }),
    });
  } catch (err) {
    console.log('[auth/callback/google] FALLO: fetch al backend lanzó error:', err);
    return NextResponse.redirect(
      new URL('/entrar?error=google_backend_unreachable', request.url),
      303
    );
  }
  console.log('[auth/callback/google] backend status =', upstream.status);

  const data = await upstream.json().catch(() => ({}));
  console.log('[auth/callback/google] backend response keys =', Object.keys(data));

  if (!upstream.ok) {
    console.log('[auth/callback/google] FALLO: backend devolvió error', upstream.status, data?.message ?? data);
    return NextResponse.redirect(
      new URL(`/entrar?error=google_backend_${upstream.status}`, request.url),
      303
    );
  }

  const token = pickToken(data);
  if (!token) {
    console.log('[auth/callback/google] FALLO: backend OK pero no vino token (keys:', Object.keys(data), ')');
    return NextResponse.redirect(
      new URL('/entrar?error=google_no_access_token', request.url),
      303
    );
  }

  const res = NextResponse.redirect(new URL('/cuenta', request.url), 303);
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  console.log('[auth/callback/google] cookie seteada =', AUTH_COOKIE_NAME);

  return res;
}
