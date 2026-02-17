import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import SafeHtml from '@/app/_components/ui/SafeHtml';

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
};

type PuebloPages = {
  GASTRONOMIA?: TematicaPage;
  NATURALEZA?: TematicaPage;
  CULTURA?: TematicaPage;
  EN_FAMILIA?: TematicaPage;
  PETFRIENDLY?: TematicaPage;
};

async function getPuebloPage(puebloSlug: string, category: string, locale?: string): Promise<TematicaPage | null> {
  try {
    const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/pueblos/${puebloSlug}/pages${qs}`,
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.coverUrl.trim()}
              alt={page.titulo}
              className="w-full rounded-lg object-cover"
              style={{ maxHeight: '500px' }}
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
