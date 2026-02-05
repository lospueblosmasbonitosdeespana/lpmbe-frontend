import Link from "next/link";
import SafeHtml from "@/app/_components/ui/SafeHtml";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";
import type { SelloPage } from "@/lib/cms/sello";
import { CONTENIDO_INTERNACIONAL } from "@/lib/cms/sello-content";

export const dynamic = "force-dynamic";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_INTERNACIONAL`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function InternacionalPage() {
  const page = await getPage();
  const titulo = page?.titulo ?? "Red Internacional";
  const subtitle = page?.subtitle ?? "Les Plus Beaux Villages de la Terre";
  const contenido = page?.contenido?.trim() || CONTENIDO_INTERNACIONAL;

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li><Link href="/" className="text-muted-foreground transition-colors hover:text-primary">Inicio</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><Link href="/el-sello" className="text-muted-foreground transition-colors hover:text-primary">El sello</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="text-foreground">El sello en el mundo</span></li>
            </ol>
          </nav>

          <div className="mb-8 flex items-start gap-4">
            <div className="hidden rounded-xl bg-primary/10 p-3 text-primary sm:block">
              <GlobeIcon className="h-8 w-8" />
            </div>
            <div>
              <Display className="mb-2 text-balance">{titulo}</Display>
              <Lead className="text-muted-foreground">{subtitle}</Lead>
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="md" background="default">
        <Container>
          <div className="prose prose-lg max-w-none [&_.grid-paises-internacional]:grid [&_.grid-paises-internacional]:gap-6 [&_.grid-paises-internacional]:sm:grid-cols-2 [&_.grid-paises-internacional]:lg:grid-cols-3 [&_.pais-card]:rounded-xl [&_.pais-card]:border [&_.pais-card]:border-border [&_.pais-card]:bg-card [&_.pais-card]:p-6 [&_.pais-card]:transition-all [&_.pais-card]:hover:border-primary/30 [&_.pais-card]:hover:shadow-lg [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
