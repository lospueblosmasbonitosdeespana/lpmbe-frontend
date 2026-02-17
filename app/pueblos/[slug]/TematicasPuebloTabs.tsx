'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

type TematicaPage = {
  id: number;
  titulo: string;
  contenido: string;
  coverUrl?: string | null;
};

type TematicasPueblo = {
  GASTRONOMIA?: TematicaPage;
  NATURALEZA?: TematicaPage;
  CULTURA?: TematicaPage;
  EN_FAMILIA?: TematicaPage;
  PETFRIENDLY?: TematicaPage;
  PATRIMONIO?: TematicaPage;
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
};

const TABS: TabConfig[] = [
  { key: 'GASTRONOMIA', label: 'Gastronomía', slug: 'gastronomia' },
  { key: 'NATURALEZA', label: 'Naturaleza', slug: 'naturaleza' },
  { key: 'CULTURA', label: 'Cultura', slug: 'cultura' },
  { key: 'PATRIMONIO', label: 'Patrimonio', slug: 'patrimonio' },
  { key: 'EN_FAMILIA', label: 'En familia', slug: 'en-familia' },
  { key: 'PETFRIENDLY', label: 'Petfriendly', slug: 'petfriendly' },
];

type Props = {
  puebloSlug: string;
  pois?: PoiTematica[]; // POIs pasados desde el padre
};

export default function TematicasPuebloTabs({ puebloSlug, pois = [] }: Props) {
  const locale = useLocale();
  const [tematicas, setTematicas] = useState<TematicasPueblo | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Agrupar POIs por categoría temática
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

        if (!res.ok) {
          setTematicas(null);
          return;
        }

        const data: TematicasPueblo = await res.json();
        setTematicas(data);
      } catch (error) {
        console.error('[TEMATICAS PUEBLO] Error:', error);
        setTematicas(null);
      } finally {
        setLoading(false);
      }
    }

    loadTematicas();
  }, [puebloSlug, locale]);

  // Determinar tabs disponibles: páginas temáticas O POIs con esa categoría
  const availableTabs = TABS.filter((tab) => {
    const hasPage = tematicas?.[tab.key];
    const hasPois = poisByCategoria[tab.key]?.length > 0;
    return hasPage || hasPois;
  });

  // Establecer tab activo después de cargar
  useEffect(() => {
    if (loading) return;
    if (activeTab) return; // Ya hay uno activo

    // Detectar tab desde URL o usar primera disponible
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    if (tabParam) {
      const matchingTab = availableTabs.find((t) => t.slug === tabParam);
      if (matchingTab) {
        setActiveTab(matchingTab.key);
        return;
      }
    }

    // Activar primera tab disponible
    if (availableTabs.length > 0) {
      setActiveTab(availableTabs[0].key);
    }
  }, [loading, activeTab, availableTabs]);

  if (loading) {
    return (
      <div className="py-8">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (availableTabs.length === 0) return null;

  const currentPage = activeTab ? tematicas?.[activeTab as keyof TematicasPueblo] : null;
  const currentPois = activeTab ? (poisByCategoria[activeTab] || []) : [];

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

      {/* Contenido del tab activo */}
      <div>
        {/* Página temática */}
        {currentPage && (
          <div className="prose prose-gray max-w-none mb-8">
            <h3 className="text-2xl font-semibold mb-4">{currentPage.titulo}</h3>

            {currentPage.coverUrl && currentPage.coverUrl.trim() && (
              <div className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentPage.coverUrl.trim()}
                  alt={currentPage.titulo}
                  className="w-full max-h-96 rounded-lg object-cover"
                />
              </div>
            )}

            <ReactMarkdown>{currentPage.contenido}</ReactMarkdown>
          </div>
        )}

        {/* POIs de esta categoría */}
        {currentPois.length > 0 && (
          <div className={currentPage ? 'mt-8 pt-8 border-t border-gray-200' : ''}>
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
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '180px',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '14px',
                      }}
                    >
                      Sin imagen
                    </div>
                  )}

                  <div style={{ padding: '16px' }}>
                    <h4
                      style={{
                        margin: '0',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1.4',
                      }}
                    >
                      {poi.nombre}
                    </h4>

                    {poi.descripcion_corta && (
                      <p
                        style={{
                          margin: '8px 0 0 0',
                          fontSize: '14px',
                          color: '#666',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {poi.descripcion_corta}
                      </p>
                    )}

                    <p
                      style={{
                        margin: '12px 0 0 0',
                        fontSize: '14px',
                        color: '#0066cc',
                        fontWeight: '500',
                      }}
                    >
                      Ver detalle →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje si no hay contenido */}
        {!currentPage && currentPois.length === 0 && (
          <p className="text-gray-500">No hay contenido disponible para esta categoría.</p>
        )}
      </div>
    </section>
  );
}
