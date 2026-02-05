import Link from 'next/link';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import {
  Display,
  Headline,
  Body,
} from '@/app/components/ui/typography';
import type { SelloPage } from '@/lib/cms/sello';
import { CONTENIDO_UNETE } from '@/lib/cms/sello-content';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/sello/SELLO_UNETE`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function UnetePage() {
  const page = await getPage();
  const titulo = page?.titulo ?? 'Únete a Nosotros';
  const subtitle = page?.subtitle ?? 'Forma parte del club';
  const contenido = page?.contenido?.trim() || CONTENIDO_UNETE;

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
                <span className="font-medium text-foreground">Únete</span>
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

      {/* Contenido editable desde CMS */}
      <Section spacing="md" background="muted">
        <Container>
          <div className="prose prose-lg max-w-none [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline [&_p]:text-muted-foreground">
            <SafeHtml html={contenido} />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/el-sello/proceso"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver proceso completo
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 font-medium transition-colors hover:bg-muted"
            >
              Contactar
            </Link>
          </div>
        </Container>
      </Section>

      {/* CTA Contacto */}
      <Section spacing="md" background="primary">
        <Container size="md">
          <div className="text-center">
            <Headline as="h2" className="mb-4 text-primary-foreground">
              ¿Tienes dudas?
            </Headline>
            <Body className="mb-6 text-primary-foreground/80">
              Nuestro equipo estará encantado de resolver cualquier pregunta
              sobre el proceso de adhesión.
            </Body>
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 font-medium text-foreground transition-colors hover:bg-background/90"
            >
              Contacta con nosotros
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
