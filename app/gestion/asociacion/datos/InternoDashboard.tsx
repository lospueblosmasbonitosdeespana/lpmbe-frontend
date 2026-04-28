'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

type AuditLog = {
  id: number;
  userId: number;
  userEmail: string;
  userRol: string;
  action: string;
  method: string;
  path: string;
  entityType: string | null;
  entityId: string | null;
  entitySlug: string | null;
  puebloId: number | null;
  puebloNombre: string | null;
  puebloSlug: string | null;
  entityLabel: string | null;
  entityName: string | null;
  resourceUrl: string | null;
  summary: string | null;
  camposCambiados: string[] | null;
  detalles: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
  total: number;
};

const ENTITY_TYPES = [
  '',
  'pueblo',
  'foto',
  'fotos',
  'contenido',
  'contenidos',
  'ruta',
  'rutas',
  'multiexperiencias',
  'pois',
  'recurso_club',
  'recursos-turisticos',
  'media',
  'usuario',
  'usuarios',
  'eventos',
  'noticias',
  'alertas',
  'colecciones',
  'sorteos',
  'campaigns',
  'newsletter',
  'site-settings',
  'navidad',
  'noche-romantica',
  'semana-santa',
] as const;

const ACTION_COLORS: Record<string, string> = {
  CREAR: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  EDITAR: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  ELIMINAR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  UPLOAD: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  SUBIR: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
};

