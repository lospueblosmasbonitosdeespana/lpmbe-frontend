import Link from "next/link";
import Image from "next/image";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import SafeHtml from "@/app/_components/ui/SafeHtml";
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
  Caption,
} from "@/app/components/ui/typography";
import type { SelloPage, CmsDocumento } from "@/lib/cms/sello";
import { CONTENIDO_SELLO_HOME } from "@/lib/cms/sello-content";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

/* ===== ICONS ===== */
function ArchitectureIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
    </svg>
  );
}

function HeritageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7h20L12 2zM4 7v10M20 7v10M8 7v10M12 7v10M16 7v10M2 17h20M4 21h16" />
    </svg>
  );
}

function NatureIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22V8M12 8C12 8 8 4 8 2c0 2.5 2 4.5 4 6M12 8c0 0 4-4 4-6 0 2.5-2 4.5-4 6M5 12c2.5 0 4.5-2 6-4-2 2.5-4 4.5-6 4zM19 12c-2.5 0-4.5-2-6-4 2 2.5 4 4.5 6 4zM8 17c1.5 0 3-1 4-2.5M16 17c-1.5 0-3-1-4-2.5" />
    </svg>
  );
}

function CommunityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" />
      <circle cx="15" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 014-4h4M15 15a4 4 0 014 4v2M12 15a4 4 0 014 4v2" />
    </svg>
  );
}

function SustainabilityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function TourismIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

const CRITERIA_ICONS = [ArchitectureIcon, HeritageIcon, NatureIcon, CommunityIcon, SustainabilityIcon, TourismIcon];
/* ===== CRITERIA DATA (titles/descriptions from t in component) ===== */
const CRITERIA_KEYS = [
  { titleKey: "criteria1Title", descKey: "criteria1Desc" },
  { titleKey: "criteria2Title", descKey: "criteria2Desc" },
  { titleKey: "criteria3Title", descKey: "criteria3Desc" },
  { titleKey: "criteria4Title", descKey: "criteria4Desc" },
  { titleKey: "criteria5Title", descKey: "criteria5Desc" },
  { titleKey: "criteria6Title", descKey: "criteria6Desc" },
] as const;

/* ===== WORLD NETWORKS ===== */
const worldNetworks = [
  { country: "Francia", flag: "🇫🇷", name: "Les Plus Beaux Villages de France", villages: 176, href: "/el-sello/internacional" },
  { country: "Italia", flag: "🇮🇹", name: "I Borghi più belli d'Italia", villages: 334, href: "/el-sello/internacional" },
  { country: "Bélgica", flag: "🇧🇪", name: "Les Plus Beaux Villages de Wallonie", villages: 32, href: "/el-sello/internacional" },
  { country: "Japón", flag: "🇯🇵", name: "Les Plus Beaux Villages du Japon", villages: 64, href: "/el-sello/internacional" },
  { country: "Canadá", flag: "🇨🇦", name: "Les Plus Beaux Villages du Québec", villages: 43, href: "/el-sello/internacional" },
  { country: "Suiza", flag: "🇨🇭", name: "Les Plus Beaux Villages de Suisse", villages: 44, href: "/el-sello/internacional" },
];

async function getSelloPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_HOME`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getSiteSettings(): Promise<{
  logoUrl: string | null;
  selloSealBadgeUrl: string | null;
  selloEvaluationImageUrl: string | null;
  selloTeamImageUrl: string | null;
}> {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${base}/public/site-settings`, { cache: "no-store" });
    if (!res.ok) return { logoUrl: null, selloSealBadgeUrl: null, selloEvaluationImageUrl: null, selloTeamImageUrl: null };
    const d = await res.json();
    return {
      logoUrl: d.logoUrl ?? null,
      selloSealBadgeUrl: d.selloSealBadgeUrl ?? null,
      selloEvaluationImageUrl: d.selloEvaluationImageUrl ?? null,
      selloTeamImageUrl: d.selloTeamImageUrl ?? null,
    };
  } catch {
    return { logoUrl: null, selloSealBadgeUrl: null, selloEvaluationImageUrl: null, selloTeamImageUrl: null };
  }
}

async function getDocumentos(): Promise<{ estatutos: CmsDocumento[]; cartaCalidad: CmsDocumento[] }> {
  try {
    const [resEstatutos, resCarta] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/cms/documentos?type=ESTATUTOS`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/cms/documentos?type=CARTA_CALIDAD`, { cache: "no-store" }),
    ]);
    const estatutos = resEstatutos.ok ? await resEstatutos.json() : [];
    const cartaCalidad = resCarta.ok ? await resCarta.json() : [];
    return {
      estatutos: Array.isArray(estatutos) ? estatutos : [],
      cartaCalidad: Array.isArray(cartaCalidad) ? cartaCalidad : [],
    };
  } catch {
    return { estatutos: [], cartaCalidad: [] };
  }
}

