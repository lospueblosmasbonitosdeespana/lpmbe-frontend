import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import {
  seoAbsoluteTitle,
  seoDescription,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  getBaseUrl,
  SITE_NAME,
  type SupportedLocale,
} from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Lead, Headline } from "@/app/components/ui/typography";
import ParadasMap from "@/app/_components/ParadasMap";
import JsonLd from "@/app/components/seo/JsonLd";
import {
  ChevronLeft,
  Clock,
  Phone,
  Mail,
  Globe,
  MapPin,
  Users,
  Tag,
  AlertTriangle,
  Star,
  CalendarX,
  Euro,
  Baby,
} from "lucide-react";
import { getResourceLabel } from "@/lib/resource-types";

export const revalidate = 60;
type HorarioDia = {
  diaSemana: number; // 0=Lun … 6=Dom
  abierto: boolean;
  horaAbre: string | null;
  horaCierra: string | null;
};

type CierreEspecial = {
  fecha: string;
  motivo: string | null;
};

type RecursoDetail = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: string;
  descripcion: string | null;
  horarios: string | null;
  horariosSemana: HorarioDia[];
  cierresEspeciales: CierreEspecial[];
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  fotoUrl: string | null;
  lat: number | null;
  lng: number | null;
  provincia: string | null;
  comunidad: string | null;
  activo: boolean;
  cerradoTemporal: boolean;
  descuentoPorcentaje: number | null;
  precioCents: number | null;
  maxAdultos: number;
  maxMenores: number;
  edadMaxMenor: number;
  pueblo?: { id: number; nombre: string; slug: string } | null;
};

// ── helpers ────────────────────────────────────────────────────────────────

function stripHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toParagraphs(html: string | null): string[] {
  if (!html) return [];
  return stripHtml(html)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function cut(s: string, max = 160): string {
  const c = s.replace(/\s+/g, " ").trim();
  return c.length > max ? c.slice(0, max - 1).trimEnd() + "…" : c;
}

const LOCALE_MAP: Record<string, string> = { ca: "ca-ES", pt: "pt-PT" };

function formatPrecio(cents: number, locale = "es"): string {
  return new Intl.NumberFormat(LOCALE_MAP[locale] ?? locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const PAGE_I18N: Record<
  string,
  {
    notFoundTitle: string;
    seoDiscover: (name: string, tipo: string, pueblo: string) => string;
    home: string;
    resources: string;
    backToResources: string;
    locatedIn: string;
    temporarilyClosed: string;
    priceAndDiscounts: string;
    price: string;
    perPerson: string;
    clubPrice: string;
    joinClub: string;
    discountCta: (discount: number) => string;
    discountJoinQuestion: string;
    clubBannerText: string;
    admission: string;
    clubConditions: string;
    admissionInfo: string;
    adults: string;
    minors: string;
    max: string;
    upToYears: (years: number) => string;
    description: string;
    contact: string;
    location: string;
    inCountry: string;
    footerTitle: string;
    footerText: string;
    footerJoinClub: string;
    footerMoreResources: string;
  }
> = {
  es: {
    notFoundTitle: "Recurso no encontrado",
    seoDiscover: (name, tipo, pueblo) =>
      `Descubre ${name}, ${tipo.toLowerCase()} en ${pueblo}. Horarios, ubicación, contacto y ventajas del Club.`,
    home: "Inicio",
    resources: "Recursos turísticos",
    backToResources: "Volver a Recursos",
    locatedIn: "Ubicado en",
    temporarilyClosed: "Cerrado temporalmente",
    priceAndDiscounts: "Precio y descuentos",
    price: "Precio",
    perPerson: "por persona",
    clubPrice: "Precio con Club",
    joinClub: "Únete al Club",
    discountCta: (discount) => `Los socios del Club disfrutan de un −${discount}% de descuento en este recurso.`,
    discountJoinQuestion: "¿Todavía no eres socio? Únete aquí",
    clubBannerText: "descuentos exclusivos en recursos turísticos de toda la red",
    admission: "Admisión",
    clubConditions: "Condiciones del Club",
    admissionInfo: "Personas admitidas por uso del beneficio con el Club.",
    adults: "Adultos",
    minors: "Menores",
    max: "máx.",
    upToYears: (years) => `(hasta ${years} años)`,
    description: "Descripción",
    contact: "Contacto",
    location: "Ubicación",
    inCountry: "España",
    footerTitle: "¿Eres socio del Club?",
    footerText:
      "Los socios disfrutan de descuentos exclusivos en recursos turísticos, acceso preferente y mucho más en todos los Pueblos Más Bonitos de España.",
    footerJoinClub: "Únete al Club",
    footerMoreResources: "Ver más recursos",
  },
  en: {
    notFoundTitle: "Resource not found",
    seoDiscover: (name, tipo, pueblo) =>
      `Discover ${name}, ${tipo.toLowerCase()} in ${pueblo}. Opening hours, location, contact details and Club benefits.`,
    home: "Home",
    resources: "Tourist resources",
    backToResources: "Back to Resources",
    locatedIn: "Located in",
    temporarilyClosed: "Temporarily closed",
    priceAndDiscounts: "Price and discounts",
    price: "Price",
    perPerson: "per person",
    clubPrice: "Club price",
    joinClub: "Join the Club",
    discountCta: (discount) => `Club members enjoy a −${discount}% discount on this resource.`,
    discountJoinQuestion: "Not a member yet? Join here",
    clubBannerText: "exclusive discounts on tourist resources across the network",
    admission: "Admission",
    clubConditions: "Club conditions",
    admissionInfo: "People allowed when using this Club benefit.",
    adults: "Adults",
    minors: "Children",
    max: "max.",
    upToYears: (years) => `(up to ${years} years old)`,
    description: "Description",
    contact: "Contact",
    location: "Location",
    inCountry: "Spain",
    footerTitle: "Are you a Club member?",
    footerText:
      "Members enjoy exclusive discounts on tourist resources, priority access and much more in all the Most Beautiful Villages of Spain.",
    footerJoinClub: "Join the Club",
    footerMoreResources: "See more resources",
  },
  fr: {
    notFoundTitle: "Ressource introuvable",
    seoDiscover: (name, tipo, pueblo) =>
      `Découvrez ${name}, ${tipo.toLowerCase()} à ${pueblo}. Horaires, localisation, contact et avantages du Club des Amis.`,
    home: "Accueil",
    resources: "Ressources touristiques",
    backToResources: "Retour aux ressources",
    locatedIn: "Situé à",
    temporarilyClosed: "Fermé temporairement",
    priceAndDiscounts: "Prix et réductions",
    price: "Prix",
    perPerson: "par personne",
    clubPrice: "Prix Club",
    joinClub: "Rejoindre le Club",
    discountCta: (discount) => `Les membres du Club des Amis bénéficient d'une réduction de −${discount}% sur cette ressource.`,
    discountJoinQuestion: "Pas encore membre ? Rejoignez-nous ici",
    clubBannerText: "réductions exclusives sur les ressources touristiques du réseau",
    admission: "Admission",
    clubConditions: "Conditions du Club des Amis",
    admissionInfo: "Personnes admises avec cet avantage du Club des Amis.",
    adults: "Adultes",
    minors: "Mineurs",
    max: "max.",
    upToYears: (years) => `(jusqu'à ${years} ans)`,
    description: "Description",
    contact: "Contact",
    location: "Localisation",
    inCountry: "Espagne",
    footerTitle: "Êtes-vous membre du Club des Amis ?",
    footerText:
      "Les membres bénéficient de réductions exclusives sur les ressources touristiques, d'un accès prioritaire et bien plus dans tous les Plus Beaux Villages d'Espagne.",
    footerJoinClub: "Rejoindre le Club des Amis",
    footerMoreResources: "Voir plus de ressources",
  },
  de: {
    notFoundTitle: "Ressource nicht gefunden",
    seoDiscover: (name, tipo, pueblo) =>
      `Entdecke ${name}, ${tipo.toLowerCase()} in ${pueblo}. Öffnungszeiten, Lage, Kontakt und Vorteile des Freundesclubs.`,
    home: "Startseite",
    resources: "Touristische Ressourcen",
    backToResources: "Zurück zu Ressourcen",
    locatedIn: "Gelegen in",
    temporarilyClosed: "Vorübergehend geschlossen",
    priceAndDiscounts: "Preis und Rabatte",
    price: "Preis",
    perPerson: "pro Person",
    clubPrice: "Clubpreis",
    joinClub: "Dem Club beitreten",
    discountCta: (discount) => `Mitglieder des Freundesclubs erhalten ${discount}% Rabatt auf diese Ressource.`,
    discountJoinQuestion: "Noch kein Mitglied? Hier beitreten",
    clubBannerText: "exklusive Rabatte auf touristische Ressourcen im gesamten Netzwerk",
    admission: "Eintritt",
    clubConditions: "Bedingungen des Freundesclubs",
    admissionInfo: "Zugelassene Personen bei Nutzung dieses Freundesclub-Vorteils.",
    adults: "Erwachsene",
    minors: "Minderjährige",
    max: "max.",
    upToYears: (years) => `(bis ${years} Jahre)`,
    description: "Beschreibung",
    contact: "Kontakt",
    location: "Standort",
    inCountry: "Spanien",
    footerTitle: "Bist du Mitglied im Freundesclub?",
    footerText:
      "Mitglieder genießen exklusive Rabatte auf touristische Ressourcen, bevorzugten Zugang und vieles mehr in allen schönsten Dörfern Spaniens.",
    footerJoinClub: "Dem Freundesclub beitreten",
    footerMoreResources: "Mehr Ressourcen anzeigen",
  },
  pt: {
    notFoundTitle: "Recurso não encontrado",
    seoDiscover: (name, tipo, pueblo) =>
      `Descobre ${name}, ${tipo.toLowerCase()} em ${pueblo}. Horários, localização, contacto e vantagens do Clube de Amigos.`,
    home: "Início",
    resources: "Recursos turísticos",
    backToResources: "Voltar aos recursos",
    locatedIn: "Localizado em",
    temporarilyClosed: "Temporariamente encerrado",
    priceAndDiscounts: "Preço e descontos",
    price: "Preço",
    perPerson: "por pessoa",
    clubPrice: "Preço com Clube",
    joinClub: "Junta-te ao Clube",
    discountCta: (discount) => `Os sócios do Clube de Amigos desfrutam de ${discount}% de desconto neste recurso.`,
    discountJoinQuestion: "Ainda não és sócio? Junta-te aqui",
    clubBannerText: "descontos exclusivos em recursos turísticos de toda a rede",
    admission: "Admissão",
    clubConditions: "Condições do Clube de Amigos",
    admissionInfo: "Pessoas admitidas ao usar este benefício do Clube de Amigos.",
    adults: "Adultos",
    minors: "Menores",
    max: "máx.",
    upToYears: (years) => `(até ${years} anos)`,
    description: "Descrição",
    contact: "Contacto",
    location: "Localização",
    inCountry: "Espanha",
    footerTitle: "És sócio do Clube de Amigos?",
    footerText:
      "Os sócios desfrutam de descontos exclusivos em recursos turísticos, acesso preferencial e muito mais em todas as Aldeias Mais Bonitas de Espanha.",
    footerJoinClub: "Junta-te ao Clube de Amigos",
    footerMoreResources: "Ver mais recursos",
  },
  it: {
    notFoundTitle: "Risorsa non trovata",
    seoDiscover: (name, tipo, pueblo) =>
      `Scopri ${name}, ${tipo.toLowerCase()} a ${pueblo}. Orari, posizione, contatti e vantaggi del Club Amici.`,
    home: "Home",
    resources: "Risorse turistiche",
    backToResources: "Torna alle risorse",
    locatedIn: "Situato a",
    temporarilyClosed: "Temporaneamente chiuso",
    priceAndDiscounts: "Prezzo e sconti",
    price: "Prezzo",
    perPerson: "a persona",
    clubPrice: "Prezzo Club",
    joinClub: "Unisciti al Club",
    discountCta: (discount) => `I soci del Club Amici usufruiscono di uno sconto del ${discount}% su questa risorsa.`,
    discountJoinQuestion: "Non sei ancora socio? Iscriviti qui",
    clubBannerText: "sconti esclusivi sulle risorse turistiche di tutta la rete",
    admission: "Accesso",
    clubConditions: "Condizioni Club Amici",
    admissionInfo: "Persone ammesse utilizzando questo vantaggio del Club Amici.",
    adults: "Adulti",
    minors: "Minori",
    max: "max.",
    upToYears: (years) => `(fino a ${years} anni)`,
    description: "Descrizione",
    contact: "Contatti",
    location: "Posizione",
    inCountry: "Spagna",
    footerTitle: "Sei socio del Club Amici?",
    footerText:
      "I soci usufruiscono di sconti esclusivi sulle risorse turistiche, accesso prioritario e molto altro in tutti i Borghi più belli di Spagna.",
    footerJoinClub: "Unisciti al Club Amici",
    footerMoreResources: "Vedi altre risorse",
  },
  ca: {
    notFoundTitle: "Recurs no trobat",
    seoDiscover: (name, tipo, pueblo) =>
      `Descobreix ${name}, ${tipo.toLowerCase()} a ${pueblo}. Horaris, ubicació, contacte i avantatges del Club d'Amics.`,
    home: "Inici",
    resources: "Recursos turístics",
    backToResources: "Tornar a recursos",
    locatedIn: "Ubicat a",
    temporarilyClosed: "Tancat temporalment",
    priceAndDiscounts: "Preu i descomptes",
    price: "Preu",
    perPerson: "per persona",
    clubPrice: "Preu amb Club",
    joinClub: "Uneix-te al Club",
    discountCta: (discount) => `Els socis del Club d'Amics gaudeixen d'un ${discount}% de descompte en aquest recurs.`,
    discountJoinQuestion: "Encara no ets soci? Uneix-te aquí",
    clubBannerText: "descomptes exclusius en recursos turístics de tota la xarxa",
    admission: "Admissió",
    clubConditions: "Condicions Club d'Amics",
    admissionInfo: "Persones admeses en utilitzar aquest benefici del Club d'Amics.",
    adults: "Adults",
    minors: "Menors",
    max: "màx.",
    upToYears: (years) => `(fins a ${years} anys)`,
    description: "Descripció",
    contact: "Contacte",
    location: "Ubicació",
    inCountry: "Espanya",
    footerTitle: "Ets soci del Club d'Amics?",
    footerText:
      "Els socis gaudeixen de descomptes exclusius en recursos turístics, accés preferent i molt més a tots els Pobles Més Bonics d'Espanya.",
    footerJoinClub: "Uneix-te al Club d'Amics",
    footerMoreResources: "Veure més recursos",
  },
};

/** Genera nombres de días de la semana en el locale indicado (lunes=0 → domingo=6) */
function getDayNames(locale: string): string[] {
  const intlLocale = LOCALE_MAP[locale] ?? locale;
  const base = new Date(2024, 0, 1); // lunes 1 enero 2024
  const fmt = new Intl.DateTimeFormat(intlLocale, { weekday: "long" });
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const name = fmt.format(d);
    return name.charAt(0).toUpperCase() + name.slice(1);
  });
}

const HORARIO_I18N: Record<string, { closed: string; open: string; toWord: string; heading: string; closureDays: string }> = {
  es: { closed: "Cerrado", open: "Abierto", toWord: "a", heading: "Horarios", closureDays: "Próximos días de cierre" },
  en: { closed: "Closed", open: "Open", toWord: "to", heading: "Opening hours", closureDays: "Upcoming closure dates" },
  fr: { closed: "Fermé", open: "Ouvert", toWord: "à", heading: "Horaires", closureDays: "Prochaines fermetures" },
  de: { closed: "Geschlossen", open: "Geöffnet", toWord: "bis", heading: "Öffnungszeiten", closureDays: "Kommende Schließtage" },
  pt: { closed: "Fechado", open: "Aberto", toWord: "a", heading: "Horários", closureDays: "Próximos dias de encerramento" },
  it: { closed: "Chiuso", open: "Aperto", toWord: "a", heading: "Orari", closureDays: "Prossime chiusure" },
  ca: { closed: "Tancat", open: "Obert", toWord: "a", heading: "Horaris", closureDays: "Propers dies de tancament" },
};

/** Agrupa días consecutivos con el mismo horario: "Martes a Domingo  10:00 - 19:00" */
function buildHorarioRows(horariosSemana: HorarioDia[], locale = "es"): Array<{ label: string; horario: string; abierto: boolean }> {
  if (!horariosSemana || horariosSemana.length === 0) return [];

  const dias = getDayNames(locale);
  const t = HORARIO_I18N[locale] ?? HORARIO_I18N.es;
  const rows: Array<{ label: string; horario: string; abierto: boolean }> = [];
  const sorted = [...horariosSemana].sort((a, b) => a.diaSemana - b.diaSemana);

  let i = 0;
  while (i < sorted.length) {
    const cur = sorted[i];
    const key = `${cur.abierto}-${cur.horaAbre}-${cur.horaCierra}`;
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j].diaSemana === sorted[j - 1].diaSemana + 1 &&
      `${sorted[j].abierto}-${sorted[j].horaAbre}-${sorted[j].horaCierra}` === key
    ) {
      j++;
    }
    const from = sorted[i];
    const to = sorted[j - 1];
    const label =
      from.diaSemana === to.diaSemana
        ? dias[from.diaSemana]
        : `${dias[from.diaSemana]} ${t.toWord} ${dias[to.diaSemana]}`;

    const horario = from.abierto
      ? from.horaAbre && from.horaCierra
        ? `${from.horaAbre} - ${from.horaCierra}`
        : t.open
      : t.closed;

    rows.push({ label, horario, abierto: from.abierto });
    i = j;
  }
  return rows;
}

