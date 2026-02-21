import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getApiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";

export const metadata: Metadata = {
  title: "Últimas incorporaciones | Los Pueblos Más Bonitos de España",
  description:
    "Descubre todos los pueblos que se han incorporado a la red de Los Pueblos Más Bonitos de España, año por año, desde 2013.",
};

type PuebloIncorporacion = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  foto: string | null;
  expulsado: boolean;
  anioExpulsion: number | null;
};

type YearGroup = {
  anio: number;
  pueblos: PuebloIncorporacion[];
};

async function getIncorporaciones(): Promise<YearGroup[]> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/pueblos/incorporaciones`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function UltimasIncorporacionesPage() {
  const yearGroups = await getIncorporaciones();
  const currentYear = new Date().getFullYear();

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs
            items={[
              { label: "Pueblos", href: "/pueblos" },
              { label: "Incorporaciones por año" },
            ]}
          />
        </Container>
      </Section>

      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative py-12 text-center">
            <Display className="text-3xl md:text-4xl">
              Incorporaciones por año
            </Display>
            <Lead className="mx-auto mt-4 max-w-2xl">
              Cada año nuevos pueblos se suman a la red de Los Pueblos Más
              Bonitos de España. Aquí puedes ver la historia completa de
              incorporaciones desde 2013.
            </Lead>
          </Container>
        </div>
      </Section>

      <Section spacing="md" background="default">
        <Container>
          {yearGroups.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay datos de incorporaciones disponibles.
            </p>
          ) : (
            <div className="space-y-10">
              {yearGroups.map((group) => {
                const isNew = group.anio === currentYear;
                const activos = group.pueblos.filter((p) => !p.expulsado);
                const expulsados = group.pueblos.filter((p) => p.expulsado);

                return (
                  <div key={group.anio} id={`anio-${group.anio}`}>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {group.anio}
                      </h2>
                      <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
                        {activos.length} pueblo{activos.length !== 1 ? "s" : ""}
                      </span>
                      {isNew && (
                        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                          Nuevos
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {activos.map((pueblo) => (
                        <PuebloRow key={pueblo.id} pueblo={pueblo} />
                      ))}
                    </div>

                    {expulsados.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-red-600">
                          Expulsiones en {group.anio === expulsados[0]?.anioExpulsion ? group.anio : "este periodo"}:
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {expulsados.map((pueblo) => (
                            <PuebloRow
                              key={pueblo.id}
                              pueblo={pueblo}
                              isExpulsado
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 border-b border-border" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Navegación rápida por años */}
          {yearGroups.length > 0 && (
            <nav className="sticky bottom-4 z-10 mt-8">
              <div className="mx-auto flex max-w-fit flex-wrap items-center justify-center gap-1.5 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                <span className="mr-1 text-xs font-medium text-muted-foreground">
                  Ir a:
                </span>
                {yearGroups.map((g) => (
                  <a
                    key={g.anio}
                    href={`#anio-${g.anio}`}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {g.anio}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </Container>
      </Section>
    </main>
  );
}

function PuebloRow({
  pueblo,
  isExpulsado = false,
}: {
  pueblo: PuebloIncorporacion;
  isExpulsado?: boolean;
}) {
  return (
    <Link
      href={`/pueblos/${pueblo.slug}`}
      className={`group flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50 ${
        isExpulsado
          ? "border-red-200 bg-red-50/30"
          : "border-border"
      }`}
    >
      {pueblo.foto ? (
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
          <Image
            src={pueblo.foto}
            alt={pueblo.nombre}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
          {pueblo.nombre.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium group-hover:text-primary ${
            isExpulsado ? "line-through text-red-600" : "text-foreground"
          }`}
        >
          {pueblo.nombre}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {pueblo.provincia}
          {isExpulsado && pueblo.anioExpulsion && (
            <span className="ml-1 text-red-500">
              · Expulsado {pueblo.anioExpulsion}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
