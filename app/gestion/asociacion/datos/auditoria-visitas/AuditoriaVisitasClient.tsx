'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type VisitaSource = 'APP_AUTO' | 'USER_MANUAL' | 'ADMIN_MANUAL' | 'SCRIPT' | 'LEGACY';

type AuditItem = {
  id: number;
  userId: number;
  userEmail: string;
  userNombre: string | null;
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
  provincia: string | null;
  comunidad: string | null;
  origen: 'GPS' | 'MANUAL';
  source: VisitaSource;
  flagged: boolean;
  flagReason: string | null;
  fecha: string;
  addedBy: { userId: number; email: string; nombre: string | null } | null;
};

type AuditResponse = {
  total: number;
  flaggedTotal: number;
  limit: number;
  offset: number;
  items: AuditItem[];
};

const SOURCE_META: Record<
  VisitaSource,
  { label: string; cls: string; tooltip: string }
> = {
  APP_AUTO: {
    label: 'App (auto)',
    cls: 'bg-emerald-100 text-emerald-700',
    tooltip: 'Detectada automáticamente por la app móvil del usuario.',
  },
  USER_MANUAL: {
    label: 'Usuario',
    cls: 'bg-sky-100 text-sky-700',
    tooltip: 'El propio usuario se la marcó desde su lista (web o app).',
  },
  ADMIN_MANUAL: {
    label: 'Admin',
    cls: 'bg-amber-100 text-amber-800',
    tooltip: 'Un administrador la añadió desde el panel de gestión.',
  },
  SCRIPT: {
    label: 'Script',
    cls: 'bg-purple-100 text-purple-700',
    tooltip: 'Visita creada por un script de mantenimiento.',
  },
  LEGACY: {
    label: 'Anterior',
    cls: 'bg-muted text-muted-foreground',
    tooltip: 'Visita anterior a la activación de la auditoría.',
  },
};

const FLAG_REASON_LABELS: Record<string, string> = {
  MOCK_PROVIDER: 'GPS falseado (mock provider)',
};

function flagReasonLabel(reason: string | null): string {
  if (!reason) return 'Sospechosa';
  return FLAG_REASON_LABELS[reason] ?? reason;
}

const PAGE_SIZE = 50;

type FlaggedFilter = '' | 'true' | 'false';
type SourceFilter = '' | VisitaSource;

