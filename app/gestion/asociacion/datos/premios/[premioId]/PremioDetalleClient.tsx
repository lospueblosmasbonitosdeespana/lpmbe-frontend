'use client';

import { useEffect, useMemo, useState } from 'react';

interface Edicion {
  id: number;
  anio: number;
  etiqueta: string;
  inicio: string;
  fin: string;
  cerrada: boolean;
}

interface Entry {
  puebloId: number;
  puebloNombre: string | null;
  puebloSlug: string | null;
  provincia: string | null;
  posicion: number;
  posicionAnterior?: number | null;
  tendencia?: 'up' | 'down' | 'same' | 'new' | null;
  valor: number;
  metadata: Record<string, unknown> | null;
}

function TrendCell({ t, prev }: { t?: Entry['tendencia']; prev?: number | null }) {
  if (!t) return <span className="text-muted-foreground">—</span>;
  if (t === 'up')
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold" title={prev ? `Antes: #${prev}` : undefined}>
        ▲ <span className="text-xs tabular-nums">{prev ? `${prev}→` : ''}</span>
      </span>
    );
  if (t === 'down')
    return (
      <span className="inline-flex items-center gap-1 text-rose-600 font-semibold" title={prev ? `Antes: #${prev}` : undefined}>
        ▼ <span className="text-xs tabular-nums">{prev ? `${prev}→` : ''}</span>
      </span>
    );
  if (t === 'same')
    return <span className="text-muted-foreground">=</span>;
  return <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">NUEVO</span>;
}

interface PremioMeta {
  id: number;
  clave: string;
  titulo: string;
  descripcion: string;
  unidad: string;
  implementado: boolean;
  razonPendiente?: string;
}

interface RankingResponse {
  edicion: Edicion;
  premio: PremioMeta;
  totalPueblos: number;
  participantes: number;
  ranking: Entry[];
}

interface PuebloMin {
  id: number;
  nombre: string;
  slug: string;
}

