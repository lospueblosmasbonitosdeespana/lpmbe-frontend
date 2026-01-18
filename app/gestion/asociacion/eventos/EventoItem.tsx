'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type EventoItemProps = {
  evento: any;
};

export default function EventoItem({ evento }: EventoItemProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('¿Borrar este evento?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/gestion/asociacion/notificaciones/${evento.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message ?? 'Error al borrar');
        return;
      }

      router.refresh();
    } catch (e: any) {
      alert(e?.message ?? 'Error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium">{evento.titulo ?? '(sin título)'}</div>
          <div className="mt-1 text-xs text-gray-500">
            {evento.fecha_inicio ?? evento.fecha ?? evento.createdAt ?? ''}
            {evento.fecha_fin && evento.fecha_fin !== evento.fecha_inicio
              ? ` → ${evento.fecha_fin}`
              : ''}
          </div>
          {evento.contenido ? (
            <div className="mt-2 text-sm text-gray-700">
              {String(evento.contenido).slice(0, 220)}
              {String(evento.contenido).length > 220 ? '…' : ''}
            </div>
          ) : null}
          {evento.coverUrl && (
            <div className="mt-2">
              <img
                src={evento.coverUrl}
                alt={evento.titulo ?? 'Portada'}
                className="h-24 w-auto rounded object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={`/gestion/asociacion/eventos/${evento.id}/editar`}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Editar
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? 'Borrando…' : 'Borrar'}
          </button>
        </div>
      </div>
    </li>
  );
}
