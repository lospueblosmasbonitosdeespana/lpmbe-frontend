import Link from 'next/link';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import {
  Display,
  Lead,
  Headline,
  Body,
} from '@/app/components/ui/typography';
import type { SelloPage } from '@/lib/cms/sello';
import { CONTENIDO_PROCESO } from '@/lib/cms/sello-content';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/sello/SELLO_PROCESO`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ProcesoPage() {
  const page = await getPage();
  const titulo = page?.titulo ?? 'Proceso de selección';
  const subtitle = page?.subtitle ?? 'Etapas y evaluación';
  const contenido = page?.contenido?.trim() || CONTENIDO_PROCESO;

  return (
    <main>
      {/* Header */}
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">/</span>
              </li>
              <li>
                <Link
                  href="/el-sello"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  El sello
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">/</span>
              </li>
              <li>
                <Link
                  href="/el-sello/como-se-obtiene"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  ¿Cómo se obtiene?
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">/</span>
              </li>
              <li>
                <span className="font-medium text-foreground">Proceso</span>
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-medium uppercase tracking-widest text-primary">
                {subtitle}
              </span>
            </div>

            <Display className="mb-8 text-balance">{titulo}</Display>
          </div>
        </Container>
      </Section>

      {/* Contenido editable desde CMS (intro + etapas) */}
      <Section spacing="md" background="muted">
        <Container size="md">
          <div className="prose prose-lg max-w-none [&_h2]:font-serif [&_h2]:text-xl [&_h3]:font-semibold [&_h3]:text-lg [&_hr]:my-8 [&_p]:text-muted-foreground [&_.lead]:text-lg [&_.lead]:text-muted-foreground">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="md" background="default">
        <Container size="sm">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <Headline as="h3" className="mb-3">
              ¿Tu pueblo cumple los requisitos?
            </Headline>
            <Body className="mb-6 text-muted-foreground">
              Consulta los criterios de evaluación y descubre si tu municipio
              puede formar parte de la red.
            </Body>
            <Link
              href="/el-sello/criterios"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver criterios de evaluación
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
