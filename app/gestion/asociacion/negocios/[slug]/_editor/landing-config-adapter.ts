/**
 * Adaptador entre el schema legacy en español que consume la página pública
 * (RestaurantePremiumDetail.tsx, restaurante-demo-config.ts) y el schema V0
 * en inglés que usa el editor (LandingConfig en landing-config.ts).
 *
 * - legacyToV0(raw): convierte el landingConfig legacy del backend al formato
 *   que entiende el editor V0. Si encuentra `raw.v0`, lo prioriza tal cual.
 * - v0ToLegacy(v0): convierte el config del editor V0 a la forma legacy en
 *   español, para que la página pública refleje los cambios.
 *
 * Esto permite que ambos formatos coexistan: el editor escribe en `raw.v0`
 * (preserva todo) y además mergea las claves legacy regeneradas a partir
 * del V0, así la web pública se actualiza al guardar.
 */

import type {
  LandingConfig,
  HeroConfig,
  ChefConfig,
  PhilosophyConfig,
  MenusConfig,
  DishesConfig,
  AmbianceConfig,
  PracticalInfoConfig,
  AccessConfig,
  MemberOffersConfig,
  StatIcon,
  PhilosophyIcon,
  DietOption,
  MenuItem,
} from './landing-config'
import { DEMO_CONFIG } from './landing-config'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId(prefix: string, idx: number): string {
  return `${prefix}${idx + 1}`
}

function asString(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

function asArray<T>(v: unknown, fallback: T[] = []): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback
}

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

// Diet options: español ↔ inglés
const DIET_ES_TO_V0: Record<string, DietOption> = {
  VEGANO: 'VEGAN',
  VEGETARIANO: 'VEGETARIAN',
  SIN_GLUTEN: 'GLUTEN_FREE',
  SIN_LACTOSA: 'LACTOSE_FREE',
  KETO: 'KETO',
  HALAL: 'HALAL',
  KOSHER: 'KOSHER',
}
const DIET_V0_TO_ES: Record<DietOption, string> = {
  VEGAN: 'VEGANO',
  VEGETARIAN: 'VEGETARIANO',
  GLUTEN_FREE: 'SIN_GLUTEN',
  LACTOSE_FREE: 'SIN_LACTOSA',
  KETO: 'KETO',
  HALAL: 'HALAL',
  KOSHER: 'KOSHER',
}

const STAT_ICONS: StatIcon[] = ['chef-hat', 'award', 'map-pin', 'clock', 'star', 'heart']
const PHILO_ICONS: PhilosophyIcon[] = ['leaf', 'calendar', 'wine', 'flame', 'sprout', 'utensils']

function asStatIcon(v: unknown): StatIcon {
  return STAT_ICONS.includes(v as StatIcon) ? (v as StatIcon) : 'chef-hat'
}
function asPhiloIcon(v: unknown): PhilosophyIcon {
  return PHILO_ICONS.includes(v as PhilosophyIcon) ? (v as PhilosophyIcon) : 'leaf'
}

// ─── legacyToV0 ──────────────────────────────────────────────────────────────

function heroFromLegacy(raw: Record<string, any>): HeroConfig {
  const badgesLegacy = asArray<unknown>(raw.badges)
  return {
    tagline: asString(raw.tagline, DEMO_CONFIG.hero.tagline),
    locationText: asString(raw.ubicacionExtra, DEMO_CONFIG.hero.locationText),
    badges: badgesLegacy.map((b, i) => ({
      id: genId('b', i),
      text: typeof b === 'string' ? b : asString((b as any)?.text, ''),
    })),
  }
}

function chefFromLegacy(raw: Record<string, any>): ChefConfig {
  const c = isPlainObject(raw.chef) ? raw.chef : {}
  const bio = asArray<unknown>(c.bio).map((s) => asString(s))
  return {
    eyebrow: asString(c.eyebrow, DEMO_CONFIG.chef.eyebrow),
    name: asString(c.nombre ?? c.name, DEMO_CONFIG.chef.name),
    bio1: bio[0] ?? asString(c.bio1, DEMO_CONFIG.chef.bio1),
    bio2: bio[1] ?? asString(c.bio2, ''),
    stats: asArray<any>(c.stats).map((s) => ({
      icon: asStatIcon(s?.icon),
      label: asString(s?.label),
      value: asString(s?.value),
    })),
  }
}

