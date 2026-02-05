import Link from "next/link";
import Image from "next/image";
import { getHomeConfig } from "@/lib/homeApi";
import { getApiUrl } from "@/lib/api";
import { Container } from "@/app/components/ui/container";
import { Section } from "@/app/components/ui/section";
import { Title, Muted, Display } from "@/app/components/ui/typography";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

type TematicaPage = {
  id: number;
  titulo: string;
  resumen?: string | null;
  coverUrl?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
    provincia?: string;
    comunidad?: string;
  };
};

const CATEGORY_MAP: Record<string, { category: string; title: string }> = {
  gastronomia: { category: "GASTRONOMIA", title: "Gastronomía" },
  naturaleza: { category: "NATURALEZA", title: "Naturaleza" },
  cultura: { category: "CULTURA", title: "Cultura" },
  "en-familia": { category: "EN_FAMILIA", title: "En familia" },
  petfriendly: { category: "PETFRIENDLY", title: "Petfriendly" },
};

async function getPueblosByTematica(
  category: string
): Promise<TematicaPage[]> {
  try {
    const res = await fetch(
      `${getApiUrl()}/public/pages?category=${category}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.pueblos) ? data.pueblos : [];
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Experiencias temáticas | Los Pueblos Más Bonitos de España",
  description:
    "Descubre nuestros pueblos por temática: gastronomía, naturaleza, cultura, en familia, petfriendly.",
};

export default async function ExperienciasPage() {
  const config = await getHomeConfig();
  const themes = config.themes;

  // Obtener pueblos por temática (solo los que tienen contenido publicado)
  const pueblosByTematica = await Promise.all(
    themes.map(async (t) => {
      const map = CATEGORY_MAP[t.key];
      const pueblos = map ? await getPueblosByTematica(map.category) : [];
      return { theme: t, pueblos };
    })
  );

  return (
    <main className="min-h-screen">
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
            <Title as="h2" size="xl" className="mb-6">
              Temáticas de la asociación
            </Title>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {themes.map((t) => (
                <Link key={t.key} href={t.href} className="group block">
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

          {/* Pueblos por temática (solo si tienen contenido) */}
          <div className="space-y-12">
            <Title as="h2" size="xl" className="mb-6">
              Pueblos por temática
            </Title>
            <Muted className="block mb-8">
              Solo se muestran los pueblos que han publicado contenido en cada temática.
            </Muted>

            {pueblosByTematica.map(({ theme, pueblos }) => (
              <section key={theme.key}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h3 className="text-lg font-semibold">{theme.title}</h3>
                  <Link
                    href={theme.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    Ver temática completa <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {pueblos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Ningún pueblo ha publicado contenido en esta temática todavía.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {pueblos.map((item) => {
                      const href = `/experiencias/${theme.key}/pueblos/${item.pueblo!.slug}`;
                      return (
                        <Link
                          key={item.id}
                          href={href}
                          className="block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
                        >
                          {item.coverUrl && item.coverUrl.trim() ? (
                            <div className="h-28 w-full overflow-hidden rounded-t-lg bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.coverUrl.trim()}
                                alt={item.titulo}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-28 w-full rounded-t-lg bg-muted" />
                          )}
                          <div className="p-2.5">
                            <h4 className="line-clamp-2 text-sm font-semibold leading-snug">
                              {item.titulo}
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.pueblo!.nombre}
                              {item.pueblo!.provincia && ` (${item.pueblo!.provincia})`}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}
