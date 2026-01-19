'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ContenidoItemPuebloProps = {
  contenido: any;
};

const CATEGORIA_TO_SLUG: Record<string, string> = {
  GASTRONOMIA: 'gastronomia',
  NATURALEZA: 'naturaleza',
  CULTURA: 'cultura',
  EN_FAMILIA: 'en-familia',
  PETFRIENDLY: 'petfriendly',
};

export default function ContenidoItemPueblo({ contenido }: ContenidoItemPuebloProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const isPaginaTematica = contenido.tipo === 'PAGINA_TEMATICA' || String(contenido.id ?? '').startsWith('page-');

  async function handleDelete() {
    if (!confirm('¿Borrar este contenido?')) return;

    setDeleting(true);
    try {
      // FIX: Usar endpoint correcto de PUEBLO
      const res = await fetch(`/api/gestion/pueblo/contenidos/${contenido.id}`, {
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

  // Construir link "Ver página"
  let verPagenaUrl: string | null = null;
  if (contenido.estado === 'PUBLICADA') {
    if (isPaginaTematica && contenido.categoria && contenido.pueblo?.slug) {
      // Página temática: ir a /experiencias/{slug}/pueblos/{puebloSlug}
      const slugTematica = CATEGORIA_TO_SLUG[contenido.categoria];
      if (slugTematica) {
        verPagenaUrl = `/experiencias/${slugTematica}/pueblos/${contenido.pueblo.slug}`;
      }
    } else if (contenido.slug) {
      // Contenido legacy: ir a /c/{slug}
      verPagenaUrl = `/c/${contenido.slug}`;
    }
  }

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
            <span className="text-xs text-gray-500 uppercase">
              {isPaginaTematica ? `PÁGINA · ${contenido.categoria}` : contenido.tipo}
            </span>
          </div>

          {contenido.resumen && (
            <div className="mt-2 text-sm text-gray-700">
              {contenido.resumen.slice(0, 150)}
              {contenido.resumen.length > 150 ? '...' : ''}
            </div>
          )}

          {contenido.coverUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contenido.coverUrl}
                alt={contenido.titulo}
                className="h-16 w-auto rounded object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {verPagenaUrl && (
            <a
              href={verPagenaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded border px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
            >
              Ver página
            </a>
          )}
          <a
            href={`/gestion/pueblo/contenidos/${contenido.id}/editar?puebloId=${contenido.pueblo?.id ?? ''}&puebloNombre=${encodeURIComponent(contenido.pueblo?.nombre ?? '')}`}
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
