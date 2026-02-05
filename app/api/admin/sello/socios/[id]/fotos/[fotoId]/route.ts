import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const API_BASE = getApiUrl();

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; fotoId: string }> }
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id, fotoId } = await params;
  const res = await fetch(`${API_BASE}/admin/sello/socios/${id}/fotos/${fotoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
