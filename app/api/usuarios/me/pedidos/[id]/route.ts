import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, ctx: RouteContext) {
  const API_BASE = getApiUrl();
  const store = await cookies();
  const token = store.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const res = await fetch(`${API_BASE}/usuarios/me/pedidos/${encodeURIComponent(id)}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
