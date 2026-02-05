import Link from 'next/link';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import {
  Display,
  Lead,
  Headline,
  Body,
  Title,
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

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
          {number}
        </div>
        <div className="mt-2 h-full w-px bg-border group-last:hidden" />
      </div>
      <div className="pb-8 group-last:pb-0">
        <Title as="h3" className="mb-1">
          {title}
        </Title>
        <Body size="sm" className="text-muted-foreground">
          {description}
        </Body>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <Title as="h3" className="mb-2">
        {title}
      </Title>
      <Body size="sm" className="text-muted-foreground">
        {description}
      </Body>
    </div>
  );
}

export default async function UnetePage() {
  const page = await getPage();
  const titulo = page?.titulo ?? 'Únete a Nosotros';
  const subtitle = page?.subtitle ?? 'Forma parte del club';
  const raw = page?.contenido?.trim() ?? '';
  // Usar contenido del CMS si tiene contenido real
  const isMinimalContent = raw.length < 100 || raw.startsWith('# ');
  const contenido = raw && !isMinimalContent ? raw : CONTENIDO_UNETE;

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
                {subtitle ?? 'Forma parte del club'}
              </span>
            </div>

            <Display className="mb-2 text-balance">{titulo}</Display>
          </div>
        </Container>
      </Section>

      {/* Contenido editable desde CMS */}
      <Section spacing="md" background="default">
        <Container>
          <div className="prose prose-lg max-w-3xl text-muted-foreground [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline [&_strong]:text-foreground">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>

      {/* Dos bloques: Para municipios y Para colaboradores */}
      <Section spacing="md" background="muted">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Para municipios */}
            <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                  <path d="M9 9v.01" />
                  <path d="M9 12v.01" />
                  <path d="M9 15v.01" />
                  <path d="M9 18v.01" />
                </svg>
              </div>

              <Headline as="h2" className="mb-3">
                Para municipios
              </Headline>
              <Body className="mb-6 text-muted-foreground">
                Si eres alcalde o representante de un ayuntamiento y crees que tu
                pueblo cumple con los criterios de calidad, puedes iniciar el
                proceso de candidatura.
              </Body>

              <div className="mb-6 space-y-1">
                <StepCard
                  number={1}
                  title="Consulta los requisitos"
                  description="Revisa los criterios de evaluación y la Carta de Calidad."
                />
                <StepCard
                  number={2}
                  title="Aprobación en pleno"
                  description="El ayuntamiento debe aprobar formalmente la solicitud."
                />
                <StepCard
                  number={3}
                  title="Envía la solicitud"
                  description="Completa el formulario oficial con la documentación requerida."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/el-sello/proceso"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver proceso completo
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
                <Link
                  href="/contacto"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 font-medium transition-colors hover:bg-muted"
                >
                  Contactar
                </Link>
              </div>
            </div>

            {/* Para colaboradores */}
            <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>

              <Headline as="h2" className="mb-3">
                Para colaboradores
              </Headline>
              <Body className="mb-6 text-muted-foreground">
                Empresas, instituciones y organizaciones pueden colaborar con la
                asociación a través de diferentes modalidades de patrocinio y
                colaboración.
              </Body>

              <ul className="mb-6 space-y-3">
                {[
                  'Patrocinio de eventos y actividades',
                  'Colaboración en proyectos de promoción',
                  'Acuerdos de visibilidad y comunicación',
                  'Apoyo a iniciativas de sostenibilidad',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 font-medium transition-colors hover:bg-muted"
              >
                Solicitar información
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
          </div>
        </Container>
      </Section>

      {/* Beneficios */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="mb-10 text-center">
            <Headline as="h2" className="mb-3">
              Beneficios de pertenecer a la red
            </Headline>
            <Body className="mx-auto max-w-2xl text-muted-foreground">
              Formar parte de Los Pueblos Más Bonitos de España ofrece múltiples
              ventajas para el desarrollo local.
            </Body>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                </svg>
              }
              title="Visibilidad"
              description="Promoción en medios nacionales e internacionales y presencia en ferias de turismo."
            />
            <BenefitCard
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="Turismo"
              description="Incremento significativo de visitantes y pernoctaciones en el municipio."
            />
            <BenefitCard
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              }
              title="Red internacional"
              description="Pertenencia a la red mundial de pueblos más bonitos con presencia en varios países."
            />
            <BenefitCard
              icon={
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
              title="Desarrollo económico"
              description="Impulso a la economía local con nuevos negocios y oportunidades de empleo."
            />
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
