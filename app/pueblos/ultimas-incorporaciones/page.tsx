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
  title: "Certificaciones por año | Los Pueblos Más Bonitos de España",
  description:
    "Descubre todos los pueblos certificados por la red de Los Pueblos Más Bonitos de España, año por año, desde 2013.",
};

type PuebloDTO = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string;
  comunidad: string;
  foto: string | null;
  expulsado: boolean;
};

type YearGroup = {
  anio: number;
  incorporaciones: PuebloDTO[];
  expulsiones: PuebloDTO[];
  reincorporaciones: PuebloDTO[];
};

type APIResponse = {
  totalActivos: number;
  years: YearGroup[];
};

async function getIncorporaciones(): Promise<APIResponse> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/pueblos/incorporaciones`,
      { cache: "no-store" }
    );
    if (!res.ok) return { totalActivos: 0, years: [] };
    return res.json();
  } catch {
    return { totalActivos: 0, years: [] };
  }
}

export default async function UltimasIncorporacionesPage() {
  const { totalActivos, years } = await getIncorporaciones();

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs
            items={[
              { label: "Pueblos", href: "/pueblos" },
              { label: "Certificaciones por año" },
            ]}
          />
        </Container>
      </Section>

      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative py-12 text-center">
            <Display className="text-3xl md:text-4xl">
              Certificaciones por año
            </Display>
            <Lead className="mx-auto mt-4 max-w-2xl">
              Cada año nuevos pueblos obtienen la certificación de Los Pueblos
              Más Bonitos de España.
            </Lead>

            {totalActivos > 0 && (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-3">
                <span className="text-3xl font-bold text-primary">
                  {totalActivos}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  pueblos en la red
                </span>
              </div>
            )}
          </Container>
        </div>
      </Section>

      <Section spacing="md" background="default">
        <Container>
          {years.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay datos de incorporaciones disponibles.
            </p>
          ) : (
            <div className="space-y-10">
              {years.map((group) => {
                const numIncorporaciones = group.incorporaciones.length;
                const numExpulsiones = group.expulsiones.length;
                const numReincorporaciones = group.reincorporaciones.length;

                return (
                  <div key={group.anio} id={`anio-${group.anio}`}>
                    {/* Year header */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {group.anio}
                      </h2>
                      {numIncorporaciones > 0 && (
                        <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
                          {numIncorporaciones} pueblo
                          {numIncorporaciones !== 1 ? "s" : ""}
                        </span>
                      )}
                      {numExpulsiones > 0 && (
                        <span className="rounded-full bg-destructive/10 px-3 py-0.5 text-sm font-medium text-destructive">
                          −{numExpulsiones} pueblo
                          {numExpulsiones !== 1 ? "s" : ""}
                        </span>
                      )}
                      {numReincorporaciones > 0 && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-sm font-medium text-emerald-700">
                          +{numReincorporaciones} reincorporación
                          {numReincorporaciones !== 1 ? "es" : ""}
                        </span>
                      )}
                    </div>

                    {/* Incorporaciones */}
                    {numIncorporaciones > 0 && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {group.incorporaciones.map((pueblo) => (
                          <PuebloCard key={`inc-${pueblo.id}`} pueblo={pueblo} />
                        ))}
                      </div>
                    )}

                    {/* Reincorporaciones */}
                    {numReincorporaciones > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {group.reincorporaciones.map((pueblo) => (
                          <PuebloCard
                            key={`reinc-${pueblo.id}`}
                            pueblo={pueblo}
                            variant="reincorporacion"
                          />
                        ))}
                      </div>
                    )}

                    {/* Expulsiones / salidas */}
                    {numExpulsiones > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {group.expulsiones.map((pueblo) => (
                          <PuebloCard
                            key={`exp-${pueblo.id}`}
                            pueblo={pueblo}
                            variant="expulsado"
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-6 border-b border-border" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Navegación rápida por años */}
          {years.length > 0 && (
            <nav className="sticky bottom-4 z-10 mt-8">
              <div className="mx-auto flex max-w-fit flex-wrap items-center justify-center gap-1.5 rounded-full border bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                <span className="mr-1 text-xs font-medium text-muted-foreground">
                  Ir a:
                </span>
                {years.map((g) => (
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

function PuebloCard({
  pueblo,
  variant = "normal",
}: {
  pueblo: PuebloDTO;
  variant?: "normal" | "expulsado" | "reincorporacion";
}) {
  const isExpulsado = variant === "expulsado";
  const isReincorporacion = variant === "reincorporacion";

  const borderClass = isExpulsado
    ? "border-destructive/20 bg-destructive/5"
    : isReincorporacion
      ? "border-emerald-500/20 bg-emerald-50/50"
      : "border-border";

  const content = (
    <div
      className={`flex items-center gap-3 rounded-lg border p-2.5 transition-colors ${borderClass} ${
        isExpulsado ? "opacity-75" : "group hover:bg-muted/50"
      }`}
    >
      {/* Foto */}
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

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p
            className={`truncate text-sm font-medium ${
              isExpulsado
                ? "text-muted-foreground line-through"
                : "text-foreground group-hover:text-primary"
            }`}
          >
            {pueblo.nombre}
          </p>

          {/* X roja para expulsados */}
          {isExpulsado && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className="flex-shrink-0 text-destructive"
            >
              <path
                d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* Flecha verde circular para reincorporaciones */}
          {isReincorporacion && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="flex-shrink-0 text-emerald-600"
            >
              <path
                d="M2.5 8a5.5 5.5 0 0 1 9.68-3.5M13.5 8a5.5 5.5 0 0 1-9.68 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12.18 2v2.5H9.68"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.82 14v-2.5H6.32"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {pueblo.provincia}
        </p>
      </div>
    </div>
  );

  if (isExpulsado || pueblo.expulsado) {
    return <div className="cursor-default">{content}</div>;
  }

  return (
    <Link href={`/pueblos/${pueblo.slug}`} className="group">
      {content}
    </Link>
  );
}
