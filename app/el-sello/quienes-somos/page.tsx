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

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getPageContent(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/sello/SELLO_QUIENES_SOMOS`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const CONTENIDO_BREVE = `
<p>La <strong>Asociación Los Pueblos Más Bonitos de España</strong> es una entidad sin ánimo de lucro fundada en 2010 que agrupa a los municipios españoles que destacan por su patrimonio, belleza y singularidad.</p>

<p>Nuestra misión es <strong>proteger, promover y desarrollar</strong> el patrimonio rural español, fomentando un turismo sostenible y de calidad que contribuya al desarrollo de estos enclaves únicos. La marca "Los Pueblos Más Bonitos de España" distingue a aquellos municipios que cumplen rigurosos criterios recogidos en nuestra Carta de Calidad.</p>

<p>La asociación está gobernada por una <strong>Comisión de Calidad</strong> formada por siete personas, encargada de evaluar las candidaturas, verificar el cumplimiento de los criterios y velar por el buen uso de la marca. Los pueblos miembros se comprometen a mantener los estándares exigidos y a invertir en la conservación y promoción de su patrimonio.</p>

<p>Formamos parte de la red internacional <em>Les Plus Beaux Villages de la Terre</em>, que reúne a asociaciones de Francia, Italia, Bélgica, Japón, Canadá, Suiza y otros países, compartiendo criterios de excelencia y buenas prácticas en la promoción del patrimonio rural.</p>

<p>Actualmente más de <strong>126 pueblos</strong> en <strong>17 comunidades autónomas</strong> forman parte de nuestra red, generando impacto positivo en la economía local, el turismo y la preservación del patrimonio cultural español.</p>

<p>Si quieres conocer el proceso para que tu municipio obtenga el sello de calidad, consulta nuestra sección de <a href="/el-sello/como-se-obtiene" class="text-primary underline hover:no-underline">cómo se obtiene el sello</a>.</p>
`;

export default async function QuienesSomosPage() {
  const page = await getPageContent();
  const titulo = page?.titulo ?? 'Quiénes somos';
  const subtitle = page?.subtitle ?? 'La asociación';
  const contenidoCms = page?.contenido?.trim();
  const contenido = contenidoCms && contenidoCms.length > 0 ? contenidoCms : CONTENIDO_BREVE;

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-primary"
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
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  El sello
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">/</span>
              </li>
              <li>
                <span className="text-foreground">Quiénes somos</span>
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

            <Display className="mb-6">{titulo}</Display>

            <Lead className="text-muted-foreground">
              Conoce la asociación que promueve y preserva el patrimonio de los
              pueblos más bonitos de España.
            </Lead>
          </div>
        </Container>
      </Section>

      <Section spacing="lg" background="default">
        <Container>
          <div className="prose prose-lg max-w-none text-foreground prose-headings:font-serif prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="md" background="muted">
        <Container size="md">
          <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-8 w-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1">
              <Headline as="h3" className="mb-2">
                ¿Quieres que tu pueblo forme parte?
              </Headline>
              <Body size="sm" className="text-muted-foreground">
                Descubre el proceso de admisión y los criterios que deben cumplir
                los municipios candidatos al sello de calidad.
              </Body>
            </div>
            <Link
              href="/el-sello/unete"
              className="shrink-0 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Solicitar información
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
