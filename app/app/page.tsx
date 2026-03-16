import Image from 'next/image';
import { getApiUrl } from '@/lib/api';
import AppDownloadActions from './AppDownloadActions.client';
import { getLocale, getTranslations } from 'next-intl/server';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/seo';

const APP_STORE_URL =
  'https://apps.apple.com/es/app/los-pueblos-m%C3%A1s-bonitos-de-esp/id6755147967';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.rork.pueblos_bonitos_app';

export const dynamic = "force-dynamic";

type AppWebPageConfig = {
  title?: string;
  subtitle?: string;
  intro?: string;
  feature1Title?: string;
  feature1Text?: string;
  feature2Title?: string;
  feature2Text?: string;
  feature3Title?: string;
  feature3Text?: string;
  feature4Title?: string;
  feature4Text?: string;
  screenshot1Url?: string | null;
  screenshot2Url?: string | null;
  screenshot3Url?: string | null;
  screenshot4Url?: string | null;
  screenshot5Url?: string | null;
  screenshot6Url?: string | null;
  appStoreUrl?: string;
  playStoreUrl?: string;
};

const DEFAULT_CONFIG: Required<
  Omit<
    AppWebPageConfig,
    | 'screenshot1Url'
    | 'screenshot2Url'
    | 'screenshot3Url'
    | 'screenshot4Url'
    | 'screenshot5Url'
    | 'screenshot6Url'
  >
> &
  Pick<
    AppWebPageConfig,
    | 'screenshot1Url'
    | 'screenshot2Url'
    | 'screenshot3Url'
    | 'screenshot4Url'
    | 'screenshot5Url'
    | 'screenshot6Url'
  > = {
  title: 'La app oficial',
  subtitle: 'Rutas, mapas y alertas para planificar tu escapada',
  intro:
    'Descubre pueblos, organiza fines de semana y consulta información útil en tiempo real desde tu móvil.',
  feature1Title: 'Planifica tu fin de semana',
  feature1Text: 'Ideas de viaje, rutas y propuestas para escapadas por toda España.',
  feature2Title: 'Mapa interactivo',
  feature2Text: 'Explora pueblos y recursos turísticos en un mapa visual y fácil de usar.',
  feature3Title: 'Actualidad y alertas',
  feature3Text: 'Consulta noticias, avisos y semáforo turístico antes de viajar.',
  feature4Title: 'Semana Santa y eventos',
  feature4Text: 'Sigue procesiones, horarios y recomendaciones para disfrutar cada visita.',
  screenshot1Url: null,
  screenshot2Url: null,
  screenshot3Url: null,
  screenshot4Url: null,
  screenshot5Url: null,
  screenshot6Url: null,
  appStoreUrl: APP_STORE_URL,
  playStoreUrl: PLAY_STORE_URL,
};

async function getAppWebPageConfig(locale?: string): Promise<typeof DEFAULT_CONFIG> {
  const API_BASE = getApiUrl();
  try {
    const qs = locale ? `?lang=${encodeURIComponent(locale)}` : '';
    const res = await fetch(`${API_BASE}/home${qs}`, {
      cache: 'no-store',
      headers: locale ? { 'Accept-Language': locale } : undefined,
    });
    if (!res.ok) return DEFAULT_CONFIG;
    const home = await res.json();
    return { ...DEFAULT_CONFIG, ...(home?.appWebPage || {}) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default async function AppLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieLocale = await getLocale();
  const locale: SupportedLocale =
    resolvedSearchParams?.lang &&
    SUPPORTED_LOCALES.includes(resolvedSearchParams.lang as SupportedLocale)
      ? (resolvedSearchParams.lang as SupportedLocale)
      : (cookieLocale as SupportedLocale);
  const t = await getTranslations({ locale, namespace: 'appPage' });
  const config = await getAppWebPageConfig(locale);
  const screenshots = [
    config.screenshot1Url,
    config.screenshot2Url,
    config.screenshot3Url,
    config.screenshot4Url,
    config.screenshot5Url,
    config.screenshot6Url,
  ].filter((item): item is string => !!item);
  const features = [
    { title: config.feature1Title, text: config.feature1Text },
    { title: config.feature2Title, text: config.feature2Text },
    { title: config.feature3Title, text: config.feature3Text },
    { title: config.feature4Title, text: config.feature4Text },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <section className="rounded-2xl border bg-card p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t('badge')}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{config.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{config.subtitle}</p>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">{config.intro}</p>
        <AppDownloadActions
          appStoreUrl={config.appStoreUrl}
          playStoreUrl={config.playStoreUrl}
          labels={{
            iosPrimary: t('downloadAppStore'),
            androidPrimary: t('downloadGooglePlay'),
            iosSecondary: t('alsoGooglePlay'),
            androidSecondary: t('alsoAppStore'),
            openDownloadPage: t('openDownloadPage'),
            qrCaption: t('qrCaption'),
          }}
        />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {features.map((feature, index) => (
          <article key={index} className="rounded-xl border bg-background p-5">
            <h2 className="text-base font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
          </article>
        ))}
      </section>

      {screenshots.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">{t('screenshotsTitle')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screenshots.map((url, index) => (
              <div key={index} className="rounded-xl border bg-card p-2">
                <div className="relative mx-auto aspect-[9/19] w-full max-w-[280px] overflow-hidden rounded-lg bg-white">
                  <Image
                    src={url}
                    alt={`Captura app ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
