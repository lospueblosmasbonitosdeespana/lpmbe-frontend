import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getGranEventoBySlug, pickI18n } from '@/lib/grandes-eventos';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const evento = await getGranEventoBySlug(slug);
  const locale = (await getLocale()) || 'es';
  const titulo = evento ? pickI18n(evento.heroTitulo_es, evento.heroTitulo_i18n, locale) : 'Gran evento';
  const intro = evento ? pickI18n(evento.heroIntro_es, evento.heroIntro_i18n, locale) : '';
  const noindex = evento?.noindex ?? true;
  return {
    title: titulo,
    description: intro,
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: { index: !noindex, follow: !noindex },
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
