import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

function parseTemplateId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const resolvedParams = await params;
  const id = parseTemplateId(resolvedParams.id);
  if (!id) return NextResponse.json({ message: 'ID inválido' }, { status: 400 });

  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/admin/newsletter/templates/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const resolvedParams = await params;
  const id = parseTemplateId(resolvedParams.id);
  if (!id) return NextResponse.json({ message: 'ID inválido' }, { status: 400 });

  try {
    const body = await req.json().catch(() => ({}));
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/admin/newsletter/templates/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const resolvedParams = await params;
  const id = parseTemplateId(resolvedParams.id);
  if (!id) return NextResponse.json({ message: 'ID inválido' }, { status: 400 });

  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/admin/newsletter/templates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ message }, { status: 500 });
  }
}
