import Image from "next/image"
import Link from "next/link"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Title, Body, Eyebrow } from "@/app/components/ui/typography"

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

export function QueHacerSection({
  puebloNombre,
  puebloSlug,
  multiexperiencias,
  rutas = [],
}: QueHacerSectionProps) {
  const hasMultiex = multiexperiencias.length > 0
  const hasRutas = rutas.length > 0

  if (!hasMultiex && !hasRutas) return null

  return (
    <Section spacing="md" background="default" id="que-hacer">
      <Container>
        <div className="mb-6">
          <Title as="h2">Qué hacer en {puebloNombre}</Title>
          <Body className="mt-2 text-muted-foreground">
            Rutas, experiencias y actividades para descubrir el pueblo.
          </Body>
        </div>

        {/* MULTIEXPERIENCIAS + Rutas que pasan por el pueblo - diseño V0 */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {hasMultiex && (
                <Eyebrow className="text-red-600">MULTIEXPERIENCIAS</Eyebrow>
              )}
              {hasRutas && rutas.map(({ ruta }) => (
                <Link
                  key={ruta.id}
                  href={`/rutas/${ruta.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-red-600 hover:text-red-700 hover:underline"
                >
                  {ruta.titulo} que pasa por {puebloNombre}
                </Link>
              ))}
            </div>
            {hasMultiex && (
              <Link
                href={`/pueblos/${puebloSlug}/multiexperiencias`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Ver todas
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
              </Link>
            ))}
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
                    RUTA
                  </span>
                  <h3 className="font-serif text-lg leading-snug transition-colors group-hover:text-primary">
                    {ruta.titulo} que pasa por {puebloNombre}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Descubre esta ruta y sus pueblos
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  )
}
