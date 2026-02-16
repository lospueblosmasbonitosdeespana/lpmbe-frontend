'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

type NotificacionItem = {
  id: number;
  tipo?: string;
  notificacionTipo?: string;
  type?: string;
  contenido?: string | null;
  createdAt?: string | null;
  puebloId?: number | null;
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

  // Cargar notificaciones
  useEffect(() => {
    fetch(`/api/notificaciones/me?limit=${MAX_ITEMS}`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        const allItems = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setTotalItems(allItems.length);
        setItems(allItems);
      })
      .catch(() => {
        setTotalItems(0);
        setItems([]);
      });
  }, []);

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
      <div className="p-6 border rounded-lg text-center text-gray-600">
        <p className="text-lg mb-2">{t('noActiveNotifs')}</p>
        <p className="text-sm">
          {t('configurePrefs')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-sm rounded-full transition ${
              filter === f.key
                ? 'bg-blue-600 text-white font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de notificaciones */}
      <div className="border rounded-lg divide-y">
        {itemsFiltrados.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            {t('noNotifsOfType')} "{FILTERS.find(f => f.key === filter)?.label ?? filter}".
          </div>
        ) : (
          itemsFiltrados.map(n => {
            const rawTipo = (n.tipo ?? n.notificacionTipo ?? n.type ?? 'NOTIFICACION').toString().toUpperCase();
            const tipoLabel = rawTipo === 'ALERTA_PUEBLO' ? 'ALERTA' : rawTipo;
            const puebloNombre =
              typeof n.puebloId === 'number'
                ? (puebloNombreById.get(n.puebloId) ?? `#${n.puebloId}`)
                : null;

            // Color del badge según tipo
            const badgeColor =
              tipoLabel === 'ALERTA' ? 'bg-red-100 text-red-700' :
              tipoLabel === 'SEMAFORO' ? 'bg-yellow-100 text-yellow-700' :
              tipoLabel === 'METEO' ? 'bg-blue-100 text-blue-700' :
              tipoLabel === 'EVENTO' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700';

            return (
              <div key={n.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${badgeColor}`}>
                        {tipoLabel}
                      </span>
                      {puebloNombre && (
                        <span className="text-sm text-gray-600">
                          📍 {puebloNombre}
                        </span>
                      )}
                    </div>

                    {n.contenido && (
                      <p className="text-sm text-gray-800 whitespace-pre-line">{n.contenido}</p>
                    )}
                  </div>

                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatFecha(n.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contador */}
      {totalItems === MAX_ITEMS && (
        <p className="text-sm text-gray-600 text-center">
          {t('showingLatest')} {MAX_ITEMS} {t('notifications')}.
        </p>
      )}
      {totalItems < MAX_ITEMS && totalItems > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {totalItems} {totalItems === 1 ? t('notification') : t('notifications')}
        </p>
      )}
    </div>
  );
}
