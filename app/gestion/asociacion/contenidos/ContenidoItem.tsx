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
      BORRADOR: 'bg-muted text-gray-700',
      PROGRAMADA: 'bg-yellow-100 text-yellow-700',
      PUBLICADA: 'bg-green-100 text-green-700',
    };
    return colors[estado] ?? 'bg-muted text-gray-700';
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-amber-100/90 bg-white shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-tight text-foreground">
              {contenido.titulo ?? '(sin título)'}
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${estadoBadge(
                contenido.estado
              )} ring-black/5`}
            >
              {contenido.estado}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 ring-1 ring-slate-200/80">
              {contenido.tipo}
            </span>
          </div>

          {(contenido.resumen || contenido.contenidoMd) &&
            (() => {
              const raw = contenido.resumen || contenido.contenidoMd || '';
              const clean = raw
                .replace(/<[^>]*>/g, '')
                .replace(/&nbsp;/g, ' ')
                .replace(/&#x27;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/\s+/g, ' ')
                .trim();
              if (!clean) return null;
              return (
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {clean.slice(0, 150)}
                  {clean.length > 150 ? '…' : ''}
                </p>
              );
            })()}

          {contenido.coverUrl && contenido.coverUrl.trim() && (
            <div className="mt-3">
              <img
                src={contenido.coverUrl.trim()}
                alt={contenido.titulo}
                className="h-20 max-w-xs rounded-xl object-cover ring-1 ring-border shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {contenido.slug && contenido.estado === 'PUBLICADA' && (
            <a
              href={`/c/${contenido.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Ver página
            </a>
          )}
          <a
            href={`/gestion/asociacion/contenidos/${contenido.id}/editar`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 active:scale-[0.98]"
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
            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? 'Borrando…' : 'Borrar'}
          </button>
        </div>
      </div>
    </li>
  );
}
