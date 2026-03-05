'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type EventoItem = {
  id: number;
  titulo: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  ocultoEnPlanificaFinDeSemana?: boolean;
};

export default function EventosListAdminClient({ slug }: { slug: string }) {
  const [eventos, setEventos] = useState<EventoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/gestion/eventos?puebloSlug=${encodeURIComponent(slug)}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setEventos(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [slug]);

  async function toggleOcultoPlanifica(ev: EventoItem) {
    const next = !ev.ocultoEnPlanificaFinDeSemana;
    setTogglingId(ev.id);
    try {
      const res = await fetch(`/api/gestion/eventos/${ev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ocultoEnPlanificaFinDeSemana: next }),
      });
      if (res.ok) {
        setEventos((prev) => prev.map((e) => e.id === ev.id ? { ...e, ocultoEnPlanificaFinDeSemana: next } : e));
      }
    } finally {
      setTogglingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando eventos…</p>;
  if (eventos.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No hay eventos de pueblo (tabla Evento) para este municipio. Los eventos se crean desde &quot;Nuevo evento&quot; o desde Contenidos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Como administrador puedes ocultar un evento solo en la página &quot;Planifica tu fin de semana&quot;; seguirá visible en actualidad y notificaciones.
      </p>
      <ul className="divide-y rounded-md border">
        {eventos.map((ev) => (
          <li key={ev.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <span className="font-medium">{ev.titulo}</span>
              <span className="ml-2 text-sm text-gray-500">
                {new Date(ev.fecha_inicio).toLocaleDateString('es-ES')}
                {ev.fecha_fin ? ` – ${new Date(ev.fecha_fin).toLocaleDateString('es-ES')}` : ''}
              </span>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!ev.ocultoEnPlanificaFinDeSemana}
                onChange={() => toggleOcultoPlanifica(ev)}
                disabled={togglingId === ev.id}
                className="h-4 w-4 rounded border-gray-300"
              />
              Ocultar en Planifica
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
