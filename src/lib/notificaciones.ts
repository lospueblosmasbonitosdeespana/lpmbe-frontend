// src/lib/notificaciones.ts
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export type Notificacion = {
  id: number;
  tipo: string;
  titulo: string | null;
  contenido: string | null;
  createdAt: string;
  puebloId: number | null;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  autor?: {
    id: number;
    rol: string;
    nombre?: string | null;
  } | null;
};

export async function getNotificacionesServer(): Promise<Notificacion[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return [];

  const res = await fetch(`${API_BASE}/notificaciones`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    // Si es 401, devolver array vacío (o podría hacer redirect, pero por ahora [] es más seguro)
    if (res.status === 401) return [];
    return [];
  }

  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? (data as Notificacion[]) : [];
}

