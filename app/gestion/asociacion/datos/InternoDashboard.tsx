'use client';

import { useEffect, useState, useCallback } from 'react';

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
  detalles: Record<string, unknown> | null;
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
  'contenido',
  'ruta',
  'multiexperiencias',
  'pois',
  'recurso_club',
  'media',
  'usuario',
] as const;

const ACTION_COLORS: Record<string, string> = {
  CREAR: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EDITAR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ELIMINAR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  UPLOAD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SUBIR: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const ROL_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EDITOR: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  ALCALDE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COLABORADOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
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
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colorClass}`}>
      {text}
    </span>
  );
}

function summarizeAction(log: AuditLog): string {
  const parts: string[] = [];
  if (log.action) parts.push(log.action);
  if (log.entityType) parts.push(log.entityType);
  if (log.entitySlug) parts.push(`"${log.entitySlug}"`);
  else if (log.entityId) parts.push(`#${log.entityId}`);
  return parts.join(' ') || `${log.method} ${log.path}`;
}

function DetailPopover({ detalles }: { detalles: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(detalles).filter(([, v]) => v != null);
  if (entries.length === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
      >
        Detalles
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-50 max-h-64 w-80 overflow-auto rounded-lg border border-border bg-card p-3 shadow-xl text-xs">
          <button onClick={() => setOpen(false)} className="absolute right-2 top-2 text-muted-foreground hover:text-foreground">&times;</button>
          <pre className="whitespace-pre-wrap text-foreground">
            {JSON.stringify(detalles, null, 2)}
          </pre>
        </div>
      )}
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
      const res = await fetch(`/api/admin/datos/audit-logs?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando logs de auditoría');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, searchUser]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setPage(0);
  }, [entityFilter, searchUser]);

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
        <h2 className="mb-4 text-lg font-semibold text-foreground">Registro de actividad interna</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Todas las acciones realizadas en la web por admins, editores, alcaldes y colaboradores:
          ediciones, subidas de fotos, creación de contenido, etc.
        </p>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <input
            type="text"
            placeholder="Filtrar por ID de usuario…"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {data && (
            <span className="text-sm text-muted-foreground">
              {data.total.toLocaleString('es-ES')} registros
            </span>
          )}
        </div>

        {/* Table */}
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
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Rol</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Acción</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Descripción</th>
                  <th className="px-3 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
                  <th className="px-3 py-3 text-center font-medium text-muted-foreground">Info</th>
                </tr>
              </thead>
              <tbody>
                {!data || data.logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      Sin registros de actividad
                    </td>
                  </tr>
                ) : (
                  data.logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-foreground text-xs">
                        {log.userEmail}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          text={log.userRol}
                          colorClass={ROL_COLORS[log.userRol] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          text={log.action}
                          colorClass={ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-foreground text-xs max-w-xs truncate" title={summarizeAction(log)}>
                        {summarizeAction(log)}
                      </td>
                      <td className="px-3 py-2.5 text-foreground text-xs">
                        {log.puebloNombre ?? '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {log.detalles && Object.keys(log.detalles).length > 0 && (
                          <DetailPopover detalles={log.detalles} />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
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
    </div>
  );
}
