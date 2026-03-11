import Image from 'next/image';
import Link from 'next/link';
import { getApiUrl } from '@/lib/api';

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
  appStoreUrl?: string;
  playStoreUrl?: string;
};

const DEFAULT_CONFIG: Required<Omit<AppWebPageConfig, 'screenshot1Url' | 'screenshot2Url' | 'screenshot3Url'>> &
  Pick<AppWebPageConfig, 'screenshot1Url' | 'screenshot2Url' | 'screenshot3Url'> = {
  title: 'La app oficial de Los Pueblos Más Bonitos de España',
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
  appStoreUrl: APP_STORE_URL,
  playStoreUrl: PLAY_STORE_URL,
};

async function getAppWebPageConfig(): Promise<typeof DEFAULT_CONFIG> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/home`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_CONFIG;
    const home = await res.json();
    return { ...DEFAULT_CONFIG, ...(home?.appWebPage || {}) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export default async function AppLandingPage() {
  const config = await getAppWebPageConfig();
  const screenshots = [config.screenshot1Url, config.screenshot2Url, config.screenshot3Url].filter(
    (item): item is string => !!item,
  );
  const features = [
    { title: config.feature1Title, text: config.feature1Text },
    { title: config.feature2Title, text: config.feature2Text },
    { title: config.feature3Title, text: config.feature3Text },
    { title: config.feature4Title, text: config.feature4Text },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <section className="rounded-2xl border bg-card p-6 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">App oficial</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">{config.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{config.subtitle}</p>
        <p className="mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">{config.intro}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={config.appStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-black px-4 py-3 text-sm font-medium text-white"
          >
            Descargar en App Store
          </a>
          <a
            href={config.playStoreUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            Descargar en Google Play
          </a>
          <Link
            href="/app/descargar"
            className="rounded-lg border px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Abrir página de descarga
          </Link>
        </div>
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
          <h2 className="mb-4 text-xl font-semibold">Capturas de la app</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {screenshots.map((url, index) => (
              <div key={index} className="overflow-hidden rounded-xl border bg-card">
                <div className="relative h-[420px] w-full">
                  <Image
                    src={url}
                    alt={`Captura app ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
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
