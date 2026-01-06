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

function formatFecha(fecha?: string | null) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function NotificacionesBandeja() {
  const [items, setItems] = useState<NotificacionItem[]>([]);
  const [pueblos, setPueblos] = useState<PuebloItem[]>([]);

  useEffect(() => {
    // Notificaciones del usuario
    fetch('/api/notificaciones/me')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));

    // Mapa de pueblos (id -> nombre)
    fetch('/api/pueblos')
      .then(r => (r.ok ? r.json() : []))
      .then(data => setPueblos(Array.isArray(data) ? data : []))
      .catch(() => setPueblos([]));
  }, []);

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
        const tipoLabel = (n.tipo ?? n.notificacionTipo ?? n.type ?? 'NOTIFICACION').toString().toUpperCase();
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
    </div>
  );
}
