// src/lib/auth.ts
export const AUTH_COOKIE_NAME = 'lpbme_token';

// Ajusta SOLO si el backend devuelve otra clave (pero en C0 soportamos 3 comunes).
export type LoginResponse = {
  access_token?: string;
  token?: string;
  jwt?: string;
};

export function pickToken(payload: LoginResponse): string | null {
  return payload.access_token ?? payload.token ?? payload.jwt ?? null;
}

