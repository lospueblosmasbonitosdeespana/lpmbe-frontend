import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from "@/lib/seo";
import NegocioDetail from "./NegocioDetail";
import NegocioPremiumDetail from "@/app/_components/negocio/NegocioPremiumDetail";

export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; negocioSlug: string }>;
}): Promise<Metadata> {
  const { slug, negocioSlug } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const name = negocioSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const puebloName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/club/${negocioSlug}`;
  const title = seoTitle(tSeo("clubNegocioTitle", { negocio: name, pueblo: puebloName }));
  const description = seoDescription(tSeo("clubNegocioDesc", { negocio: name, pueblo: puebloName }));
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
  };
}

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  scope: string;
  slug: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  contacto?: string | null;
  fotoUrl?: string | null;
  horarios?: string | null;
  cerradoTemporal?: boolean;
  activo?: boolean;
  lat?: number | null;
  lng?: number | null;
  puntosClub?: number | null;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  imagenes?: Array<{ id: number; url: string; alt: string | null; orden: number }>;
  horariosSemana?: Array<{
    diaSemana: number;
    abierto: boolean;
    horaAbre: string | null;
    horaCierra: string | null;
  }>;
};

export default async function NegocioDetailPage({
  params,
}: {
  params: Promise<{ slug: string; negocioSlug: string }>;
}) {
  const { slug, negocioSlug } = await params;
  const locale = await getLocale();
  const tRecursos = await getTranslations("recursos");
  const imprescindibleLabel = tRecursos("imprescindible");
  const API_BASE = getApiUrl();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);

  let recurso: Recurso | null = null;
  try {
    const res = await fetch(
      `${API_BASE}/public/recursos/${negocioSlug}?lang=${locale}`);
    if (res.ok) {
      recurso = await res.json();
    }
  } catch {}

  if (!recurso || !recurso.activo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">Negocio no encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            Este negocio no está disponible o no existe.
          </p>
          <Link
            href={pueblo ? `/pueblos/${pueblo.slug}/club` : "/pueblos"}
            className="mt-4 inline-block text-primary hover:underline"
          >
            Volver al Club
          </Link>
        </div>
      </main>
    );
  }

  const tPremium = await getTranslations("premiumNegocio");
  const isPremium = (recurso as any).planNegocio === "PREMIUM" || (recurso as any).planNegocio === "SELECTION";

  if (isPremium) {
    return (
      <NegocioPremiumDetail
        recurso={recurso as any}
        puebloSlug={slug}
        backHref={pueblo ? `/pueblos/${pueblo.slug}/club` : `/pueblos/${slug}/club`}
        backLabel={pueblo?.nombre ?? "Club"}
        t={(key: string) => tPremium(key as any)}
      />
    );
  }

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    ...(pueblo
      ? [
          { label: pueblo.nombre, href: `/pueblos/${pueblo.slug}` },
          { label: "El Club", href: `/pueblos/${pueblo.slug}/club` },
        ]
      : []),
    { label: recurso.nombre, href: `/pueblos/${slug}/club/${negocioSlug}` },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <NegocioDetail
          recurso={recurso}
          puebloSlug={slug}
          imprescindibleLabel={imprescindibleLabel}
        />
      </div>
    </main>
  );
}
