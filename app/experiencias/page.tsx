import Link from "next/link";
import Image from "next/image";
import { getHomeConfig } from "@/lib/homeApi";
import { getApiUrl } from "@/lib/api";
import { Container } from "@/app/components/ui/container";
import { Section } from "@/app/components/ui/section";
import { Title, Muted, Display } from "@/app/components/ui/typography";
import { CCAA, norm } from "@/app/_components/pueblos/ccaa.config";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  comunidad?: string | null;
};

async function getPueblos(): Promise<Pueblo[]> {
  try {
    const res = await fetch(`${getApiUrl()}/pueblos`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Experiencias temáticas | Los Pueblos Más Bonitos de España",
  description:
    "Descubre nuestros pueblos por temática: gastronomía, naturaleza, cultura, en familia, petfriendly. Y explóralos por comunidad autónoma.",
};

export default async function ExperienciasPage() {
  const [config, pueblos] = await Promise.all([
    getHomeConfig(),
    getPueblos(),
  ]);

  const themes = config.themes;

  // Agrupar pueblos por comunidad
  const byComunidad = pueblos.reduce((acc, p) => {
    const c = (p.comunidad ?? "").trim();
    if (!c) return acc;
    acc[c] = acc[c] || [];
    acc[c].push(p);
    return acc;
  }, {} as Record<string, Pueblo[]>);

  // CCAA con pueblos (orden según config)
  const visibleCCAA = CCAA.filter((c) => {
    if (c.slug === "murcia") return true;
    const total =
      Array.from(Object.entries(byComunidad)).find(([name]) => norm(name) === norm(c.name))?.[1]
        ?.length ?? 0;
    return total > 0;
  });

  return (
    <main className="min-h-screen">
      {/* Hero / Intro */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
              Ideas de viaje
            </p>
            <Display as="h1" className="mb-3">
              Experiencias temáticas
            </Display>
            <Muted className="text-base max-w-2xl mx-auto">
              Los pueblos según tus deseos. En familia, para escapadas gastronómicas,
              para descubrir la naturaleza o el patrimonio — encuentra tu experiencia ideal.
            </Muted>
          </div>

          {/* Temáticas de la asociación */}
          <div className="mb-16">
            <h2 className="text-xl font-semibold mb-6">Temáticas de la asociación</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {themes.map((t) => (
                <Link
                  key={t.key}
                  href={t.href}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-500">
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt={t.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">{t.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-center text-sm sm:text-base">
                        {t.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-center text-xs text-primary font-medium group-hover:underline">
                    Para saber más
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Pueblos por región */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Pueblos por comunidad autónoma</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Explora nuestros pueblos certificados organizados por región.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleCCAA.map((c) => {
                const comunidadMatch = Object.keys(byComunidad).find(
                  (name) => norm(name) === norm(c.name)
                );
                const pueblosCCAA = comunidadMatch ? byComunidad[comunidadMatch] ?? [] : [];
                const total = pueblosCCAA.length;

                return (
                  <Link
                    key={c.slug}
                    href={`/pueblos/comunidades/${c.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      {c.flagSrc ? (
                        <Image
                          src={c.flagSrc}
                          alt={`Bandera de ${c.name}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{c.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {total > 0
                          ? `${total} pueblo${total === 1 ? "" : "s"} certificado${total === 1 ? "" : "s"}`
                          : "Todavía sin pueblos"}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
