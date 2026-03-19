'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { uniqueH1ForLocale } from '@/lib/seo';

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  coverUrl?: string;
  tipo: string;
  publishedAt?: string;
  createdAt?: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

type ActualidadPuebloClientProps = {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
  locale?: string;
  tipo?: string;
  modo?: string;
  h1Label?: string;
  h1Archivo?: string;
};
const NEWS_VISIBLE_DAYS = 30;

function isOlderThanDays(value?: string | null, days = NEWS_VISIBLE_DAYS): boolean {
  if (!value) return false;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return ts < cutoff;
}

function procesarContenidos(contenidos: Contenido[]) {
  const ahora = new Date();

  const eventos = contenidos.filter((c) => c.tipo === 'EVENTO');
  const noticias = contenidos.filter((c) => c.tipo === 'NOTICIA');
  const articulos = contenidos.filter((c) => c.tipo === 'ARTICULO');

  const eventosActivos = eventos
    .filter((e) => {
      const fin = e.fechaFin ?? e.fechaInicio;
      if (!fin) return false;
      return new Date(fin) >= ahora;
    })
    .sort((a, b) => {
      const fa = a.fechaInicio ? new Date(a.fechaInicio) : null;
      const fb = b.fechaInicio ? new Date(b.fechaInicio) : null;
      if (!fa || !fb) return 0;
      const aStarted = fa.getTime() < ahora.getTime();
      const bStarted = fb.getTime() < ahora.getTime();
      if (aStarted && !bStarted) return 1;
      if (!aStarted && bStarted) return -1;
      return fa.getTime() - fb.getTime();
    });

  const noticiasOrdenadas = [...noticias].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });
  const noticiasActivas = noticiasOrdenadas.filter((n) => !isOlderThanDays(n.publishedAt ?? n.createdAt ?? null));
  const noticiasAnteriores = noticiasOrdenadas.filter((n) => isOlderThanDays(n.publishedAt ?? n.createdAt ?? null));

  const eventosAnteriores = eventos
    .filter((e) => {
      const fin = e.fechaFin ?? e.fechaInicio;
      if (!fin) return false;
      return new Date(fin) < ahora;
    })
    .sort((a, b) => {
      const fa = a.fechaInicio ? new Date(a.fechaInicio) : null;
      const fb = b.fechaInicio ? new Date(b.fechaInicio) : null;
      if (!fa || !fb) return 0;
      return fb.getTime() - fa.getTime();
    });

  const articulosOrdenados = [...articulos].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });

  return {
    noticiasActivas,
    noticiasAnteriores,
    eventosActivos,
    eventosAnteriores,
    articulos: articulosOrdenados,
  };
}

const TIPO_LABEL: Record<string, string> = {
  EVENTO: 'Evento',
  NOTICIA: 'Noticia',
  ARTICULO: 'Artículo',
};

const LIMIT_RESUMEN = 3;

function TarjetaContenido({
  item,
  esEvento,
}: {
  item: Contenido;
  esEvento: boolean;
}) {
  const href = `/c/${item.slug}`;
  const fechaPub = item.publishedAt ?? item.createdAt;
  const fechaFormateada = esEvento && item.fechaInicio
    ? formatEventoRangeEs(item.fechaInicio, item.fechaFin ?? undefined)
    : fechaPub
      ? formatDateTimeEs(fechaPub)
      : '';

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden transition hover:border-gray-300 hover:shadow-md">
    <Link
      href={href}
      className="group block"
    >
      {item.coverUrl && item.coverUrl.trim() ? (
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={item.coverUrl.trim()}
            alt={item.titulo}
            className="w-full h-full object-cover transition group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Sin imagen</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase">
            {TIPO_LABEL[item.tipo] ?? item.tipo}
          </span>
          {fechaFormateada && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-500">{fechaFormateada}</span>
            </>
          )}
        </div>
        <h3 className="font-semibold text-lg leading-tight group-hover:underline line-clamp-2">
          {item.titulo}
        </h3>
        {item.resumen && (
          <p className="mt-2 text-gray-600 text-sm line-clamp-2">{item.resumen}</p>
        )}
        <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline">
          Leer más →
        </span>
      </div>
    </Link>
    <div className="absolute top-3 right-3 z-10">
      <ShareButton url={href} title={item.titulo} variant="icon" />
    </div>
    </div>
  );
}

