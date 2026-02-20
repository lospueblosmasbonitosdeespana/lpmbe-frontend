import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

async function getToken() {
  const store = await cookies();
  return store.get('token')?.value ?? null;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id, userId } = await params;
  const apiUrl = getApiUrl();

  try {
    const res = await fetch(
      `${apiUrl}/club/recursos/${id}/colaboradores/${userId}`,
      {
        method: 'DELETE',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API proxy] DELETE colaborador:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 },
    );
  }
}