function formatFechaCierre(isoDate: string, locale = "es"): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(LOCALE_MAP[locale] ?? locale, { day: "numeric", month: "long", year: "numeric" });
}

/** Detecta si el campo contacto tiene email o teléfono */
function parseContacto(contacto: string | null): { telefono: string | null; email: string | null; resto: string | null } {
  if (!contacto) return { telefono: null, email: null, resto: null };
  const emailMatch = contacto.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
  const telMatch = contacto.match(/(\+?[\d\s\-().]{7,20})/);
  return {
    email: emailMatch ? emailMatch[0] : null,
    telefono: telMatch ? telMatch[0].trim() : null,
    resto: contacto,
  };
}

// ── data fetching ───────────────────────────────────────────────────────────

async function getRecursoBySlug(slug: string, locale?: string): Promise<RecursoDetail | null> {
  const apiUrl = getApiUrl();
  const langQs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
  const res = await fetch(
    `${apiUrl}/public/recursos/${encodeURIComponent(slug)}${langQs}`);
  if (res.status === 404 || !res.ok) return null;
  return res.json();
}

// ── metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const t = PAGE_I18N[locale] ?? PAGE_I18N.es;
  const recurso = await getRecursoBySlug(slug, locale);
  if (!recurso) return { title: t.notFoundTitle };

  const tipoLabel = getResourceLabel(recurso.tipo);
  const puebloName = recurso.pueblo?.nombre ?? recurso.provincia ?? recurso.comunidad ?? "España";
  const title = seoAbsoluteTitle(`${recurso.nombre} en ${puebloName} | ${tipoLabel} | ${SITE_NAME}`);
  const descText = recurso.descripcion ? stripHtml(recurso.descripcion) : "";
  const description = descText
    ? seoDescription(cut(descText, 160))
    : seoDescription(t.seoDiscover(recurso.nombre, tipoLabel, puebloName));
  const path = `/recursos/${recurso.slug ?? slug}`;
  const heroImage = recurso.fotoUrl?.trim() || null;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      type: "article",
      locale: getOGLocale(locale),
      images: heroImage ? [{ url: heroImage, alt: recurso.nombre }] : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

