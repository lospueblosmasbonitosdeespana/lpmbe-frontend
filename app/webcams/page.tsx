import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getApiUrl } from '@/lib/api';
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from '@/lib/seo';
import WebcamsGrid from './WebcamsGrid';
import JsonLd from '@/app/components/seo/JsonLd';

export const revalidate = 120;

const PAGE_TITLE: Record<string, string> = {
  es: 'Webcams en directo de los pueblos más bonitos de España',
  en: 'Live webcams from Spain\'s most beautiful villages',
  fr: 'Webcams en direct des plus beaux villages d\'Espagne',
  de: 'Live-Webcams aus Spaniens schönsten Dörfern',
  pt: 'Webcams em direto das aldeias mais bonitas de Espanha',
  it: 'Webcam in diretta dai borghi più belli della Spagna',
  ca: 'Webcams en directe dels pobles més bonics d\'Espanya',
};

const PAGE_DESC: Record<string, string> = {
  es: 'Asómate en tiempo real a los pueblos más bonitos de España. Webcams en directo desde plazas, monumentos y paisajes de los pueblos con más encanto.',
  en: 'Peek into Spain\'s most beautiful villages in real time. Live webcams from squares, monuments and landscapes of the most charming villages.',
  fr: 'Découvrez en temps réel les plus beaux villages d\'Espagne. Webcams en direct depuis les places, monuments et paysages.',
  de: 'Schauen Sie live in Spaniens schönste Dörfer. Webcams von Plätzen, Denkmälern und Landschaften.',
  pt: 'Espreite em tempo real as aldeias mais bonitas de Espanha. Webcams em direto de praças, monumentos e paisagens.',
  it: 'Affacciati in tempo reale sui borghi più belli della Spagna. Webcam in diretta da piazze, monumenti e paesaggi.',
  ca: 'Mira en temps real els pobles més bonics d\'Espanya. Webcams en directe des de places, monuments i paisatges.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = '/webcams';
  const title = seoTitle(PAGE_TITLE[locale] ?? PAGE_TITLE.es);
  const description = seoDescription(PAGE_DESC[locale] ?? PAGE_DESC.es);

  let ogImage: string | null = null;
  let hasWebcams = false;
  try {
    const webcams = await fetchWebcams();
    hasWebcams = webcams.length > 0;
    ogImage = webcams.find((w) => w.pueblo?.foto_destacada)?.pueblo.foto_destacada ?? null;
  } catch {
    ogImage = null;
  }
  const finalOgImage = ogImage ?? `${getBaseUrl()}/brand/logo-lpbe-1.png`;

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
      type: 'website',
      images: [{ url: finalOgImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [finalOgImage],
    },
    robots: { index: hasWebcams, follow: true },
  };
}

interface WebcamItem {
  id: number;
  nombre: string;
  url: string;
  proveedor: string | null;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
}

async function fetchWebcams(): Promise<WebcamItem[]> {
  try {
    const API = getApiUrl();
    const res = await fetch(`${API}/public/webcams`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function WebcamsPage() {
  const [webcams, t] = await Promise.all([
    fetchWebcams(),
    getTranslations('webcamsPage'),
  ]);

  const puebloMap = new Map<string, { pueblo: WebcamItem['pueblo']; webcams: WebcamItem[] }>();
  for (const w of webcams) {
    const key = w.pueblo.slug;
    if (!puebloMap.has(key)) {
      puebloMap.set(key, { pueblo: w.pueblo, webcams: [] });
    }
    puebloMap.get(key)!.webcams.push(w);
  }
  const groups = Array.from(puebloMap.values());

  const locale = await getLocale();
  const base = getBaseUrl();
  const pageUrl = getCanonicalUrl('/webcams', locale as SupportedLocale);
  const title = seoTitle(PAGE_TITLE[locale] ?? PAGE_TITLE.es);
  const description = seoDescription(PAGE_DESC[locale] ?? PAGE_DESC.es);
  const firstCover = groups.find((g) => g.pueblo.foto_destacada)?.pueblo.foto_destacada ?? null;

  const collectionLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: pageUrl,
    inLanguage: locale,
    ...(firstCover ? { image: firstCover } : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Los Pueblos Más Bonitos de España',
      url: base,
    },
    ...(groups.length > 0
      ? {
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: groups.length,
            itemListElement: groups.slice(0, 100).map((g, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${base}/pueblos/${g.pueblo.slug}/webcam`,
              name: `Webcam · ${g.pueblo.nombre}`,
              ...(g.pueblo.foto_destacada ? { image: g.pueblo.foto_destacada } : {}),
            })),
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: base },
      { '@type': 'ListItem', position: 2, name: 'Webcams', item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-700 via-[#b45309] to-amber-900 py-16 md:py-24">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 text-center text-white">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            {t('liveBadge')}
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-amber-100 md:text-xl">
            {t('heroSubtitle')}
          </p>
          <p className="mt-6 text-sm text-amber-200/80">
            {groups.length} {t('statsVillages')} · {webcams.length} webcams
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        {groups.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-neutral-800">
              <svg className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <p className="text-xl text-muted-foreground">{t('noWebcams')}</p>
          </div>
        ) : (
          <WebcamsGrid groups={groups.map(g => ({
            pueblo: g.pueblo,
            webcams: g.webcams.map(w => ({ id: w.id, nombre: w.nombre, url: w.url, proveedor: w.proveedor })),
          }))} />
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 bg-stone-50 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/50">
        <p className="text-stone-600 dark:text-neutral-400">{t('ctaQuestion')}</p>
        <Link
          href="/contacto"
          className="mt-3 inline-block rounded-full bg-[#b45309] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
        >
          {t('ctaButton')}
        </Link>
      </section>
    </main>
  );
}
