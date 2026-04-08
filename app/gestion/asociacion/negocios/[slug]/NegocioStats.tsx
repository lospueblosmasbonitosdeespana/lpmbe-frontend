'use client';

import { useCallback, useEffect, useState } from 'react';

type StatsData = {
  periodo: { dias: number; desde: string };
  fichaVisitas: number;
  fichaVisitasUnicas: number;
  fichaVisitasPorDia: Array<{ fecha: string; total: number }>;
  contactClicks: number;
  contactByType: Array<{ tipo: string; total: number }>;
};

const CONTACT_LABELS: Record<string, string> = {
  click_phone: 'Teléfono',
  click_email: 'Email',
  click_web: 'Web',
  click_whatsapp: 'WhatsApp',
  click_directions: 'Cómo llegar',
};

export default function NegocioStats({
  negocioId,
  planNegocio = 'FREE',
}: {
  negocioId: number;
  planNegocio?: string;
}) {
  const hasStats = planNegocio !== 'FREE';
  const isAdvanced = planNegocio === 'PREMIUM' || planNegocio === 'SELECTION';
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(30);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    if (!hasStats) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/club/negocios/${negocioId}/stats?days=${days}`);
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [negocioId, days, hasStats]);

  useEffect(() => {
    if (expanded) load();
  }, [expanded, load]);

  if (!hasStats) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          Las estadísticas de visitas y clics están disponibles con el plan Recomendado o superior.
        </p>
        <a
          href="/para-negocios"
          target="_blank"
          className="mt-2 inline-block rounded bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90"
        >
          Mejorar plan
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-muted/20 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Estadísticas {isAdvanced ? 'avanzadas' : 'básicas'}
        </span>
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  days === d
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Cargando...</p>
          ) : stats ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.fichaVisitas}</p>
                  <p className="text-[11px] text-muted-foreground">Visitas a la ficha</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.fichaVisitasUnicas}</p>
                  <p className="text-[11px] text-muted-foreground">Visitantes únicos</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.contactClicks}</p>
                  <p className="text-[11px] text-muted-foreground">Clics en contacto</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {stats.fichaVisitas > 0
                      ? ((stats.contactClicks / stats.fichaVisitas) * 100).toFixed(1)
                      : '0'}%
                  </p>
                  <p className="text-[11px] text-muted-foreground">Tasa de conversión</p>
                </div>
              </div>

              {/* Contact breakdown */}
              {isAdvanced && stats.contactByType.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Detalle de clics por tipo
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {stats.contactByType.map((c) => (
                      <div key={c.tipo} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                        <span className="text-muted-foreground">{CONTACT_LABELS[c.tipo] ?? c.tipo}</span>
                        <span className="font-bold text-foreground">{c.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Daily chart (simple bar) */}
              {isAdvanced && stats.fichaVisitasPorDia.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Visitas por día
                  </h5>
                  <div className="flex items-end gap-[2px] h-24">
                    {(() => {
                      const maxV = Math.max(...stats.fichaVisitasPorDia.map((d) => d.total), 1);
                      return stats.fichaVisitasPorDia.map((d) => (
                        <div
                          key={d.fecha}
                          className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors"
                          style={{ height: `${(d.total / maxV) * 100}%`, minHeight: d.total > 0 ? '2px' : '0px' }}
                          title={`${d.fecha}: ${d.total} visitas`}
                        />
                      ));
                    })()}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{stats.fichaVisitasPorDia[0]?.fecha.slice(5)}</span>
                    <span>{stats.fichaVisitasPorDia[stats.fichaVisitasPorDia.length - 1]?.fecha.slice(5)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No hay datos disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}