function philosophyFromLegacy(raw: Record<string, any>): PhilosophyConfig {
  const f = isPlainObject(raw.filosofia) ? raw.filosofia : isPlainObject(raw.philosophy) ? raw.philosophy : {}
  const pillars = asArray<any>(f.pillars).map((p, i) => ({
    id: genId('p', i),
    icon: asPhiloIcon(p?.icon),
    title: asString(p?.title),
    description: asString(p?.desc ?? p?.description),
  }))
  return {
    eyebrow: asString(f.eyebrow, DEMO_CONFIG.philosophy.eyebrow),
    title: asString(f.title, DEMO_CONFIG.philosophy.title),
    pillars: pillars.length > 0 ? pillars : DEMO_CONFIG.philosophy.pillars,
  }
}

function menusFromLegacy(raw: Record<string, any>): MenusConfig {
  const m = isPlainObject(raw.menus) ? raw.menus : {}
  const items: MenuItem[] = asArray<any>(m.items).map((it, i) => ({
    id: genId('m', i),
    name: asString(it?.nombre ?? it?.name),
    price: asString(it?.precio ?? it?.price),
    priceNote: asString(it?.precioNota ?? it?.priceNote),
    description: asString(it?.descripcion ?? it?.description),
    chip: asString(it?.chip),
    courses: asArray<unknown>(it?.cursos ?? it?.courses).map((c, j) => ({
      id: `${genId('m', i)}-c${j + 1}`,
      text: typeof c === 'string' ? c : asString((c as any)?.text),
    })),
    featured: Boolean(it?.destacado ?? it?.featured),
    badgeText: asString(it?.badge ?? it?.badgeText),
  }))
  return {
    eyebrow: asString(m.eyebrow, DEMO_CONFIG.menus.eyebrow),
    title: asString(m.title, DEMO_CONFIG.menus.title),
    items: items.length > 0 ? items : DEMO_CONFIG.menus.items,
  }
}

function dishesFromLegacy(raw: Record<string, any>): DishesConfig {
  const d = isPlainObject(raw.platos) ? raw.platos : isPlainObject(raw.dishes) ? raw.dishes : {}
  const items = asArray<any>(d.items).map((it, i) => ({
    id: genId('d', i),
    name: asString(it?.nombre ?? it?.name),
    price: asString(it?.precio ?? it?.price),
    wide: Boolean(it?.wide),
    imageUrl: asString(it?.fotoUrl ?? it?.imageUrl),
  }))
  return {
    eyebrow: asString(d.eyebrow, DEMO_CONFIG.dishes.eyebrow),
    title: asString(d.title, DEMO_CONFIG.dishes.title),
    items: items.length > 0 ? items : DEMO_CONFIG.dishes.items,
  }
}

function ambianceFromLegacy(raw: Record<string, any>): AmbianceConfig {
  const a = isPlainObject(raw.ambiente) ? raw.ambiente : isPlainObject(raw.ambiance) ? raw.ambiance : {}
  const blocks = asArray<any>(a.blocks).map((b, i) => ({
    id: genId('a', i),
    imageUrl: asString(b?.fotoUrl ?? b?.imageUrl),
    alt: asString(b?.alt),
    title: asString(b?.title),
    description: asString(b?.body ?? b?.description),
    imageLeft: Boolean(b?.imageLeft),
  }))
  return { blocks: blocks.length > 0 ? blocks : DEMO_CONFIG.ambiance.blocks }
}

