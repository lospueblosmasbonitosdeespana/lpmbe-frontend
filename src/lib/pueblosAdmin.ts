// src/lib/pueblosAdmin.ts
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export type PuebloMini = { id: number; nombre: string; slug: string };

export async function getAllPueblosServer(): Promise<PuebloMini[]> {
  const res = await fetch(`${API_BASE}/pueblos`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  if (!Array.isArray(data)) return [];

  return data.map((p: any) => ({
    id: Number(p.id),
    nombre: String(p.nombre ?? ''),
    slug: String(p.slug ?? ''),
  })) as PuebloMini[];
}

