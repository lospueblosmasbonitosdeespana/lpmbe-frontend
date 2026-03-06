import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const API_BASE = getApiUrl();
  const store = await cookies();
  const token = store.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json([], { status: 401 });
  }

  const res = await fetch(`${API_BASE}/usuarios/me/pedidos`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
