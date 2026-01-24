import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

// GET /api/admin/orders - Listar todos los pedidos
export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const API_BASE = getApiUrl();
    const url = `${API_BASE}/admin/orders`;

    console.log('[API orders] Llamando a:', url);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    console.log('[API orders] Status:', res.status, 'Response:', text.substring(0, 200));

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Backend no devolvió JSON válido', raw: text },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    console.error('[API orders] Error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
