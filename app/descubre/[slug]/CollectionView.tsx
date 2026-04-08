"use client";

import Link from "next/link";
import Image from "next/image";
import { getComunidadFlagSrc } from "@/lib/flags";
import {
  Sun, CloudSun, Cloudy, CloudFog,
  CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Cloud,
  Landmark, MountainSnow, Waves, TowerControl, FerrisWheel, Palmtree,
  Caravan, PlugZap, Heart, Snowflake, Thermometer, Activity,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  castle: Landmark,
  landmark: Landmark,
  "mountain-snow": MountainSnow,
  mountain: MountainSnow,
  waves: Waves,
  "tower-control": TowerControl,
  "brick-wall": TowerControl,
  shield: TowerControl,
  "ferris-wheel": FerrisWheel,
  home: FerrisWheel,
  palmtree: Palmtree,
  caravan: Caravan,
  "plug-zap": PlugZap,
  zap: PlugZap,
  heart: Heart,
  users: Heart,
  snowflake: Snowflake,
  thermometer: Thermometer,
  wind: Thermometer,
  sun: Sun,
};

const EMOJI_TO_ICON: Record<string, LucideIcon> = {
  "🏰": Landmark,
  "⛰️": MountainSnow,
  "🌊": Waves,
  "🧱": TowerControl,
  "🏘️": FerrisWheel,
  "🏝️": Palmtree,
  "🚐": Caravan,
  "⚡": PlugZap,
  "👨‍👩‍👧‍👦": Heart,
  "❄️": Snowflake,
  "🌬️": Thermometer,
  "☀️": Sun,
};

function HeroIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name] ?? EMOJI_TO_ICON[name];
  if (!Icon) return <Activity size={48} className="text-white/90" strokeWidth={1.5} />;
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

export function CollectionView({ data, locale }: { data: CollectionData; locale: string }) {
  const backLabel = BACK_LABELS[locale] ?? BACK_LABELS.es;
  const villagesLabel = VILLAGES_LABEL[locale] ?? VILLAGES_LABEL.es;

  return (
    <>
      {/* Hero */}
      <section
        className="relative overflow-hidden py-16 md:py-24"
        style={{
          background: `linear-gradient(135deg, ${data.color}E6 0%, ${data.color}99 50%, ${data.color}CC 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
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

      {/* Grid */}
      <section className="mx-auto max-w-[80rem] px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.pueblos.map((p) => (
            <PuebloCard key={p.id} pueblo={p} color={data.color} />
          ))}
        </div>

        {data.pueblos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-neutral-500">
              {locale === "es"
                ? "No hay pueblos en esta colección en este momento."
                : "No villages in this collection at this time."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function PuebloCard({ pueblo: p, color }: { pueblo: Pueblo; color: string }) {
  const flagSrc = getComunidadFlagSrc(p.comunidad);
  const hasPhoto = !!p.foto_destacada;

  return (
    <Link
      href={`/pueblos/${p.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-[#e2d5cb] bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:bg-neutral-900 dark:border-neutral-700"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#efe2d8] to-[#d4c4b5]">
        {hasPhoto ? (
          <Image
            src={p.foto_destacada!}
            alt={p.nombre}
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

        {/* Badge / extra data */}
        {p.highlightExtra && (
          <span
            className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            {p.highlightExtra}
          </span>
        )}
        {p.habitantes && (
          <span
            className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
            style={{ backgroundColor: color }}
          >
            {p.habitantes} hab.
          </span>
        )}

        {/* Meteo overlay */}
        {p.meteo && p.meteo.temperatureC != null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm">
            <WeatherIcon code={p.meteo.weatherCode} />
            <span>{Math.round(p.meteo.temperatureC)}°</span>
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h2 className="font-serif text-lg font-bold text-white drop-shadow-md leading-tight">
            {p.nombre}
          </h2>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 px-4 py-3">
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
      </div>

      {/* Bottom accent */}
      <div
        className="h-0.5 w-full transition-all group-hover:h-1"
        style={{ backgroundColor: color }}
      />
    </Link>
  );
}
