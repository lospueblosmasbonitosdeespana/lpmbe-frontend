import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { Metadata } from 'next';
import { NewsletterPageClient } from './NewsletterPageClient';

export const metadata: Metadata = {
  title: 'Newsletter | Los Pueblos Más Bonitos de España',
  description: 'Lee nuestras últimas newsletters y suscríbete para recibir novedades.',
};

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
