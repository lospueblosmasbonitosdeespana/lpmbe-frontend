import { getToken } from './auth';
import { getApiUrl } from './api';
import { fetchWithTimeout } from './fetch-safe';

export type Usuario = {
  id: number;
  email: string;
  nombre?: string | null;
  rol: 'ADMIN' | 'EDITOR' | 'ALCALDE' | 'COLABORADOR' | 'USUARIO' | 'CLIENTE';
};

export type MeResult =
  | { kind: 'ok'; user: Usuario }
  | { kind: 'anon' }
  | { kind: 'expired' }
  | { kind: 'unavailable' };

/**
 * Variante tolerante a fallos transitorios del backend.
 *
 *  - `anon`        → no hay cookie de sesión (usuario no logueado).
 *  - `expired`     → el backend dijo 401/403 (token inválido / caducado).
 *  - `unavailable` → el backend no respondió (timeout, red, 5xx) pese a
 *                    existir token. El caller debe tratarlo como sesión
 *                    probablemente válida: NO expulsar al usuario.
 *  - `ok`          → sesión válida, devuelve usuario.
 */
export async function getMeServerDetailed(): Promise<MeResult> {
  const token = await getToken();
  if (!token) return { kind: 'anon' };

  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(`${API_BASE}/usuarios/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      timeoutMs: 15_000,
      retries: 2,
    });

    if (res.status === 401 || res.status === 403) return { kind: 'expired' };
    if (!res.ok) return { kind: 'unavailable' };
    return { kind: 'ok', user: await res.json() };
  } catch {
    return { kind: 'unavailable' };
  }
}

export async function getMeServer(): Promise<Usuario | null> {
  const r = await getMeServerDetailed();
  return r.kind === 'ok' ? r.user : null;
}





























