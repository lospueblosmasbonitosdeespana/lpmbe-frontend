"use client";

import Link from "next/link";

type Collection = {
  slug: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  description: string;
};

const TYPE_LABELS: Record<string, Record<string, string>> = {
  es: { highlight: "Patrimonio", service: "Servicios", meteo: "Tiempo real", static: "Geografía" },
  en: { highlight: "Heritage", service: "Services", meteo: "Live weather", static: "Geography" },
  fr: { highlight: "Patrimoine", service: "Services", meteo: "Météo en direct", static: "Géographie" },
  de: { highlight: "Kulturerbe", service: "Dienste", meteo: "Live-Wetter", static: "Geographie" },
  pt: { highlight: "Património", service: "Serviços", meteo: "Tempo real", static: "Geografia" },
  it: { highlight: "Patrimonio", service: "Servizi", meteo: "Meteo live", static: "Geografia" },
  ca: { highlight: "Patrimoni", service: "Serveis", meteo: "Temps real", static: "Geografia" },
};

export function DescubreGrid({ collections, locale }: { collections: Collection[]; locale: string }) {
  const labels = TYPE_LABELS[locale] ?? TYPE_LABELS.es;

  const statics = collections.filter((c) => c.type !== "meteo");
  const dynamics = collections.filter((c) => c.type === "meteo");

  return (
    <div className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Static collections — big visual cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {statics.map((c) => (
          <Link
            key={c.slug}
            href={`/descubre/${c.slug}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e2d5cb] bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 dark:bg-neutral-900 dark:border-neutral-700"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${c.color}15` }}
                >
                  {c.icon}
                </span>
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ color: c.color, backgroundColor: `${c.color}12` }}
                >
                  {labels[c.type] ?? c.type}
                </span>
              </div>
              <h2 className="font-serif text-xl font-semibold text-[#3d2c1e] group-hover:text-[#8B6F47] transition-colors dark:text-neutral-100 dark:group-hover:text-amber-400">
                {c.title}
              </h2>
              <p className="mt-2 text-sm text-neutral-600 line-clamp-3 dark:text-neutral-400">
                {c.description}
              </p>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium" style={{ color: c.color }}>
              <span className="group-hover:underline">
                {locale === "es" ? "Explorar" : locale === "en" ? "Explore" : locale === "fr" ? "Explorer" : "Explorar"}
              </span>
              <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div
              className="absolute bottom-0 left-0 h-1 w-full transition-all group-hover:h-1.5"
              style={{ backgroundColor: c.color }}
            />
          </Link>
        ))}
      </div>

      {/* Dynamic / meteo collections */}
      {dynamics.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#e2d5cb] to-transparent dark:via-neutral-700" />
            <h2 className="font-serif text-lg font-semibold text-[#3d2c1e] whitespace-nowrap dark:text-neutral-200">
              <span className="mr-2">📡</span>
              {locale === "es" ? "En tiempo real" : locale === "en" ? "Live weather" : locale === "fr" ? "En temps réel" : "En tiempo real"}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-[#e2d5cb] via-[#e2d5cb] to-transparent dark:from-neutral-700 dark:via-neutral-700" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {dynamics.map((c) => (
              <Link
                key={c.slug}
                href={`/descubre/${c.slug}`}
                className="group relative flex items-start gap-4 rounded-xl border border-[#e2d5cb] bg-gradient-to-br from-white to-[#faf7f4] p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:from-neutral-900 dark:to-neutral-800 dark:border-neutral-700"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: `${c.color}18` }}
                >
                  {c.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-semibold text-[#3d2c1e] group-hover:text-[#8B6F47] transition-colors dark:text-neutral-100">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500 line-clamp-2 dark:text-neutral-400">
                    {c.description}
                  </p>
                </div>
                <div
                  className="absolute top-0 right-0 h-full w-1 rounded-r-xl transition-all group-hover:w-1.5"
                  style={{ backgroundColor: c.color }}
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
