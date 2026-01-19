import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

// POST /api/media/upload-multiple (multipart/form-data con files[])
// Devuelve { count: number, images: [{ url: string }] }
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const formData = await req.formData();

  const upstream = await fetch(`${API_BASE}/media/upload-multiple`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}
