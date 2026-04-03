'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  puebloNombre?: string | null;
  detalles: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, string> = {
  CREAR: 'Crear',
  EDITAR: 'Editar',
  ELIMINAR: 'Eliminar',
};

const ENTITY_LABELS: Record<string, string> = {
  fotos: 'Foto',
  contenidos: 'Contenido',
  notificaciones: 'Notificación',
  noticias: 'Noticia',
  eventos: 'Evento',
  rutas: 'Ruta',
  products: 'Producto',
  orders: 'Pedido',
  coupons: 'Cupón',
  promotions: 'Promoción',
  pages: 'Página',
  pois: 'POI',
  multiexperiencias: 'Multiexperiencia',
  semaforo: 'Semáforo',
  recursos: 'Recurso',
  highlights: 'Destacados',
  media: 'Subida multimedia',
};

export default function DatosPueblosPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEntity, setFiltroEntity] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('limit', '150');
        if (filtroEntity) params.set('entityType', filtroEntity);

        const res = await fetch(`/api/admin/datos/audit-logs?${params.toString()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs ?? []);
          setTotal(data.total ?? 0);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err?.message ?? 'Error cargando registro');
        }
      } catch (e) {
        setError('Error cargando registro de actividad');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filtroEntity]);

  if (loading && logs.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="animate-pulse rounded-lg bg-muted p-8">
          Cargando registro de actividad...
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Pueblos</h1>
        <p className="mt-2 text-muted-foreground">
          Registro de todos los movimientos: quién ha tocado qué y cuándo
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <label className="mr-2 text-sm text-muted-foreground">Tipo:</label>
          <select
            value={filtroEntity}
            onChange={(e) => setFiltroEntity(e.target.value)}
            className="rounded border border-border px-2 py-1 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(ENTITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Acción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Entidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pueblo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Ruta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tamaño
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    {loading ? 'Cargando...' : 'No hay registros aún. Los movimientos de alcaldes y admins se registrarán automáticamente.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-gray-900">{log.userEmail}</span>
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {log.userRol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          log.action === 'ELIMINAR'
                            ? 'bg-red-100 text-red-800'
                            : log.action === 'CREAR'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.entityType ? (
                        <>
                          {ENTITY_LABELS[log.entityType] ?? log.entityType}
                          {log.entityId && (
                            <span className="text-muted-foreground"> #{log.entityId}</span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                      {log.puebloNombre ?? '—'}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-muted-foreground" title={log.path}>
                      {log.path}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.entityType === 'media' && log.detalles && typeof log.detalles === 'object' ? (
                        <span title="Original → Guardado en R2 (optimizado)">
                          {(log.detalles as { originalSizeMB?: string }).originalSizeMB ?? '—'}
                          {' → '}
                          <span className="font-medium text-green-700">
                            {(log.detalles as { optimizedSizeMB?: string }).optimizedSizeMB ?? '—'}
                          </span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Mostrando {logs.length} de {total} registros
      </div>
    </main>
  );
}
