import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Tarjetas modernas tipo "Club de Amigos" para los hubs principales:
 * - /gestion/asociacion
 * - /gestion/pueblos/[slug]
 *
 * Cada item lleva su propio icono SVG. Los iconos NO se repiten dentro de
 * la misma página (son únicos). El icono "metrics" se reutiliza en ambas
 * páginas para que la sección de Métricas tenga la misma identidad visual.
 */

// ────────────────────────────────────────────────────────────────────────
// Tonos: gradiente del icono, color de texto, glow y borde
// ────────────────────────────────────────────────────────────────────────

type ToneClasses = {
  /** Borde lateral de la tarjeta + halo */
  border: string;
  borderHover: string;
  /** Gradiente del fondo de la tarjeta */
  cardBg: string;
  /** Blob decorativo desenfocado */
  blob: string;
  /** Gradiente del cuadrado del icono */
  iconBg: string;
  iconShadow: string;
  /** Pill (badge) */
  badgeBg: string;
  badgeText: string;
  badgeRing: string;
};

const TONES: Record<string, ToneClasses> = {
  amber: {
    border: 'border-amber-200/80',
    borderHover: 'hover:border-amber-300',
    cardBg: 'from-amber-50/70',
    blob: 'bg-amber-200/40 dark:bg-amber-800/20',
    iconBg: 'from-amber-500 to-amber-600',
    iconShadow: 'shadow-amber-200/60',
    badgeBg: 'bg-amber-100 dark:bg-amber-950',
    badgeText: 'text-amber-700 dark:text-amber-200',
    badgeRing: 'ring-amber-200 dark:ring-amber-800',
  },
  rose: {
    border: 'border-rose-200/80',
    borderHover: 'hover:border-rose-300',
    cardBg: 'from-rose-50/70',
    blob: 'bg-rose-200/40 dark:bg-rose-800/20',
    iconBg: 'from-rose-500 to-rose-600',
    iconShadow: 'shadow-rose-200/60',
    badgeBg: 'bg-rose-100 dark:bg-rose-950',
    badgeText: 'text-rose-700 dark:text-rose-200',
    badgeRing: 'ring-rose-200 dark:ring-rose-800',
  },
  violet: {
    border: 'border-violet-200/80',
    borderHover: 'hover:border-violet-300',
    cardBg: 'from-violet-50/70',
    blob: 'bg-violet-200/40 dark:bg-violet-800/20',
    iconBg: 'from-violet-500 to-violet-600',
    iconShadow: 'shadow-violet-200/60',
    badgeBg: 'bg-violet-100 dark:bg-violet-950',
    badgeText: 'text-violet-700 dark:text-violet-200',
    badgeRing: 'ring-violet-200 dark:ring-violet-800',
  },
  emerald: {
    border: 'border-emerald-200/80',
    borderHover: 'hover:border-emerald-300',
    cardBg: 'from-emerald-50/70',
    blob: 'bg-emerald-200/40 dark:bg-emerald-800/20',
    iconBg: 'from-emerald-500 to-emerald-600',
    iconShadow: 'shadow-emerald-200/60',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950',
    badgeText: 'text-emerald-700 dark:text-emerald-200',
    badgeRing: 'ring-emerald-200 dark:ring-emerald-800',
  },
  sky: {
    border: 'border-sky-200/80',
    borderHover: 'hover:border-sky-300',
    cardBg: 'from-sky-50/70',
    blob: 'bg-sky-200/40 dark:bg-sky-800/20',
    iconBg: 'from-sky-500 to-sky-600',
    iconShadow: 'shadow-sky-200/60',
    badgeBg: 'bg-sky-100 dark:bg-sky-950',
    badgeText: 'text-sky-700 dark:text-sky-200',
    badgeRing: 'ring-sky-200 dark:ring-sky-800',
  },
  teal: {
    border: 'border-teal-200/80',
    borderHover: 'hover:border-teal-300',
    cardBg: 'from-teal-50/70',
    blob: 'bg-teal-200/40 dark:bg-teal-800/20',
    iconBg: 'from-teal-500 to-teal-600',
    iconShadow: 'shadow-teal-200/60',
    badgeBg: 'bg-teal-100 dark:bg-teal-950',
    badgeText: 'text-teal-700 dark:text-teal-200',
    badgeRing: 'ring-teal-200 dark:ring-teal-800',
  },
  cyan: {
    border: 'border-cyan-200/80',
    borderHover: 'hover:border-cyan-300',
    cardBg: 'from-cyan-50/70',
    blob: 'bg-cyan-200/40 dark:bg-cyan-800/20',
    iconBg: 'from-cyan-500 to-cyan-600',
    iconShadow: 'shadow-cyan-200/60',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950',
    badgeText: 'text-cyan-700 dark:text-cyan-200',
    badgeRing: 'ring-cyan-200 dark:ring-cyan-800',
  },
  indigo: {
    border: 'border-indigo-200/80',
    borderHover: 'hover:border-indigo-300',
    cardBg: 'from-indigo-50/70',
    blob: 'bg-indigo-200/40 dark:bg-indigo-800/20',
    iconBg: 'from-indigo-500 to-indigo-600',
    iconShadow: 'shadow-indigo-200/60',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950',
    badgeText: 'text-indigo-700 dark:text-indigo-200',
    badgeRing: 'ring-indigo-200 dark:ring-indigo-800',
  },
  fuchsia: {
    border: 'border-fuchsia-200/80',
    borderHover: 'hover:border-fuchsia-300',
    cardBg: 'from-fuchsia-50/70',
    blob: 'bg-fuchsia-200/40 dark:bg-fuchsia-800/20',
    iconBg: 'from-fuchsia-500 to-fuchsia-600',
    iconShadow: 'shadow-fuchsia-200/60',
    badgeBg: 'bg-fuchsia-100 dark:bg-fuchsia-950',
    badgeText: 'text-fuchsia-700 dark:text-fuchsia-200',
    badgeRing: 'ring-fuchsia-200 dark:ring-fuchsia-800',
  },
  pink: {
    border: 'border-pink-200/80',
    borderHover: 'hover:border-pink-300',
    cardBg: 'from-pink-50/70',
    blob: 'bg-pink-200/40 dark:bg-pink-800/20',
    iconBg: 'from-pink-500 to-pink-600',
    iconShadow: 'shadow-pink-200/60',
    badgeBg: 'bg-pink-100 dark:bg-pink-950',
    badgeText: 'text-pink-700 dark:text-pink-200',
    badgeRing: 'ring-pink-200 dark:ring-pink-800',
  },
  orange: {
    border: 'border-orange-200/80',
    borderHover: 'hover:border-orange-300',
    cardBg: 'from-orange-50/70',
    blob: 'bg-orange-200/40 dark:bg-orange-800/20',
    iconBg: 'from-orange-500 to-orange-600',
    iconShadow: 'shadow-orange-200/60',
    badgeBg: 'bg-orange-100 dark:bg-orange-950',
    badgeText: 'text-orange-700 dark:text-orange-200',
    badgeRing: 'ring-orange-200 dark:ring-orange-800',
  },
  red: {
    border: 'border-red-200/80',
    borderHover: 'hover:border-red-300',
    cardBg: 'from-red-50/70',
    blob: 'bg-red-200/40 dark:bg-red-800/20',
    iconBg: 'from-red-500 to-red-600',
    iconShadow: 'shadow-red-200/60',
    badgeBg: 'bg-red-100 dark:bg-red-950',
    badgeText: 'text-red-700 dark:text-red-200',
    badgeRing: 'ring-red-200 dark:ring-red-800',
  },
  yellow: {
    border: 'border-yellow-200/80',
    borderHover: 'hover:border-yellow-300',
    cardBg: 'from-yellow-50/70',
    blob: 'bg-yellow-200/40 dark:bg-yellow-800/20',
    iconBg: 'from-yellow-500 to-yellow-600',
    iconShadow: 'shadow-yellow-200/60',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950',
    badgeText: 'text-yellow-700 dark:text-yellow-200',
    badgeRing: 'ring-yellow-200 dark:ring-yellow-800',
  },
  lime: {
    border: 'border-lime-200/80',
    borderHover: 'hover:border-lime-300',
    cardBg: 'from-lime-50/70',
    blob: 'bg-lime-200/40 dark:bg-lime-800/20',
    iconBg: 'from-lime-500 to-lime-600',
    iconShadow: 'shadow-lime-200/60',
    badgeBg: 'bg-lime-100 dark:bg-lime-950',
    badgeText: 'text-lime-700 dark:text-lime-200',
    badgeRing: 'ring-lime-200 dark:ring-lime-800',
  },
  slate: {
    border: 'border-slate-200/80',
    borderHover: 'hover:border-slate-300',
    cardBg: 'from-slate-50/70',
    blob: 'bg-slate-200/40 dark:bg-slate-800/20',
    iconBg: 'from-slate-600 to-slate-800',
    iconShadow: 'shadow-slate-200/60',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-200',
    badgeRing: 'ring-slate-200 dark:ring-slate-700',
  },
  stone: {
    border: 'border-stone-200/80',
    borderHover: 'hover:border-stone-300',
    cardBg: 'from-stone-50/80',
    blob: 'bg-stone-200/40 dark:bg-stone-800/20',
    iconBg: 'from-stone-500 to-stone-700',
    iconShadow: 'shadow-stone-200/60',
    badgeBg: 'bg-stone-100 dark:bg-stone-800',
    badgeText: 'text-stone-700 dark:text-stone-200',
    badgeRing: 'ring-stone-200 dark:ring-stone-700',
  },
  // Tonos festivos
  romance: {
    border: 'border-pink-200/80',
    borderHover: 'hover:border-pink-300',
    cardBg: 'from-pink-50/70',
    blob: 'bg-pink-200/40 dark:bg-pink-800/20',
    iconBg: 'from-pink-500 via-fuchsia-500 to-rose-500',
    iconShadow: 'shadow-pink-200/60',
    badgeBg: 'bg-pink-100 dark:bg-pink-950',
    badgeText: 'text-pink-700 dark:text-pink-200',
    badgeRing: 'ring-pink-200 dark:ring-pink-800',
  },
  holiday: {
    border: 'border-emerald-200/80',
    borderHover: 'hover:border-emerald-300',
    cardBg: 'from-emerald-50/70',
    blob: 'bg-red-200/30 dark:bg-red-800/20',
    iconBg: 'from-emerald-500 via-amber-400 to-red-500',
    iconShadow: 'shadow-emerald-200/60',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950',
    badgeText: 'text-emerald-700 dark:text-emerald-200',
    badgeRing: 'ring-emerald-200 dark:ring-emerald-800',
  },
};

