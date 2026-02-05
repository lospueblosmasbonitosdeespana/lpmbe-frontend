import Link from "next/link";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import type { SelloPage } from "@/lib/cms/sello";
import { CONTENIDO_COMO_SE_OBTIENE } from "@/lib/cms/sello-content";

export const dynamic = "force-dynamic";

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
  const page = await getPage();
  const titulo = page?.titulo ?? "¿Cómo se obtiene el Sello?";
  const subtitle = page?.subtitle ?? "Proceso de certificación";
  const contenido = page?.contenido?.trim() || CONTENIDO_COMO_SE_OBTIENE;

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li><Link href="/" className="text-muted-foreground transition-colors hover:text-primary">Inicio</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><Link href="/el-sello" className="text-muted-foreground transition-colors hover:text-primary">El sello</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="text-foreground">¿Cómo se obtiene el sello?</span></li>
            </ol>
          </nav>

          <div className="relative">
            <div className="absolute -left-4 top-0 h-full w-1 rounded-full bg-gradient-to-b from-primary to-primary/20" />
            <Display className="mb-2 text-balance">{titulo}</Display>
          </div>

          <Lead className="mb-8 max-w-2xl text-muted-foreground">{subtitle}</Lead>

          <div className="max-w-4xl prose prose-lg max-w-none [&_.grid]:grid [&_.grid]:gap-6 [&_.grid]:md:grid-cols-2 [&_a]:no-underline [&_a:hover]:underline [&_article]:rounded-xl [&_article]:border [&_article]:border-border [&_article]:bg-card [&_article]:p-8 [&_article]:transition-all [&_article:hover]:border-primary/30 [&_article:hover]:shadow-lg">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
