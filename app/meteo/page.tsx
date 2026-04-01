import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from "@/lib/seo";
import { MeteoList } from "./MeteoList";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = "/meteo";
  const t = await getTranslations("meteoPage");
  return {
    title: seoTitle(t("title")),
    description: seoDescription(t("metaDescription")),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: seoTitle(t("title")),
      description: seoDescription(t("metaDescription")),
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function MeteoPage() {
  const [t, tPanel, locale] = await Promise.all([
    getTranslations("meteoPage"),
    getTranslations("meteoPanel"),
    getLocale(),
  ]);

  const labels = {
    villagesCount: t("villagesCount", { count: "{count}" }),
    mm24h: t("mm24h"),
    snowCm24h: t("snowCm24h"),
    windKph: t("windKph"),
    rainProbPct: t("rainProbPct"),
    aqiLabel: t("aqiLabel"),
    aqiGood: t("aqiGood"),
    aqiFair: t("aqiFair"),
    aqiModerate: t("aqiModerate"),
    aqiPoor: t("aqiPoor"),
    aqiVeryPoor: t("aqiVeryPoor"),
    aqiExtreme: t("aqiExtreme"),
    alertSnow: t("alertSnow"),
    alertRain: t("alertRain"),
    alertWind: t("alertWind"),
    alertFrost: t("alertFrost"),
    alertHeat: t("alertHeat"),
    today: t("today"),
    tomorrow: t("tomorrow"),
    yesterday: t("yesterday"),
    labelFrom: t("labelFrom"),
    labelUntil: t("labelUntil"),
    weatherClear: tPanel("clear"),
    weatherCloudy: tPanel("cloudy"),
    weatherFog: tPanel("fog"),
    weatherDrizzle: tPanel("drizzle"),
    weatherRain: tPanel("rain"),
    weatherSnow: tPanel("snow"),
    weatherShowers: tPanel("showers"),
    weatherStorm: tPanel("storm"),
    weatherGeneric: tPanel("weather"),
    sortLabels: {
      temp_asc: t("sortColdest"),
      temp_desc: t("sortHottest"),
      alpha: t("sortAlpha"),
      rain_desc: t("sortRain"),
      wind_desc: t("sortWind"),
      aqi_asc: t("sortAir"),
    },
    loading: t("title"),
    error: t("title"),
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <Suspense
        fallback={
          <div className="mt-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-[#efe2d8] dark:bg-neutral-800 animate-pulse" />
            ))}
          </div>
        }
      >
        <MeteoList labels={labels} locale={locale} />
      </Suspense>
    </main>
  );
}
