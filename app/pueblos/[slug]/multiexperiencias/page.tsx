import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPuebloBySlug } from "@/lib/api";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Title, Body, Eyebrow } from "@/app/components/ui/typography";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pueblo = await getPuebloBySlug(slug);
  return {
    title: `Multiexperiencias en ${pueblo.nombre} – Los Pueblos Más Bonitos de España`,
    description: `Experiencias y actividades para descubrir ${pueblo.nombre}.`,
  };
}

export default async function MultiexperienciasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const pueblo = await getPuebloBySlug(slug);
  const multiexperiencias = (pueblo as any).multiexperiencias ?? [];

  if (multiexperiencias.length === 0) {
    return (
      <main className="bg-background min-h-screen">
        <Section spacing="md">
          <Container>
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
              <span className="mx-2">/</span>
              <Link href={`/pueblos/${slug}`} className="hover:text-foreground">{pueblo.nombre}</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">Multiexperiencias</span>
            </nav>
            <div className="mb-10">
              <Eyebrow className="mb-2">Qué hacer</Eyebrow>
              <Title as="h2">Multiexperiencias en {pueblo.nombre}</Title>
              <Body className="mt-2 text-muted-foreground">
                Experiencias y actividades para descubrir el pueblo.
              </Body>
            </div>
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <p className="text-muted-foreground">
                No hay multiexperiencias disponibles para este pueblo.
              </p>
              <Link
                href={`/pueblos/${slug}`}
                className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
              >
                ← Volver a {pueblo.nombre}
              </Link>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <main className="bg-background min-h-screen">
      <Section spacing="md">
        <Container>
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${slug}`} className="hover:text-foreground">{pueblo.nombre}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Multiexperiencias</span>
          </nav>

          <div className="mb-10">
            <Eyebrow className="mb-2 text-red-600">Qué hacer</Eyebrow>
            <Title as="h2">Multiexperiencias en {pueblo.nombre}</Title>
            <Body className="mt-2 text-muted-foreground">
              Experiencias y actividades para descubrir el pueblo.
            </Body>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {multiexperiencias.map((m: any) => {
              const mx = m.multiexperiencia;
              if (!mx) return null;
              return (
                <Link
                  key={mx.id}
                  href={`/experiencias/${mx.slug}/pueblos/${slug}`}
                  className="group block"
                >
                  <article>
                    {mx.foto && (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                        <Image
                          src={mx.foto}
                          alt={mx.titulo}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="mt-3">
                      <span className="mb-0.5 block text-xs uppercase tracking-wider text-muted-foreground">
                        EXPERIENCIA
                      </span>
                      <h3 className="font-serif text-lg leading-snug transition-colors group-hover:text-primary">
                        {mx.titulo}
                      </h3>
                      {mx.descripcion && (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {mx.descripcion.length > 120
                            ? mx.descripcion.substring(0, 120) + "..."
                            : mx.descripcion}
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href={`/pueblos/${slug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← Volver a {pueblo.nombre}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
