'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import ContenidoImageCarousel from '@/app/components/ContenidoImageCarousel';

type TematicaPage = {
  id: number;
  titulo: string;
  slug?: string | null;
  contenido: string;
  resumen?: string | null;
  coverUrl?: string | null;
  galleryUrls?: string[];
};

type TematicasPueblo = {
  GASTRONOMIA?: TematicaPage | TematicaPage[];
  NATURALEZA?: TematicaPage | TematicaPage[];
  CULTURA?: TematicaPage | TematicaPage[];
  EN_FAMILIA?: TematicaPage | TematicaPage[];
  PETFRIENDLY?: TematicaPage | TematicaPage[];
  PATRIMONIO?: TematicaPage | TematicaPage[];
};

type PoiTematica = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  categoriaTematica: string | null;
};

type TabConfig = {
  key: keyof TematicasPueblo;
  label: string;
  slug: string;
  urlSlug: string; // slug de la ruta SEO (puede diferir de slug)
};

const TABS: TabConfig[] = [
  { key: 'GASTRONOMIA', label: 'Gastronomía', slug: 'gastronomia', urlSlug: 'que-comer' },
  { key: 'NATURALEZA', label: 'Naturaleza', slug: 'naturaleza', urlSlug: 'naturaleza' },
  { key: 'CULTURA', label: 'Cultura', slug: 'cultura', urlSlug: 'cultura' },
  { key: 'PATRIMONIO', label: 'Patrimonio', slug: 'patrimonio', urlSlug: 'patrimonio' },
  { key: 'EN_FAMILIA', label: 'En familia', slug: 'en-familia', urlSlug: 'en-familia' },
  { key: 'PETFRIENDLY', label: 'Petfriendly', slug: 'petfriendly', urlSlug: 'petfriendly' },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

type Props = {
  puebloSlug: string;
  pois?: PoiTematica[];
};

export default function TematicasPuebloTabs({ puebloSlug, pois = [] }: Props) {
  const locale = useLocale();
  const [tematicas, setTematicas] = useState<TematicasPueblo | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const poisByCategoria: Record<string, PoiTematica[]> = {};
  for (const poi of pois) {
    if (poi.categoriaTematica) {
      if (!poisByCategoria[poi.categoriaTematica]) {
        poisByCategoria[poi.categoriaTematica] = [];
      }
      poisByCategoria[poi.categoriaTematica].push(poi);
    }
  }

  useEffect(() => {
    async function loadTematicas() {
      try {
        const res = await fetch(`/api/public/pueblos/${puebloSlug}/pages?lang=${encodeURIComponent(locale)}`, {
          cache: 'no-store',
        });
        if (!res.ok) { setTematicas(null); return; }
        const data: TematicasPueblo = await res.json();
        setTematicas(data);
      } catch {
        setTematicas(null);
      } finally {
        setLoading(false);
      }
    }
    loadTematicas();
  }, [puebloSlug, locale]);

  const availableTabs = TABS.filter((tab) => {
    const val = tematicas?.[tab.key];
    const hasPage = Array.isArray(val) ? val.length > 0 : !!val;
    const hasPois = poisByCategoria[tab.key]?.length > 0;
    return hasPage || hasPois;
  });

  useEffect(() => {
    if (loading) return;
    if (activeTab) return;
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      const matchingTab = availableTabs.find((t) => t.slug === tabParam);
      if (matchingTab) { setActiveTab(matchingTab.key); return; }
    }
    if (availableTabs.length > 0) setActiveTab(availableTabs[0].key);
  }, [loading, activeTab, availableTabs]);

  if (loading) {
    return <div className="py-8"><p className="text-sm text-gray-500">Cargando...</p></div>;
  }

  if (availableTabs.length === 0) return null;

  // Obtener TODAS las páginas del tab activo (no solo la primera)
  const currentPages: TematicaPage[] = activeTab ? (() => {
    const val = tematicas?.[activeTab as keyof TematicasPueblo];
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  })() : [];

  const currentPois = activeTab ? (poisByCategoria[activeTab] || []) : [];
  const activeTabConfig = TABS.find((t) => t.key === activeTab);

  return (
    <section style={{ marginTop: '48px' }} className="mx-auto max-w-6xl px-4 py-12">
      <h2 style={{ marginBottom: '24px' }}>Qué hacer</h2>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {tab.label}
            {poisByCategoria[tab.key]?.length > 0 && (
              <span className="ml-1 text-xs text-gray-400">
                ({poisByCategoria[tab.key].length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div>
        {/* Si hay UNA sola página: mostrar inline con contenido completo */}
        {currentPages.length === 1 && (
          <div className="prose prose-gray max-w-none mb-8">
            <h3 className="text-2xl font-semibold mb-4">{currentPages[0].titulo}</h3>
            {(() => {
              const imgs = [currentPages[0].coverUrl, ...(currentPages[0].galleryUrls ?? [])].filter((u): u is string => !!u?.trim());
              return imgs.length > 0 ? (
                <div className="mb-6 not-prose">
                  <ContenidoImageCarousel images={imgs} alt={currentPages[0].titulo} />
                </div>
              ) : null;
            })()}
            <ReactMarkdown>{currentPages[0].contenido}</ReactMarkdown>
          </div>
        )}

        {/* Si hay MÁS DE UNA página: mostrar grid de cards con enlace a la URL SEO */}
        {currentPages.length > 1 && activeTabConfig && (
          <div className="mb-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentPages.map((page) => {
                const pageSlug = page.slug ?? slugify(page.titulo);
                const href = `/${activeTabConfig.urlSlug}/${puebloSlug}/${pageSlug}`;
                const mainImage = page.coverUrl ?? page.galleryUrls?.[0];
                return (
                  <Link
                    key={page.id}
                    href={href}
                    className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {mainImage ? (
                      <div className="aspect-[4/3] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mainImage}
                          alt={page.titulo}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Sin imagen</span>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                        {page.titulo}
                      </h3>
                      {page.resumen && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{page.resumen}</p>
                      )}
                      <span className="mt-2 inline-block text-sm font-medium text-primary">
                        Ver más →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* POIs de esta categoría */}
        {currentPois.length > 0 && (
          <div className={currentPages.length > 0 ? 'mt-8 pt-8 border-t border-gray-200' : ''}>
            <h3 className="text-xl font-semibold mb-4">
              Puntos de interés
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({currentPois.length})
              </span>
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {currentPois.map((poi) => (
                <Link
                  key={poi.id}
                  href={`/pueblos/${puebloSlug}/pois/${poi.id}`}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  {poi.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poi.foto}
                      alt={poi.nombre}
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%', height: '180px', backgroundColor: '#f0f0f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#999', fontSize: '14px',
                      }}
                    >
                      Sin imagen
                    </div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '600', lineHeight: '1.4' }}>
                      {poi.nombre}
                    </h4>
                    {poi.descripcion_corta && (
                      <p style={{
                        margin: '8px 0 0 0', fontSize: '14px', color: '#666', lineHeight: '1.4',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {poi.descripcion_corta}
                      </p>
                    )}
                    <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#0066cc', fontWeight: '500' }}>
                      Ver detalle →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!currentPages.length && currentPois.length === 0 && (
          <p className="text-gray-500">No hay contenido disponible para esta categoría.</p>
        )}

        {activeTabConfig && (currentPages.length > 0 || currentPois.length > 0) && (
          <div className="mt-8 text-center">
            <Link
              href={`/${activeTabConfig.urlSlug}/${puebloSlug}`}
              className="inline-block rounded-lg border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-black"
            >
              Ver más sobre {activeTabConfig.label.toLowerCase()} en este pueblo →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
