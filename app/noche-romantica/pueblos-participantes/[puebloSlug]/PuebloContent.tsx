import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Clock } from 'lucide-react';
import NRExpandableCard from './NRExpandableCard';

export interface Actividad {
  id: number;
  titulo: string;
  descripcion: string | null;
  horario: string | null;
  fotoUrl: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
}

export interface Negocio {
  id: number;
  tipo: 'HOTEL' | 'RESTAURANTE' | 'COMERCIO' | 'OTRO';
  nombre: string;
  descripcion: string | null;
  horario: string | null;
  menuUrl: string | null;
  fotoUrl: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  email: string | null;
}

export interface NRPuebloDetail {
  id: number;
  cartelUrl: string | null;
  titulo: string | null;
  descripcion: string | null;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  actividades: Actividad[];
  negocios: Negocio[];
}

export interface NRConfig {
  logoUrl?: string;
  fechaEvento?: string;
  titulo?: string;
  activa?: boolean;
}

function formatFechaEuropea(fecha: string): string {
  if (!fecha) return fecha;
  if (fecha.includes('-')) {
    return fecha.split('-').reverse().join('/');
  }
  return fecha;
}

interface Props {
  data: NRPuebloDetail;
  nrConfig: NRConfig;
  /** Año de la edición mostrada (si se pasa, se muestra como badge de archivo si no es activa). */
  anio?: number;
  showArchivedBadge?: boolean;
}

