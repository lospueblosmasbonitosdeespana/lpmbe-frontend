'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { stripHtml } from '@/app/_lib/html';

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
  const [rol, setRol] = useState<string | null>(null);
  const [ocultoPlanifica, setOcultoPlanifica] = useState(!!contenido.ocultoEnPlanificaFinDeSemana);
  const [togglingPlanifica, setTogglingPlanifica] = useState(false);
  const isPaginaTematica = contenido.tipo === 'PAGINA_TEMATICA' || String(contenido.id ?? '').startsWith('page-');
  const isEvento = contenido.tipo === 'EVENTO' && !isPaginaTematica;
  const galleryUrls = Array.isArray(contenido.galleryUrls) ? contenido.galleryUrls : [];
  const fotosCombinadas = Array.from(
    new Set(
      [contenido.coverUrl, ...galleryUrls]
        .map((u: string | null | undefined) => (u || '').trim())
        .filter(Boolean)
        .slice(0, 3),
    ),
  );
  const portadaNorm = typeof contenido.coverUrl === 'string' ? contenido.coverUrl.trim() : '';

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => me?.rol && setRol(me.rol))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setOcultoPlanifica(!!contenido.ocultoEnPlanificaFinDeSemana);
  }, [contenido.ocultoEnPlanificaFinDeSemana]);

  async function toggleOcultoPlanifica() {
    if (!isEvento || rol !== 'ADMIN' || togglingPlanifica) return;
    const next = !ocultoPlanifica;
    setTogglingPlanifica(true);
    try {
      const res = await fetch(`/api/gestion/pueblo/contenidos/${contenido.id}/oculto-planifica`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ocultoEnPlanificaFinDeSemana: next }),
      });
      if (res.ok) {
        setOcultoPlanifica(next);
        router.refresh();
      }
    } finally {
      setTogglingPlanifica(false);
    }
  }

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
              {stripHtml(contenido.resumen).slice(0, 150)}
              {stripHtml(contenido.resumen).length > 150 ? '...' : ''}
            </div>
          )}

          {fotosCombinadas.length > 0 && (
            <div className="mt-2">
              <div className="mb-1 text-xs text-gray-600">
                {fotosCombinadas.length} foto{fotosCombinadas.length === 1 ? '' : 's'} subida{fotosCombinadas.length === 1 ? '' : 's'}
              </div>
              <div className="flex flex-wrap gap-2">
                {fotosCombinadas.map((url, idx) => (
                  <div key={`thumb-${contenido.id}-${idx}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${contenido.titulo} foto ${idx + 1}`}
                      className="h-16 w-16 rounded border bg-gray-100 object-contain p-1"
                    />
                    <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {url === portadaNorm ? 'Portada' : `Galería ${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isEvento && rol === 'ADMIN' && (
            <label className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm dark:border-amber-800 dark:bg-amber-950/30">
              <input
                type="checkbox"
                checked={ocultoPlanifica}
                onChange={toggleOcultoPlanifica}
                disabled={togglingPlanifica}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span>Ocultar en Planifica fin de semana</span>
            </label>
          )}
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
