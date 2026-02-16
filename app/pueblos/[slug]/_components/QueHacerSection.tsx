import Image from "next/image"
import Link from "next/link"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Title, Body, Eyebrow } from "@/app/components/ui/typography"
import { getTranslations } from "next-intl/server"

type Multiexperiencia = {
  id: number
  titulo: string
  descripcion: string | null
  foto: string | null
  slug: string
  tipo?: string | null
}

type PuebloMultiexperiencia = {
  multiexperiencia: Multiexperiencia
}

type RutaEnPueblo = {
  ruta: { id: number; titulo: string; slug: string; foto_portada?: string | null }
}

interface QueHacerSectionProps {
  puebloNombre: string
  puebloSlug: string
  multiexperiencias: PuebloMultiexperiencia[]
  rutas?: RutaEnPueblo[]
}

export async function QueHacerSection({
  puebloNombre,
  puebloSlug,
  multiexperiencias,
  rutas = [],
}: QueHacerSectionProps) {
  const t = await getTranslations("queHacer")
  const hasMultiex = multiexperiencias.length > 0
  const hasRutas = rutas.length > 0

  if (!hasMultiex && !hasRutas) return null

  return (
    <Section spacing="md" background="default" id="que-hacer">
      <Container>
        <div className="mb-6">
          <Title as="h2">{t("title", { nombre: puebloNombre })}</Title>
          <Body className="mt-2 text-muted-foreground">
            {t("subtitle")}
          </Body>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {hasRutas && rutas.map(({ ruta }) => (
                <Link
                  key={ruta.id}
                  href={`/rutas/${ruta.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 hover:underline"
                >
                  {t("routeThrough", { titulo: ruta.titulo, nombre: puebloNombre })}
                </Link>
              ))}
              {hasMultiex && (
                <Eyebrow className="text-red-600">{t("multiexperiencias").toUpperCase()}</Eyebrow>
              )}
            </div>
            {hasMultiex && (
              <Link
                href={`/pueblos/${puebloSlug}/multiexperiencias`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                {t("viewAll")}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {hasRutas && rutas.map(({ ruta }) => (
              <Link
                key={`ruta-${ruta.id}`}
                href={`/rutas/${ruta.slug}`}
                className="group block"
              >
                {ruta.foto_portada && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                    <Image
                      src={ruta.foto_portada}
                      alt={ruta.titulo}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                {!ruta.foto_portada && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted flex items-center justify-center">
                    <span className="text-4xl text-muted-foreground/50">🗺️</span>
                  </div>
                )}
                <div className="mt-3">
                  <span className="mb-0.5 block text-xs uppercase tracking-wider text-muted-foreground">
                    {t("route").toUpperCase()}
                  </span>
                  <h3 className="font-serif text-lg leading-snug transition-colors group-hover:text-primary">
                    {t("routeThrough", { titulo: ruta.titulo, nombre: puebloNombre })}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t("discoverRoute")}
                  </p>
                </div>
              </Link>
            ))}
            {hasMultiex && multiexperiencias.map(({ multiexperiencia: mx }) => (
              <Link
                key={`mx-${mx.id}`}
                href={`/pueblos/${puebloSlug}/experiencias/${mx.slug}`}
                className="group block"
              >
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
                    {t("experience").toUpperCase()}
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
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}
