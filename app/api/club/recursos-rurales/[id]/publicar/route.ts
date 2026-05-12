import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/club/recursos-rurales/:id/publicar
 *
 * Activa el recurso (genera slug + i18n si faltan). Solo ADMIN.
 * Body opcional: { activo?: boolean } — por defecto activo: true.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(
      `${getApiUrl()}/club/recursos-rurales/${id}/publicar`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 },
    );
  }
}
