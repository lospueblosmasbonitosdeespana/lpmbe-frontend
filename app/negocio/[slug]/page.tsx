import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from "@/lib/seo";
import { getPlanFeatures } from "@/lib/plan-features";
import { NegocioLanding } from "./NegocioLanding";
import JsonLd from "@/app/components/seo/JsonLd";

export const revalidate = 60;

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  scope: string;
  slug: string;
  activo?: boolean;
  descripcion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  servicios?: string[] | null;
  landingConfig?: Record<string, any> | null;
  planNegocio?: string;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  imagenes?: Array<{ id: number; url: string; alt: string | null; orden: number }>;
  ofertas?: Array<{
    id: number;
    tipoOferta: string;
    titulo: string;
    descripcion?: string | null;
    descuentoPorcentaje?: number | null;
    valorFijoCents?: number | null;
    destacada: boolean;
  }>;
};

async function fetchRecurso(slug: string, locale: string): Promise<Recurso | null> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/public/recursos/${slug}?lang=${locale}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const recurso = await fetchRecurso(slug, locale);
  const name = recurso?.nombre ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/negocio/${slug}`;
  const landing = recurso?.landingConfig;
  const title = seoTitle(landing?.headline ?? `${name} | Club LPMBE`);
  const description = seoDescription(
    landing?.subheadline ?? recurso?.descripcion ?? `Descubre ${name}, establecimiento asociado a Los Pueblos Más Bonitos de España.`
  );
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      ...(recurso?.imagenes?.[0]?.url && {
        images: [{ url: recurso.imagenes[0].url, alt: name }],
      }),
    },
    twitter: {
      card: recurso?.imagenes?.[0]?.url ? "summary_large_image" : "summary",
      title,
      description,
      ...(recurso?.imagenes?.[0]?.url ? { images: [recurso.imagenes[0].url] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function NegocioLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const recurso = await fetchRecurso(slug, locale);

  if (!recurso || recurso.activo === false) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">Establecimiento no encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            Esta página no está disponible.
          </p>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const features = getPlanFeatures(recurso.planNegocio);
  if (!features.customLandingEnabled || !recurso.landingConfig) {
    const fallbackHref = recurso.pueblo
      ? `/pueblos/${recurso.pueblo.slug}/club/${recurso.slug}`
      : `/selection/${recurso.slug}`;
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">{recurso.nombre}</h1>
          <p className="mt-2 text-muted-foreground">
            Este negocio aún no tiene una landing personalizada.
          </p>
          <Link href={fallbackHref} className="mt-4 inline-block text-primary hover:underline">
            Ver ficha del negocio →
          </Link>
        </div>
      </main>
    );
  }

  const base = getBaseUrl();
  const pagePath = `/negocio/${slug}`;
  const pageUrl = getCanonicalUrl(pagePath, locale as SupportedLocale);
  const localBusinessLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: recurso.nombre,
    url: pageUrl,
    ...(recurso.descripcion
      ? { description: seoDescription(recurso.descripcion.replace(/<[^>]+>/g, " "), 300) }
      : {}),
    ...(recurso.imagenes?.[0]?.url ? { image: recurso.imagenes[0].url } : {}),
    ...(recurso.telefono ? { telephone: recurso.telefono } : {}),
    ...(recurso.email ? { email: recurso.email } : {}),
    ...(recurso.web ? { sameAs: [recurso.web] } : {}),
    ...(recurso.localidad || recurso.provincia
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "ES",
            ...(recurso.localidad ? { addressLocality: recurso.localidad } : {}),
            ...(recurso.provincia ? { addressRegion: recurso.provincia } : {}),
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: recurso.nombre, item: `${base}${pagePath}` },
    ],
  };

  return (
    <>
      <JsonLd data={localBusinessLd} />
      <JsonLd data={breadcrumbLd} />
      <NegocioLanding recurso={recurso} />
    </>
  );
}
