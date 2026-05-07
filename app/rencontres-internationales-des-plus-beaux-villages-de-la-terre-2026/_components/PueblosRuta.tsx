import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const PUEBLOS = [
  { key: 'castellar', slug: 'castellar-de-la-frontera', day: 1 },
  { key: 'vejer', slug: 'vejer-de-la-frontera', day: 2 },
  { key: 'grazalema', slug: 'grazalema', day: 3 },
  { key: 'zahara', slug: 'zahara', day: 4 },
  { key: 'setenil', slug: 'setenil-de-las-bodegas', day: 4 },
] as const;

export default async function PueblosRuta() {
  const t = await getTranslations('rencontres2026');

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PUEBLOS.map((p, idx) => (
        <Link
          key={p.slug}
          href={`/pueblos/${p.slug}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg"
        >
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-amber-100 via-stone-100 to-emerald-100">
            <div
              className="absolute inset-0 opacity-40 transition group-hover:opacity-60"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 30% 20%, rgba(133,77,14,0.25), transparent 60%), radial-gradient(circle at 70% 80%, rgba(16,121,75,0.2), transparent 60%)',
              }}
              aria-hidden
            />
            <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-amber-700 text-sm font-bold text-white shadow-md">
              {idx + 1}
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-stone-700 shadow-sm backdrop-blur">
              Cádiz
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <h3 className="text-lg font-semibold leading-tight text-stone-900 group-hover:text-amber-800">
                {t(`villages.${p.key}.name`)}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-stone-500">
                {t(`villages.${p.key}.tagline`)}
              </p>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 group-hover:gap-2.5 transition-all">
              {t('actions.viewVillage')}
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
