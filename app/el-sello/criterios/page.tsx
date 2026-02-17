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
import { CONTENIDO_CRITERIOS } from '@/lib/cms/sello-content';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/sello/SELLO_CRITERIOS`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getCartaCalidad(): Promise<{ titulo: string; url: string } | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/documentos?type=CARTA_CALIDAD`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const doc = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return doc ? { titulo: doc.titulo, url: doc.url } : null;
  } catch {
    return null;
  }
}

export default async function CriteriosPage() {
  const [page, cartaDoc] = await Promise.all([getPage(), getCartaCalidad()]);

  const titulo = page?.titulo ?? 'Criterios de evaluación';
  const subtitle = page?.subtitle ?? 'Qué valoramos';
  // Si el CMS tiene contenido mínimo (seed antiguo), usar el completo para que coincida con el admin
  const raw = page?.contenido?.trim() ?? '';
  const isMinimalContent = raw.length < 400 || !raw.includes('Requisitos de admisión');
  const contenido = raw && !isMinimalContent ? raw : CONTENIDO_CRITERIOS;

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li>
                <Link href="/el-sello" className="text-muted-foreground transition-colors hover:text-foreground">
                  El sello
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li>
                <Link href="/el-sello/como-se-obtiene" className="text-muted-foreground transition-colors hover:text-foreground">
                  ¿Cómo se obtiene?
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="font-medium text-foreground">Criterios</span></li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-medium uppercase tracking-widest text-primary">
                {subtitle}
              </span>
            </div>

            <Display className="mb-2 text-balance">{titulo}</Display>

            <Lead className="mb-8 max-w-3xl text-muted-foreground dark:text-foreground/90">
              Resumen de los criterios recogidos en nuestra{' '}
              <strong className="text-foreground">Carta de Calidad</strong>. Todo
              municipio candidato debe satisfacer estos requisitos para obtener
              el sello de Los Pueblos Más Bonitos de España.
            </Lead>
          </div>
        </Container>
      </Section>

      <Section spacing="md" background="muted">
        <Container>
          <div className="prose prose-gray dark:prose-invert prose-sm max-w-none text-foreground/90 [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_.text-muted-foreground]:text-foreground/90 [&_.grid]:grid [&_.grid]:gap-6 [&_.grid]:sm:grid-cols-2 [&_.grid]:lg:grid-cols-3">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>

      <Section spacing="md" background="default">
        <Container size="md">
          <div className="rounded-xl border border-border bg-card p-8">
            <Headline as="h3" className="mb-4">
              La Carta de Calidad
            </Headline>
            <Body className="mb-4 text-muted-foreground dark:text-foreground/90">
              Todos los criterios detallados, el procedimiento de instrucción, los
              modos de utilización de la marca y las obligaciones de los pueblos
              miembros están recogidos en la{' '}
              <strong className="text-foreground">Carta de Calidad</strong>, el
              documento oficial que rige la asociación.
            </Body>
            <div className="flex flex-wrap gap-4">
              {cartaDoc ? (
                <a
                  href={cartaDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  {cartaDoc.titulo}
                </a>
              ) : (
                <Link
                  href="/el-sello#documentacion"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver documentación
                </Link>
              )}
              <Link
                href="/el-sello/proceso"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 font-medium transition-colors hover:bg-muted"
              >
                Ver proceso de selección
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
