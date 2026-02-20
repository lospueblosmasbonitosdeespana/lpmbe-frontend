import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getApiUrl } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from "@/lib/seo";
import { getLocale } from "next-intl/server";
import { DetailPageHero } from "@/app/components/ui/detail-page-hero";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Lead, Headline } from "@/app/components/ui/typography";
import ParadasMap from "@/app/_components/ParadasMap";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RecursoDetail = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: string;
  descripcion: string | null;
  horarios: string | null;
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
  pueblo?: { id: number; nombre: string; slug: string } | null;
};

function stripHtmlToPlain(input: string): string {
  if (!input) return "";
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function descripcionToParagraphs(html: string | null): string[] {
  if (!html) return [];
  const text = stripHtmlToPlain(html);
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function cut(input: string, max = 160): string {
  const s = input.replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

async function getRecursoBySlug(slug: string): Promise<RecursoDetail | null> {
  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/public/recursos/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const recurso = await getRecursoBySlug(slug);
  if (!recurso) {
    return {
      title: "Recurso no encontrado | Los Pueblos Más Bonitos de España",
    };
  }

  const locale = (await getLocale()) as SupportedLocale;
  const baseTitle = `${recurso.nombre} · ${recurso.provincia ?? ""} · ${recurso.comunidad ?? ""}`.trim();
  const title = `${recurso.nombre} – Recursos turísticos | Los Pueblos Más Bonitos de España`;
  const descText = recurso.descripcion
    ? stripHtmlToPlain(recurso.descripcion)
    : "";
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
      images: heroImage ? [{ url: heroImage, alt: baseTitle }] : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
    },
  };
}

export default async function RecursoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recurso = await getRecursoBySlug(slug);

  if (!recurso) {
    notFound();
  }

  const heroImage = recurso.fotoUrl?.trim() || null;
  const provCom = [recurso.provincia, recurso.comunidad].filter(Boolean).join(" / ");
  const paradas =
    recurso.lat != null && recurso.lng != null
      ? [{ titulo: recurso.nombre, lat: recurso.lat, lng: recurso.lng }]
      : [];

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Recursos turísticos", href: "/recursos" },
    { label: recurso.nombre, href: `/recursos/${recurso.slug ?? slug}` },
  ];

  const heroMetadata = (
    <div className="flex items-center gap-2">
      {recurso.provincia && <span>{recurso.provincia}</span>}
      {recurso.comunidad && (
        <>
          <span aria-hidden="true">·</span>
          <span>{recurso.comunidad}</span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span className="rounded-md bg-primary/20 px-2 py-0.5 text-sm font-medium">
        {recurso.tipo}
      </span>
    </div>
  );

  const parrafos = descripcionToParagraphs(recurso.descripcion);
  const hasDescripcion = parrafos.length > 0;

  return (
    <main className="bg-background">
      <DetailPageHero
        title={recurso.nombre}
        eyebrow={provCom || recurso.tipo}
        metadata={heroMetadata}
        image={heroImage}
        imageAlt={recurso.nombre}
        breadcrumbs={breadcrumbs}
        backLink={{ label: "Volver a Recursos", href: "/recursos" }}
        variant="fullscreen"
        overlay="gradient"
      />

      {/* Badges: Cerrado temporal / Descuento Club */}
      <div className="border-b border-border bg-card">
        <Container>
          <div className="flex flex-wrap items-center gap-3 py-4">
            {recurso.cerradoTemporal && (
              <span className="rounded-full bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-white">
                Cerrado temporalmente
              </span>
            )}
            {recurso.descuentoPorcentaje != null &&
              recurso.descuentoPorcentaje > 0 && (
                <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                  Descuento Club de Amigos: −{recurso.descuentoPorcentaje}%
                </span>
              )}
            {recurso.descuentoPorcentaje != null &&
              recurso.descuentoPorcentaje > 0 && (
                <Link
                  href="/club"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Únete al Club →
                </Link>
              )}
          </div>
        </Container>
      </div>

      {/* Pueblo asociado */}
      {recurso.pueblo && (
        <Section spacing="sm" background="muted">
          <Container>
            <p className="text-sm text-muted-foreground">
              Ubicado en{" "}
              <Link
                href={`/pueblos/${recurso.pueblo.slug}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {recurso.pueblo.nombre}
              </Link>
            </p>
          </Container>
        </Section>
      )}

      {/* Descripción */}
      {hasDescripcion && (
        <Section spacing="md">
          <Container size="lg">
            <Headline as="h2" className="mb-6">
              Descripción
            </Headline>
            <div className="prose max-w-none space-y-4 text-muted-foreground">
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
      {recurso.horarios && recurso.horarios.trim() && (
        <Section spacing="md">
          <Container size="lg">
            <Headline as="h2" className="mb-4">
              Horarios
            </Headline>
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono text-sm text-foreground">
              {recurso.horarios.trim()}
            </div>
          </Container>
        </Section>
      )}

      {/* Contacto y web */}
      {(recurso.contacto || recurso.web) && (
        <Section spacing="md" background="muted">
          <Container size="lg">
            <Headline as="h2" className="mb-4">
              Contacto
            </Headline>
            <div className="space-y-3">
              {recurso.contacto && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Teléfono / email:{" "}
                  </span>
                  <span className="text-foreground">{recurso.contacto}</span>
                </div>
              )}
              {recurso.web && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Web:{" "}
                  </span>
                  <a
                    href={recurso.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {recurso.web}
                  </a>
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* Mapa */}
      {paradas.length > 0 && (
        <Section spacing="md" id="mapa">
          <Container>
            <div className="mb-6">
              <Title>Ubicación</Title>
              <Lead className="mt-2">
                {recurso.nombre} en {recurso.provincia ?? recurso.comunidad ?? "España"}
              </Lead>
            </div>
            <ParadasMap paradas={paradas} puebloNombre={recurso.nombre} />
          </Container>
        </Section>
      )}

      {/* Back link */}
      <Section spacing="sm">
        <Container>
          <Link
            href="/recursos"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al listado de recursos
          </Link>
        </Container>
      </Section>
    </main>
  );
}
