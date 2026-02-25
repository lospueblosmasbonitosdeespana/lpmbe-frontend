'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

type NotificacionItem = {
  id: number;
  tipo?: string;
  notificacionTipo?: string;
  type?: string;
  titulo?: string | null;
  contenido?: string | null;
  slug?: string | null;
  contenidoSlug?: string | null;
  enlace?: string | null;
  puebloId?: number | null;
  pueblo?: { id: number; nombre?: string; slug?: string } | null;
  createdAt?: string | null;
};

type PuebloItem = {
  id: number;
  nombre: string;
};

type FilterType = 'TODAS' | 'NOTICIA' | 'EVENTO' | 'ALERTA' | 'SEMAFORO' | 'METEO';

const MAX_ITEMS = 150;

function formatFecha(fecha?: string | null) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BandejaNotificaciones() {
  const locale = useLocale();
  const t = useTranslations('notifications');
  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [pueblos, setPueblos] = useState<PuebloItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState<FilterType>('TODAS');

  const FILTERS: Array<{ key: FilterType; label: string }> = [
    { key: 'TODAS', label: t('all') },
    { key: 'NOTICIA', label: t('news') },
    { key: 'EVENTO', label: t('events') },
    { key: 'ALERTA', label: t('alerts') },
    { key: 'SEMAFORO', label: t('semaforos') },
    { key: 'METEO', label: t('meteo') },
  ];

  // Cargar pueblos una sola vez
  useEffect(() => {
    fetch('/api/pueblos')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setPueblos(Array.isArray(data) ? data : []))
      .catch(() => setPueblos([]));
  }, []);

  // Cargar notificaciones (lang para semáforos traducidos; METEO se deja en español)
  useEffect(() => {
    fetch(`/api/notificaciones/me?limit=${MAX_ITEMS}&lang=${encodeURIComponent(locale)}`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        const allItems: Array<{ id: number }> = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setTotalItems(allItems.length);
        setItems(allItems as NotificacionItem[]);
        // Marcar como leídas guardando el ID más reciente
        if (allItems.length > 0) {
          try {
            localStorage.setItem('lpbe_notif_last_read_id', String(allItems[0].id));
          } catch {}
        }
      })
      .catch(() => {
        setTotalItems(0);
        setItems([]);
      });
  }, [locale]);

  const puebloNombreById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of pueblos) m.set(p.id, p.nombre);
    return m;
  }, [pueblos]);

  const itemsFiltrados = useMemo(() => {
    if (filter === 'TODAS') return items;
    
    return items.filter(n => {
      const rawTipo = (n.tipo ?? n.notificacionTipo ?? n.type ?? '').toString().toUpperCase();
      const tipoNormalizado = rawTipo === 'ALERTA_PUEBLO' ? 'ALERTA' : rawTipo;
      return tipoNormalizado === filter;
    });
  }, [items, filter]);

  if (!items.length) {
    return (
      <div className="p-6 border border-border rounded-lg text-center text-muted-foreground">
        <p className="text-lg mb-2 text-foreground">{t('noActiveNotifs')}</p>
        <p className="text-sm">
          {t('configurePrefs')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-foreground">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-full transition ${
              filter === f.key
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de notificaciones */}
      <div className="border border-border rounded-lg divide-y divide-border">
        {itemsFiltrados.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            {t('noNotifsOfType')} "{FILTERS.find(f => f.key === filter)?.label ?? filter}".
          </div>
        ) : (
          itemsFiltrados.map(n => {
            const rawTipo = (n.tipo ?? n.notificacionTipo ?? n.type ?? 'NOTIFICACION').toString().toUpperCase();
            const tipoLabel = rawTipo === 'ALERTA_PUEBLO' ? 'ALERTA' : rawTipo;
            const puebloNombre =
              typeof n.puebloId === 'number'
                ? (n.pueblo?.nombre ?? puebloNombreById.get(n.puebloId) ?? `#${n.puebloId}`)
                : null;

            const badgeColor =
              tipoLabel === 'ALERTA' ? 'bg-red-500/20 text-red-400' :
              tipoLabel === 'SEMAFORO' ? 'bg-yellow-500/20 text-yellow-400' :
              tipoLabel === 'METEO' ? 'bg-blue-500/20 text-blue-400' :
              tipoLabel === 'EVENTO' ? 'bg-green-500/20 text-green-400' :
              'bg-muted text-foreground';

            let href: string | null = null;
            if (n.enlace) {
              href = n.enlace;
            } else if (n.contenidoSlug) {
              href = `/c/${n.contenidoSlug}`;
            } else if (n.slug && (rawTipo === 'NOTICIA' || rawTipo === 'EVENTO')) {
              href = `/${rawTipo === 'NOTICIA' ? 'noticias' : 'eventos'}/${n.slug}`;
            } else if (rawTipo === 'SEMAFORO' && n.pueblo?.slug) {
              href = `/pueblos/${n.pueblo.slug}`;
            }

            const inner = (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColor}`}>
                      {tipoLabel}
                    </span>
                    {puebloNombre && (
                      <span className="text-sm text-muted-foreground">
                        📍 {puebloNombre}
                      </span>
                    )}
                  </div>

                  {n.titulo && (
                    <p className="text-sm font-semibold text-foreground mb-1">{n.titulo}</p>
                  )}

                  {n.contenido && (
                    <p className="text-sm text-foreground whitespace-pre-line">{n.contenido}</p>
                  )}

                  {href && (
                    <span className="text-xs text-primary mt-1 inline-block">Ver detalle →</span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatFecha(n.createdAt)}
                </div>
              </div>
            );

            return href ? (
              <Link key={n.id} href={href} className="block p-4 hover:bg-muted/50 transition text-foreground">
                {inner}
              </Link>
            ) : (
              <div key={n.id} className="p-4 hover:bg-muted/50 transition">
                {inner}
              </div>
            );
          })
        )}
      </div>

      {/* Contador */}
      {totalItems === MAX_ITEMS && (
        <p className="text-sm text-muted-foreground text-center">
          {t('showingLatest')} {MAX_ITEMS} {t('notifications')}.
        </p>
      )}
      {totalItems < MAX_ITEMS && totalItems > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {totalItems} {totalItems === 1 ? t('notification') : t('notifications')}
        </p>
      )}
    </div>
  );
}
