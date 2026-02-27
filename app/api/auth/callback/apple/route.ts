/**
 * POST /api/auth/callback/apple
 * Recibe el form_post de Apple tras Sign in with Apple (redirect_uri).
 * Valida state, envía id_token al backend, establece cookie y redirige a /mi-cuenta.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';

function getApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return raw?.startsWith('https://') ? raw : null;
}

export async function POST(req: Request) {
  const API_BASE = getApiBase();
  if (!API_BASE) {
    return NextResponse.redirect(new URL('/entrar?error=config', req.url));
  }

  let body: Record<string, string>;
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      body = Object.fromEntries(new URLSearchParams(text)) as Record<string, string>;
    } else {
      body = await req.json();
    }
  } catch {
    return NextResponse.redirect(new URL('/entrar?error=invalid', req.url));
  }

  const idToken = body?.id_token || body?.idToken;
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.redirect(new URL('/entrar?error=no_token', req.url));
  }

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('apple_oauth_state')?.value;
  const stateForm = body?.state;
  if (stateForm && stateCookie && stateForm !== stateCookie) {
    return NextResponse.redirect(new URL('/entrar?error=state', req.url));
  }
  cookieStore.delete('apple_oauth_state');
  cookieStore.delete('apple_oauth_nonce');

  const upstream = await fetch(`${API_BASE}/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data = await upstream.json().catch(() => ({}));
  const token = pickToken(data);

  if (!upstream.ok || !token) {
    const msg = encodeURIComponent(data?.message || 'Error al iniciar sesión con Apple');
    return NextResponse.redirect(new URL(`/entrar?error=${msg}`, req.url));
  }

  const base = new URL(req.url);
  const redirectUrl = `${base.origin}/mi-cuenta`;
  const redirect = NextResponse.redirect(redirectUrl, 302);
  redirect.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return redirect;
}