// ── page ────────────────────────────────────────────────────────────────────

export default async function RecursoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const t = PAGE_I18N[locale] ?? PAGE_I18N.es;
  const recurso = await getRecursoBySlug(slug, locale);

  if (!recurso) notFound();

  const heroImage = recurso.fotoUrl?.trim() || null;
  const provCom = [recurso.provincia, recurso.comunidad].filter(Boolean).join(" / ");
  const paradas =
    recurso.lat != null && recurso.lng != null
      ? [{ titulo: recurso.nombre, lat: recurso.lat, lng: recurso.lng, tipo: recurso.tipo }]
      : [];
  const parrafos = toParagraphs(recurso.descripcion);
  const horarioRows = buildHorarioRows(recurso.horariosSemana ?? [], locale);
  const hasHorarios = horarioRows.length > 0 || (recurso.horarios && recurso.horarios.trim());
  const hasCierres = (recurso.cierresEspeciales ?? []).length > 0;
  const tHorario = HORARIO_I18N[locale] ?? HORARIO_I18N.es;
  const contactoParsed = parseContacto(recurso.contacto ?? null);
  const telefono = recurso.telefono || contactoParsed.telefono;
  const email = recurso.email || contactoParsed.email;
  const hasContacto = !!(email || telefono || recurso.web);
  const hasDescuento = recurso.descuentoPorcentaje != null && recurso.descuentoPorcentaje > 0;
  const hasPrecio = recurso.precioCents != null && recurso.precioCents > 0;
  const hasCapacidad = recurso.maxAdultos > 1 || recurso.maxMenores > 0;
  const tipoLabel = getResourceLabel(recurso.tipo);
  const canonicalPath = `/recursos/${recurso.slug ?? slug}`;
  const canonicalUrl = getCanonicalUrl(canonicalPath, locale);
  const baseUrl = getBaseUrl();
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t.home,
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t.resources,
        item: `${baseUrl}/recursos`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: recurso.nombre,
        item: canonicalUrl,
      },
    ],
  };
  const recursoJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: recurso.nombre,
    description: recurso.descripcion ? cut(stripHtml(recurso.descripcion), 280) : undefined,
    url: canonicalUrl,
    image: heroImage || undefined,
    touristType: tipoLabel,
    address: {
      "@type": "PostalAddress",
      addressLocality: recurso.pueblo?.nombre ?? undefined,
      addressRegion: recurso.provincia ?? undefined,
      addressCountry: "ES",
    },
    geo:
      recurso.lat != null && recurso.lng != null
        ? {
            "@type": "GeoCoordinates",
            latitude: recurso.lat,
            longitude: recurso.lng,
          }
        : undefined,
  };

  const breadcrumbs = [
    { label: t.home, href: "/" },
    { label: t.resources, href: "/recursos" },
    { label: recurso.nombre, href: `/recursos/${recurso.slug ?? slug}` },
  ];

  return (
    <main className="bg-background">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={recursoJsonLd} />

      {/* Breadcrumbs */}
      <div className="border-b border-border bg-card">
        <Container size="md">
          <div className="pb-2 pt-6">
            <nav aria-label="Breadcrumb" className="mb-2">
              <ol className="flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbs.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                    {i < breadcrumbs.length - 1 && <span className="text-muted-foreground/50">/</span>}
                  </li>
                ))}
              </ol>
            </nav>
            <Link
              href="/recursos"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.backToResources}
            </Link>
          </div>
        </Container>
      </div>

      {/* Hero image + título */}
      <Section spacing="sm">
        <Container size="md">
          {heroImage && (
            <div className="relative mb-6 overflow-hidden rounded-xl bg-[#faf8f5]" style={{ maxHeight: 520 }}>
              <Image
                src={heroImage}
                alt={recurso.nombre}
                width={900}
                height={520}
                className="h-auto max-h-[520px] w-full object-contain"
                priority
                quality={85}
                unoptimized
              />
            </div>
          )}

          {/* Tipo + título */}
          {provCom && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {provCom}
            </p>
          )}
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            {recurso.nombre}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {recurso.provincia && <span>{recurso.provincia}</span>}
            {recurso.comunidad && (
              <>
                <span aria-hidden="true">·</span>
                <span>{recurso.comunidad}</span>
              </>
            )}
            {recurso.tipo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {getResourceLabel(recurso.tipo)}
                </span>
              </>
            )}
          </div>

          {/* Pueblo asociado */}
          {recurso.pueblo && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t.locatedIn}{" "}
              <Link
                href={`/pueblos/${recurso.pueblo.slug}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {recurso.pueblo.nombre}
              </Link>
            </p>
          )}
        </Container>
      </Section>

      {/* Alertas: cerrado temporal */}
      {recurso.cerradoTemporal && (
        <div className="bg-amber-50 border-y border-amber-200">
          <Container size="md">
            <div className="flex items-center gap-2 py-3 text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="font-medium">{t.temporarilyClosed}</span>
            </div>
          </Container>
        </div>
      )}

      {/* Precios y Club */}
      {(hasPrecio || hasDescuento) && (
        <Section spacing="sm" background="muted">
          <Container size="md">
            <Headline as="h2" className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {t.priceAndDiscounts}
            </Headline>
            <div className="grid gap-4 sm:grid-cols-2">
              {hasPrecio && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
                  <Euro className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.price}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatPrecio(recurso.precioCents!, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.perPerson}</p>
                  </div>
                </div>
              )}
              {hasDescuento && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 shadow-sm">
                  <Star className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      El Club
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      −{recurso.descuentoPorcentaje}%
                    </p>
                    {hasPrecio && (
                      <p className="text-sm font-medium text-foreground">
                        {t.clubPrice}:{" "}
                        {formatPrecio(
                          Math.round(recurso.precioCents! * (1 - recurso.descuentoPorcentaje! / 100))
                          ,
                          locale
                        )}
                      </p>
                    )}
                    <Link
                      href="/club"
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      {t.joinClub} →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Club si solo hay descuento sin precio */}
            {hasDescuento && !hasPrecio && (
              <p className="mt-3 text-sm text-muted-foreground">
                {t.discountCta(recurso.descuentoPorcentaje!)}{" "}
                <Link href="/club" className="font-medium text-primary underline-offset-4 hover:underline">
                  {t.discountJoinQuestion} →
                </Link>
              </p>
            )}
          </Container>
        </Section>
      )}

      {/* CTA Club si no hay precio ni descuento pero queremos animar */}
      {!hasPrecio && !hasDescuento && (
        <div className="border-y border-border bg-primary/5">
          <Container size="md">
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <p className="text-sm text-foreground">
                  <strong>El Club</strong> — {t.clubBannerText}
                </p>
              </div>
              <Link
                href="/club"
                className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t.joinClub} →
              </Link>
            </div>
          </Container>
        </div>
      )}

      {/* Capacidad / admisión */}
      {hasCapacidad && (
        <Section spacing="sm">
          <Container size="md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Headline as="h2" className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t.admission}
              </Headline>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                <Star className="h-3.5 w-3.5" />
                {t.clubConditions}
              </span>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {t.admissionInfo} <Link href="/club" className="font-medium text-primary underline-offset-4 hover:underline">El Club</Link>.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  <strong>{t.adults}:</strong> {t.max} {recurso.maxAdultos}
                </span>
              </div>
              {recurso.maxMenores > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <Baby className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    <strong>{t.minors}:</strong> {t.max} {recurso.maxMenores}
                    {recurso.edadMaxMenor > 0 && ` ${t.upToYears(recurso.edadMaxMenor)}`}
                  </span>
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* Descripción */}
      {parrafos.length > 0 && (
        <Section spacing="sm">
          <Container size="md">
            <Headline as="h2" className="mb-4">
              {t.description}
            </Headline>
            <div className="prose max-w-none space-y-3 text-muted-foreground">
              {parrafos.map((p, i) => (
                <p key={i} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Horarios */}
      {hasHorarios && (
        <Section spacing="sm" background="muted">
          <Container size="md">
            <Headline as="h2" className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {tHorario.heading}
            </Headline>

            {/* Horarios estructurados por día */}
            {horarioRows.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {horarioRows.map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-5 py-3 text-sm ${
                      i > 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <span className="font-medium text-foreground">{row.label}</span>
                    <span
                      className={
                        row.abierto
                          ? "text-foreground"
                          : "font-medium text-muted-foreground"
                      }
                    >
                      {row.horario}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Horarios legacy (texto libre) solo si no hay estructurados */}
            {horarioRows.length === 0 && recurso.horarios?.trim() && (
              <div className="whitespace-pre-wrap rounded-xl border border-border bg-card px-5 py-4 font-mono text-sm text-foreground">
                {recurso.horarios.trim()}
              </div>
            )}

            {/* Cierres especiales */}
            {hasCierres && (
              <div className="mt-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <CalendarX className="h-4 w-4" />
                  {tHorario.closureDays}
                </p>
                <ul className="space-y-1">
                  {recurso.cierresEspeciales.map((c, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
                    >
                      <span className="font-medium">{formatFechaCierre(c.fecha, locale)}</span>
                      {c.motivo && <span className="text-amber-700">— {c.motivo}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Container>
        </Section>
      )}

      {/* Contacto */}
      {hasContacto && (
        <Section spacing="sm">
          <Container size="md">
            <Headline as="h2" className="mb-4">
              {t.contact}
            </Headline>
            <div className="flex flex-col gap-3">
              {telefono && (
                <a
                  href={`tel:${telefono.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span>{telefono}</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span>{email}</span>
                </a>
              )}
              {recurso.web && (
                <a
                  href={recurso.web.startsWith("http") ? recurso.web : `https://${recurso.web}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Globe className="h-4 w-4 shrink-0 text-primary" />
                  <span className="break-all">{recurso.web}</span>
                </a>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* Mapa */}
      {paradas.length > 0 && (
        <Section spacing="sm" background="muted" id="mapa">
          <Container size="md">
            <Headline as="h2" className="mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t.location}
            </Headline>
            <Lead className="mb-4 text-sm">
              {recurso.nombre} en {recurso.provincia ?? recurso.comunidad ?? t.inCountry}
            </Lead>
            <div className="overflow-hidden rounded-xl border border-border [&>div]:!h-[300px]">
              <ParadasMap paradas={paradas} puebloNombre={recurso.nombre} resourceTipo={recurso.tipo} />
            </div>
          </Container>
        </Section>
      )}

      {/* Footer CTA Club */}
      <Section spacing="md" background="default">
        <Container size="md">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-8 text-center sm:px-10">
            <Star className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h2 className="font-serif text-xl font-bold text-foreground sm:text-2xl">
              {t.footerTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              {t.footerText}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/club"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                {t.footerJoinClub}
              </Link>
              <Link
                href="/recursos"
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40"
              >
                {t.footerMoreResources}
              </Link>
            </div>
          </div>
        </Container>
      </Section>

    </main>
  );
}
