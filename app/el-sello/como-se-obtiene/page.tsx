import Link from "next/link";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead, Title, Body } from "@/app/components/ui/typography";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import type { SelloPage } from "@/lib/cms/sello";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

/* ===== ICONS ===== */
function ProcessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function CriteriaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

const cards = [
  {
    titleKey: "cardProcessTitle" as const,
    descriptionKey: "cardProcessDesc" as const,
    linkTextKey: "cardProcessLink" as const,
    linkHref: "/el-sello/proceso",
    icon: ProcessIcon,
  },
  {
    titleKey: "cardCriteriaTitle" as const,
    descriptionKey: "cardCriteriaDesc" as const,
    linkTextKey: "cardCriteriaLink" as const,
    linkHref: "/el-sello/criterios",
    icon: CriteriaIcon,
  },
];

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_COMO_SE_OBTIENE`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ComoSeObtienePage() {
  const t = await getTranslations("sello");
  const page = await getPage();
  const titulo = page?.titulo ?? t("howToGetTitle");
  const subtitle = page?.subtitle;
  const contenido = page?.contenido ?? "";

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-primary">{t("breadcrumbHome")}</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><Link href="/el-sello" className="text-muted-foreground hover:text-primary">{t("breadcrumbSello")}</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="text-foreground">{t("breadcrumbHowToGet")}</span></li>
            </ol>
          </nav>

          <div className="relative">
            <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-gradient-to-b from-primary to-primary/20" />
            <Display className="mb-2 text-balance">{titulo}</Display>
          </div>

          <Lead className="mb-8 max-w-2xl text-muted-foreground dark:text-foreground/90">{subtitle ?? t("howToGetSubtitle")}</Lead>

          {contenido && (
            <div className="mb-8 max-w-4xl safe-html-content prose prose-gray dark:prose-invert prose-lg max-w-none">
              <SafeHtml html={contenido} />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {cards.map((card, index) => {
              const IconComponent = card.icon;
              return (
              <Link key={index} href={card.linkHref} className="group block">
                <article className="relative h-full overflow-hidden rounded-xl border border-border bg-card p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <Title as="h3" className="mb-3 text-xl">{t(card.titleKey)}</Title>
                  <Body className="mb-6 text-muted-foreground dark:text-foreground/90">{t(card.descriptionKey)}</Body>
                  <span className="inline-flex items-center gap-2 font-medium text-primary transition-colors group-hover:text-primary/80">
                    {t(card.linkTextKey)}
                    <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </article>
              </Link>
            );
            })}
          </div>
        </Container>
      </Section>
    </main>
  );
}
