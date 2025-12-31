import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'auth_token';

export function pickToken(data: any): string | null {
  if (typeof data === 'string') return data;
  if (data?.token) return String(data.token);
  if (data?.access_token) return String(data.access_token);
  if (data?.accessToken) return String(data.accessToken);
  return null;
}

/**
 * Obtiene el token de autenticación desde las cookies (solo server-side).
 * NO usar en client components.
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

// Alias para compatibilidad
export async function getToken(): Promise<string | null> {
  return getTokenFromCookies();
}

