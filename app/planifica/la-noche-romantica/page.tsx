import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Container } from "@/app/components/ui/container";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const path = "/planifica/la-noche-romantica";
  const title = seoTitle(tSeo('nocheRomanticaTitle'));
  const description = seoDescription(tSeo('nocheRomanticaDesc'));
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
    },
  };
}

const breadcrumbItems = [
  { label: "Planifica", href: "/planifica/fin-de-semana" },
  { label: "La Noche Romántica" },
];

export default function LaNocheRomanticaPage() {
  return (
    <main className="min-h-screen bg-background">
      <Container className="py-8 md:py-12">
        <Breadcrumbs items={breadcrumbItems} />

        <header className="mb-12">
          <h1 className="font-serif text-4xl font-medium text-foreground">
            La Noche Romántica
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Un evento muy especial de la asociación en el que participan nuestros
            pueblos, hoteles y restaurantes.
          </p>
        </header>

        {/* Placeholder: espacio para logo, contenido y diseño personalizado */}
        <section className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Contenido en preparación. Aquí irá el logo, la marca y el diseño
            específico de La Noche Romántica.
          </p>
          <Link
            href="/planifica/fin-de-semana"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Volver a Planifica
          </Link>
        </section>
      </Container>
    </main>
  );
}
