'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';

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
  tipo?: string;
};

function procesarContenidos(contenidos: Contenido[]) {
  const ahora = new Date();

  const eventos = contenidos.filter((c) => c.tipo === 'EVENTO');
  const noticias = contenidos.filter((c) => c.tipo === 'NOTICIA');
  const articulos = contenidos.filter((c) => c.tipo === 'ARTICULO');

  const eventosProximos = eventos
    .filter((e) => {
      if (!e.fechaInicio) return false;
      return new Date(e.fechaInicio) >= ahora;
    })
    .sort((a, b) => {
      if (!a.fechaInicio || !b.fechaInicio) return 0;
      return new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
    });

  const noticiasOrdenadas = [...noticias].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });

  const articulosOrdenados = [...articulos].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });

  return {
    noticias: noticiasOrdenadas,
    eventos: eventosProximos,
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
    <Link
      href={href}
      className="group block rounded-lg border border-gray-200 bg-white overflow-hidden transition hover:border-gray-300 hover:shadow-md"
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
  );
}

export default function ActualidadPuebloClient({
  puebloId,
  puebloNombre,
  puebloSlug,
  tipo,
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

  const { noticias, eventos, articulos } = useMemo(
    () => procesarContenidos(items),
    [items]
  );

  const baseUrl = `/pueblos/${puebloSlug}/actualidad`;

  const verMasNoticias = noticias.length > LIMIT_RESUMEN;
  const verMasEventos = eventos.length > LIMIT_RESUMEN;
  const verMasArticulos = articulos.length > LIMIT_RESUMEN;

  // Vista filtrada por tipo
  if (tipo && ['NOTICIA', 'EVENTO', 'ARTICULO'].includes(tipo)) {
    const list =
      tipo === 'NOTICIA' ? noticias : tipo === 'EVENTO' ? eventos : articulos;
    const tituloSeccion =
      tipo === 'NOTICIA'
        ? 'Noticias'
        : tipo === 'EVENTO'
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
            {tituloSeccion} · {puebloNombre}
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

  // Vista principal: 3 secciones con 3 tarjetas cada una
  const noticiasMostrar = noticias.slice(0, LIMIT_RESUMEN);
  const eventosMostrar = eventos.slice(0, LIMIT_RESUMEN);
  const articulosMostrar = articulos.slice(0, LIMIT_RESUMEN);
  const hayContenido =
    noticiasMostrar.length > 0 ||
    eventosMostrar.length > 0 ||
    articulosMostrar.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">Actualidad · {puebloNombre}</h1>
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
                      href={`${baseUrl}?tipo=NOTICIA`}
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
            <h2 className="text-xl font-semibold mb-4">Próximos eventos</h2>
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
                      href={`${baseUrl}?tipo=EVENTO`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Ver más eventos →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500">No hay eventos próximos.</p>
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
                      href={`${baseUrl}?tipo=ARTICULO`}
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

      <div className="mt-10">
        <Link href={`/pueblos/${puebloSlug}`} className="text-sm hover:underline">
          ← Volver al pueblo
        </Link>
      </div>
    </main>
  );
}