function practicalFromLegacy(raw: Record<string, any>): PracticalInfoConfig {
  const ip = isPlainObject(raw.infoPractica) ? raw.infoPractica : isPlainObject(raw.practicalInfo) ? raw.practicalInfo : {}
  const dietas = asArray<unknown>(ip.dietas ?? ip.dietOptions).map((d) => {
    if (typeof d !== 'string') return null
    if (DIET_ES_TO_V0[d]) return DIET_ES_TO_V0[d]
    if (Object.values(DIET_ES_TO_V0).includes(d as DietOption)) return d as DietOption
    return null
  })
  return {
    capacity: asString(ip.aforo ?? ip.capacity, DEMO_CONFIG.practicalInfo.capacity),
    serviceType: asString(ip.tipoServicio ?? ip.serviceType, DEMO_CONFIG.practicalInfo.serviceType),
    avgTime: asString(ip.tiempoMedio ?? ip.avgTime, DEMO_CONFIG.practicalInfo.avgTime),
    childrenPolicy: asString(ip.politicaNinos ?? ip.childrenPolicy, DEMO_CONFIG.practicalInfo.childrenPolicy),
    petPolicy: asString(ip.politicaMascotas ?? ip.petPolicy, DEMO_CONFIG.practicalInfo.petPolicy),
    reservationNote: asString(ip.notaReserva ?? ip.reservationNote, DEMO_CONFIG.practicalInfo.reservationNote),
    dietOptions: dietas.filter((d): d is DietOption => d !== null),
    cancellationText: asString(ip.cancelacion ?? ip.cancellationText, DEMO_CONFIG.practicalInfo.cancellationText),
  }
}

function accessFromLegacy(raw: Record<string, any>): AccessConfig {
  const a = isPlainObject(raw.acceso) ? raw.acceso : isPlainObject(raw.access) ? raw.access : {}
  return {
    parking: asString(a.aparcamiento ?? a.parking, DEMO_CONFIG.access.parking),
    transport: asString(a.transportePublico ?? a.transport, DEMO_CONFIG.access.transport),
    accessibility: asString(a.accesibilidad ?? a.accessibility, DEMO_CONFIG.access.accessibility),
  }
}

function memberOffersFromLegacy(raw: Record<string, any>): MemberOffersConfig {
  // El legacy no guarda ofertas en landingConfig (vienen de tabla aparte),
  // así que devolvemos lo que venga en raw.memberOffers o demo.
  const mo = isPlainObject(raw.memberOffers) ? raw.memberOffers : {}
  const offers = asArray<any>(mo.offers).map((o, i) => ({
    id: o?.id ?? genId('o', i),
    icon: o?.icon ?? 'gift',
    title: asString(o?.title),
    description: asString(o?.description),
    highlight: asString(o?.highlight),
    isFeatured: Boolean(o?.isFeatured),
    badgeText: asString(o?.badgeText),
  }))
  return {
    eyebrow: asString(mo.eyebrow, DEMO_CONFIG.memberOffers.eyebrow),
    title: asString(mo.title, DEMO_CONFIG.memberOffers.title),
    offers: offers.length > 0 ? offers : DEMO_CONFIG.memberOffers.offers,
  }
}

/**
 * Convierte el raw landingConfig (sea legacy en español, V0, o vacío) al
 * formato V0 que entiende el editor.
 *
 * Prioridad:
 *   1. Si raw.v0 ya existe y tiene hero/chef/menus → úsalo.
 *   2. Si no, pero hay claves legacy reconocibles → adáptalas.
 *   3. Si está vacío → DEMO_CONFIG.
 */
