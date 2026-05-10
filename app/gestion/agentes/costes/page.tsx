import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface Row {
  agente: string;
  mes: string;
  eur: number;
  ejecuciones: number;
}

async function fetchCostes(meses = 6): Promise<Row[]> {
  const token = await getToken();
  if (!token) return [];
  const API_BASE = getApiUrl();
  const res = await fetch(
    `${API_BASE}/admin/agentes/costes/resumen?meses=${meses}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function CostesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion');

  const rows = await fetchCostes(6);

  // Agrupar por mes para el resumen.
  const mesesUnicos = Array.from(new Set(rows.map((r) => r.mes))).sort();
  const totalesPorMes = mesesUnicos.map((mes) => {
    const items = rows.filter((r) => r.mes === mes);
    const eur = items.reduce((s, r) => s + (r.eur || 0), 0);
    const ejecs = items.reduce((s, r) => s + (r.ejecuciones || 0), 0);
    return { mes, eur, ejecs };
  });

  // Agrupar por agente para el desglose.
  const agentesUnicos = Array.from(new Set(rows.map((r) => r.agente))).sort();

  const maxEurMes = Math.max(...totalesPorMes.map((t) => t.eur), 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Costes
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Gasto en IA
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estimación calculada a partir de tokens consumidos en cada ejecución
          y la tabla de precios de <code>agentes.pricing.ts</code>. La factura
          oficial vive en el dashboard de Vercel AI Gateway.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Total mensual (últimos {Math.max(mesesUnicos.length, 1)} meses)
        </h2>
        {totalesPorMes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Sin gastos registrados todavía.
          </p>
        ) : (
          <div className="space-y-2">
            {totalesPorMes.map((t) => (
              <div key={t.mes} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-xs text-slate-500">{t.mes}</p>
                  <p className="text-sm font-semibold text-emerald-700">
                    {t.eur.toFixed(2)} €{' '}
                    <span className="text-xs font-normal text-slate-500">
                      ({t.ejecs} ejecuciones)
                    </span>
                  </p>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (t.eur / maxEurMes) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Desglose por agente y mes
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Sin datos.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Agente</th>
                  {mesesUnicos.map((m) => (
                    <th key={m} className="px-3 py-2 text-right font-mono">
                      {m}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {agentesUnicos.map((agente) => {
                  const cellsByMes = mesesUnicos.map((m) => {
                    const cell = rows.find(
                      (r) => r.agente === agente && r.mes === m,
                    );
                    return cell?.eur ?? 0;
                  });
                  const total = cellsByMes.reduce((s, v) => s + v, 0);
                  return (
                    <tr key={agente} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-[11px]">
                        {agente}
                      </td>
                      {cellsByMes.map((v, i) => (
                        <td
                          key={i}
                          className="px-3 py-2 text-right font-mono text-[11px]"
                        >
                          {v ? `${v.toFixed(2)} €` : '—'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-mono text-[11px] font-semibold text-emerald-700">
                        {total.toFixed(2)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
