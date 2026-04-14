"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getComunidadFlagSrc } from "@/lib/flags";
import {
  Sun, CloudSun, Cloudy, CloudFog,
  CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Cloud,
} from "lucide-react";
import { resolveTagIcon, TagIcon } from "@/lib/tag-icon-map";

function HeroIcon({ name }: { name: string }) {
  const Icon = resolveTagIcon(name);
  return <Icon size={48} className="text-white/90" strokeWidth={1.5} />;
}

type Pueblo = {
  id: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  lat: number;
  lng: number;
  foto_destacada: string | null;
  highlightExtra?: string | null;
  habitantes?: string | null;
  linkUrl?: string | null;
  linkedName?: string | null;
  detalle?: string | null;
  visitable?: boolean | null;
  meteo?: {
    temperatureC: number | null;
    weatherCode: number | null;
    snowfallMm?: number | null;
  } | null;
};

type CollectionData = {
  slug: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  pueblos: Pueblo[];
  count: number;
  generatedAt: string;
};

function WeatherIcon({ code, className }: { code: number | null; className?: string }) {
  const size = 18;
  if (code === null || code === 0) return <Sun size={size} className={`text-amber-500 ${className}`} />;
  if (code === 1) return <CloudSun size={size} className={`text-stone-400 ${className}`} />;
  if ([2, 3].includes(code)) return <Cloudy size={size} className={`text-stone-400 ${className}`} />;
  if ([45, 48].includes(code)) return <CloudFog size={size} className={`text-stone-400 ${className}`} />;
  if ([51, 53, 55, 56, 57].includes(code)) return <CloudDrizzle size={size} className={`text-slate-400 ${className}`} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain size={size} className={`text-slate-500 ${className}`} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow size={size} className={`text-sky-400 ${className}`} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning size={size} className={`text-violet-500 ${className}`} />;
  return <Cloud size={size} className={`text-stone-400 ${className}`} />;
}

const BACK_LABELS: Record<string, string> = {
  es: "Volver a Descubre",
  en: "Back to Discover",
  fr: "Retour à Découvrir",
  de: "Zurück zu Entdecken",
  pt: "Voltar a Descobrir",
  it: "Torna a Scopri",
  ca: "Tornar a Descobreix",
};

const VILLAGES_LABEL: Record<string, string> = {
  es: "pueblos",
  en: "villages",
  fr: "villages",
  de: "Dörfer",
  pt: "aldeias",
  it: "borghi",
  ca: "pobles",
};

type TagBadge = { tag: string; icono: string; color: string; nombre_i18n: Record<string, string>; cantidad: number | null };