export function legacyToV0(raw: unknown): LandingConfig {
  if (!isPlainObject(raw)) return DEMO_CONFIG
  // 1) Ya hay V0 guardado, úsalo (con merge defensivo contra DEMO).
  const v0 = raw.v0
  if (isPlainObject(v0) && (v0.hero || v0.chef || v0.menus)) {
    return {
      hero: v0.hero ?? DEMO_CONFIG.hero,
      chef: v0.chef ?? DEMO_CONFIG.chef,
      philosophy: v0.philosophy ?? DEMO_CONFIG.philosophy,
      menus: v0.menus ?? DEMO_CONFIG.menus,
      dishes: v0.dishes ?? DEMO_CONFIG.dishes,
      ambiance: v0.ambiance ?? DEMO_CONFIG.ambiance,
      practicalInfo: v0.practicalInfo ?? DEMO_CONFIG.practicalInfo,
      access: v0.access ?? DEMO_CONFIG.access,
      memberOffers: v0.memberOffers ?? DEMO_CONFIG.memberOffers,
    }
  }
  // 2) Legacy (español) → adaptar.
  const hasLegacy =
    raw.chef || raw.menus || raw.platos || raw.filosofia || raw.ambiente || raw.infoPractica || raw.acceso
  if (hasLegacy) {
    return {
      hero: heroFromLegacy(raw),
      chef: chefFromLegacy(raw),
      philosophy: philosophyFromLegacy(raw),
      menus: menusFromLegacy(raw),
      dishes: dishesFromLegacy(raw),
      ambiance: ambianceFromLegacy(raw),
      practicalInfo: practicalFromLegacy(raw),
      access: accessFromLegacy(raw),
      memberOffers: memberOffersFromLegacy(raw),
    }
  }
  // 3) Vacío.
  return DEMO_CONFIG
}

// ─── v0ToLegacy ──────────────────────────────────────────────────────────────

/**
 * Convierte el config V0 al formato legacy en español que consume la página
 * pública. El resultado se mergea con el raw original (preservando claves
 * que la web no toca: template, etc.) y se guarda junto a `v0`.
 */
export function v0ToLegacy(cfg: LandingConfig): Record<string, any> {
  return {
    template: 'restaurante-premium',
    badges: cfg.hero.badges.map((b) => b.text).filter(Boolean),
    tagline: cfg.hero.tagline,
    ubicacionExtra: cfg.hero.locationText,
    chef: {
      eyebrow: cfg.chef.eyebrow,
      nombre: cfg.chef.name,
      bio: [cfg.chef.bio1, cfg.chef.bio2].filter(Boolean),
      stats: cfg.chef.stats.map((s) => ({
        icon: s.icon,
        label: s.label,
        value: s.value,
      })),
    },
    filosofia: {
      eyebrow: cfg.philosophy.eyebrow,
      title: cfg.philosophy.title,
      pillars: cfg.philosophy.pillars.map((p) => ({
        icon: p.icon,
        title: p.title,
        desc: p.description,
      })),
    },
    menus: {
      eyebrow: cfg.menus.eyebrow,
      title: cfg.menus.title,
      items: cfg.menus.items.map((m) => {
        const precioNum = parseFloat(m.price)
        return {
          nombre: m.name,
          precio: Number.isFinite(precioNum) ? precioNum : m.price,
          precioNota: m.priceNote || undefined,
          descripcion: m.description,
          chip: m.chip || undefined,
          cursos: m.courses.map((c) => c.text).filter(Boolean),
          destacado: m.featured || undefined,
          badge: m.badgeText || undefined,
        }
      }),
    },
    platos: {
      eyebrow: cfg.dishes.eyebrow,
      title: cfg.dishes.title,
      items: cfg.dishes.items.map((d) => ({
        fotoUrl: d.imageUrl,
        nombre: d.name,
        precio: d.price,
        wide: d.wide,
      })),
    },
    ambiente: {
      blocks: cfg.ambiance.blocks.map((b) => ({
        fotoUrl: b.imageUrl,
        alt: b.alt,
        title: b.title,
        body: b.description,
        imageLeft: b.imageLeft,
      })),
    },
    infoPractica: {
      aforo: cfg.practicalInfo.capacity,
      tipoServicio: cfg.practicalInfo.serviceType,
      tiempoMedio: cfg.practicalInfo.avgTime,
      politicaNinos: cfg.practicalInfo.childrenPolicy,
      politicaMascotas: cfg.practicalInfo.petPolicy,
      notaReserva: cfg.practicalInfo.reservationNote,
      dietas: cfg.practicalInfo.dietOptions.map((d) => DIET_V0_TO_ES[d] ?? d),
      cancelacion: cfg.practicalInfo.cancellationText,
    },
    acceso: {
      aparcamiento: cfg.access.parking,
      transportePublico: cfg.access.transport,
      accesibilidad: cfg.access.accessibility,
    },
  }
}
