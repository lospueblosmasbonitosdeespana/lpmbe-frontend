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

type AdminActionBucket = {
  adminId: number;
  adminEmail: string;
  adminNombre: string | null;
  userId: number;
  userEmail: string;
  userNombre: string | null;
  total: number;
  ultimaFecha: string;
  pueblos: { id: number; nombre: string; slug: string; fecha: string }[];
};

type AdminActionsResponse = {
  days: number;
  desde: string;
  totalVisitas: number;
  totalAdmins: number;
  totalUsuariosAfectados: number;
  grouped: AdminActionBucket[];
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
  RAPID_FIRE: 'Ráfaga: ≥2 visitas GPS en menos de 30 s',
  TELEPORT: 'Salto físico imposible (>200 km en <30 min)',
  WRONG_LOCATION: 'Lejos del pueblo (>3 km de las coordenadas reales)',
};

function flagReasonLabel(reason: string | null): string {
  if (!reason) return 'Sospechosa';
  // Las visitas pueden tener varias razones combinadas con `|`.
  return reason
    .split('|')
    .map((r) => FLAG_REASON_LABELS[r] ?? r)
    .join(' · ');
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
  const [adminActions, setAdminActions] = useState<AdminActionsResponse | null>(null);
  const [adminActionsDays, setAdminActionsDays] = useState(7);
  const [adminActionsExpanded, setAdminActionsExpanded] = useState(false);

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

  const fetchAdminActions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/datos/visitas/admin-actions?days=${adminActionsDays}`,
        { cache: 'no-store' },
      );
      if (!res.ok) return;
      const json = (await res.json()) as AdminActionsResponse;
      setAdminActions(json);
    } catch {
      // Silenciamos: el banner es informativo.
    }
  }, [adminActionsDays]);

  useEffect(() => {
    fetchAdminActions();
  }, [fetchAdminActions]);

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

  // Anular en bloque todas las visitas SOSPECHOSAS visibles del mismo usuario.
  // Útil cuando un usuario ha generado decenas de visitas fraudulentas en
  // ráfaga (caso típico: cliente itera todos los pueblos por curl).
  const deleteAllForUser = useCallback(
    async (userId: number, userEmail: string) => {
      const items = (data?.items ?? []).filter(
        (i) => i.userId === userId && i.flagged,
      );
      if (items.length === 0) return;
      const ok = window.confirm(
        `¿ANULAR las ${items.length} visitas sospechosas de ${userEmail} mostradas en pantalla?\n\n` +
          `Esta acción ELIMINA esas visitas y RETIRA los puntos asociados. ` +
          `No se puede deshacer.\n\n` +
          `(Si tiene más sospechosas en otras páginas, repite la acción tras buscar al usuario.)`,
      );
      if (!ok) return;
      let okCount = 0;
      let failCount = 0;
      for (const it of items) {
        try {
          const res = await fetch(`/api/admin/datos/visitas/${it.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error(await res.text());
          okCount++;
        } catch {
          failCount++;
        }
      }
      setActionMsg(
        `Anuladas ${okCount}/${items.length} visitas de ${userEmail}.${
          failCount ? ` Fallidas: ${failCount}.` : ''
        }`,
      );
      await fetchData();
    },
    [data, fetchData],
  );

  // Resumen agrupado por usuario de las visitas sospechosas mostradas.
  // Permite ver de un vistazo qué usuarios tienen "muchas a la vez" y
  // anular todo de golpe.
  const grouped = useMemo(() => {
    if (!data) return [];
    const map = new Map<
      number,
      { userId: number; email: string; nombre: string | null; total: number; flagged: number }
    >();
    for (const it of data.items) {
      const e = map.get(it.userId);
      if (e) {
        e.total++;
        if (it.flagged) e.flagged++;
      } else {
        map.set(it.userId, {
          userId: it.userId,
          email: it.userEmail,
          nombre: it.userNombre,
          total: 1,
          flagged: it.flagged ? 1 : 0,
        });
      }
    }
    return [...map.values()]
      .filter((g) => g.flagged > 0)
      .sort((a, b) => b.flagged - a.flagged);
  }, [data]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const fmtDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      {adminActions && adminActions.totalVisitas > 0 && (
        <section
          className={`rounded-xl border-2 p-4 shadow-sm ${
            adminActions.totalVisitas >= 20
              ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
              : 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
          }`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground">
                {adminActions.totalVisitas >= 20 ? '🚨' : '⚠️'} Visitas añadidas manualmente
                por admins ({adminActions.days} {adminActions.days === 1 ? 'día' : 'días'})
              </h2>
              <p className="mt-1 text-sm text-foreground">
                <strong>{adminActions.totalVisitas}</strong> visita
                {adminActions.totalVisitas === 1 ? '' : 's'} añadida
                {adminActions.totalVisitas === 1 ? '' : 's'} por{' '}
                <strong>{adminActions.totalAdmins}</strong> admin
                {adminActions.totalAdmins === 1 ? '' : 's'} a{' '}
                <strong>{adminActions.totalUsuariosAfectados}</strong> usuario
                {adminActions.totalUsuariosAfectados === 1 ? '' : 's'}. Cada acción queda
                registrada con <code>addedByUserId</code> y debe poder justificarse.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={adminActionsDays}
                onChange={(e) => setAdminActionsDays(parseInt(e.target.value, 10))}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
              >
                <option value={1}>Hoy</option>
                <option value={7}>7 días</option>
                <option value={30}>30 días</option>
                <option value={90}>90 días</option>
                <option value={365}>1 año</option>
              </select>
              <button
                onClick={() => setAdminActionsExpanded((v) => !v)}
                className="rounded border border-border bg-background px-3 py-1 text-xs font-medium hover:bg-muted/50"
              >
                {adminActionsExpanded ? 'Ocultar detalle' : 'Ver detalle'}
              </button>
            </div>
          </div>
          {adminActionsExpanded && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="px-3 py-2">Admin</th>
                    <th className="px-3 py-2">Usuario destino</th>
                    <th className="px-3 py-2 text-right">Visitas</th>
                    <th className="px-3 py-2">Última</th>
                    <th className="px-3 py-2">Pueblos</th>
                  </tr>
                </thead>
                <tbody>
                  {adminActions.grouped.map((b) => (
                    <tr
                      key={`${b.adminId}-${b.userId}`}
                      className={`border-b border-border last:border-0 ${
                        b.total >= 10 ? 'bg-red-100/50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2">
                        <Link
                          href={`/gestion/asociacion/datos/usuarios/${b.adminId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {b.adminNombre || b.adminEmail}
                        </Link>
                        <div className="text-xs text-muted-foreground">{b.adminEmail}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/gestion/asociacion/datos/usuarios/${b.userId}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {b.userNombre || b.userEmail}
                        </Link>
                        <div className="text-xs text-muted-foreground">{b.userEmail}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {b.total >= 10 ? (
                          <span className="text-red-700">{b.total}</span>
                        ) : (
                          b.total
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {fmtDateTime(b.ultimaFecha)}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {b.pueblos
                          .slice(0, 6)
                          .map((p) => p.nombre)
                          .join(', ')}
                        {b.pueblos.length > 6 && ` … +${b.pueblos.length - 6}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

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
          <strong>sospechosas pendientes</strong>. Una visita se marca como sospechosa si:
        </p>
        <ul className="ml-4 list-disc text-xs text-muted-foreground max-w-3xl">
          <li>
            <strong>MOCK_PROVIDER</strong>: la app detectó que el dispositivo tiene activa una app
            de GPS falso.
          </li>
          <li>
            <strong>RAPID_FIRE</strong>: el usuario registró ≥ 2 visitas GPS en menos de 30
            segundos (físicamente imposible viajar entre pueblos en ese tiempo).
          </li>
          <li>
            <strong>TELEPORT</strong>: salto de más de 200 km en menos de 30 minutos respecto a la
            visita GPS anterior.
          </li>
          <li>
            <strong>WRONG_LOCATION</strong>: las coordenadas reportadas por el dispositivo están a
            más de 3 km del centro del pueblo (sólo aplica a la app actual, que envía lat/lng).
          </li>
        </ul>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Las visitas sospechosas <strong>se computan igualmente</strong> y suman puntos: un admin
          debe revisarlas y decidir si <em>aprobar</em> (era un falso positivo) o <em>anular</em>{' '}
          (la visita era falsa). Las visitas anuladas retiran los puntos asociados.
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

      {grouped.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-amber-900">
            Usuarios con visitas sospechosas en esta página
          </h2>
          <p className="mb-3 text-xs text-amber-800">
            Si un mismo usuario tiene muchas visitas marcadas (típicamente por la regla{' '}
            <em>RAPID_FIRE</em>: ráfaga de visitas GPS), puedes anularlas en bloque.
          </p>
          <ul className="divide-y divide-amber-200 rounded border border-amber-200 bg-white">
            {grouped.map((g) => (
              <li
                key={g.userId}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-foreground">
                    {g.nombre || g.email}{' '}
                    <span className="text-xs text-muted-foreground">#{g.userId}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{g.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {g.flagged} sospechosa{g.flagged === 1 ? '' : 's'} en pantalla
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUserId(String(g.userId));
                      setOffset(0);
                    }}
                    className="rounded border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                  >
                    Filtrar
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAllForUser(g.userId, g.email)}
                    className="rounded border border-red-300 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Anular todas
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
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
