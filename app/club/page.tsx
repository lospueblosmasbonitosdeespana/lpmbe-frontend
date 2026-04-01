import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  seoTitle,
  seoDescription,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { Container } from "@/app/components/ui/container";
import { Section } from "@/app/components/ui/section";
import { Title, Lead } from "@/app/components/ui/typography";
import ClubNewsletterForm from "./ClubNewsletterForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const path = "/club";
  const title = seoTitle(tSeo("clubListTitle"));
  const description = seoDescription(tSeo("clubListDesc"));
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

export default async function ClubLandingPage() {
  const t = await getTranslations("clubLanding");

  return (
    <main className="bg-background">
      <Section spacing="lg">
        <Container size="md">
          <div className="mx-auto max-w-2xl text-center">
            <Title as="h1" size="2xl" className="mb-4">
              {t("title")}
            </Title>
            <Lead className="mb-10 text-muted-foreground">
              {t("description")}
            </Lead>

            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="mb-2 font-semibold text-foreground">
                {t("newsletterTitle")}
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {t("newsletterDesc")}
              </p>
              <ClubNewsletterForm />
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
