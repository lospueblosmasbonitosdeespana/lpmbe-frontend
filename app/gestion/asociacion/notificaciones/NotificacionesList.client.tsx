'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EliminarNotificacionButton from '@/app/components/EliminarNotificacionButton';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconClipboard } from '../_components/asociacion-hero-icons';

type Notificacion = {
  id: number;
  tipo: string;
  titulo: string;
  contenido?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  coverUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  pueblo?: { slug: string } | null;
};

function getEditHref(n: Notificacion): string | null {
  switch (String(n.tipo)) {
    case 'NOTICIA':
      return `/gestion/asociacion/noticias/${n.id}/editar`;
    case 'EVENTO':
      return `/gestion/asociacion/eventos/${n.id}/editar`;
    case 'ALERTA':
      return `/gestion/asociacion/alertas/${n.id}/editar`;
    case 'SEMAFORO':
      return n.pueblo?.slug ? `/gestion/pueblos/${n.pueblo.slug}/semaforo` : null;
    default:
      return null;
  }
}

function getTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    NOTICIA: 'Noticia',
    EVENTO: 'Evento',
    ALERTA: 'Alerta',
    SEMAFORO: 'Semáforo',
    METEO: 'Meteo',
  };
  return labels[tipo] ?? tipo;
}

function getTipoBadgeClass(tipo: string): string {
  const classes: Record<string, string> = {
    NOTICIA: 'bg-blue-100 text-blue-700',
    EVENTO: 'bg-amber-100 text-amber-700',
    ALERTA: 'bg-red-100 text-red-700',
    SEMAFORO: 'bg-yellow-100 text-yellow-700',
    METEO: 'bg-sky-100 text-sky-700',
  };
  return classes[tipo] ?? 'bg-muted text-gray-700';
}

export default function NotificacionesList() {
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>('');

  const fetchNotificaciones = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroTipo) params.set('tipo', filtroTipo);
      params.set('limit', '200');

      const res = await fetch(
        `/api/gestion/asociacion/notificaciones/global?${params.toString()}`,
        { credentials: 'include', cache: 'no-store' }
      );

      const text = await res.text();
      if (!res.ok) {
        setErr(text || `HTTP ${res.status}`);
        setItems([]);
        return;
      }

      const data = text ? JSON.parse(text) : {};
      const arr = Array.isArray(data) ? data : data.items ?? data.data ?? [];
      setItems(arr);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchNotificaciones();
  }, [filtroTipo]);

  const shellBase = {
    title: 'Notificaciones',
    subtitle: 'Noticias, eventos y alertas en un solo listado · Asociación LPMBE',
    heroIcon: <AsociacionHeroIconClipboard />,
    maxWidthClass: 'max-w-5xl' as const,
    heroAction: (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          href="/gestion/asociacion/contenidos"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]"
        >
          + Nuevo contenido
        </Link>
        <Link
          href="/gestion/asociacion/alertas/nueva"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]"
        >
          + Nueva alerta
        </Link>
      </div>
    ),
  };

  if (loading) {
    return (
      <GestionAsociacionSubpageShell {...shellBase}>
        <p className="text-muted-foreground">Cargando notificaciones…</p>
      </GestionAsociacionSubpageShell>
    );
  }

  if (err) {
    return (
      <GestionAsociacionSubpageShell {...shellBase}>
        <p className="text-red-600">Error: {err}</p>
      </GestionAsociacionSubpageShell>
    );
  }

  return (
    <GestionAsociacionSubpageShell
      {...shellBase}
      heroBadges={
        <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
          <span className="text-lg font-bold">{items.length}</span>
          <span className="ml-1.5 text-xs text-white/70">
            {items.length === 1 ? 'entrada' : 'entradas'}
          </span>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-tipo" className="text-sm font-medium">
            Filtrar por tipo:
          </label>
          <select
            id="filtro-tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="NOTICIA">Noticias</option>
            <option value="EVENTO">Eventos</option>
            <option value="ALERTA">Alertas</option>
            <option value="SEMAFORO">Semáforos</option>
            <option value="METEO">Meteo</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-8 text-center text-muted-foreground">
          No hay notificaciones globales.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const editHref = getEditHref(n);
            return (
              <li
                key={n.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTipoBadgeClass(
                        n.tipo
                      )}`}
                    >
                      {getTipoLabel(n.tipo)}
                    </span>
                    <h3 className="font-semibold">{n.titulo ?? '(sin título)'}</h3>
                  </div>
                  {(n.fechaInicio || n.createdAt) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {n.fechaInicio
                        ? new Date(n.fechaInicio).toLocaleDateString('es-ES', {
                            dateStyle: 'medium',
                          })
                        : n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString('es-ES', {
                              dateStyle: 'medium',
                            })
                          : null}
                    </div>
                  )}
                  {n.contenido && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {String(n.contenido).slice(0, 180)}
                      {String(n.contenido).length > 180 ? '…' : ''}
                    </p>
                  )}
                  {n.coverUrl && n.coverUrl.trim() && (
                    <div className="mt-2">
                      <img
                        src={n.coverUrl.trim()}
                        alt={n.titulo ?? 'Portada'}
                        className="h-16 w-auto rounded object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {editHref ? (
                    <Link
                      href={editHref}
                      className="rounded border border-input bg-background px-3 py-1.5 text-sm hover:bg-muted"
                    >
                      Editar
                    </Link>
                  ) : (
                    <span className="rounded border border-transparent px-3 py-1.5 text-sm text-muted-foreground">
                      (sin edición)
                    </span>
                  )}
                  <EliminarNotificacionButton
                    id={n.id}
                    confirmText={`¿Eliminar esta ${getTipoLabel(n.tipo).toLowerCase()}? No se puede deshacer.`}
                    onDeleted={() => {
                      setItems((prev) => prev.filter((x) => x.id !== n.id));
                    }}
                    className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </GestionAsociacionSubpageShell>
  );
}