export type ModernTone = keyof typeof TONES;

// ────────────────────────────────────────────────────────────────────────
// Catálogo de iconos. Cada uno representa una tarea concreta. NO se
// repiten. Estilo line-icon coherente: stroke 1.7, sin fill, fondo
// transparente, color del propio gradiente del icono (los pinta de blanco).
// ────────────────────────────────────────────────────────────────────────

const ICON_SVG_CLASS = 'h-5 w-5 text-white';

function I({ children }: { children: ReactNode }) {
  return (
    <svg
      className={ICON_SVG_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS = {
  // ── Identidad / contenidos ─────────────────────────────────────────
  home: <I><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6h-6v6H5a2 2 0 01-2-2z" /></I>,
  cinema: <I><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M7 6V4M11 6V4M15 6V4M19 6V4M3 11h18" /></I>,
  routes: <I><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19c4 0 4-7 4-7s0-7 4-7" /></I>,
  newspaper: <I><rect x="3" y="5" width="14" height="15" rx="1.5" /><path d="M17 9h4v9a2 2 0 01-2 2h-2M6 9h7M6 13h7M6 17h4" /></I>,
  bell: <I><path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 004 0" /></I>,
  alertTriangle: <I><path d="M12 4l9.5 16h-19z" /><path d="M12 11v4M12 18.5h.01" /></I>,
  layers: <I><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5M3 18l9 5 9-5" /></I>,
  // ── Club / negocios / app ───────────────────────────────────────────
  members: <I><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17.5" cy="9" r="2.5" /><path d="M14 18.5c1-2 2.5-3 3.5-3s2.5 1 3.5 3" /></I>,
  castle: <I><path d="M3 21V9l3 1V7l3-1 3 1V4l3 1 3-1v3l3 1v12" /><path d="M9 21v-5h6v5M11 12h2" /></I>,
  storefront: <I><path d="M4 7l1-3h14l1 3M4 7v13h16V7M4 7h16M9 13h6M9 13v7M15 13v7" /></I>,
  starShield: <I><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M12 8.5l1.4 2.8 3 .4-2.2 2.1.5 3-2.7-1.4-2.7 1.4.5-3-2.2-2.1 3-.4z" /></I>,
  cart: <I><path d="M3 4h2l2.5 11.5a2 2 0 002 1.5h7.5a2 2 0 002-1.5L21 8H6" /><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /></I>,
  phoneApp: <I><rect x="6" y="3" width="12" height="18" rx="2" /><circle cx="12" cy="17" r="1" /><path d="M9 7h6M9 10h6" /></I>,
  // ── Comunicación y prensa ───────────────────────────────────────────
  megaphone: <I><path d="M3 11l13-5v12L3 13z" /><path d="M3 11v2M16 6c2 0 4 1.5 4 5s-2 5-4 5" /></I>,
  microphone: <I><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3M9 21h6" /></I>,
  envelope: <I><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></I>,
  // ── Documentación / mapa páginas ───────────────────────────────────
  sitemap: <I><rect x="9" y="3" width="6" height="4" rx="1" /><rect x="3" y="17" width="6" height="4" rx="1" /><rect x="15" y="17" width="6" height="4" rx="1" /><path d="M12 7v4M6 17v-2h12v2M12 11v4" /></I>,
  // ── Archivos, datos y marca ────────────────────────────────────────
  cityHall: <I><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M9 14h6v7M11 8h2" /></I>,
  photo: <I><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M5 19l5-5 4 3 3-3 4 5" /></I>,
  /** "metrics" — usado en Asociación (Datos) y en Pueblos (Métricas) — MISMO ICONO */
  metrics: <I><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /><circle cx="7" cy="14" r="0.8" /><circle cx="10" cy="11" r="0.8" /><circle cx="13" cy="14" r="0.8" /><circle cx="18" cy="8" r="0.8" /></I>,
  trophy: <I><path d="M7 5h10v3a5 5 0 01-10 0z" /><path d="M5 5h2v3a3 3 0 01-3-3zM19 5h-2v3a3 3 0 003-3z" /><path d="M9 14h6l-1 4h-4z" /><path d="M8 21h8" /></I>,
  reportMail: <I><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 8l9 6 9-6" /><path d="M7 13h4M7 16h7" /></I>,
  cog: <I><circle cx="12" cy="12" r="3" /><path d="M19.4 15a7.8 7.8 0 000-6l1.6-1.2-2-3.4-1.9.7a7.8 7.8 0 00-5.2-3l-.3-2h-3.4l-.3 2a7.8 7.8 0 00-5.2 3l-1.9-.7-2 3.4L1.6 9a7.8 7.8 0 000 6L0 16.2l2 3.4 1.9-.7a7.8 7.8 0 005.2 3l.3 2h3.4l.3-2a7.8 7.8 0 005.2-3l1.9.7 2-3.4z" /></I>,
  ribbon: <I><circle cx="12" cy="9" r="6" /><path d="M9 14l-3 7 3-1.5L11 22l1-7M15 14l3 7-3-1.5L13 22l-1-7" /></I>,
  fileDoc: <I><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></I>,
  inbox: <I><path d="M3 13l3-8h12l3 8M3 13v6a2 2 0 002 2h14a2 2 0 002-2v-6" /><path d="M3 13h5l1 2h6l1-2h5" /></I>,
  // ── Campañas estacionales (compartidas asociación + pueblos) ───────
  heart: <I><path d="M12 21s-7-4.5-9.3-9C1 9 3 5 6.5 5c1.9 0 3.4.9 4.5 2.4C12.1 5.9 13.6 5 15.5 5 19 5 21 9 19.3 12 17 16.5 12 21 12 21z" /></I>,
  cross: <I><path d="M10 3h4v6h6v4h-6v8h-4v-8H4V9h6z" /></I>,
  pineTree: <I><path d="M12 3l4 5h-2l3 4h-2l3 4H5l3-4H6l3-4H7z" /><path d="M11 16h2v4h-2z" /></I>,
  // ── Pueblo: identidad, comunicación, mapa ──────────────────────────
  tagLabel: <I><path d="M3 12V4h8l9.5 9.5a2 2 0 010 2.8l-5.2 5.2a2 2 0 01-2.8 0L3 12z" /><circle cx="7" cy="8" r="1.4" /></I>,
  pencil: <I><path d="M14 4l6 6-11 11H3v-6z" /><path d="M13 5l6 6" /></I>,
  barChart: <I><path d="M4 21h16" /><rect x="6" y="14" width="3" height="6" /><rect x="11" y="9" width="3" height="11" /><rect x="16" y="4" width="3" height="16" /></I>,
  tower: <I><path d="M7 21V8l5-4 5 4v13" /><path d="M7 8h10M9 12h6M9 16h6M11 21v-3h2v3" /></I>,
  trafficLight: <I><rect x="8" y="2" width="8" height="20" rx="3" /><circle cx="12" cy="7" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="17" r="1.5" /></I>,
  socialChat: <I><rect x="3" y="3" width="18" height="14" rx="2" /><path d="M8 17l-2 4 5-3M8 9h8M8 12h5" /></I>,
  webcam: <I><circle cx="12" cy="9" r="6" /><circle cx="12" cy="9" r="2.5" /><path d="M12 15v4M8 21h8" /></I>,
  pinMap: <I><path d="M12 21s-7-7-7-12a7 7 0 1114 0c0 5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></I>,
  servicesPin: <I><path d="M5 9.5C5 5.9 8 3 12 3s7 2.9 7 6.5c0 5-7 11-7 11S5 14.5 5 9.5z" /><path d="M9 9h2v3h-2zM11 9h1.5a1.5 1.5 0 010 3H11" /></I>,
  trail: <I><path d="M5 20l3-7-2-4 4-2 1-4 4 1 3-3 2 4-1 4 3 3-3 2 1 4-4 1-3 1-3-3" /></I>,
  key: <I><circle cx="8" cy="14" r="4" /><path d="M11 11l9-9M16 6l3 3M14 8l3 3" /></I>,
  // ── Club: nuevos accesos ───────────────────────────────────────────
  mountain: <I><path d="M3 20l5-9 4 6 3-4 6 7z" /><path d="M9 11l1.5-2L12 11" /></I>,
  sparkles: <I><path d="M12 3l1.8 4.6 4.6 1.8-4.6 1.8L12 15.8l-1.8-4.6L5.6 9.4l4.6-1.8z" /><path d="M19 16l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" /></I>,
  /** Cabeza de "agente" (robot estilizado) — usado en /gestion/asociacion → Agentes IA. */
  agentBot: <I><rect x="5" y="8" width="14" height="11" rx="2.5" /><path d="M9 13h.01M15 13h.01" /><path d="M12 4v4M9 19v2M15 19v2M2 13h3M19 13h3" /></I>,
  /** Pila de monedas con símbolo €. Sección "Subvenciones asociación" (output del Sabueso). */
  coins: <I><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M3 11v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" /><path d="M19 14a3 3 0 100-6M19 12h-2.2M19 10h-2.2" /></I>,
};

export type ModernIconKey = keyof typeof ICONS;

// ────────────────────────────────────────────────────────────────────────
// Componente tarjeta
// ────────────────────────────────────────────────────────────────────────

export function GestionHubModernCard({
  href,
  title,
  description,
  iconKey,
  tone = 'amber',
  badge,
  ctaLabel,
  external,
  disabled,
}: {
  href: string;
  title: string;
  description: string;
  iconKey: ModernIconKey;
  tone?: ModernTone;
  badge?: string;
  ctaLabel?: string;
  external?: boolean;
  disabled?: boolean;
}) {
  const t = TONES[tone] ?? TONES.amber;
  const cta = ctaLabel ?? (external ? 'Abrir' : 'Acceder');
  const icon = ICONS[iconKey];

  if (disabled) {
    return (
      <article className="relative flex min-h-[180px] flex-col overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/30 p-5 opacity-70">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.iconBg} opacity-50 shadow-md ${t.iconShadow}`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className="mt-auto pt-4 text-xs font-medium text-muted-foreground">No disponible</span>
      </article>
    );
  }

  const Inner = (
    <>
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity group-hover:opacity-80 ${t.blob}`}
        aria-hidden
      />
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${t.iconBg} shadow-md ${t.iconShadow} transition-transform duration-200 group-hover:scale-105`}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              {badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${t.badgeBg} ${t.badgeText} ${t.badgeRing}`}
                >
                  {badge}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <span className={`mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold ${t.badgeText} transition-colors`}>
          {cta}
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </>
  );

  const cardCls = `group relative flex min-h-[180px] flex-col overflow-hidden rounded-2xl border ${t.border} bg-gradient-to-br ${t.cardBg} via-white to-white p-5 shadow-sm transition-all hover:-translate-y-0.5 ${t.borderHover} hover:shadow-lg dark:border-opacity-50 dark:from-card dark:via-card dark:to-card`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cardCls}>
        {Inner}
      </a>
    );
  }

  return (
    <Link href={href} className={cardCls}>
      {Inner}
    </Link>
  );
}