export function CollectionView({ data, locale }: { data: CollectionData; locale: string }) {
  const backLabel = BACK_LABELS[locale] ?? BACK_LABELS.es;
  const villagesLabel = VILLAGES_LABEL[locale] ?? VILLAGES_LABEL.es;
  const isMeteo = data.type === "meteo";

  const [bulkTags, setBulkTags] = React.useState<Record<string, TagBadge[]>>({});
  React.useEffect(() => {
    const ids = data.pueblos.map((p) => p.id);
    if (ids.length === 0) return;
    let cancelled = false;
    fetch(`/api/public/caracteristicas/bulk?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setBulkTags(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [data.pueblos]);

  const byCCAA = React.useMemo(() => {
    if (isMeteo) return {};
    const acc: Record<string, Pueblo[]> = {};
    for (const p of data.pueblos) {
      const key = p.comunidad || "—";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
    }
    return acc;
  }, [data.pueblos, isMeteo]);

  const comunidades = React.useMemo(
    () => Object.keys(byCCAA).sort((a, b) => a.localeCompare(b, locale || "es")),
    [byCCAA, locale],
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {data.imageUrl ? (
          <>
            <Image
              src={data.imageUrl}
              alt={data.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/50" />
            <div
              className="absolute inset-0 mix-blend-multiply opacity-40"
              style={{ backgroundColor: data.color }}
            />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${data.color}E6 0%, ${data.color}99 50%, ${data.color}CC 100%)` }}
            />
            <div className="absolute inset-0 bg-black/10" />
          </>
        )}
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Link
            href="/descubre"
            className="inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors mb-6"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
          <div className="mb-4"><HeroIcon name={data.icon} /></div>
          <h1 className="font-serif text-3xl font-bold text-white md:text-5xl tracking-tight">
            {data.title}
          </h1>
          <p className="mt-4 text-base text-white/85 md:text-lg max-w-2xl mx-auto leading-relaxed">
            {data.description}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-sm text-white font-medium">
            <span className="font-bold">{data.count}</span> {villagesLabel}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {data.pueblos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-neutral-500">
              {locale === "es"
                ? "No hay pueblos en esta colección en este momento."
                : "No villages in this collection at this time."}
            </p>
          </div>
        ) : isMeteo ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.pueblos.map((p) => (
              <PuebloCard key={p.id} pueblo={p} color={data.color} tags={bulkTags[String(p.id)]} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {comunidades.map((ccaa) => {
              const flag = getComunidadFlagSrc(ccaa);
              return (
                <div key={ccaa}>
                  <div className="flex items-center gap-3 mb-5">
                    {flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={flag} alt={ccaa} className="h-5 w-7 rounded-sm object-cover" />
                    )}
                    <h2 className="font-serif text-lg font-semibold text-[#3d2c1e] dark:text-neutral-100">
                      {ccaa}
                    </h2>
                    <span className="text-sm text-neutral-400">({byCCAA[ccaa].length})</span>
                    <div className="h-px flex-1 bg-[#e2d5cb] dark:bg-neutral-700" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {byCCAA[ccaa].map((p) => (
                      <PuebloCard key={p.id} pueblo={p} color={data.color} tags={bulkTags[String(p.id)]} locale={locale} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function PuebloCard({ pueblo: p, color, tags, locale = "es" }: { pueblo: Pueblo; color: string; tags?: TagBadge[]; locale?: string }) {
  const flagSrc = getComunidadFlagSrc(p.comunidad);
  const hasPhoto = !!p.foto_destacada;
  const badge = p.highlightExtra ?? (p.habitantes ? `${p.habitantes} hab.` : null);
  const href = p.linkUrl || `/pueblos/${p.slug}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#e2d5cb] bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:bg-neutral-900 dark:border-neutral-700"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#efe2d8] to-[#d4c4b5]">
        {hasPhoto ? (
          <Image
            src={p.foto_destacada!}
            alt={p.linkedName ?? p.nombre}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl opacity-30">🏘️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {badge && (
          <span
            className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-neutral-900 shadow-sm"
            style={{ backgroundColor: color }}
          >
            {badge}
          </span>
        )}

        {p.meteo && p.meteo.temperatureC != null && !p.highlightExtra && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm">
            <WeatherIcon code={p.meteo.weatherCode} />
            <span>{Math.round(p.meteo.temperatureC)}°</span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          {p.linkedName && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70 drop-shadow-sm mb-0.5">
              {p.linkedName}
            </p>
          )}
          <h2 className="font-serif text-lg font-bold text-white drop-shadow-md leading-tight">
            {p.nombre}
          </h2>
        </div>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2">
          {flagSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={flagSrc}
              alt={p.comunidad}
              className="h-4 w-6 rounded-sm object-cover shrink-0"
            />
          )}
          <span className="text-sm text-neutral-600 truncate dark:text-neutral-400">
            {p.provincia} · {p.comunidad}
          </span>
          {p.visitable && (
            <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              Visitable
            </span>
          )}
        </div>
        {p.detalle && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {p.detalle}
          </p>
        )}
        <div className="min-h-[22px]">
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {tags.map((t) => (
                <span
                  key={t.tag}
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
                  style={{ backgroundColor: `${t.color}14` }}
                  title={t.nombre_i18n?.[locale] ?? t.nombre_i18n?.es ?? t.tag}
                >
                  <TagIcon name={t.icono} color={t.color} size={12} />
                  {t.cantidad && t.cantidad > 1 && (
                    <span className="text-[9px] font-semibold leading-none" style={{ color: t.color }}>
                      {t.cantidad}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="h-0.5 w-full mt-auto transition-all group-hover:h-1"
        style={{ backgroundColor: color }}
      />
    </Link>
  );
}
