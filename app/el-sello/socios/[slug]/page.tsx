import Link from 'next/link';
import { notFound } from 'next/navigation';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Display, Headline, Body, Lead } from '@/app/components/ui/typography';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type SelloSocioDetalle = {
  id: number;
  nombre: string;
  slug: string | null;
  logoUrl: string | null;
  descripcion: string | null;
  contenido: string | null;
  websiteUrl: string | null;
  tipo: string;
  fotos: Array<{ id: number; url: string; alt: string | null; orden: number }>;
};

async function getSocioBySlug(slug: string): Promise<SelloSocioDetalle | null> {
  try {
    const res = await fetch(`${API_BASE}/public/sello/socios/slug/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function SocioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const socio = await getSocioBySlug(slug);

  if (!socio) notFound();

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
              <li><span className="text-muted-foreground/50">/</span></li>
              <li>
                <Link
                  href="/el-sello"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  El sello
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li>
                <Link
                  href="/el-sello/socios"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Socios
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="font-medium text-foreground">{socio.nombre}</span></li>
            </ol>
          </nav>

          <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
            {socio.logoUrl && (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={socio.logoUrl}
                  alt={`Logo ${socio.nombre}`}
                  className="h-auto max-h-16 w-auto object-contain"
                />
              </div>
            )}
            <div>
              <Display className="mb-2">{socio.nombre}</Display>
              {socio.descripcion && (
                <Lead className="text-muted-foreground dark:text-foreground/90">{socio.descripcion}</Lead>
              )}
              {socio.websiteUrl && (
                <a
                  href={socio.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-primary underline hover:no-underline"
                >
                  Visitar web
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {socio.contenido && (
        <Section spacing="md" background="muted">
          <Container>
            <div className="prose prose-gray dark:prose-invert prose-lg max-w-none text-foreground/90 [&_p]:text-foreground/90 [&_li]:text-foreground/90 [&_a]:text-primary [&_a]:underline hover:[&_a]:no-underline [&_strong]:text-foreground">
              <SafeHtml html={socio.contenido} />
            </div>
          </Container>
        </Section>
      )}

      {socio.fotos && socio.fotos.length > 0 && (
        <Section spacing="md" background="default">
          <Container>
            <Headline as="h2" className="mb-6">
              Galería
            </Headline>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {socio.fotos.map((foto) => (
                <div
                  key={foto.id}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={foto.url}
                    alt={foto.alt || socio.nombre}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}

      <Section spacing="md" background="muted">
        <Container>
          <Link
            href="/el-sello/socios"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            ← Volver a Socios y colaboradores
          </Link>
        </Container>
      </Section>
    </main>
  );
}
