import { getApiUrl } from '@/lib/api';

const API_BASE = getApiUrl();

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

export type RecursoTuristico = {
  id: number;
  puebloId: number;
  nombre: string;
  tipo: string;
  codigoQr: string;
  activo: boolean;
  cerradoTemporal: boolean;
  descuentoPorcentaje: number | null;
  precioCents: number | null;
  pueblo?: { id: number; nombre: string; slug: string };
};

export type ClubMe = {
  isMember: boolean;
  status: string | null;
  plan: string | null;
  validUntil: string | null;
  qrToken: string;
  qrPayload: string;
};

export type ColaboradorAsignado = {
  id: number;
  activo: boolean;
  createdAt: string;
  user: {
    id: number;
    email: string;
    nombre: string | null;
    apellidos: string | null;
    rol: string;
  };
};

export type MetricasRecurso = {
  hoy: { total: number; ok: number; noOk: number; adultos: number; menores: number };
  periodo: { totalIntentos: number; ok: number; noOk: Record<string, number> };
  dias: Array<{ fecha: string; total: number; ok: number; adultos: number; menores: number }>;
  ultimosDias: Array<{ fecha: string; total: number; ok: number; adultos: number; menores: number }>;
  ultimosEscaneos: Array<{
    scannedAt: string;
    hora: string;
    resultado: string;
    adultosUsados: number;
    menoresUsados: number;
  }>;
};

export async function getClubMe(): Promise<ClubMe> {
  const res = await authFetch(`${API_BASE}/club/me`);
  if (!res.ok) throw new Error('Error obteniendo estado del club');
  return res.json();
}

export async function getMisRecursos(): Promise<RecursoTuristico[]> {
  const res = await authFetch(`${API_BASE}/club/mis-recursos`);
  if (!res.ok) throw new Error('Error cargando recursos');
  return res.json();
}

export async function getMetricasRecurso(
  recursoId: number,
  days: number = 7,
): Promise<MetricasRecurso> {
  const res = await authFetch(
    `${API_BASE}/club/validador/metricas?recursoId=${recursoId}&days=${days}`,
  );
  if (!res.ok) throw new Error('Error cargando métricas');
  return res.json();
}

export async function toggleCerradoTemporal(
  recursoId: number,
  cerradoTemporal: boolean,
): Promise<{ id: number; cerradoTemporal: boolean }> {
  const res = await authFetch(`${API_BASE}/club/recursos/${recursoId}/cerrado-temporal`, {
    method: 'PATCH',
    body: JSON.stringify({ cerradoTemporal }),
  });
  if (!res.ok) throw new Error('Error actualizando estado');
  return res.json();
}

export async function getColaboradoresRecurso(
  recursoId: number,
): Promise<ColaboradorAsignado[]> {
  const res = await authFetch(`${API_BASE}/club/recursos/${recursoId}/colaboradores`);
  if (!res.ok) throw new Error('Error cargando colaboradores');
  return res.json();
}

export async function asignarColaborador(
  recursoId: number,
  email: string,
): Promise<{ ok: boolean; message: string }> {
  const res = await authFetch(`${API_BASE}/club/recursos/${recursoId}/colaboradores`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error asignando colaborador');
  }
  return res.json();
}

export async function revocarColaborador(
  recursoId: number,
  userId: number,
): Promise<{ ok: boolean }> {
  const res = await authFetch(
    `${API_BASE}/club/recursos/${recursoId}/colaboradores/${userId}`,
    { method: 'DELETE' },
  );
  if (!res.ok) throw new Error('Error revocando acceso');
  return res.json();
}

export function getExportCsvUrl(recursoId: number, days: number = 30): string {
  const token = getAuthToken();
  return `${API_BASE}/club/recursos/${recursoId}/validaciones/export?days=${days}&token=${token}`;
}

export async function scanValidador(
  qrToken: string,
  recursoId: number,
  adultosUsados: number = 2,
  menoresUsados: number = 0,
) {
  const res = await authFetch(`${API_BASE}/club/validador/scan`, {
    method: 'POST',
    body: JSON.stringify({ qrToken, recursoId, adultosUsados, menoresUsados }),
  });
  if (!res.ok && res.status !== 201) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error validando QR');
  }
  return res.json();
}
