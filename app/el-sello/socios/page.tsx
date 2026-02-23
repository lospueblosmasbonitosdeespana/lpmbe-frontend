import Link from 'next/link';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import {
  Display,
  Headline,
  Body,
  Title,
} from '@/app/components/ui/typography';
import type { SelloPage } from '@/lib/cms/sello';
import { CONTENIDO_SOCIOS } from '@/lib/cms/sello-content';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/sello/SELLO_SOCIOS`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type SelloSocio = {
  id: number;
  nombre: string;
  slug: string | null;
  logoUrl: string | null;
  descripcion: string | null;
  websiteUrl: string | null;
  tipo: 'INSTITUCIONAL' | 'COLABORADOR' | 'PATROCINADOR';
};

const categoryLabels: Record<string, string> = {
  INSTITUCIONAL: 'Institucional',
  COLABORADOR: 'Colaborador',
  PATROCINADOR: 'Patrocinador',
};

const categoryColors: Record<string, string> = {
  INSTITUCIONAL: 'bg-primary/10 text-primary',
  COLABORADOR: 'bg-accent/30 text-accent-foreground',
  PATROCINADOR: 'bg-amber-100 text-amber-800',
};

async function getSocios(): Promise<SelloSocio[]> {
  try {
    const res = await fetch(`${API_BASE}/public/sello/socios`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function PartnerCard({
  nombre,
  slug,
  logoUrl,
  descripcion,
  websiteUrl,
  tipo,
}: SelloSocio) {
  const content = (
    <>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted p-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo ${nombre}`}
              className="h-auto max-h-12 w-auto max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <span className="text-2xl text-muted-foreground">?</span>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${categoryColors[tipo] ?? 'bg-muted text-muted-foreground dark:text-foreground/90'}`}
        >
          {categoryLabels[tipo] ?? tipo}
        </span>
      </div>

      <Title as="h3" className="mb-2">
        {nombre}
      </Title>
      {descripcion && (
        <Body size="sm" className="mb-4 text-muted-foreground dark:text-foreground/90">
          {descripcion}
        </Body>
      )}

      {slug ? (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          Ver más
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      ) : websiteUrl ? (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          onClick={(e) => e.stopPropagation()}
        >
          Visitar web
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      ) : null}
    </>
  );

  return slug ? (
    <Link
      href={`/el-sello/socios/${slug}`}
      className="block rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md h-full group"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md h-full">
      {content}
    </div>
  );
}

export default async function SociosPage() {
  const [page, socios] = await Promise.all([getPage(), getSocios()]);

  const titulo = page?.titulo ?? 'Socios';
  const subtitle = page?.subtitle ?? 'Nuestros miembros';
  const raw = page?.contenido?.trim() ?? '';
  const isMinimalContent = raw.length < 400 || !raw.includes('instituciones');
  const contenido = raw && !isMinimalContent ? raw : CONTENIDO_SOCIOS;

  const countInstitucionales = socios.filter(
    (s) => s.tipo === 'INSTITUCIONAL'
  ).length;
  const countColaboradores = socios.filter(
    (s) => s.tipo === 'COLABORADOR' || s.tipo === 'PATROCINADOR'
  ).length;

  return (
    <main>
      {/* Header */}
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
                <span className="text-foreground">Socios</span>
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

            <div className="prose prose-gray dark:prose-invert prose-lg max-w-none text-foreground/90 [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline">
              <SafeHtml html={contenido} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Stats */}
      <Section spacing="sm" background="default">
        <Container>
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-4 sm:p-8">
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-primary sm:text-4xl">
                126
              </div>
              <div className="mt-1 text-sm text-muted-foreground dark:text-foreground/90">
                Municipios socios
              </div>
            </div>
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-primary sm:text-4xl">
                17
              </div>
              <div className="mt-1 text-sm text-muted-foreground dark:text-foreground/90">
                Comunidades
              </div>
            </div>
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-primary sm:text-4xl">
                {countInstitucionales}
              </div>
              <div className="mt-1 text-sm text-muted-foreground dark:text-foreground/90">
                Socios institucionales
              </div>
            </div>
            <div className="text-center">
              <div className="font-serif text-3xl font-bold text-primary sm:text-4xl">
                {countColaboradores}
              </div>
              <div className="mt-1 text-sm text-muted-foreground dark:text-foreground/90">
                Colaboradores
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Partners Grid */}
      <Section spacing="lg" background="muted">
        <Container>
          <Headline as="h2" className="mb-8">
            Instituciones y colaboradores
          </Headline>

          {socios.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground dark:text-foreground/90">
              Próximamente se mostrarán aquí las instituciones y colaboradores
              de la asociación.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {socios.map((s) => (
                <PartnerCard key={s.id} {...s} />
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Ver proceso completo */}
      <Section spacing="md" background="default">
        <Container>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Headline as="h3" className="mb-3">
              Proceso de admisión
            </Headline>
            <Body className="mb-6 text-muted-foreground dark:text-foreground/90">
              Si tu municipio quiere solicitar el sello de calidad, consulta el
              proceso completo de admisión y los criterios de evaluación.
            </Body>
            <Link
              href="/el-sello/proceso"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
          </div>
        </Container>
      </Section>

      {/* Pueblos miembros CTA */}
      <Section spacing="md" background="default">
        <Container size="md">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
            <Headline as="h3" className="mb-3">
              Pueblos miembros
            </Headline>
            <Body className="mb-6 text-muted-foreground dark:text-foreground/90">
              Descubre los 126 municipios que forman parte de la asociación y
              lucen con orgullo el sello de calidad.
            </Body>
            <Link
              href="/pueblos"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Ver todos los pueblos
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

      {/* ¿Quieres ser socio colaborador? */}
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div className="flex-1">
              <Title as="h3" className="mb-2">
                ¿Quieres ser socio colaborador?
              </Title>
              <Body size="sm" className="text-muted-foreground dark:text-foreground/90">
                Si tu empresa u organización quiere colaborar con la asociación,
                solicita información sobre las opciones de patrocinio y
                colaboración.
              </Body>
            </div>
            <Link
              href="/el-sello/unete"
              className="shrink-0 rounded-lg border border-border bg-transparent px-5 py-2.5 font-medium transition-colors hover:bg-muted"
            >
              Solicitar información
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
