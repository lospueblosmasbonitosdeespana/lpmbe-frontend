import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Container } from "@/app/components/ui/container";
import { Section } from "@/app/components/ui/section";
import { Title, Lead } from "@/app/components/ui/typography";
import ClubNewsletterForm from "./ClubNewsletterForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Club de Amigos | Los Pueblos Más Bonitos de España",
  description:
    "En pocos días el Club de Amigos será una realidad. Suscríbete a la newsletter y noticias de la asociación.",
  openGraph: {
    title: "Club de Amigos | Los Pueblos Más Bonitos de España",
    description:
      "En pocos días el Club de Amigos será una realidad. Suscríbete a la newsletter y noticias de la asociación.",
  },
};

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
