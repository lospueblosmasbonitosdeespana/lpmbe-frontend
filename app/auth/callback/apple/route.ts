// Única implementación del callback Apple: route.ts (no page.tsx en este path).
// POST = form_post desde Apple; GET = alguien entró por URL a mano.
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, pickToken } from '@/lib/auth';

export function GET(request: Request) {
  return NextResponse.redirect(new URL('/entrar', request.url), 303);
}

function getApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  if (!raw || !raw.startsWith('https://')) return null;
  return raw;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const idToken = form.get('id_token');
  console.log('[auth/callback/apple] id_token presente =', Boolean(idToken && typeof idToken === 'string'));

  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.redirect(
      new URL('/entrar?error=apple_no_token', request.url)
    );
  }

  const API_BASE = getApiBase();
  if (!API_BASE) {
    return NextResponse.redirect(
      new URL('/entrar?error=apple_exchange_failed', request.url)
    );
  }

  const upstream = await fetch(`${API_BASE}/auth/apple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  console.log('[auth/callback/apple] backend status =', upstream.status);

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.redirect(
      new URL('/entrar?error=apple_exchange_failed', request.url)
    );
  }

  const token = pickToken(data);
  if (!token) {
    return NextResponse.redirect(
      new URL('/entrar?error=apple_exchange_failed', request.url)
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
  console.log('[auth/callback/apple] cookie seteada =', AUTH_COOKIE_NAME);

  return res;
}
