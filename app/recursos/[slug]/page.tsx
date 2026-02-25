import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Lead, Headline } from "@/app/components/ui/typography";
import ParadasMap from "@/app/_components/ParadasMap";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function formatPrecio(cents: number): string {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} €`;
}

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];

/** Agrupa días consecutivos con el mismo horario para mostrarlo compacto: "L-V  09:00-18:00" */
function buildHorarioRows(horariosSemana: HorarioDia[]): Array<{ label: string; horario: string; abierto: boolean }> {
  if (!horariosSemana || horariosSemana.length === 0) return [];

  const rows: Array<{ label: string; horario: string; abierto: boolean }> = [];
  const sorted = [...horariosSemana].sort((a, b) => a.diaSemana - b.diaSemana);

  let i = 0;
  while (i < sorted.length) {
    const cur = sorted[i];
    const key = `${cur.abierto}-${cur.horaAbre}-${cur.horaCierra}`;
    let j = i + 1;
    // agrupar días consecutivos con mismo horario
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
        ? DIAS[from.diaSemana]
        : `${DIAS_SHORT[from.diaSemana]}-${DIAS_SHORT[to.diaSemana]}`;

    const horario = from.abierto
      ? from.horaAbre && from.horaCierra
        ? `${from.horaAbre} - ${from.horaCierra}`
        : "Abierto"
      : "Cerrado";

    rows.push({ label, horario, abierto: from.abierto });
    i = j;
  }
  return rows;
}

function formatFechaCierre(isoDate: string): string {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
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
    `${apiUrl}/public/recursos/${encodeURIComponent(slug)}${langQs}`,
    { cache: "no-store" }
  );
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
  const recurso = await getRecursoBySlug(slug, locale);
  if (!recurso) return { title: "Recurso no encontrado | Los Pueblos Más Bonitos de España" };

  const title = `${recurso.nombre} – Recursos turísticos | Los Pueblos Más Bonitos de España`;
  const descText = recurso.descripcion ? stripHtml(recurso.descripcion) : "";
  const description = descText
    ? cut(descText, 160)
    : `Recurso turístico recomendado por la Asociación en ${recurso.provincia ?? recurso.comunidad ?? "España"}.`;
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
  const recurso = await getRecursoBySlug(slug, locale);

  if (!recurso) notFound();

  const heroImage = recurso.fotoUrl?.trim() || null;
  const provCom = [recurso.provincia, recurso.comunidad].filter(Boolean).join(" / ");
  const paradas =
    recurso.lat != null && recurso.lng != null
      ? [{ titulo: recurso.nombre, lat: recurso.lat, lng: recurso.lng, tipo: recurso.tipo }]
      : [];
  const parrafos = toParagraphs(recurso.descripcion);
  const horarioRows = buildHorarioRows(recurso.horariosSemana ?? []);
  const hasHorarios = horarioRows.length > 0 || (recurso.horarios && recurso.horarios.trim());
  const hasCierres = (recurso.cierresEspeciales ?? []).length > 0;
  const contacto = parseContacto(recurso.contacto ?? null);
  const hasContacto = !!(contacto.email || contacto.telefono || recurso.web);
  const hasDescuento = recurso.descuentoPorcentaje != null && recurso.descuentoPorcentaje > 0;
  const hasPrecio = recurso.precioCents != null && recurso.precioCents > 0;
  const hasCapacidad = recurso.maxAdultos > 1 || recurso.maxMenores > 0;

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Recursos turísticos", href: "/recursos" },
    { label: recurso.nombre, href: `/recursos/${recurso.slug ?? slug}` },
  ];

  return (
    <main className="bg-background">

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
              Volver a Recursos
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
              Ubicado en{" "}
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
              <span className="font-medium">Cerrado temporalmente</span>
            </div>
          </Container>
        </div>
      )}

      {/* Precios y Club de Amigos */}
      {(hasPrecio || hasDescuento) && (
        <Section spacing="sm" background="muted">
          <Container size="md">
            <Headline as="h2" className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Precio y descuentos
            </Headline>
            <div className="grid gap-4 sm:grid-cols-2">
              {hasPrecio && (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
                  <Euro className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Precio
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatPrecio(recurso.precioCents!)}
                    </p>
                    <p className="text-xs text-muted-foreground">por persona</p>
                  </div>
                </div>
              )}
              {hasDescuento && (
                <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 shadow-sm">
                  <Star className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Club de Amigos
                    </p>
                    <p className="mt-1 text-2xl font-bold text-primary">
                      −{recurso.descuentoPorcentaje}%
                    </p>
                    {hasPrecio && (
                      <p className="text-sm font-medium text-foreground">
                        Precio con Club:{" "}
                        {formatPrecio(
                          Math.round(recurso.precioCents! * (1 - recurso.descuentoPorcentaje! / 100))
                        )}
                      </p>
                    )}
                    <Link
                      href="/club"
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      Únete al Club →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Club si solo hay descuento sin precio */}
            {hasDescuento && !hasPrecio && (
              <p className="mt-3 text-sm text-muted-foreground">
                Los socios del Club de Amigos disfrutan de un{" "}
                <strong className="text-primary">−{recurso.descuentoPorcentaje}% de descuento</strong>{" "}
                en este recurso.{" "}
                <Link href="/club" className="font-medium text-primary underline-offset-4 hover:underline">
                  ¿Todavía no eres socio? Únete aquí →
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
                  <strong>Club de Amigos</strong> — descuentos exclusivos en recursos turísticos de toda la red
                </p>
              </div>
              <Link
                href="/club"
                className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Únete al Club →
              </Link>
            </div>
          </Container>
        </div>
      )}

      {/* Capacidad / admisión */}
      {hasCapacidad && (
        <Section spacing="sm">
          <Container size="md">
            <Headline as="h2" className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Admisión
            </Headline>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  <strong>Adultos:</strong> máx. {recurso.maxAdultos}
                </span>
              </div>
              {recurso.maxMenores > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
                  <Baby className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    <strong>Menores:</strong> máx. {recurso.maxMenores}
                    {recurso.edadMaxMenor > 0 && ` (hasta ${recurso.edadMaxMenor} años)`}
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
              Descripción
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
              Horarios
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
                    <span className="w-28 font-medium text-foreground">{row.label}</span>
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
                  Próximos días de cierre
                </p>
                <ul className="space-y-1">
                  {recurso.cierresEspeciales.map((c, i) => (
                    <li
                      key={i}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
                    >
                      <span className="font-medium">{formatFechaCierre(c.fecha)}</span>
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
              Contacto
            </Headline>
            <div className="flex flex-col gap-3">
              {contacto.telefono && (
                <a
                  href={`tel:${contacto.telefono.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span>{contacto.telefono}</span>
                </a>
              )}
              {contacto.email && (
                <a
                  href={`mailto:${contacto.email}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span>{contacto.email}</span>
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
              Ubicación
            </Headline>
            <Lead className="mb-4 text-sm">
              {recurso.nombre} en {recurso.provincia ?? recurso.comunidad ?? "España"}
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
              ¿Eres socio del Club de Amigos?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Los socios disfrutan de descuentos exclusivos en recursos turísticos, acceso preferente y mucho más en todos los Pueblos Más Bonitos de España.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/club"
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Únete al Club de Amigos
              </Link>
              <Link
                href="/recursos"
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40"
              >
                Ver más recursos
              </Link>
            </div>
          </div>
        </Container>
      </Section>

    </main>
  );
}
