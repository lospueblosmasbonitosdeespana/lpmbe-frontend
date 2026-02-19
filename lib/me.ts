import { getToken } from './auth';
import { getApiUrl } from './api';
import { fetchWithTimeout } from './fetch-safe';

export type Usuario = {
  id: number;
  email: string;
  nombre?: string | null;
  rol: 'ADMIN' | 'ALCALDE' | 'COLABORADOR' | 'USUARIO' | 'CLIENTE';
};

export async function getMeServer(): Promise<Usuario | null> {
  const token = await getToken();
  if (!token) return null;

  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(`${API_BASE}/usuarios/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}





























