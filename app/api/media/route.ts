import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * GET /api/media?ownerType=X&ownerId=Y
 * Obtiene lista de media para una entidad
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerType = searchParams.get('ownerType');
    const ownerId = searchParams.get('ownerId');

    if (!ownerType || !ownerId) {
      return NextResponse.json(
        { error: 'ownerType y ownerId son obligatorios' },
        { status: 400 }
      );
    }

    const API_BASE = getApiUrl();
    const url = `${API_BASE}/media?ownerType=${ownerType}&ownerId=${ownerId}`;

    // Media puede ser público o privado según la entidad
    // Intentar con token si existe
    const token = await getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(url, {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error' }));
      return NextResponse.json(error, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('[GET /api/media] error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