export default function AuditoriaVisitasClient() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Por defecto mostramos las sospechosas — son las que requieren acción.
  const [source, setSource] = useState<SourceFilter>('');
  const [flagged, setFlagged] = useState<FlaggedFilter>('true');
  const [addedByUserId, setAddedByUserId] = useState('');
  const [userId, setUserId] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [offset, setOffset] = useState(0);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (source) p.set('source', source);
    if (flagged) p.set('flagged', flagged);
    if (addedByUserId.trim()) p.set('addedByUserId', addedByUserId.trim());
    if (userId.trim()) p.set('userId', userId.trim());
    if (desde) p.set('desde', new Date(desde).toISOString());
    if (hasta) p.set('hasta', new Date(hasta).toISOString());
    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String(offset));
    return p.toString();
  }, [source, flagged, addedByUserId, userId, desde, hasta, offset]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/datos/visitas/audit?${queryString}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const text = await res.text().catch(() => 'Error');
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as AuditResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approveVisita = useCallback(
    async (item: AuditItem) => {
      const ok = window.confirm(
        `¿Aprobar la visita de ${item.userEmail} a ${item.puebloNombre}?\n\n` +
          `Se quitará la marca de sospechosa y la visita quedará como una visita normal. ` +
          `Los puntos del usuario no cambian.`,
      );
      if (!ok) return;
      try {
        const res = await fetch(`/api/admin/datos/visitas/${item.id}/approve`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error(await res.text());
        setActionMsg(`Visita ${item.id} aprobada.`);
        await fetchData();
      } catch (e: any) {
        setActionMsg(`Error aprobando: ${e?.message || e}`);
      }
    },
    [fetchData],
  );

  const deleteVisita = useCallback(
    async (item: AuditItem) => {
      const ok = window.confirm(
        `¿ANULAR la visita de ${item.userEmail} a ${item.puebloNombre}?\n\n` +
          `Esta acción ELIMINA la visita y RETIRA los puntos asociados al usuario. ` +
          `No se puede deshacer.`,
      );
      if (!ok) return;
      try {
        const res = await fetch(`/api/admin/datos/visitas/${item.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(await res.text());
        setActionMsg(`Visita ${item.id} anulada y puntos retirados.`);
        await fetchData();
      } catch (e: any) {
        setActionMsg(`Error anulando: ${e?.message || e}`);
      }
    },
    [fetchData],
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Auditoría de visitas</h1>
          <Link
            href="/gestion/asociacion/datos?tab=usuarios"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Volver a Datos
          </Link>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Listado de todas las visitas con la fuente que las creó (app móvil, usuario, admin o
          script) y marca de sospecha. Por defecto se muestran las{' '}
          <strong>sospechosas pendientes</strong>: visitas en las que la app móvil detectó que el
          usuario tenía activa una app de simulación de GPS. Se computan igualmente y suman puntos,
          pero un admin debería revisarlas y decidir si <em>aprobar</em> (era un falso positivo) o{' '}
          <em>anular</em> (la visita era falsa).
        </p>
        {data && (
          <p className="text-xs text-muted-foreground">
            <strong className="text-red-700">{data.flaggedTotal}</strong> visita
            {data.flaggedTotal === 1 ? '' : 's'} sospechosa{data.flaggedTotal === 1 ? '' : 's'} en
            total en el sistema.
          </p>
        )}
      </header>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-7">
          <label className="flex flex-col text-xs font-medium text-muted-foreground">
            Sospechosa
            <select
              value={flagged}
              onChange={(e) => {
                setOffset(0);
                setFlagged(e.target.value as FlaggedFilter);
              }}
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              <option value="">Todas</option>
              <option value="true">Solo sospechosas</option>
              <option value="false">Solo limpias</option>
            </select>
          </label>

          <label className="flex flex-col text-xs font-medium text-muted-foreground">
            Fuente
            <select
              value={source}
              onChange={(e) => {
                setOffset(0);
                setSource(e.target.value as SourceFilter);
              }}
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              <option value="">Todas</option>
              <option value="APP_AUTO">App (auto)</option>
              <option value="USER_MANUAL">Usuario</option>
              <option value="ADMIN_MANUAL">Admin (manual)</option>
              <option value="SCRIPT">Script</option>
              <option value="LEGACY">Anterior</option>
            </select>
          </label>

          <label className="flex flex-col text-xs font-medium text-muted-foreground">
            ID admin que añadió
            <input
              type="number"
              value={addedByUserId}
              onChange={(e) => {
                setOffset(0);
                setAddedByUserId(e.target.value);
              }}
              placeholder="p.ej. 123"
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>

          <label className="flex flex-col text-xs font-medium text-muted-foreground">
            ID usuario afectado
            <input
              type="number"
              value={userId}
              onChange={(e) => {
                setOffset(0);
                setUserId(e.target.value);
              }}
              placeholder="p.ej. 456"
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>

          <label className="flex flex-col text-xs font-medium text-muted-foreground">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setOffset(0);
                setDesde(e.target.value);
              }}
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>

          <label className="flex flex-col text-xs font-medium text-muted-foreground">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setOffset(0);
                setHasta(e.target.value);
              }}
              className="mt-1 rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Buscar
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {actionMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {actionMsg}
        </div>
      )}

      <section className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {loading
              ? 'Cargando…'
              : data
              ? `${data.total} visita${data.total === 1 ? '' : 's'} · página ${currentPage} de ${totalPages}`
              : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((v) => Math.max(0, v - PAGE_SIZE))}
              disabled={offset === 0 || loading}
              className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setOffset((v) => v + PAGE_SIZE)}
              disabled={!data || offset + PAGE_SIZE >= data.total || loading}
              className="rounded border border-border px-3 py-1 text-xs disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Usuario</th>
              <th className="px-4 py-2 font-medium">Pueblo</th>
              <th className="px-4 py-2 font-medium">Origen</th>
              <th className="px-4 py-2 font-medium">Fuente</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Añadido por</th>
              <th className="px-4 py-2 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && data && data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  No hay visitas que cumplan los filtros.
                </td>
              </tr>
            )}
            {data?.items.map((it) => {
              const meta = SOURCE_META[it.source] ?? SOURCE_META.LEGACY;
              return (
                <tr
                  key={it.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/30 ${
                    it.flagged ? 'bg-red-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(it.fecha).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/gestion/asociacion/datos/usuarios/${it.userId}`}
                      className="text-foreground hover:underline"
                    >
                      {it.userNombre || it.userEmail}
                    </Link>
                    <div className="text-[11px] text-muted-foreground">{it.userEmail}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-medium text-foreground">{it.puebloNombre}</span>
                    <div className="text-[11px] text-muted-foreground">
                      {[it.provincia, it.comunidad].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs font-medium uppercase text-muted-foreground">
                    {it.origen}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}
                      title={meta.tooltip}
                    >
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {it.flagged ? (
                      <span
                        className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-800"
                        title={flagReasonLabel(it.flagReason)}
                      >
                        ⚠ Sospechosa
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">OK</span>
                    )}
                    {it.flagged && it.flagReason && (
                      <div className="mt-0.5 text-[10px] text-red-700">
                        {flagReasonLabel(it.flagReason)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {it.addedBy ? (
                      <Link
                        href={`/gestion/asociacion/datos/usuarios/${it.addedBy.userId}`}
                        className="text-foreground hover:underline"
                      >
                        <div>{it.addedBy.nombre || it.addedBy.email}</div>
                        <div className="text-[11px] text-muted-foreground">{it.addedBy.email}</div>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      {it.flagged && (
                        <button
                          onClick={() => approveVisita(it)}
                          className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100"
                          title="Quitar la marca de sospechosa (era un falso positivo)"
                        >
                          Aprobar
                        </button>
                      )}
                      <button
                        onClick={() => deleteVisita(it)}
                        className="rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800 hover:bg-red-100"
                        title="Eliminar la visita y retirar los puntos del usuario"
                      >
                        Anular
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
