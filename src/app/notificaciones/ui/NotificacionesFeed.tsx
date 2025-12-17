'use client';

import { useState } from 'react';
import { getNotificaciones } from '@/lib/api/notificaciones';
import { NotificacionFeedItem } from '@/lib/types/notificacion';

export default function NotificacionesFeed({
  initialItems,
  initialCursor,
}: {
  initialItems: NotificacionFeedItem[];
  initialCursor?: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!cursor || loading) return;

    setLoading(true);
    const data = await getNotificaciones(cursor);
    setItems((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setLoading(false);
  }

  return (
    <>
      <ul style={{ marginTop: 24 }}>
        {items.map((n) => (
          <li
            key={n.refId}
            style={{
              marginBottom: 16,
              padding: 12,
              borderBottom: '1px solid #ddd',
            }}
          >
            {/* TIPO */}
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {n.tipo === 'SEMAFORO'
                ? 'Cambio de semáforo'
                : 'Comunicado de la asociación'}
            </div>

            {/* TITULO */}
            <strong>{n.titulo}</strong>

            {/* FECHA */}
            <div style={{ fontSize: 12, color: '#666' }}>
              {new Date(n.fecha).toLocaleString()}
            </div>

            {/* PUEBLO */}
            {n.pueblo && (
              <div style={{ marginTop: 4 }}>
                Pueblo: <strong>{n.pueblo.nombre}</strong>
              </div>
            )}

            {/* SEMÁFORO */}
            {n.semaforo && (
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 18, marginRight: 6 }}>
                  {n.semaforo.estado === 'VERDE' && '🟢'}
                  {n.semaforo.estado === 'AMARILLO' && '🟡'}
                  {n.semaforo.estado === 'ROJO' && '🔴'}
                </span>
                <strong>{n.semaforo.estado}</strong>

                {n.semaforo.mensaje && (
                  <div style={{ fontSize: 13, marginTop: 2 }}>
                    {n.semaforo.mensaje}
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? 'Cargando…' : 'Cargar más'}
        </button>
      )}
    </>
  );
}