export default function ActualidadPuebloClient({
  puebloId,
  puebloNombre,
  puebloSlug,
  locale,
  tipo,
  modo,
  h1Label,
  h1Archivo,
}: ActualidadPuebloClientProps) {
  const [items, setItems] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/contenidos?puebloId=${puebloId}&limit=50`, {
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Error cargando contenidos');

        const json = await res.json();
        const data = Array.isArray(json) ? json : (json?.items ?? []);

        if (!cancelled) {
          setItems(data);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [puebloId]);

  const { noticiasActivas, noticiasAnteriores, eventosActivos, eventosAnteriores, articulos } = useMemo(
    () => procesarContenidos(items),
    [items]
  );

  const baseUrl = `/pueblos/${puebloSlug}/actualidad`;

  const verMasNoticias = noticiasActivas.length > LIMIT_RESUMEN;
  const verMasEventos = eventosActivos.length > LIMIT_RESUMEN;
  const verMasArticulos = articulos.length > LIMIT_RESUMEN;
  const isArchivoMode = modo === 'ARCHIVO';

  // Vista filtrada por tipo
  const tipoNorm = tipo?.toUpperCase();
  if (tipoNorm && ['NOTICIA', 'EVENTO', 'ARTICULO'].includes(tipoNorm)) {
    const list =
      tipoNorm === 'NOTICIA' ? noticiasActivas : tipoNorm === 'EVENTO' ? eventosActivos : articulos;
    const tituloSeccion =
      tipoNorm === 'NOTICIA'
        ? 'Noticias'
        : tipoNorm === 'EVENTO'
          ? 'Eventos'
          : 'Artículos';

    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <Link
            href={baseUrl}
            className="text-sm text-gray-600 hover:underline mb-4 inline-block"
          >
            ← Volver a Actualidad
          </Link>
          <h1 className="text-4xl font-semibold">
            {uniqueH1ForLocale(`${tituloSeccion} · ${puebloNombre}`, locale)}
          </h1>
          <p className="mt-2 text-gray-600">
            {tituloSeccion.toLowerCase()} de {puebloNombre}
          </p>
        </div>

        {loading ? (
          <div className="text-gray-600">Cargando...</div>
        ) : list.length === 0 ? (
          <div className="rounded-md border p-6 text-gray-600">
            No hay {tituloSeccion.toLowerCase()} disponibles.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((item) => (
              <TarjetaContenido
                key={item.id}
                item={item}
                esEvento={item.tipo === 'EVENTO'}
              />
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link href={`/pueblos/${puebloSlug}`} className="text-sm hover:underline">
            ← Volver al pueblo
          </Link>
        </div>
      </main>
    );
  }

  // Vista archivo: noticias + eventos anteriores
  if (isArchivoMode) {
    const hayArchivo = noticiasAnteriores.length > 0 || eventosAnteriores.length > 0;
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <Link
            href={baseUrl}
            className="text-sm text-gray-600 hover:underline mb-4 inline-block"
          >
            ← Volver a Actualidad
          </Link>
          <h1 className="text-4xl font-semibold">
            {uniqueH1ForLocale(h1Archivo ?? `Archivo · ${puebloNombre}`, locale)}
          </h1>
          <p className="mt-2 text-gray-600">
            Noticias y eventos anteriores de {puebloNombre}
          </p>
        </div>

        {loading ? (
          <div className="text-gray-600">Cargando...</div>
        ) : !hayArchivo ? (
          <div className="rounded-md border p-6 text-gray-600">
            No hay noticias ni eventos anteriores.
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-semibold mb-4">Noticias anteriores</h2>
              {noticiasAnteriores.length === 0 ? (
                <p className="text-gray-500">No hay noticias anteriores.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {noticiasAnteriores.map((item) => (
                    <TarjetaContenido key={`na-${item.id}`} item={item} esEvento={false} />
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold mb-4">Eventos anteriores</h2>
              {eventosAnteriores.length === 0 ? (
                <p className="text-gray-500">No hay eventos anteriores.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventosAnteriores.map((item) => (
                    <TarjetaContenido key={`ea-${item.id}`} item={item} esEvento />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    );
  }

  // Vista principal: 3 secciones con 3 tarjetas cada una
  const noticiasMostrar = noticiasActivas.slice(0, LIMIT_RESUMEN);
  const eventosMostrar = eventosActivos.slice(0, LIMIT_RESUMEN);
  const articulosMostrar = articulos.slice(0, LIMIT_RESUMEN);
  const hayContenido =
    noticiasMostrar.length > 0 ||
    eventosMostrar.length > 0 ||
    articulosMostrar.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">
          {uniqueH1ForLocale(h1Label ?? `Actualidad · ${puebloNombre}`, locale)}
        </h1>
        <p className="mt-2 text-gray-600">
          Noticias, eventos y artículos de {puebloNombre}
        </p>
      </div>

      {loading ? (
        <div className="text-gray-600">Cargando...</div>
      ) : !hayContenido ? (
        <div className="rounded-md border p-6 text-gray-600">
          No hay contenido disponible.
        </div>
      ) : (
        <div className="space-y-12">
          {/* Noticias */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Noticias</h2>
            {noticiasMostrar.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {noticiasMostrar.map((item) => (
                    <TarjetaContenido
                      key={item.id}
                      item={item}
                      esEvento={false}
                    />
                  ))}
                </div>
                {verMasNoticias && (
                  <div className="mt-4">
                    <Link
                      href={`${baseUrl}?tipo=noticia`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Ver noticias anteriores →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">No hay noticias recientes.</p>
            )}
          </section>

          {/* Eventos */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Eventos</h2>
            {eventosMostrar.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventosMostrar.map((item) => (
                    <TarjetaContenido
                      key={item.id}
                      item={item}
                      esEvento
                    />
                  ))}
                </div>
                {verMasEventos && (
                  <div className="mt-4">
                    <Link
                      href={`${baseUrl}?tipo=evento`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Ver más eventos →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">No hay eventos activos.</p>
            )}
          </section>

          {/* Artículos */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Artículos</h2>
            {articulosMostrar.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articulosMostrar.map((item) => (
                    <TarjetaContenido
                      key={item.id}
                      item={item}
                      esEvento={false}
                    />
                  ))}
                </div>
                {verMasArticulos && (
                  <div className="mt-4">
                    <Link
                      href={`${baseUrl}?tipo=articulo`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Ver más artículos →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">No hay artículos.</p>
            )}
          </section>
        </div>
      )}

      {/* Enlace al archivo de noticias y eventos anteriores */}
      {!loading && (
        <div className="mt-12 text-center">
          <Link
            href={`${baseUrl}?modo=ARCHIVO`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Noticias y eventos anteriores
          </Link>
        </div>
      )}

      <div className="mt-10">
        <Link href={`/pueblos/${puebloSlug}`} className="text-sm hover:underline">
          ← Volver al pueblo
        </Link>
      </div>
    </main>
  );
}
