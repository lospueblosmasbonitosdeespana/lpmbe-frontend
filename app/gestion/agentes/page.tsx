import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

import { AgentesCenterClient } from './_components/AgentesCenterClient';
import { AgenteAdminView } from './_types';

export const dynamic = 'force-dynamic';

async function fetchAgentes(): Promise<AgenteAdminView[]> {
  const token = await getToken();
  if (!token) return [];
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/agentes`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function GestionAgentesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion');

  const agentes = await fetchAgentes();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">
          Centro de control
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Agentes IA
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Fábrica de agentes basada en Vercel AI Gateway. Cada tarjeta es un
          agente del registry. Activa los implementados, ajusta presupuesto y
          modelo, y revisa lo que generan en la bandeja de pendientes.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link
            href="/gestion/agentes/pendientes"
            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 font-medium text-amber-800 hover:bg-amber-100"
          >
            Bandeja de pendientes
          </Link>
          <Link
            href="/gestion/agentes/historial"
            className="rounded-full border border-slate-300 bg-slate-50 px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-100"
          >
            Histórico
          </Link>
          <Link
            href="/gestion/agentes/costes"
            className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Costes
          </Link>
        </nav>
      </header>

      <AgentesCenterClient initial={agentes} />

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