function formatValor(premioId: number, valor: number): string {
  if (premioId === 1) return valor.toFixed(2) + ' ★';
  if (premioId === 6) return (valor >= 0 ? '+' : '') + valor.toFixed(1) + '%';
  if (premioId === 9) return Math.round(valor) + ' / 100';
  if (premioId === 11) return valor.toFixed(2) + ' vis/rec';
  return Math.round(valor).toLocaleString('es-ES');
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function PremioDetalleClient({
  premioId,
  edicionIdInicial,
}: {
  premioId: number;
  edicionIdInicial?: number;
}) {
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [edicionId, setEdicionId] = useState<number | null>(edicionIdInicial ?? null);
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/premios/ediciones', {
        cache: 'no-store',
      });
      if (res.ok) {
        const list: Edicion[] = await res.json();
        setEdiciones(list);
        if (edicionId == null) {
          const actual = list.find((e) => !e.cerrada) ?? list[0];
          if (actual) setEdicionId(actual.id);
        }
      }
    })();
  }, [edicionId]);

  useEffect(() => {
    if (edicionId == null) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/premios/${edicionId}/${premioId}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((d: RankingResponse) => setData(d))
      .catch((e) => setError(e?.message || 'Error'))
      .finally(() => setLoading(false));
  }, [edicionId, premioId]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['posicion', 'puebloId', 'pueblo', 'provincia', 'valor'],
      ...data.ranking.map((r) => [
        r.posicion,
        r.puebloId,
        r.puebloNombre ?? '',
        r.provincia ?? '',
        r.valor,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row
          .map((v) => {
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `premio-${premioId}-${data.edicion.etiqueta.replace(/[^\w]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border/70 bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Edición
          </label>
          <select
            value={edicionId ?? ''}
            onChange={(e) => setEdicionId(Number(e.target.value))}
            className="min-w-[260px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {ediciones.map((e) => (
              <option key={e.id} value={e.id}>
                {e.etiqueta} {e.cerrada ? '(cerrada)' : '· en curso'}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <div className="flex-1 text-sm text-muted-foreground">
            <div className="text-base font-semibold text-foreground">
              {data.premio.titulo}
            </div>
            <p>{data.premio.descripcion}</p>
            <p className="mt-1 text-xs">
              Unidad: <span className="font-medium">{data.premio.unidad}</span> · Periodo:{' '}
              {formatFecha(data.edicion.inicio)} → {formatFecha(data.edicion.fin)} ·{' '}
              {data.participantes} con datos de {data.totalPueblos} pueblos elegibles
            </p>
          </div>
        )}
        {data && data.ranking.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Exportar CSV
          </button>
        )}
      </div>

      {/* Premio 12: formulario de asignación manual */}
      {premioId === 12 && data && !data.edicion.cerrada && (
        <JuradoForm
          edicionId={data.edicion.id}
          actual={data.ranking[0] ?? null}
          onChange={() => {
            if (edicionId != null) setEdicionId(edicionId);
          }}
        />
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Calculando ranking…
        </div>
      ) : !data ? null : !data.premio.implementado && premioId !== 12 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>Premio pendiente de implementación.</strong>
          <p className="mt-2">
            {data.premio.razonPendiente ??
              'Este premio requiere cambios de modelo o una fórmula consensuada antes de poder calcularse.'}
          </p>
        </div>
      ) : data.ranking.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">
          Aún no hay datos suficientes para este premio en la edición seleccionada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left">#</th>
                <th className="px-3 py-2.5 text-left">Tendencia</th>
                <th className="px-4 py-2.5 text-left">Pueblo</th>
                <th className="px-4 py-2.5 text-left">Provincia</th>
                <th className="px-4 py-2.5 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.ranking.map((r) => (
                <tr
                  key={r.puebloId}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-2.5 tabular-nums">
                    <span
                      className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                        r.posicion === 1
                          ? 'bg-amber-400 text-amber-950'
                          : r.posicion === 2
                            ? 'bg-zinc-300 text-zinc-800'
                            : r.posicion === 3
                              ? 'bg-amber-700/50 text-amber-50'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {r.posicion}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <TrendCell t={r.tendencia} prev={r.posicionAnterior} />
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {r.puebloNombre ?? `#${r.puebloId}`}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {r.provincia ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatValor(premioId, r.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function JuradoForm({
  edicionId,
  actual,
  onChange,
}: {
  edicionId: number;
  actual: Entry | null;
  onChange: () => void;
}) {
  const [pueblos, setPueblos] = useState<PuebloMin[]>([]);
  const [puebloId, setPuebloId] = useState<number | ''>(actual?.puebloId ?? '');
  const [motivo, setMotivo] = useState<string>(() => {
    const meta = actual?.metadata as { motivo?: string } | null;
    return meta?.motivo ?? '';
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pueblos', { cache: 'no-store' })
      .then(async (r) => (r.ok ? r.json() : []))
      .then((d: PuebloMin[]) => setPueblos(Array.isArray(d) ? d : []))
      .catch(() => setPueblos([]));
  }, []);

  const guardar = async () => {
    setMsg(null);
    if (!puebloId || !motivo.trim()) {
      setMsg('Selecciona un pueblo y escribe un motivo (mínimo 10 caracteres).');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/premios/${edicionId}/12`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ puebloId: Number(puebloId), motivo }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('Premio asignado');
      onChange();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'desconocido'));
    } finally {
      setBusy(false);
    }
  };

  const limpiar = async () => {
    if (!confirm('¿Quitar el Premio Especial del Jurado de esta edición?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/premios/${edicionId}/12`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await res.text());
      setPuebloId('');
      setMotivo('');
      setMsg('Premio eliminado');
      onChange();
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'desconocido'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-base font-semibold text-foreground">
        Asignación manual · Premio Especial del Jurado
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Decisión discrecional del jurado por iniciativas singulares.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[260px_1fr_auto_auto]">
        <select
          value={puebloId}
          onChange={(e) =>
            setPuebloId(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">— Selecciona pueblo —</option>
          {pueblos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo del premio (mínimo 10 caracteres)"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={busy}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        {actual && (
          <button
            type="button"
            onClick={limpiar}
            disabled={busy}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            Quitar
          </button>
        )}
      </div>
      {msg && <p className="mt-3 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
