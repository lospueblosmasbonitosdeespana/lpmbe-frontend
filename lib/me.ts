// lib/me.ts
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export type Me = {
  sub: number;
  email: string;
  rol: 'USUARIO' | 'ALCALDE' | 'ADMIN';
  nombre?: string | null;
};

export async function getMeServer(): Promise<Me | null> {
  const cookieStore = await cookies(); // 👈 Next 16: cookies() puede ser Promise
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const res = await fetch(`${API_BASE}/usuarios/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return (await res.json()) as Me;
}

