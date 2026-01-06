import { getToken } from './auth';
import { getApiUrl } from './api';

export type PuebloBasico = {
  id: number;
  nombre: string;
  slug: string;
};

export async function getMisPueblosServer(): Promise<PuebloBasico[]> {
  const token = await getToken();
  if (!token) return [];

  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/usuarios/me/pueblos`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.items ?? data?.data ?? []);
  } catch {
    return [];
  }
}