export default async function ElSelloPage() {
  const t = await getTranslations("sello");
  const [page, documentos, siteSettings] = await Promise.all([
    getSelloPage(),
    getDocumentos(),
    getSiteSettings(),
  ]);

  const subtitle = page?.subtitle;
  const raw = page?.contenido?.trim() ?? '';
  // Usar contenido del CMS si tiene contenido real
  const isMinimalContent = raw.length < 200 || raw.startsWith('# ') || raw.startsWith('<h2>Título');
  const contenido = raw && !isMinimalContent ? raw : CONTENIDO_SELLO_HOME;
  const sealBadgeUrl = siteSettings.selloSealBadgeUrl || page?.heroUrl?.trim() || "/images/sello/seal-badge.jpg";
  const evaluationImageUrl = siteSettings.selloEvaluationImageUrl || "/images/sello/evaluation.jpg";
  const teamImageUrl = siteSettings.selloTeamImageUrl || "/images/sello/team.jpg";

  const criteriaItems = CRITERIA_KEYS.map((keys, i) => ({
    icon: CRITERIA_ICONS[i],
    title: t(keys.titleKey),
    description: t(keys.descKey),
  }));

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: t("breadcrumbSello") }]} />
        </Container>
      </Section>

      {/* Hero Section */}
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-16 pt-8 text-center lg:pb-24 lg:pt-12">
              {/* Logo principal encima */}
              {siteSettings.logoUrl && (
                <div className="mb-6">
                  <Image
                    src={siteSettings.logoUrl}
                    alt="Los Pueblos Más Bonitos de España"
                    width={180}
                    height={72}
                    className="h-16 w-auto object-contain lg:h-20"
                    unoptimized={siteSettings.logoUrl.startsWith("http")}
                  />
                </div>
              )}
              {/* Badge del sello */}
              <div className="mb-8 h-32 w-32 overflow-hidden rounded-full border-4 border-primary/20 bg-card shadow-xl lg:h-40 lg:w-40">
                <Image
                  src={sealBadgeUrl}
                  alt="Sello de Los Pueblos Más Bonitos de España"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized={sealBadgeUrl.startsWith("http")}
                />
              </div>

              <Eyebrow className="mb-4">{t("heroEyebrow")}</Eyebrow>
              <Display className="mb-6 max-w-3xl text-balance">{t("heroTitle")}</Display>
              {subtitle && <Lead className="mb-6 max-w-2xl">{subtitle}</Lead>}
              {!subtitle && (
                <Lead className="max-w-2xl text-muted-foreground dark:text-foreground/90">
                  {t("heroSubtitle")}
                </Lead>
              )}

              {/* Stats */}
              <div className="mt-12 flex flex-wrap justify-center gap-8 lg:gap-16">
                <div className="text-center">
                  <div className="font-serif text-4xl font-semibold text-primary lg:text-5xl">126</div>
                  <Caption className="mt-1">{t("statVillages")}</Caption>
                </div>
                <div className="text-center">
                  <div className="font-serif text-4xl font-semibold text-primary lg:text-5xl">17</div>
                  <Caption className="mt-1">{t("statRegions")}</Caption>
                </div>
                <div className="text-center">
                  <div className="font-serif text-4xl font-semibold text-primary lg:text-5xl">2010</div>
                  <Caption className="mt-1">{t("statYear")}</Caption>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </Section>

      {/* Contenido CMS - Qué es el sello */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow className="mb-4 text-foreground/80">{t("whatIsEyebrow")}</Eyebrow>
            <Headline className="mb-6 text-foreground">{t("whatIsTitle")}</Headline>
          </div>
          <div className="mx-auto max-w-3xl">
            <div className="prose prose-gray dark:prose-invert prose-lg max-w-none text-foreground/90 [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline [&_strong]:text-foreground [&_em]:text-foreground">
              <SafeHtml html={contenido} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Criteria Section */}
      <Section spacing="lg" background="muted">
        <Container>
          <div className="mb-12 text-center">
            <Eyebrow className="mb-4">{t("criteriaEyebrow")}</Eyebrow>
            <Headline className="mb-4">{t("criteriaTitle")}</Headline>
                <Lead className="mx-auto max-w-2xl text-muted-foreground dark:text-foreground/90">
              {t("criteriaLead")}
            </Lead>
          </div>
          <Grid columns={3} gap="md">
            {criteriaItems.map((item, index) => (
              <div
                key={index}
                className="group rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-8 w-8" />
                </div>
                <Title as="h4" className="mb-2 text-lg">
                  {item.title}
                </Title>
                <Body size="sm" className="text-muted-foreground dark:text-foreground/90">
                  {item.description}
                </Body>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Process Section */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg lg:aspect-auto">
              <Image
                src={evaluationImageUrl}
                alt={t("evaluationCommittee")}
                fill
                className="object-cover"
                unoptimized={evaluationImageUrl.startsWith("http")}
              />
            </div>
            <div>
              <Eyebrow className="mb-4">{t("processEyebrow")}</Eyebrow>
              <Headline className="mb-6">{t("processTitle")}</Headline>
              <Body className="mb-8 text-muted-foreground dark:text-foreground/90">
                {t("processBody")}
              </Body>
              <div className="space-y-6">
                {[
                  { n: 1, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
                  { n: 2, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
                  { n: 3, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
                  { n: 4, titleKey: "step4Title" as const, descKey: "step4Desc" as const },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                      {step.n}
                    </div>
                    <div>
                      <Title as="h4" className="mb-1 text-lg">
                        {t(step.titleKey)}
                      </Title>
                      <Body className="text-muted-foreground dark:text-foreground/90">{t(step.descKey)}</Body>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
              <Link
                href="/el-sello/unete"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("requestSeal")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* About Us Section */}
      <Section spacing="lg" background="card">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <Eyebrow className="mb-4">{t("aboutEyebrow")}</Eyebrow>
              <Headline className="mb-6">{t("aboutTitle")}</Headline>
              <Body className="mb-6 text-muted-foreground dark:text-foreground/90">
                {t("aboutBody1")}
              </Body>
              <Body className="mb-8 text-muted-foreground dark:text-foreground/90">
                {t("aboutBody2")}
              </Body>
              <div className="space-y-3">
                {[t("aboutItem1"), t("aboutItem2"), t("aboutItem3"), t("aboutItem4")].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    <Body>{item}</Body>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/el-sello/quienes-somos"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {t("meetTeam")}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-lg lg:order-2 lg:aspect-auto">
              <Image
                src={teamImageUrl}
                alt={t("teamImageAlt")}
                fill
                className="object-cover"
                unoptimized={teamImageUrl.startsWith("http")}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* World Network Section */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="mb-12 text-center">
            <Eyebrow className="mb-4">{t("worldEyebrow")}</Eyebrow>
            <Headline className="mb-4">{t("worldTitle")}</Headline>
                <Lead className="mx-auto max-w-2xl text-muted-foreground dark:text-foreground/90">
              {t("worldLead")}
            </Lead>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {worldNetworks.map((network, index) => (
              <Link
                key={index}
                href={network.href}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
                  {network.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <Caption className="text-primary">{network.country}</Caption>
                  <Title as="h4" className="text-base">
                    {network.name}
                  </Title>
                  <Caption>{network.villages} {t("villagesCount")}</Caption>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/el-sello/internacional"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              {t("viewAllNetworks")}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </Container>
      </Section>

      {/* Documentación */}
      {(documentos.estatutos.length > 0 || documentos.cartaCalidad.length > 0) && (
        <Section spacing="lg" background="muted" id="documentacion">
          <Container>
            <div className="mb-12 text-center">
              <Eyebrow className="mb-4">{t("docEyebrow")}</Eyebrow>
              <Headline className="mb-4">{t("docTitle")}</Headline>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {documentos.estatutos.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <Title as="h3" className="mb-4">
                    {t("statutes")}
                  </Title>
                  <ul className="space-y-2">
                    {documentos.estatutos.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          📄 {doc.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {documentos.cartaCalidad.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-6">
                  <Title as="h3" className="mb-4">
                    {t("qualityCharter")}
                  </Title>
                  <ul className="space-y-2">
                    {documentos.cartaCalidad.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          📄 {doc.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Container>
        </Section>
      )}

      {/* CTA Section */}
      <Section spacing="lg" background="primary" className="bg-primary text-primary-foreground">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Headline className="mb-6 text-primary-foreground">
              {t("ctaTitle")}
            </Headline>
            <Lead className="mb-8 text-primary-foreground/80">
              {t("ctaLead")}
            </Lead>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/el-sello/unete"
                className="inline-flex items-center gap-2 rounded-lg bg-card px-8 py-4 font-semibold text-foreground transition-colors hover:bg-card/90"
              >
                {t("requestSeal")}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/el-sello/unete"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-primary-foreground/30 px-8 py-4 font-semibold text-primary-foreground transition-colors hover:border-primary-foreground hover:bg-primary-foreground/10"
              >
                {t("contactUs")}
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Quick Links */}
      <Section spacing="md" background="default">
        <Container>
          <Grid columns={3} gap="md">
            <Link
              href="/el-sello/unete"
              className="group flex items-start gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArchitectureIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <Title as="h4" className="mb-1 flex items-center gap-2 text-lg">
                  {t("quickRequestSeal")}
                  <ArrowRightIcon className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </Title>
                <Body size="sm" className="text-muted-foreground dark:text-foreground/90">
                  {t("quickRequestDesc")}
                </Body>
              </div>
            </Link>
            <Link
              href="/el-sello/quienes-somos"
              className="group flex items-start gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <CommunityIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <Title as="h4" className="mb-1 flex items-center gap-2 text-lg">
                  {t("quickWhoWeAre")}
                  <ArrowRightIcon className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </Title>
                <Body size="sm" className="text-muted-foreground dark:text-foreground/90">
                  {t("quickWhoDesc")}
                </Body>
              </div>
            </Link>
            <Link
              href="/el-sello/socios"
              className="group flex items-start gap-4 rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <HeritageIcon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <Title as="h4" className="mb-1 flex items-center gap-2 text-lg">
                  {t("quickPartners")}
                  <ArrowRightIcon className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </Title>
                <Body size="sm" className="text-muted-foreground dark:text-foreground/90">
                  {t("quickPartnersDesc")}
                </Body>
              </div>
            </Link>
          </Grid>
        </Container>
      </Section>
    </main>
  );
}
