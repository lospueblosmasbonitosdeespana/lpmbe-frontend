import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale } from "next-intl/server";
import { getPueblosLite } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from "@/lib/seo";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";

const PAGE_TITLE: Record<string, string> = {
  es: "Pueblos por provincias",
  en: "Villages by province",
  fr: "Villages par province",
  de: "Dörfer nach Provinz",
  pt: "Aldeias por província",
  it: "Borghi per provincia",
  ca: "Pobles per província",
};

const PAGE_DESC: Record<string, string> = {
  es: "Encuentra los pueblos más bonitos de España organizados por provincia. Elige tu provincia y descubre qué visitar.",
  en: "Find the most beautiful villages in Spain by province. Choose a province and discover what to visit.",
  fr: "Trouvez les plus beaux villages d'Espagne par province. Choisissez une province et découvrez quoi visiter.",
  de: "Finden Sie die schönsten Dörfer Spaniens nach Provinz. Wählen Sie eine Provinz und entdecken Sie Sehenswertes.",
  pt: "Encontre as aldeias mais bonitas de Espanha por província. Escolha uma província e descubra o que visitar.",
  it: "Trova i borghi più belli della Spagna per provincia. Scegli una provincia e scopri cosa visitare.",
  ca: "Troba els pobles més bonics d'Espanya per província. Tria una província i descobreix què visitar.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/pueblos/provincias";
  const title = seoTitle(PAGE_TITLE[locale] ?? PAGE_TITLE.es);
  const description = seoDescription(PAGE_DESC[locale] ?? PAGE_DESC.es);
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
    robots: { index: true, follow: true },
  };
}

function normalize(s: string) {
  return s.trim();
}

export default async function ProvinciasPage() {
  const locale = await getLocale();
  const pueblos = await getPueblosLite(locale);

  const provincias = Array.from(
    new Set(
      pueblos
        .map((p) => p.provincia)
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .map(normalize)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Pueblos", href: "/pueblos" }, { label: "Por provincia" }]} />
        </Container>
      </Section>

      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">Por provincia</Display>
              <Lead className="mb-10 max-w-2xl text-muted-foreground">
                Elige una provincia para ver sus pueblos.
              </Lead>
            </div>
          </Container>
        </div>
      </Section>

      <Section spacing="lg" background="default">
        <Container>
          {provincias.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay provincias disponibles.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {provincias.map((p) => (
                <Link
                  key={p}
                  href={`/pueblos?provincia=${encodeURIComponent(p)}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div>
                    <div className="font-semibold text-foreground group-hover:text-primary">{p}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Ver pueblos</div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}

