'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mail, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ReportRow {
  id: number;
  mes: string;
  asunto: string;
  destinatarios: string[];
  enviadoAt: string;
  error: string | null;
  metricas?: any;
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function mesLegible(mes: string): string {
  const [y, m] = mes.split('-');
  try {
    const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, 1));
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return mes;
  }
}

export default function ReportsMensualesPuebloDashboard({
  puebloId,
  puebloNombre,
}: {
  puebloId: number;
  puebloNombre: string;
}) {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/pueblos/${puebloId}/reports-mensuales`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(await res.text());
        setRows((await res.json()) as ReportRow[]);
      } catch (e: any) {
        setError(e?.message || 'Error cargando histórico');
      } finally {
        setLoading(false);
      }
    })();
  }, [puebloId]);

  const ultimo = rows?.[0] ?? null;
  const ultimoOk = useMemo(
    () => rows?.find((r) => !r.error) ?? null,
    [rows],
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: 'linear-gradient(135deg, #854d0e 0%, #b45309 50%, #c2410c 100%)' }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Reports mensuales · {puebloNombre}
            </h1>
            <p className="mt-0.5 text-sm text-white/80">
              Resumen automático que recibes el día 1 de cada mes con las métricas y tu posición en
              los <strong className="font-semibold text-white">10 premios</strong>.
            </p>
          </div>
        </div>
        {ultimoOk && (
          <div className="relative mt-5 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Último enviado
              </span>
              <span className="text-sm font-semibold">{mesLegible(ultimoOk.mes)}</span>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Fecha de envío
              </span>
              <span className="text-sm font-semibold">{formatFecha(ultimoOk.enviadoAt)}</span>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Destinatarios
              </span>
              <span className="text-sm font-semibold">
                {ultimoOk.destinatarios.length} persona{ultimoOk.destinatarios.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900">
        <p className="font-semibold">¿Cómo funciona?</p>
        <p className="mt-1">
          Cada día 1 del mes a las 07:00 (hora peninsular) enviamos un email al equipo del pueblo con:
          visitas físicas al municipio, páginas vistas en web/app, canjes del Club, valoraciones,
          contenidos publicados por el pueblo y la posición actual en los 10 premios anuales. El email
          muestra también el cambio respecto al mes anterior.
        </p>
      </div>

      {loading && (
        <div className="py-10 text-center text-sm text-stone-500">Cargando histórico…</div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {!loading && !error && rows && rows.length === 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
          Aún no hemos enviado ningún report mensual a este pueblo. El primero llegará el día 1 del próximo mes.
        </div>
      )}

      {!loading && !error && rows && rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-stone-800">Histórico</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-2 text-left">Mes</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Enviado</th>
                  <th className="px-4 py-2 text-left">Destinatarios</th>
                  <th className="px-4 py-2 text-right">Abrir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-stone-100 hover:bg-stone-50/60">
                    <td className="px-4 py-2 font-medium capitalize text-stone-900">
                      {mesLegible(r.mes)}
                    </td>
                    <td className="px-4 py-2">
                      {r.error ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-rose-700"
                          title={r.error}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> error
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> enviado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-stone-600">
                      {formatFecha(r.enviadoAt)}
                    </td>
                    <td className="px-4 py-2 text-xs text-stone-600">
                      {r.destinatarios.length > 0 ? (
                        r.destinatarios.join(', ')
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <a
                        href={`/api/admin/pueblos/${puebloId}/reports-mensuales/${r.id}/html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> Abrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-stone-500">
        {ultimo?.destinatarios?.length
          ? `Próximo envío: el día 1 del próximo mes, a ${ultimo.destinatarios.join(', ')}.`
          : `Próximo envío: el día 1 del próximo mes, a los usuarios con acceso al pueblo.`}
      </p>
    </div>
  );
}
