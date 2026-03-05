import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const idNum = parseInt(id, 10);
  if (Number.isNaN(idNum)) return NextResponse.json({ message: 'ID inválido' }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ message: 'Body inválido' }, { status: 400 });

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/eventos/${idNum}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  return NextResponse.json(data, { status: res.status });
}
