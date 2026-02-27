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
    console.log('[auth/callback/apple] FALLO: no hay id_token en form data');
    return NextResponse.redirect(
      new URL('/entrar?error=apple_no_token', request.url)
    );
  }

  const API_BASE = getApiBase();
  const rawEnv = process.env.NEXT_PUBLIC_API_URL ?? '(no definida)';
  console.log('[auth/callback/apple] NEXT_PUBLIC_API_URL =', rawEnv);
  console.log('[auth/callback/apple] API_BASE =', API_BASE ?? '(null - inválido)');

  if (!API_BASE) {
    console.log('[auth/callback/apple] FALLO: API_BASE es null (URL no https o vacía)');
    return NextResponse.redirect(
      new URL('/entrar?error=apple_config_invalid', request.url)
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch (err) {
    console.log('[auth/callback/apple] FALLO: fetch al backend lanzó error:', err);
    return NextResponse.redirect(
      new URL('/entrar?error=apple_backend_unreachable', request.url)
    );
  }
  console.log('[auth/callback/apple] backend status =', upstream.status);

  const data = await upstream.json().catch(() => ({}));
  console.log('[auth/callback/apple] backend response keys =', Object.keys(data));

  if (!upstream.ok) {
    console.log('[auth/callback/apple] FALLO: backend devolvió error', upstream.status, data?.message ?? data);
    return NextResponse.redirect(
      new URL(`/entrar?error=apple_backend_${upstream.status}`, request.url)
    );
  }

  const token = pickToken(data);
  if (!token) {
    console.log('[auth/callback/apple] FALLO: backend OK pero no vino token (keys:', Object.keys(data), ')');
    return NextResponse.redirect(
      new URL('/entrar?error=apple_no_access_token', request.url)
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
