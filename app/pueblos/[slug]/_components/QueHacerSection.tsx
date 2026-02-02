import Image from "next/image"
import Link from "next/link"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Headline, Lead, Eyebrow } from "@/app/components/ui/typography"

type Multiexperiencia = {
  id: number
  titulo: string
  descripcion: string | null
  foto: string | null
  slug: string
}

type PuebloMultiexperiencia = {
  multiexperiencia: Multiexperiencia
}

type PaginaTematica = {
  id: number
  titulo: string
  coverUrl: string | null
  category: string
}

type Poi = {
  id: number
  nombre: string
  descripcion_corta: string | null
  foto: string | null
  rotation?: number | null
}

// Slug para URL de categoría temática
const CATEGORY_TO_SLUG: Record<string, string> = {
  GASTRONOMIA: "gastronomia",
  NATURALEZA: "naturaleza",
  CULTURA: "cultura",
  PATRIMONIO: "patrimonio",
  EN_FAMILIA: "en-familia",
  PETFRIENDLY: "petfriendly",
}

interface QueHacerSectionProps {
  puebloNombre: string
  puebloSlug: string
  paginasTematicas: PaginaTematica[]
  pois: Poi[]
  multiexperiencias: PuebloMultiexperiencia[]
}

export function QueHacerSection({
  puebloNombre,
  puebloSlug,
  paginasTematicas,
  pois,
  multiexperiencias,
}: QueHacerSectionProps) {
  // Primera fila: máx 3 - temáticos primero, si no hay entonces POIs
  const topItems = paginasTematicas.length > 0
    ? paginasTematicas.slice(0, 3).map((p) => ({
        type: "tematica" as const,
        id: p.id,
        titulo: p.titulo,
        imagen: p.coverUrl,
        href: `/pueblos/${puebloSlug}#categoria-${CATEGORY_TO_SLUG[p.category] || p.category.toLowerCase()}`,
        rotation: undefined as number | undefined,
        descripcion: null as string | null,
      }))
    : pois.slice(0, 3).map((poi) => ({
        type: "poi" as const,
        id: poi.id,
        titulo: poi.nombre,
        imagen: poi.foto,
        href: `/pueblos/${puebloSlug}/pois/${poi.id}`,
        rotation: poi.rotation ?? undefined,
        descripcion: poi.descripcion_corta,
      }))

  const hasTop = topItems.length > 0
  const hasMultiex = multiexperiencias.length > 0

  if (!hasTop && !hasMultiex) return null

  return (
    <Section spacing="md" background="default" id="que-hacer">
      <Container>
        <div className="mb-10">
          <Headline>Qué hacer en {puebloNombre}</Headline>
          <Lead className="mt-2">
            Rutas, experiencias y actividades para descubrir el pueblo.
          </Lead>
        </div>

        {/* Primera fila: 3 cards - contenidos temáticos o POIs */}
        {hasTop && (
          <div className="mb-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {topItems.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
                >
                  {item.imagen && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <Image
                        src={item.imagen}
                        alt={item.titulo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                      {item.titulo}
                    </h3>
                    {item.descripcion && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.descripcion}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Segunda fila: SÓLO multiexperiencias - horizontal, primera a la izquierda, más a la derecha */}
        {hasMultiex && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Eyebrow className="text-red-600">MULTIEXPERIENCIAS</Eyebrow>
              <Link
                href={`/pueblos/${puebloSlug}/multiexperiencias`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Ver todas
              </Link>
            </div>
            <div className="flex flex-wrap gap-6">
              {multiexperiencias.map(({ multiexperiencia: mx }) => (
                <Link
                  key={mx.id}
                  href={`/experiencias/${mx.slug}/pueblo/${puebloSlug}`}
                  className="group block w-full min-w-[280px] max-w-[400px] overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md sm:flex-1"
                >
                  {mx.foto && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <Image
                        src={mx.foto}
                        alt={mx.titulo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                      {mx.titulo}
                    </h3>
                    {mx.descripcion && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {mx.descripcion.length > 150
                          ? mx.descripcion.substring(0, 150) + "..."
                          : mx.descripcion}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </Section>
  )
}
