// lib/misPueblos.ts
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export type MiPueblo = {
  id: number;
  nombre: string;
  slug: string;
};

export async function getMisPueblosServer(): Promise<MiPueblo[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return [];

  // endpoint ya existente en backend según proyecto: /usuarios/me/pueblos
  const res = await fetch(`${API_BASE}/usuarios/me/pueblos`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? (data as MiPueblo[]) : [];
}

