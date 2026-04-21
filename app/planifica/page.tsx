import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Grid } from "@/app/components/ui/grid";
import {
  Display,
  Headline,
  Title,
  Lead,
  Body,
  Eyebrow,
} from "@/app/components/ui/typography";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getCanonicalUrl,
  getDefaultOgImage,
  getLocaleAlternates,
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("seo");
  const path = "/planifica";
  const title = t("planificaTitle");
  const description = t("planificaDescription");
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
      images: [{ url: getDefaultOgImage(), alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getDefaultOgImage()],
    },
  };
}

/* ===== ICONS ===== */
function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
    </svg>
  );
}
function RouteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" />
    </svg>
  );
}
function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3h12v18l-6-4-6 4z" />
    </svg>
  );
}
function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 5a5.5 5.5 0 0 1 9.5 7C19 16.5 12 21 12 21z" />
    </svg>
  );
}
function TreeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l4 5h-2l3 4h-2l3 4H6l3-4H7l3-4H8l4-5z" />
      <path d="M12 15v7M9 22h6" />
    </svg>
  );
}
function CrossIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2v20M6 8h12" />
    </svg>
  );
}
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

type HubCardProps = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
};

function HubCard({ href, title, description, icon: Icon, cta }: HubCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-7 w-7" />
      </div>
      <Title as="h3" className="mb-2 text-xl">
        {title}
      </Title>
      <Body size="sm" className="mb-6 flex-1 text-muted-foreground dark:text-foreground/90">
        {description}
      </Body>
      <span className="inline-flex items-center gap-2 font-medium text-primary">
        {cta}
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export default async function PlanificaHubPage() {
  const t = await getTranslations("planifica.hub");

  const cards: Array<Omit<HubCardProps, "cta">> = [
    {
      href: "/planifica/fin-de-semana",
      title: t("cardFinDeSemanaTitle"),
      description: t("cardFinDeSemanaDesc"),
      icon: CalendarIcon,
    },
    {
      href: "/planifica/crea-mi-ruta",
      title: t("cardCreaRutaTitle"),
      description: t("cardCreaRutaDesc"),
      icon: RouteIcon,
    },
    {
      href: "/planifica/mis-rutas",
      title: t("cardMisRutasTitle"),
      description: t("cardMisRutasDesc"),
      icon: BookmarkIcon,
    },
    {
      href: "/noche-romantica",
      title: t("cardNocheRomanticaTitle"),
      description: t("cardNocheRomanticaDesc"),
      icon: HeartIcon,
    },
    {
      href: "/planifica/navidad",
      title: t("cardNavidadTitle"),
      description: t("cardNavidadDesc"),
      icon: TreeIcon,
    },
    {
      href: "/planifica/semana-santa",
      title: t("cardSemanaSantaTitle"),
      description: t("cardSemanaSantaDesc"),
      icon: CrossIcon,
    },
  ];

  const cta = t("cta");

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        </Container>
      </Section>

      {/* Hero */}
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
              <Display className="mb-6 max-w-3xl text-balance">
                {t("heroTitle")}
              </Display>
              <Lead className="max-w-2xl text-muted-foreground dark:text-foreground/90">
                {t("heroLead")}
              </Lead>
            </div>
          </Container>
        </div>
      </Section>

      {/* Cards */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="mb-10 text-center">
            <Headline className="mb-4">{t("sectionTitle")}</Headline>
            <Lead className="mx-auto max-w-2xl text-muted-foreground dark:text-foreground/90">
              {t("sectionLead")}
            </Lead>
          </div>
          <Grid columns={3} gap="md">
            {cards.map((c) => (
              <HubCard
                key={c.href}
                href={c.href}
                title={c.title}
                description={c.description}
                icon={c.icon}
                cta={cta}
              />
            ))}
          </Grid>
        </Container>
      </Section>
    </main>
  );
}
