/** Gradientes y utilidades para campañas estacionales (sin terracota genérico). */

export const CAMPANA_NOCHE_ROMANTICA = {
  heroGradient: 'linear-gradient(135deg, #9d174d 0%, #6d28d9 42%, #db2777 100%)',
  blobA: 'bg-fuchsia-300/25',
  blobB: 'bg-rose-200/20',
  tabActive: 'bg-white text-pink-950 shadow-sm',
  tabInactive: 'text-white/75 hover:text-white hover:bg-white/10',
  tabBar: 'rounded-xl border border-white/20 bg-black/15 p-1 backdrop-blur-sm',
  sectionAccent: 'border-pink-200/60 bg-gradient-to-br from-pink-50/80 via-violet-50/50 to-fuchsia-50/40 dark:border-pink-900/40 dark:from-pink-950/25 dark:via-violet-950/20 dark:to-fuchsia-950/20',
  primaryButton: 'rounded-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:from-pink-500 hover:to-fuchsia-500 disabled:opacity-50',
  primaryButtonSm: 'rounded-md bg-gradient-to-r from-pink-600 to-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-pink-500 hover:to-fuchsia-500 disabled:opacity-50',
  formCallout: 'rounded-lg border border-pink-200/70 bg-pink-50/40 dark:border-pink-900/50 dark:bg-pink-950/25',
  secondaryOutline: 'rounded-lg border border-pink-300 bg-white/90 px-4 py-2 text-sm font-medium text-pink-900 hover:bg-pink-50 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-100',
} as const;

export const CAMPANA_NAVIDAD = {
  heroGradient: 'linear-gradient(135deg, #14532d 0%, #0f766e 36%, #991b1b 100%)',
  blobA: 'bg-amber-300/30',
  blobB: 'bg-emerald-200/20',
  tabActive: 'bg-amber-50 text-emerald-950 shadow-sm',
  tabInactive: 'text-white/80 hover:text-white hover:bg-white/10',
  tabBar: 'rounded-xl border border-white/20 bg-black/20 p-1 backdrop-blur-sm',
  sectionAccent: 'border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-amber-50/40 to-red-50/50 dark:border-emerald-800/50 dark:from-emerald-950/30 dark:via-amber-950/20 dark:to-red-950/25',
  primaryButton: 'rounded-lg bg-gradient-to-r from-emerald-600 to-red-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-emerald-500 hover:to-red-600 disabled:opacity-50',
  primaryButtonSm: 'rounded-md bg-gradient-to-r from-emerald-600 to-red-700 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:from-emerald-500 hover:to-red-600 disabled:opacity-50',
  formCallout: 'rounded-lg border border-emerald-200/80 bg-emerald-50/35 dark:border-emerald-900/45 dark:bg-emerald-950/25',
  secondaryOutline: 'rounded-lg border border-amber-400/80 bg-amber-50/90 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-emerald-950/50 dark:text-amber-100',
} as const;
