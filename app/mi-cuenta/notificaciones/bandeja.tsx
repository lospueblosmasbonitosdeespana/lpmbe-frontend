'use client';

import { useEffect, useMemo, useState } from 'react';

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

const MAX_ITEMS = 15;

function formatFecha(fecha?: string | null) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function NotificacionesBandeja({ refreshKey = 0 }: { refreshKey?: number }) {
  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [pueblos, setPueblos] = useState<PuebloItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);

  // Cargar pueblos una sola vez
  useEffect(() => {
    fetch('/api/pueblos')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setPueblos(Array.isArray(data) ? data : []))
      .catch(() => setPueblos([]));
  }, []);

  // Cargar notificaciones cuando cambie refreshKey
  useEffect(() => {
    fetch('/api/notificaciones/me')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        const allItems = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
        setTotalItems(allItems.length);
        setItems(allItems.slice(0, MAX_ITEMS));
      })
      .catch(() => {
        setTotalItems(0);
        setItems([]);
      });
  }, [refreshKey]);

  const puebloNombreById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of pueblos) m.set(p.id, p.nombre);
    return m;
  }, [pueblos]);

  if (!items.length) {
    return (
      <div className="p-4 border rounded text-sm text-gray-600">
        No tienes notificaciones activas.
      </div>
    );
  }

  return (
    <div className="p-4 border rounded space-y-4">
      <h2 className="font-medium">Bandeja</h2>

      {items.map(n => {
        const rawTipo = (n.tipo ?? n.notificacionTipo ?? n.type ?? 'NOTIFICACION').toString().toUpperCase();
        const tipoLabel = rawTipo === 'ALERTA_PUEBLO' ? 'ALERTA' : rawTipo;
        const puebloNombre =
          typeof n.puebloId === 'number'
            ? (puebloNombreById.get(n.puebloId) ?? `#${n.puebloId}`)
            : null;

        return (
          <div key={n.id} className="border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold uppercase">{tipoLabel}</div>

                {puebloNombre && (
                  <div className="text-sm text-gray-600">
                    Pueblo: <span className="font-medium text-gray-800">{puebloNombre}</span>
                  </div>
                )}

                {n.contenido && <p className="text-sm mt-1">{n.contenido}</p>}
              </div>

              <div className="text-sm text-gray-500 whitespace-nowrap">
                {formatFecha(n.createdAt)}
              </div>
            </div>
          </div>
        );
      })}

      {totalItems > MAX_ITEMS && (
        <p className="text-sm text-gray-600 mt-3">
          Mostrando las últimas {MAX_ITEMS} notificaciones.
        </p>
      )}
    </div>
  );
}
