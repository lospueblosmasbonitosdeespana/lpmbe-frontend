import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import ZoomableImage from '@/app/components/ZoomableImage';
import { getApiUrl } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates, seoDescription, seoTitle, slugToTitle, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type TematicaPage = {
  id: number;
  titulo: string;
  contenido: string;
  coverUrl?: string | null;
};

type CategoryConfig = {
  titleKey: string;
  category: string;
};

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  gastronomia: { titleKey: 'titleGastronomia', category: 'GASTRONOMIA' },
  naturaleza: { titleKey: 'titleNaturaleza', category: 'NATURALEZA' },
  cultura: { titleKey: 'titleCultura', category: 'CULTURA' },
  'en-familia': { titleKey: 'titleEnFamilia', category: 'EN_FAMILIA' },
  petfriendly: { titleKey: 'titlePetfriendly', category: 'PETFRIENDLY' },
  patrimonio: { titleKey: 'titlePatrimonio', category: 'PATRIMONIO' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; puebloSlug: string }>;
}): Promise<Metadata> {
  const { slug, puebloSlug } = await params;
  const locale = await getLocale();
  const localeSuffix = locale === 'es' ? '' : ` (${locale.toUpperCase()})`;
  const t = await getTranslations('experienciasPage');
  const config = CATEGORY_MAP[slug];
  const categoryTitle = config ? t(config.titleKey) : slugToTitle(slug);
  const villageTitle = slugToTitle(puebloSlug) || "Pueblo";
  const path = `/experiencias/${slug}/pueblos/${puebloSlug}`;

  return {
    title: seoTitle(`${categoryTitle} en ${villageTitle}${localeSuffix}`),
    description: seoDescription(`Experiencias de ${categoryTitle.toLowerCase()} para descubrir ${villageTitle}.${localeSuffix}`),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

type PuebloPages = {
  GASTRONOMIA?: TematicaPage[];
  NATURALEZA?: TematicaPage[];
  CULTURA?: TematicaPage[];
  EN_FAMILIA?: TematicaPage[];
  PETFRIENDLY?: TematicaPage[];
  PATRIMONIO?: TematicaPage[];
};

async function getPuebloPage(puebloSlug: string, category: string, locale?: string): Promise<TematicaPage | null> {
  try {
    const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
    const res = await fetch(
      `${getApiUrl()}/public/pueblos/${puebloSlug}/pages${qs}`,
      { cache: 'no-store', headers: locale ? { 'Accept-Language': locale } : undefined }
    );

    if (!res.ok) {
      console.warn(`[PUEBLO ${puebloSlug} ${category}] Backend respondió ${res.status}`);
      return null;
    }

    const data: PuebloPages = await res.json();
    const pages = data[category as keyof PuebloPages];
    if (Array.isArray(pages) && pages.length > 0) return pages[0];
    if (pages && !Array.isArray(pages)) return pages as TematicaPage;
    return null;
  } catch (error) {
    console.error(`[PUEBLO ${puebloSlug} ${category}] Error:`, error);
    return null;
  }
}

export default async function PuebloTematicaPage({
  params,
}: {
  params: Promise<{ slug: string; puebloSlug: string }>;
}) {
  const { slug, puebloSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('experienciasPage');
  const config = CATEGORY_MAP[slug];
  const title = config ? t(config.titleKey) : '';

  if (!config) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <p className="text-gray-600">{t('categoryNotFound')}</p>
      </main>
    );
  }

  const page = await getPuebloPage(puebloSlug, config.category, locale);

  if (!page) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-12">
        <Link href={`/experiencias/${slug}`} className="text-sm text-blue-600 hover:underline">
          {t('backTo', { title })}
        </Link>
        <p className="mt-4 text-gray-600">{t('contentUnavailable')}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <Link href={`/experiencias/${slug}`} className="text-sm text-blue-600 hover:underline">
        {t('backTo', { title })}
      </Link>

      <article className="mt-8">
        <h1 className="text-4xl font-semibold">{page.titulo}</h1>

        {page.coverUrl && page.coverUrl.trim() && (
          <div className="my-8">
            <ZoomableImage
              src={page.coverUrl.trim()}
              alt={page.titulo}
              fit="cover"
              wrapperClassName="aspect-[4/3] max-h-[500px] rounded-lg"
              className="rounded-lg"
            />
          </div>
        )}

        <div className="prose prose-gray prose-lg max-w-none safe-html-content [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-6">
          <SafeHtml html={page.contenido || ''} />
        </div>
      </article>
    </main>
  );
}
