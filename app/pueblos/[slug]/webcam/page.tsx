import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import WebcamPuebloPlayer from "./WebcamPuebloPlayer";
import JsonLd from "@/app/components/seo/JsonLd";

export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const path = `/pueblos/${slug}/webcam`;

  let name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  let ogImage: string | null = null;
  let hasWebcams = false;
  try {
    const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
    if (pueblo) {
      name = pueblo.nombre ?? name;
      ogImage = (pueblo as { foto_destacada?: string | null }).foto_destacada ?? null;
      const API_BASE = getApiUrl();
      const res = await fetch(`${API_BASE}/pueblos/${pueblo.id}/webcams`, { cache: "no-store" });
      if (res?.ok) {
        const wc: Array<unknown> = await res.json().catch(() => []);
        hasWebcams = Array.isArray(wc) && wc.length > 0;
      }
    }
  } catch {
    // noop
  }
  const title = seoTitle(tSeo("puebloWebcamTitle", { nombre: name }));
  const description = seoDescription(tSeo("puebloWebcamDesc", { nombre: name }));
  const ogImages = ogImage ? [{ url: ogImage, alt: title }] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: hasWebcams, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
      type: "website",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

type Webcam = {
  id: number;
  puebloId: number;
  nombre: string;
  url: string;
  tipo?: string | null;
};

export default async function WebcamPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const tPueblo = await getTranslations("puebloPage");
  const API_BASE = getApiUrl();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">{tPueblo("h1Webcam", { nombre: slug })}</h1>
          <p className="mt-2 text-muted-foreground">
            No se ha podido cargar el pueblo para mostrar la webcam.
          </p>
          <Link href="/pueblos" className="mt-4 inline-block text-primary hover:underline">
            Volver a pueblos
          </Link>
        </div>
      </main>
    );
  }

  const webcamsRes = await fetch(`${API_BASE}/pueblos/${pueblo.id}/webcams`);

  let webcams: Webcam[] = [];
  if (webcamsRes.ok) {
    try {
      webcams = await webcamsRes.json();
    } catch {
      // ignorar
    }
  }

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    { label: pueblo.nombre, href: `/pueblos/${pueblo.slug}` },
    { label: "Webcam", href: `/pueblos/${pueblo.slug}/webcam` },
  ];

  const base = getBaseUrl();
  const webcamPath = `/pueblos/${pueblo.slug}/webcam`;
  const pageUrl = getCanonicalUrl(webcamPath, locale as SupportedLocale);
  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Webcam · ${pueblo.nombre}`,
    description: `Webcams en directo de ${pueblo.nombre}.`,
    url: pageUrl,
    inLanguage: locale,
    ...(pueblo.foto_destacada ? { image: pueblo.foto_destacada } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: base,
    },
    about: {
      "@type": "TouristAttraction",
      name: pueblo.nombre,
      url: `${base}/pueblos/${pueblo.slug}`,
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: "Pueblos", item: `${base}/pueblos` },
      { "@type": "ListItem", position: 3, name: pueblo.nombre, item: `${base}/pueblos/${pueblo.slug}` },
      { "@type": "ListItem", position: 4, name: "Webcam", item: `${base}${webcamPath}` },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="text-2xl font-bold">
            {uniqueH1ForLocale(tPueblo("h1Webcam", { nombre: pueblo.nombre }), locale)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Imagen en directo de las webcams del pueblo.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {webcams.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-muted-foreground">
              Aún no hay webcams enlazadas para este pueblo.
            </p>
            <Link
              href={`/pueblos/${pueblo.slug}`}
              className="mt-4 inline-block text-primary hover:underline"
            >
              Volver al pueblo
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1">
            {webcams.map((webcam) => (
              <WebcamPuebloPlayer
                key={webcam.id}
                webcam={webcam}
                puebloNombre={pueblo.nombre}
                puebloSlug={pueblo.slug}
                puebloFoto={pueblo.foto_destacada ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
