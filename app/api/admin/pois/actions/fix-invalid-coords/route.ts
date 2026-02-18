import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/admin/pois/actions/fix-invalid-coords
 * Corrige POIs con coordenadas inválidas (solo ADMIN). Proxy al backend.
 */
export async function POST() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pois/actions/fix-invalid-coords`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.message ?? data?.error ?? 'Error' },
        { status: upstream.status },
      );
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Error llamando al backend' },
      { status: 500 },
    );
  }
}
