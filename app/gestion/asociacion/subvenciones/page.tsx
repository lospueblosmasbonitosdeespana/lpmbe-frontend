import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { SubvencionesClient } from './SubvencionesClient';
import type { SubvencionListResponse } from './_types';

export const dynamic = 'force-dynamic';

async function fetchInicial(): Promise<SubvencionListResponse | null> {
  const token = await getToken();
  if (!token) return null;
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/subvenciones?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function GestionSubvencionesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion');

  const data = await fetchInicial();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Sabueso de subvenciones · Asociación
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Subvenciones asociación
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Convocatorias del Estado (todos los ministerios) detectadas en BDNS
          y filtradas por IA según el perfil de la asociación: turismo,
          patrimonio, digitalización rural, reto demográfico, fondos UE
          (MRR/Next Generation) y similares.
        </p>
        <p className="mt-2 max-w-3xl text-xs text-muted-foreground">
          El agente <code className="rounded bg-muted px-1 py-0.5">sabueso-subvenciones</code> rastrea diariamente. Para activar el cron o lanzar una ejecución manual ve a{' '}
          <Link href="/gestion/agentes" className="font-medium text-amber-700 underline-offset-2 hover:underline">
            Agentes IA
          </Link>
          .
        </p>
      </header>

      {data ? (
        <SubvencionesClient initial={data} />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          No se ha podido cargar el listado. Comprueba que estás autenticado
          como ADMIN.
        </div>
      )}

      <div className="mt-12 border-t border-border/60 pt-6 text-sm">
        <Link
          href="/gestion/asociacion"
          className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground hover:underline"
        >
          <span aria-hidden>←</span> Volver a Asociación
        </Link>
      </div>
    </main>
  );
}
