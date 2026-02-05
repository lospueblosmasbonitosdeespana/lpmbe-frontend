import { headers } from "next/headers";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";

export const dynamic = "force-dynamic";

async function fetchStaticPage(key: string) {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/public/static-pages/${key}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CookiesPage() {
  const page = await fetchStaticPage("COOKIES");
  const titulo = page?.titulo ?? "Política de cookies";
  const contenido = page?.contenido?.trim() ?? "";

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Cookies" }]} />
        </Container>
      </Section>

      <Section spacing="lg" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">{titulo}</Display>
              {contenido ? (
                <Lead className="mb-8 max-w-2xl text-muted-foreground">
                  Información sobre el uso de cookies en este sitio
                </Lead>
              ) : (
                <Lead className="mb-8 max-w-2xl text-muted-foreground">
                  El contenido de esta página se puede editar en la gestión de la asociación.
                </Lead>
              )}
            </div>
          </Container>
        </div>
      </Section>

      {contenido && (
        <Section spacing="lg" background="default">
          <Container>
            <div className="prose prose-lg mx-auto max-w-3xl max-w-none text-muted-foreground [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline [&_strong]:text-foreground [&_em]:text-foreground">
              <SafeHtml html={contenido} />
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}
