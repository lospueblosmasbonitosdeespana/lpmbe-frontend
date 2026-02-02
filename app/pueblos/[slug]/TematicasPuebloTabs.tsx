'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

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
  { key: 'EN_FAMILIA', label: 'En familia', slug: 'en-familia' },
  { key: 'PETFRIENDLY', label: 'Petfriendly', slug: 'petfriendly' },
];

type Props = {
  puebloSlug: string;
};

export default function TematicasPuebloTabs({ puebloSlug }: Props) {
  const [tematicas, setTematicas] = useState<TematicasPueblo | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTematicas() {
      try {
        const res = await fetch(`/api/public/pueblos/${puebloSlug}/pages`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setTematicas(null);
          return;
        }

        const data: TematicasPueblo = await res.json();
        setTematicas(data);

        // Detectar tab desde URL o usar primera disponible
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');

        if (tabParam) {
          const matchingTab = TABS.find((t) => t.slug === tabParam);
          if (matchingTab && data[matchingTab.key]) {
            setActiveTab(matchingTab.key);
            return;
          }
        }

        // Activar primera tab disponible
        const firstAvailable = TABS.find((t) => data[t.key]);
        if (firstAvailable) {
          setActiveTab(firstAvailable.key);
        }
      } catch (error) {
        console.error('[TEMATICAS PUEBLO] Error:', error);
        setTematicas(null);
      } finally {
        setLoading(false);
      }
    }

    loadTematicas();
  }, [puebloSlug]);

  if (loading) {
    return (
      <div className="py-8">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (!tematicas) return null;

  // Filtrar tabs disponibles
  const availableTabs = TABS.filter((tab) => tematicas[tab.key]);

  if (availableTabs.length === 0) return null;

  const currentPage = activeTab ? tematicas[activeTab as keyof TematicasPueblo] : null;

  return (
    <section style={{ marginTop: '48px' }} className="mx-auto max-w-6xl px-4 py-12">
      <h2 style={{ marginBottom: '24px' }}>Categorías temáticas</h2>
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
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
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      {currentPage && (
        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold mb-4">{currentPage.titulo}</h2>

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
    </section>
  );
}
