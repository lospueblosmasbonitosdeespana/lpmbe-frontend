'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { stripHtml } from '@/app/_lib/html';

type PressItem = {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  date?: string;
  type: 'news' | 'event' | 'article';
  href: string;
};

function PressPageContent() {
  const t = useTranslations('pressPage');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const section = (searchParams.get('seccion') ?? 'comunicados').toLowerCase();

  const [releases, setReleases] = useState<PressItem[]>([]);
  const [media, setMedia] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const langQs = `&lang=${encodeURIComponent(locale)}`;
        const [newsRes, eventsRes, mediaRes] = await Promise.all([
          fetch(`/api/public/noticias?limit=24${langQs}`, { cache: 'no-store' }),
          fetch(`/api/public/eventos?limit=24${langQs}`, { cache: 'no-store' }),
          fetch(`/api/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=24${langQs}`, {
            cache: 'no-store',
          }),
        ]);

        const news = newsRes.ok ? await newsRes.json().catch(() => []) : [];
        const events = eventsRes.ok ? await eventsRes.json().catch(() => []) : [];
        const articles = mediaRes.ok ? await mediaRes.json().catch(() => []) : [];

        const releaseItems: PressItem[] = [
          ...(Array.isArray(news)
            ? news.map((item: any) => ({
                id: item.id,
                title: item.titulo ?? '(sin título)',
                slug: item.slug ?? '',
                summary: item.resumen ?? item.contenido ?? undefined,
                date: item.publishedAt ?? item.fecha ?? item.createdAt,
                type: 'news' as const,
                href: item.slug ? `/noticias/${item.slug}` : '/actualidad',
              }))
            : []),
          ...(Array.isArray(events)
            ? events.map((item: any) => ({
                id: item.id,
                title: item.titulo ?? '(sin título)',
                slug: item.slug ?? '',
                summary: item.resumen ?? item.descripcion ?? undefined,
                date: item.publishedAt ?? item.fechaInicio ?? item.createdAt,
                type: 'event' as const,
                href: item.slug ? `/eventos/${item.slug}` : '/actualidad',
              }))
            : []),
        ].sort(
          (a, b) =>
            new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
        );

        const mediaItems: PressItem[] = (Array.isArray(articles) ? articles : [])
          .map((item: any) => ({
            id: item.id,
            title: item.titulo ?? '(sin título)',
            slug: item.slug ?? '',
            summary: item.resumen ?? item.contenidoMd ?? item.contenido ?? undefined,
            date: item.publishedAt ?? item.createdAt,
            type: 'article' as const,
            href: item.slug ? `/c/${item.slug}` : '/actualidad',
          }))
          .sort(
            (a: PressItem, b: PressItem) =>
              new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
          );

        if (!cancelled) {
          setReleases(releaseItems);
          setMedia(mediaItems);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const typeLabel: Record<PressItem['type'], string> = {
    news: t('mediaTypeNews'),
    event: t('mediaTypeEvent'),
    article: t('mediaTypeArticle'),
  };

  const dateLocale =
    locale === 'es'
      ? 'es-ES'
      : locale === 'ca'
        ? 'ca-ES'
        : locale === 'en'
          ? 'en-GB'
          : locale === 'fr'
            ? 'fr-FR'
            : locale === 'de'
              ? 'de-DE'
              : locale === 'pt'
                ? 'pt-PT'
                : locale === 'it'
                  ? 'it-IT'
                  : 'es-ES';

  const tabs = [
    { key: 'comunicados', label: t('tabReleases'), href: '/prensa?seccion=comunicados' },
    { key: 'medios', label: t('tabMedia'), href: '/prensa?seccion=medios' },
    { key: 'kit', label: t('tabKit'), href: '/prensa?seccion=kit' },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('intro')}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              section === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="text-muted-foreground">...</div>
      ) : section === 'medios' ? (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('mediaMentions')}</h2>
          {media.length === 0 ? (
            <div className="rounded-md border border-border p-6 text-muted-foreground">
              {t('noMedia')}
            </div>
          ) : (
            <div className="space-y-5">
              {media.map((item) => (
                <article key={`m-${item.id}`} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase">{typeLabel[item.type]}</span>
                    {item.date && (
                      <>
                        <span>·</span>
                        <span>
                          {new Date(item.date).toLocaleDateString(dateLocale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  {item.summary && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {stripHtml(item.summary)}
                    </p>
                  )}
                  <Link className="mt-3 inline-block text-sm font-medium text-primary hover:underline" href={item.href}>
                    {t('readMore')}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : section === 'kit' ? (
        <section>
          <h2 className="mb-2 text-2xl font-semibold">{t('kitTitle')}</h2>
          <p className="mb-5 text-muted-foreground">{t('kitDesc')}</p>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border p-4">
              <h3 className="text-lg font-semibold">{t('kitLogosTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('kitLogosDesc')}</p>
            </article>
            <article className="rounded-lg border p-4">
              <h3 className="text-lg font-semibold">{t('kitDataTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('kitDataDesc')}</p>
            </article>
            <article className="rounded-lg border p-4">
              <h3 className="text-lg font-semibold">{t('kitContactTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('kitContactDesc')}</p>
              <Link href="/contacto" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                {t('goContact')}
              </Link>
            </article>
          </div>
        </section>
      ) : (
        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('latestOfficial')}</h2>
          {releases.length === 0 ? (
            <div className="rounded-md border border-border p-6 text-muted-foreground">
              {t('noReleases')}
            </div>
          ) : (
            <div className="space-y-5">
              {releases.map((item) => (
                <article key={`r-${item.type}-${item.id}`} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="uppercase">{typeLabel[item.type]}</span>
                    {item.date && (
                      <>
                        <span>·</span>
                        <span>
                          {new Date(item.date).toLocaleDateString(dateLocale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  {item.summary && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {stripHtml(item.summary)}
                    </p>
                  )}
                  <Link className="mt-3 inline-block text-sm font-medium text-primary hover:underline" href={item.href}>
                    {t('readMore')}
                  </Link>
                </article>
              ))}
            </div>
          )}
          <Link href="/actualidad" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
            {t('viewAllNews')}
          </Link>
        </section>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm hover:underline">
          {t('backHome')}
        </Link>
      </div>
    </main>
  );
}

export default function PressPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 py-10 text-muted-foreground">...</div>}>
      <PressPageContent />
    </Suspense>
  );
}
