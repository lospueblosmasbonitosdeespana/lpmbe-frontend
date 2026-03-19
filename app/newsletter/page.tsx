import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import {
  getCanonicalUrl,
  getLocaleAlternates,
  metaLocaleLead,
  seoDescription,
  seoTitle,
  titleLocaleSuffix,
  type SupportedLocale,
} from '@/lib/seo';
import { NewsletterPageClient } from './NewsletterPageClient';

const NL_DESC: Record<string, string> = {
  es: 'Lee nuestras últimas newsletters y suscríbete para recibir novedades de Los Pueblos Más Bonitos de España.',
  en: 'Read our latest newsletters and subscribe to receive updates from Los Pueblos Más Bonitos de España.',
  fr: 'Lisez nos dernières newsletters et abonnez-vous pour recevoir les actualités des plus beaux villages d\'Espagne.',
  de: 'Lesen Sie unsere neuesten Newsletter und abonnieren Sie, um Neuigkeiten zu erhalten.',
  pt: 'Leia as nossas últimas newsletters e subscreva para receber novidades.',
  it: 'Leggi le nostre ultime newsletter e iscriviti per ricevere aggiornamenti.',
  ca: 'Llegeix els nostres últims butlletins i subscriu-te per rebre novetats.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/newsletter';
  const locSuf = titleLocaleSuffix(locale);
  const desc = NL_DESC[locale] ?? `${metaLocaleLead(locale)}${NL_DESC.es}`;
  return {
    title: seoTitle(`Newsletter${locSuf}`),
    description: seoDescription(desc),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
  };
}

async function getEditions() {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/newsletter/editions`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default async function NewsletterPage() {
  const editions = await getEditions();

  return (
    <main className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/90 via-primary to-primary/80 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Newsletter
          </h1>
          <p className="mt-4 text-white/90 max-w-xl mx-auto">
            Descubre nuestras últimas ediciones y suscríbete para no perderte nada.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12">
        <NewsletterPageClient editions={editions} meses={MESES} />
      </div>
    </main>
  );
}
