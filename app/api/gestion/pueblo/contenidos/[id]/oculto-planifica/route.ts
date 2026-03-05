import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/** PATCH: solo ADMIN. Toggle ocultar en Planifica fin de semana (solo esa página). */
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
  const value = body && typeof body.ocultoEnPlanificaFinDeSemana === 'boolean' ? body.ocultoEnPlanificaFinDeSemana : false;

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/contenidos/${idNum}/oculto-planifica`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ocultoEnPlanificaFinDeSemana: value }),
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
