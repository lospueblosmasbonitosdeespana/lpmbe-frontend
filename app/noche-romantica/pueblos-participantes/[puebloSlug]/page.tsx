import type { Metadata } from "next";
import Link from 'next/link';
import Image from 'next/image';
import { getApiUrl } from '@/lib/api';
import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Clock } from 'lucide-react';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";
import NRExpandableCard from './NRExpandableCard';

export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}): Promise<Metadata> {
  const { puebloSlug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const name = slugToTitle(puebloSlug);
  const path = `/noche-romantica/pueblos-participantes/${puebloSlug}`;
  const title = seoTitle(tSeo('nocheRomanticaPuebloTitle', { nombre: name }));
  const description = seoDescription(tSeo('nocheRomanticaPuebloDesc', { nombre: name }));
  const data = await fetchPueblo(puebloSlug, locale);
  const hasData = Boolean(data?.pueblo?.slug);
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
    robots: { index: hasData, follow: true },
  };
}

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string | null;
  horario: string | null;
  fotoUrl: string | null;
  direccion: string | null;
  lat: number | null;
  lng: number | null;
}

interface Negocio {
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

interface NRPuebloDetail {
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

interface NRConfig {
  logoUrl?: string;
  fechaEvento?: string;
  titulo?: string;
  activa?: boolean;
}

async function fetchPueblo(slug: string, lang?: string): Promise<NRPuebloDetail | null> {
  try {
    const API_BASE = getApiUrl();
    const langParam = lang && lang !== 'es' ? `?lang=${lang}` : '';
    const res = await fetch(`${API_BASE}/noche-romantica/pueblos/${slug}${langParam}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchNRConfig(): Promise<NRConfig> {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/noche-romantica/app-status`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

function formatFechaEuropea(fecha: string): string {
  if (!fecha) return fecha;
  if (fecha.includes('-')) {
    return fecha.split('-').reverse().join('/');
  }
  return fecha;
}

export default async function PuebloNocheRomanticaPage({
  params,
}: {
  params: Promise<{ puebloSlug: string }>;
}) {
  const { puebloSlug } = await params;
  const t = await getTranslations('nocheRomantica');
  const locale = await getLocale();

  const [data, nrConfig] = await Promise.all([
    fetchPueblo(puebloSlug, locale),
    fetchNRConfig(),
  ]);

  if (!data) {
    const name = slugToTitle(puebloSlug);
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border bg-muted/30 px-8 py-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">La Noche Rom&aacute;ntica en {name}</h1>
          <p className="text-muted-foreground">
            Este pueblo no participa actualmente en La Noche Rom&aacute;ntica.
          </p>
          <Link href="/noche-romantica/pueblos-participantes" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            &larr; Ver pueblos participantes
          </Link>
        </div>
      </main>
    );
  }

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
    <main className="min-h-screen">
      {/* Logo NR */}
      {nrConfig.logoUrl && (
        <div className="flex justify-center py-6 bg-white dark:bg-neutral-900">
          <Link href="/noche-romantica">
            <img
              src={nrConfig.logoUrl}
              alt={t('title')}
              className="h-20 md:h-24 w-auto object-contain"
            />
          </Link>
        </div>
      )}

      {/* Hero / Cartel con imagen */}
      {heroImage ? (
        <section className="relative w-full bg-gray-100">
          <img
            src={heroImage}
            alt={data.pueblo.nombre}
            className="w-full max-h-[60vh] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <p className="text-sm opacity-80">{t('title')}</p>
            <h1 className="text-3xl md:text-4xl font-bold drop-shadow-lg">
              {data.pueblo.nombre}
            </h1>
            <p className="mt-1 text-sm drop-shadow-md opacity-90">
              {data.pueblo.provincia}, {data.pueblo.comunidad}
            </p>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-b from-rose-50 to-white py-12 text-center">
          <p className="text-sm text-rose-600">{t('title')}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {data.pueblo.nombre}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {data.pueblo.provincia}, {data.pueblo.comunidad}
          </p>
        </section>
      )}

      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Breadcrumbs */}
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
          <span className="text-foreground font-medium">{data.pueblo.nombre}</span>
        </nav>

        {/* Título y descripción del evento */}
        {data.titulo && (
          <h2 className="mb-4 text-2xl font-bold text-gray-800">{data.titulo}</h2>
        )}
        {data.descripcion && (
          <p className="mb-8 text-lg text-gray-600 leading-relaxed whitespace-pre-line">
            {data.descripcion}
          </p>
        )}

        {/* Bloque "Próximamente" cuando no hay contenido — igual que en la app */}
        {!hasContent && (
          <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50/70 px-8 py-10 text-center shadow-sm">
            {nrConfig?.logoUrl ? (
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

        {/* Programa de actividades */}
        {data.actividades.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>🎭</span> {t('programActivities')}
            </h2>
            <div className="space-y-4">
              {data.actividades.map((a) => (
                <NRExpandableCard
                  key={a.id}
                  direccion={a.direccion}
                  lat={a.lat}
                  lng={a.lng}
                >
                  <div className="flex flex-col sm:flex-row">
                    {a.fotoUrl && (
                      <div className="sm:w-48 h-40 sm:h-auto flex-shrink-0">
                        <img
                          src={a.fotoUrl}
                          alt={a.titulo}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5 flex-1 pr-12">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {a.titulo}
                      </h3>
                      {a.horario && (
                        <p className="mt-1 text-sm font-medium text-rose-600">
                          🕐 {a.horario}
                        </p>
                      )}
                      {a.direccion && (
                        <p className="mt-1 text-sm text-gray-500">
                          📍 {a.direccion}
                        </p>
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

        {/* Establecimientos participantes */}
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
                            <img
                              src={n.fotoUrl}
                              alt={n.nombre}
                              className="h-40 w-full object-cover"
                            />
                          )}
                          <div className="p-4 pr-12">
                            <h4 className="font-semibold text-gray-800">
                              {n.nombre}
                            </h4>
                            {n.horario && (
                              <p className="text-sm text-rose-600">
                                🕐 {n.horario}
                              </p>
                            )}
                            {n.direccion && (
                              <p className="mt-1 text-sm text-gray-500">
                                📍 {n.direccion}
                              </p>
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

        {/* Back link */}
        <div className="mt-10 pt-6 border-t text-sm">
          <Link
            href="/noche-romantica/pueblos-participantes"
            className="text-rose-600 hover:underline"
          >
            {t('backToPueblosParticipantes')}
          </Link>
        </div>
      </div>
    </main>
  );
}