const ROL_COLORS: Record<string, string> = {
  ADMIN: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  EDITOR: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  ALCALDE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  COLABORADOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${colorClass}`}>
      {text}
    </span>
  );
}

/** Devuelve un user-agent legible y compacto. */
function shortUA(ua?: string | null): string {
  if (!ua) return '—';
  const lc = ua.toLowerCase();
  let device = 'Desktop';
  if (/mobile|iphone|ipad|android/.test(lc)) device = 'Móvil';
  let browser = 'navegador';
  if (lc.includes('edg/')) browser = 'Edge';
  else if (lc.includes('chrome/')) browser = 'Chrome';
  else if (lc.includes('firefox/')) browser = 'Firefox';
  else if (lc.includes('safari/')) browser = 'Safari';
  let os = '';
  if (lc.includes('mac os x')) os = 'macOS';
  else if (lc.includes('windows')) os = 'Windows';
  else if (lc.includes('android')) os = 'Android';
  else if (/iphone|ipad|ios/.test(lc)) os = 'iOS';
  else if (lc.includes('linux')) os = 'Linux';
  return [device, browser, os].filter(Boolean).join(' · ');
}

const FRIENDLY_FIELD_LABEL: Record<string, string> = {
  titulo: 'título',
  nombre: 'nombre',
  descripcion: 'descripción',
  slug: 'slug',
  estado: 'estado',
  publicado: 'publicación',
  visible: 'visibilidad',
  activo: 'activo',
  fechaInicio: 'fecha de inicio',
  fechaFin: 'fecha de fin',
  imagen: 'imagen',
  imagenUrl: 'imagen',
  fotoUrl: 'foto',
  url: 'URL',
  precio: 'precio',
  precioMensualCents: 'precio mensual',
  precioAnualCents: 'precio anual',
  lat: 'coordenadas',
  lng: 'coordenadas',
  email: 'email',
  rol: 'rol',
  fotos: 'fotos',
  videos: 'vídeos',
  redes: 'redes sociales',
  semaforo: 'semáforo',
  caracteristicas: 'características',
};

function friendlyField(k: string): string {
  return FRIENDLY_FIELD_LABEL[k] ?? k;
}

/** Renderiza un valor del body con tipografía mono y truncado seguro. */
function ValueRender({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">—</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="font-mono text-xs">{value ? 'sí' : 'no'}</span>;
  }
  if (typeof value === 'number') {
    return <span className="font-mono text-xs">{value}</span>;
  }
  if (typeof value === 'string') {
    return <span className="font-mono text-xs break-all">{value}</span>;
  }
  return (
    <pre className="m-0 max-h-32 overflow-auto rounded bg-muted/40 p-2 font-mono text-[11px] leading-snug">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const detalles = log.detalles ?? null;
  const body = detalles && typeof detalles === 'object' ? (detalles as any).body : null;
  const camposBody: Array<[string, unknown]> = body && typeof body === 'object' ? Object.entries(body) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-6" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-br from-muted/50 to-card p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge text={log.action} colorClass={ACTION_COLORS[log.action] ?? 'bg-muted'} />
              <Badge text={log.userRol} colorClass={ROL_COLORS[log.userRol] ?? 'bg-muted'} />
              {log.entityLabel ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {log.entityLabel}
                </span>
              ) : null}
            </div>
            <h3 className="mt-2 text-lg font-bold leading-snug text-foreground">
              {log.summary || `${log.action} ${log.entityType || ''}`}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(log.createdAt)} · {log.userEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="max-h-[calc(90vh-128px)] overflow-y-auto p-5 space-y-5">
          {/* Resumen ─ tarjetas */}
          <div className="grid gap-3 sm:grid-cols-2">
            {log.entityName && (
              <Field label="Recurso" value={log.entityName} />
            )}
            {log.puebloNombre && (
              <Field label="Pueblo" value={log.puebloNombre} />
            )}
            {log.entityId && (
              <Field label="ID" value={`#${log.entityId}`} mono />
            )}
            {log.entitySlug && (
              <Field label="Slug" value={log.entitySlug} mono />
            )}
          </div>

          {/* Campos cambiados */}
          {camposBody.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Campos enviados ({camposBody.length})
              </h4>
              <ul className="divide-y divide-border rounded-xl border border-border bg-muted/20">
                {camposBody.map(([k, v]) => (
                  <li key={k} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[140px_1fr] sm:gap-3">
                    <div className="text-xs font-semibold capitalize text-foreground">
                      {friendlyField(k)}
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">{k}</span>
                    </div>
                    <div className="min-w-0">
                      <ValueRender value={v} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Petición HTTP */}
          <section>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Petición HTTP
            </h4>
            <div className="rounded-xl border border-border bg-muted/20 p-3 font-mono text-xs">
              <div className="break-all">
                <span className="font-bold text-foreground">{log.method}</span>{' '}
                <span className="text-foreground/80">{log.path}</span>
              </div>
              <div className="mt-1.5 grid grid-cols-1 gap-x-4 text-[11px] text-muted-foreground sm:grid-cols-2">
                <span>IP: {log.ip || '—'}</span>
                <span>Cliente: {shortUA(log.userAgent)}</span>
              </div>
            </div>
          </section>

          {/* JSON crudo */}
          {detalles && (
            <details className="rounded-xl border border-border bg-muted/20">
              <summary className="cursor-pointer px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:bg-muted/40">
                JSON completo (datos crudos)
              </summary>
              <pre className="m-0 max-h-64 overflow-auto p-3 font-mono text-[11px] leading-snug text-foreground">
                {JSON.stringify(detalles, null, 2)}
              </pre>
            </details>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-2">
            {log.resourceUrl && (
              <a
                href={log.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M14 3h7v7M21 3l-9 9M5 5h6M5 12h2M5 19h14" />
                </svg>
                Abrir recurso
              </a>
            )}
            {log.puebloSlug && (
              <a
                href={`/gestion/pueblos/${log.puebloSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Ir a gestión del pueblo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 truncate text-sm text-foreground ${mono ? 'font-mono' : 'font-semibold'}`} title={value}>
        {value}
      </div>
    </div>
  );
}

export default function InternoDashboard() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [entityFilter, setEntityFilter] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (entityFilter) params.set('entityType', entityFilter);
      if (searchUser.trim()) {
        const uid = parseInt(searchUser.trim(), 10);
        if (!isNaN(uid)) params.set('userId', String(uid));
      }
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/admin/datos/audit-logs?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando logs de auditoría');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, searchUser, q]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(0);
  }, [entityFilter, searchUser, q]);

  // Filtro local por acción (no se envía al backend para no añadir un round-trip)
  const filteredLogs = useMemo(() => {
    if (!data) return [];
    if (!actionFilter) return data.logs;
    return data.logs.filter((l) => l.action === actionFilter);
  }, [data, actionFilter]);

  if (error && !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-foreground">Registro de actividad interna</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Auditoría detallada de cada acción de admins, editores, alcaldes y colaboradores.
          Pulsa en cualquier fila para ver qué cambió exactamente.
        </p>

        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos los tipos</option>
            {ENTITY_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todas las acciones</option>
            <option value="CREAR">CREAR</option>
            <option value="EDITAR">EDITAR</option>
            <option value="ELIMINAR">ELIMINAR</option>
            <option value="UPLOAD">UPLOAD</option>
          </select>
          <input
            type="text"
            placeholder="Filtrar por ID de usuario…"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <input
            type="text"
            placeholder="Buscar email, slug, ruta…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {data && (
          <div className="mb-3 text-sm text-muted-foreground">
            <strong className="text-foreground">{data.total.toLocaleString('es-ES')}</strong> registros en total
            {actionFilter && ` · ${filteredLogs.length} con acción ${actionFilter}`}
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {loading && !data ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              Cargando registros…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-3 font-semibold">Fecha</th>
                  <th className="px-3 py-3 font-semibold">Quién</th>
                  <th className="px-3 py-3 font-semibold">Qué hizo</th>
                  <th className="px-3 py-3 font-semibold">Pueblo</th>
                  <th className="px-3 py-3 text-right font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      Sin registros para los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/30 cursor-pointer"
                      onClick={() => setActiveLog(log)}
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-foreground">{log.userEmail}</span>
                          <Badge text={log.userRol} colorClass={ROL_COLORS[log.userRol] ?? 'bg-muted text-muted-foreground'} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <Badge text={log.action} colorClass={ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground'} />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-foreground">
                              {log.entityLabel && log.entityName ? (
                                <>
                                  {log.entityLabel}{' '}
                                  <span className="text-foreground/70">«{log.entityName}»</span>
                                </>
                              ) : log.entityLabel ? (
                                log.entityLabel
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">{log.path}</span>
                              )}
                            </div>
                            {log.camposCambiados && log.camposCambiados.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {log.camposCambiados.slice(0, 4).map((c) => (
                                  <span key={c} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {friendlyField(c)}
                                  </span>
                                ))}
                                {log.camposCambiados.length > 4 && (
                                  <span className="text-[10px] text-muted-foreground">+{log.camposCambiados.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-foreground">
                        {log.puebloNombre ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLog(log);
                          }}
                          className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          Ver
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {data && data.total > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} de{' '}
              {data.total.toLocaleString('es-ES')}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                disabled={(page + 1) * PAGE_SIZE >= data.total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </section>

      {activeLog && <DetailModal log={activeLog} onClose={() => setActiveLog(null)} />}
    </div>
  );
}
