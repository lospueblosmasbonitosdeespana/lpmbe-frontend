/**
 * GET /api/auth/apple/authorize
 * Redirige a Apple Sign In (uso en móvil: enlace directo evita que Safari bloquee el redirect del SDK).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const APPLE_AUTH_URL = 'https://appleid.apple.com/auth/authorize';

function getRedirectUri(): string | null {
  const uri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim();
  return uri || null;
}

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim();
  const redirectUri = getRedirectUri();

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { message: 'Configuración Apple no disponible' },
      { status: 500 },
    );
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set('apple_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });
  cookieStore.set('apple_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    response_mode: 'form_post',
    scope: 'name email',
    state,
    nonce,
  });

  const url = `${APPLE_AUTH_URL}?${params.toString()}`;
  return NextResponse.redirect(url);
}
