'use client';

import { useEffect, useState, useCallback } from 'react';

type Recurso = {
  id: number;
  puebloId: number;
  nombre: string;
  tipo: string;
  activo: boolean;
  cerradoTemporal: boolean;
  descuentoPorcentaje: number | null;
  pueblo?: { id: number; nombre: string; slug: string };
};

type Metricas = {
  hoy: { total: number; ok: number; noOk: number; adultos: number; menores: number };
  periodo?: { totalIntentos: number; ok: number; noOk: Record<string, number> };
  dias?: Array<{ fecha: string; total: number; ok: number; adultos: number; menores: number }>;
  ultimosDias?: Array<{ fecha: string; total: number; ok: number; adultos: number; menores: number }>;
  ultimosEscaneos?: Array<{
    scannedAt: string;
    hora: string;
    resultado: string;
    adultosUsados: number;
    menoresUsados: number;
  }>;
};

const PERIODOS = [
  { label: '7 días', days: 7 },
  { label: '14 días', days: 14 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
  { label: '365 días', days: 365 },
];

export default function ColaboradorPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [metricasDays, setMetricasDays] = useState(7);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  const loadRecursos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/colaborador/mis-recursos');
      if (!res.ok) throw new Error('Error cargando recursos');
      const data = await res.json();
      setRecursos(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando recursos');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadMetricas = useCallback(async () => {
    if (!selectedId) return;
    try {
      setLoadingMetricas(true);
      const res = await fetch(
        `/api/colaborador/metricas?recursoId=${selectedId}&days=${metricasDays}`,
      );
      if (!res.ok) throw new Error('Error cargando métricas');
      setMetricas(await res.json());
    } catch {
      setMetricas(null);
    } finally {
      setLoadingMetricas(false);
    }
  }, [selectedId, metricasDays]);

  useEffect(() => {
    loadRecursos();
  }, [loadRecursos]);

  useEffect(() => {
    loadMetricas();
  }, [loadMetricas]);

  const handleToggleCerrado = async (r: Recurso) => {
    try {
      const res = await fetch('/api/colaborador/cerrado-temporal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recursoId: r.id, cerradoTemporal: !r.cerradoTemporal }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      setRecursos((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, cerradoTemporal: !x.cerradoTemporal } : x)),
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const recurso = recursos.find((r) => r.id === selectedId);
  const dias = metricas?.dias ?? metricas?.ultimosDias ?? [];

  if (loading) {
    return <p className="py-12 text-center text-muted-foreground">Cargando recursos...</p>;
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Asegúrate de haber iniciado sesión con una cuenta de colaborador.
        </p>
      </div>
    );
  }

  if (recursos.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-lg font-semibold">Sin recursos asignados</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No tienes ningún recurso turístico asignado. Contacta con el alcalde o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Selector de recurso */}
      {recursos.length > 1 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                selectedId === r.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="font-medium">{r.nombre}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {r.pueblo?.nombre ?? `Pueblo ${r.puebloId}`} · {r.tipo}
              </div>
              <div className="mt-2 flex gap-1">
                {!r.activo && (
                  <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    Inactivo
                  </span>
                )}
                {r.cerradoTemporal && (
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                    Cerrado
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Cabecera recurso seleccionado */}
      {recurso && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">{recurso.nombre}</h2>
            <p className="text-sm text-muted-foreground">
              {recurso.pueblo?.nombre} · {recurso.tipo}
              {recurso.descuentoPorcentaje != null && (
                <span className="ml-2 font-medium text-green-600">
                  {recurso.descuentoPorcentaje}% dto.
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleCerrado(recurso)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                recurso.cerradoTemporal
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-border bg-card text-foreground hover:bg-accent'
              }`}
            >
              {recurso.cerradoTemporal ? 'Reabrir recurso' : 'Cerrar temporalmente'}
            </button>
            <a
              href={`/api/colaborador/export-csv?recursoId=${recurso.id}&days=${metricasDays}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Exportar CSV
            </a>
          </div>
        </div>
      )}

      {/* Selector de periodo */}
      <div className="flex flex-wrap gap-2">
        {PERIODOS.map((p) => (
          <button
            key={p.days}
            onClick={() => setMetricasDays(p.days)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              metricasDays === p.days
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Contenido métricas */}
      {loadingMetricas ? (
        <p className="py-8 text-center text-muted-foreground">Cargando métricas...</p>
      ) : metricas ? (
        <div className="space-y-8">
          {/* Cards resumen */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Validaciones hoy" value={metricas.hoy.ok} color="text-green-600" />
            <StatCard label="Rechazados hoy" value={metricas.hoy.noOk} color="text-destructive" />
            <StatCard label="Adultos hoy" value={metricas.hoy.adultos} />
            <StatCard label="Menores hoy" value={metricas.hoy.menores} />
            <StatCard
              label={`Total OK (${metricasDays}d)`}
              value={metricas.periodo?.ok ?? dias.reduce((s, d) => s + d.ok, 0)}
              color="text-primary"
            />
          </div>

          {/* Gráfico de barras */}
          {dias.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-4 font-semibold">Validaciones por día</h3>
              <div className="flex items-end gap-1" style={{ height: 140 }}>
                {dias.map((d) => {
                  const maxVal = Math.max(...dias.map((x) => x.ok), 1);
                  const h = Math.max((d.ok / maxVal) * 100, 3);
                  return (
                    <div key={d.fecha} className="flex flex-1 flex-col items-center">
                      <span className="mb-1 text-xs font-medium text-foreground">
                        {d.ok > 0 ? d.ok : ''}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-primary transition-all"
                        style={{ height: `${h}%`, minHeight: 3, maxWidth: 32 }}
                        title={`${d.fecha}: ${d.ok} OK, ${d.adultos} adultos, ${d.menores} menores`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1 flex gap-1">
                {dias.map((d) => (
                  <div
                    key={d.fecha}
                    className="flex-1 overflow-hidden text-center text-[10px] text-muted-foreground"
                  >
                    {d.fecha.slice(5)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabla de últimos escaneos */}
          {metricas.ultimosEscaneos && metricas.ultimosEscaneos.length > 0 && (
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b bg-muted/30 px-5 py-3">
                <h3 className="font-semibold">Últimas validaciones</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b text-left">
                    <tr>
                      <th className="px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                      <th className="px-5 py-3 font-medium text-muted-foreground">Hora</th>
                      <th className="px-5 py-3 font-medium text-muted-foreground">Resultado</th>
                      <th className="px-5 py-3 text-right font-medium text-muted-foreground">Adultos</th>
                      <th className="px-5 py-3 text-right font-medium text-muted-foreground">Menores</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {metricas.ultimosEscaneos.map((e, i) => (
                      <tr key={i} className="hover:bg-accent/50">
                        <td className="px-5 py-2.5">
                          {e.scannedAt
                            ? new Date(e.scannedAt).toLocaleDateString('es-ES')
                            : '-'}
                        </td>
                        <td className="px-5 py-2.5">{e.hora}</td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                              e.resultado === 'OK'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {e.resultado}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right">{e.adultosUsados}</td>
                        <td className="px-5 py-2.5 text-right">{e.menoresUsados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          No hay datos de métricas disponibles.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
      <div className={`text-3xl font-bold ${color ?? 'text-foreground'}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