export default async function PuebloContent({ data, nrConfig, anio, showArchivedBadge }: Props) {
  const t = await getTranslations('nocheRomantica');

  const negociosByType = data.negocios.reduce(
    (acc, n) => {
      if (!acc[n.tipo]) acc[n.tipo] = [];
      acc[n.tipo].push(n);
      return acc;
    },
    {} as Record<string, Negocio[]>,
  );

  const NEGOCIO_LABEL: Record<string, { title: string; icon: string }> = {
    HOTEL: { title: t('whereSleep'), icon: '🏨' },
    RESTAURANTE: { title: t('whereEat'), icon: '🍽️' },
    COMERCIO: { title: t('whereShop'), icon: '🛍️' },
    OTRO: { title: t('others'), icon: '📍' },
  };

  const heroImage = data.cartelUrl || data.pueblo.foto_destacada;
  const hasContent = data.actividades.length > 0 || Object.keys(negociosByType).length > 0;

  return (
    <>
      {nrConfig.logoUrl && (
        <div className="flex justify-center py-6 bg-white dark:bg-neutral-900">
          <Link href="/noche-romantica">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nrConfig.logoUrl}
              alt={t('title')}
              className="h-20 md:h-24 w-auto object-contain"
            />
          </Link>
        </div>
      )}

      {heroImage ? (
        <section className="relative w-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={data.pueblo.nombre}
            className="w-full max-h-[60vh] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <p className="text-sm opacity-80">
              {t('title')}
              {anio ? ` ${anio}` : ''}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
              {data.pueblo.nombre}
            </h1>
            <p className="mt-1 text-sm drop-shadow-md opacity-90">
              {data.pueblo.provincia}, {data.pueblo.comunidad}
            </p>
            {showArchivedBadge && (
              <span className="mt-2 inline-block rounded-full border border-amber-300/60 bg-amber-500/30 px-3 py-1 text-xs font-medium">
                Edición {anio} · archivo
              </span>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-rose-50 to-white py-12 text-center">
          <p className="text-sm text-rose-600">
            {t('title')}
            {anio ? ` ${anio}` : ''}
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {data.pueblo.nombre}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {data.pueblo.provincia}, {data.pueblo.comunidad}
          </p>
        </section>
      )}

      <div className="mx-auto max-w-4xl px-4 py-10">
        <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/noche-romantica" className="hover:text-rose-600 hover:underline">
            {t('title')}
          </Link>
          <span>/</span>
          <Link
            href="/noche-romantica/pueblos-participantes"
            className="hover:text-rose-600 hover:underline"
          >
            {t('pueblosParticipantes')}
          </Link>
          <span>/</span>
          {anio ? (
            <>
              <Link
                href={`/noche-romantica/pueblos-participantes/${data.pueblo.slug}`}
                className="hover:text-rose-600 hover:underline"
              >
                {data.pueblo.nombre}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{anio}</span>
            </>
          ) : (
            <span className="text-foreground font-medium">{data.pueblo.nombre}</span>
          )}
        </nav>

        {data.titulo && (
          <h2 className="mb-4 text-2xl font-bold text-gray-800">{data.titulo}</h2>
        )}
        {data.descripcion && (
          <p className="mb-8 text-lg text-gray-600 leading-relaxed whitespace-pre-line">
            {data.descripcion}
          </p>
        )}

        {!hasContent && (
          <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/70 px-8 py-10 text-center shadow-sm">
            {nrConfig?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={nrConfig.logoUrl}
                alt={t('title')}
                className="mx-auto mb-6 h-24 w-auto object-contain"
              />
            ) : (
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl">
                💕
              </div>
            )}
            <h3 className="mb-3 font-serif text-2xl font-bold text-rose-800">
              {t('comingSoonExclaim')}
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              {t('emptyMessagePueblo', { pueblo: data.pueblo.nombre })}
            </p>
            {nrConfig?.fechaEvento && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700">
                <Clock className="h-4 w-4" />
                {formatFechaEuropea(nrConfig.fechaEvento)}
              </div>
            )}
          </div>
        )}

        {data.actividades.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🎭</span> {t('programActivities')}
            </h2>
            <div className="space-y-4">
              {data.actividades.map((a) => (
                <NRExpandableCard key={a.id} direccion={a.direccion} lat={a.lat} lng={a.lng}>
                  <div className="flex flex-col sm:flex-row">
                    {a.fotoUrl && (
                      <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.fotoUrl} alt={a.titulo} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="p-5 flex-1 pr-12">
                      <h3 className="text-lg font-semibold text-gray-800">{a.titulo}</h3>
                      {a.horario && (
                        <p className="mt-1 text-sm font-medium text-rose-600">🕐 {a.horario}</p>
                      )}
                      {a.direccion && (
                        <p className="mt-1 text-sm text-gray-500">📍 {a.direccion}</p>
                      )}
                      {a.descripcion && (
                        <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-line">
                          {a.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </NRExpandableCard>
              ))}
            </div>
          </section>
        )}

        {Object.keys(negociosByType).length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🏪</span> {t('participatingEstablishments')}
            </h2>
            <div className="space-y-8">
              {Object.entries(negociosByType).map(([tipo, negocios]) => {
                const meta = NEGOCIO_LABEL[tipo] ?? { title: tipo, icon: '📍' };
                return (
                  <div key={tipo}>
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-700">
                      <span>{meta.icon}</span> {meta.title}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {negocios.map((n) => (
                        <NRExpandableCard
                          key={n.id}
                          direccion={n.direccion}
                          lat={n.lat}
                          lng={n.lng}
                          menuUrl={n.menuUrl}
                          menuLabel={t('viewMenu')}
                          telefono={n.telefono}
                          email={n.email}
                        >
                          {n.fotoUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={n.fotoUrl} alt={n.nombre} className="h-40 w-full object-cover" />
                          )}
                          <div className="p-4 pr-12">
                            <h4 className="font-semibold text-gray-800">{n.nombre}</h4>
                            {n.horario && <p className="text-sm text-rose-600">🕐 {n.horario}</p>}
                            {n.direccion && (
                              <p className="mt-1 text-sm text-gray-500">📍 {n.direccion}</p>
                            )}
                            {n.descripcion && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                                {n.descripcion}
                              </p>
                            )}
                          </div>
                        </NRExpandableCard>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-10 pt-6 border-t text-sm">
          <Link
            href={anio
              ? `/noche-romantica/pueblos-participantes/${data.pueblo.slug}`
              : `/noche-romantica/pueblos-participantes`}
            className="text-rose-600 hover:underline"
          >
            {anio ? `← Volver a ${data.pueblo.nombre}` : t('backToPueblosParticipantes')}
          </Link>
        </div>
      </div>
    </>
  );
}
