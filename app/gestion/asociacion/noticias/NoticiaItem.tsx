'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type NoticiaItemProps = {
  noticia: any;
};

export default function NoticiaItem({ noticia }: NoticiaItemProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('¿Borrar esta noticia?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/gestion/asociacion/notificaciones/${noticia.id}`, {
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
          <div className="font-medium">{noticia.titulo ?? '(sin título)'}</div>
          <div className="mt-1 text-xs text-gray-500">
            {noticia.fecha ?? noticia.createdAt ?? ''}
          </div>
          {noticia.contenido ? (
            <div className="mt-2 text-sm text-gray-700">
              {String(noticia.contenido).slice(0, 220)}
              {String(noticia.contenido).length > 220 ? '…' : ''}
            </div>
          ) : null}
          {noticia.coverUrl && noticia.coverUrl.trim() && (
            <div className="mt-2">
              <img
                src={noticia.coverUrl.trim()}
                alt={noticia.titulo ?? 'Portada'}
                className="h-24 w-auto rounded object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={`/gestion/asociacion/noticias/${noticia.id}/editar`}
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
