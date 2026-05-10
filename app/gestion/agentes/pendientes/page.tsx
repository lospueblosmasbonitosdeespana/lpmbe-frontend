import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { AgenteEjecucion } from '../_types';
import { PendientesClient } from './PendientesClient';

export const dynamic = 'force-dynamic';

async function fetchPendientes(): Promise<AgenteEjecucion[]> {
  const token = await getToken();
  if (!token) return [];
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/agentes/pendientes?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function PendientesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion');

  const pendientes = await fetchPendientes();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Bandeja de pendientes
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Salidas a aprobar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cosas que los agentes han generado y esperan tu visto bueno antes de
          aplicarse (publicar, enviar, modificar BD).
        </p>
      </header>

      <PendientesClient initial={pendientes} />

      <div className="mt-12 border-t border-border/60 pt-6 text-sm">
        <Link
          href="/gestion/agentes"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground hover:underline"
        >
          <span aria-hidden>←</span> Volver al centro de control
        </Link>
      </div>
    </main>
  );
}
