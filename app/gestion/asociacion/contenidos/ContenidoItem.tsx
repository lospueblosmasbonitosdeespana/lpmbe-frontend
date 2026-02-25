'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ContenidoItemProps = {
  contenido: any;
};

export default function ContenidoItem({ contenido }: ContenidoItemProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('¿Borrar este contenido?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/gestion/asociacion/contenidos/${contenido.id}`, {
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

  const estadoBadge = (estado: string) => {
    const colors: Record<string, string> = {
      BORRADOR: 'bg-gray-100 text-gray-700',
      PROGRAMADA: 'bg-yellow-100 text-yellow-700',
      PUBLICADA: 'bg-green-100 text-green-700',
    };
    return colors[estado] ?? 'bg-gray-100 text-gray-700';
  };

  return (
    <li className="rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-medium">{contenido.titulo ?? '(sin título)'}</div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadge(
                contenido.estado
              )}`}
            >
              {contenido.estado}
            </span>
            <span className="text-xs text-gray-500 uppercase">{contenido.tipo}</span>
          </div>

          {(contenido.resumen || contenido.contenidoMd) && (() => {
            const raw = contenido.resumen || contenido.contenidoMd || '';
            const clean = raw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
            if (!clean) return null;
            return (
              <div className="mt-2 text-sm text-gray-700">
                {clean.slice(0, 150)}{clean.length > 150 ? '…' : ''}
              </div>
            );
          })()}

          {contenido.coverUrl && contenido.coverUrl.trim() && (
            <div className="mt-2">
              <img
                src={contenido.coverUrl.trim()}
                alt={contenido.titulo}
                className="h-16 w-auto rounded object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {contenido.slug && contenido.estado === 'PUBLICADA' && (
            <a
              href={`/c/${contenido.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded border px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
            >
              Ver página
            </a>
          )}
          <a
            href={`/gestion/asociacion/contenidos/${contenido.id}/editar`}
            onClick={(e) => e.stopPropagation()}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Editar
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
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
