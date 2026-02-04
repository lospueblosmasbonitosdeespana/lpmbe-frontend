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
  categoriaTematica?: string | null
}

const CATEGORIA_LABEL: Record<string, string> = {
  NATURALEZA: "NATURALEZA",
  CULTURA: "CULTURA",
  PATRIMONIO: "PATRIMONIO",
  GASTRONOMIA: "GASTRONOMÍA",
  EN_FAMILIA: "EN FAMILIA",
  PETFRIENDLY: "PETFRIENDLY",
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
  // Primera fila: máx 3 - temáticos primero, si no hay entonces POIs (diseño V0: sin tarjeta, texto abajo)
  const topItems = paginasTematicas.length > 0
    ? paginasTematicas.slice(0, 3).map((p) => ({
        type: "tematica" as const,
        id: p.id,
        titulo: p.titulo,
        imagen: p.coverUrl,
        href: `/pueblos/${puebloSlug}/categoria/${CATEGORY_TO_SLUG[p.category] || p.category.toLowerCase()}`,
        rotation: undefined as number | undefined,
        detalle: CATEGORIA_LABEL[p.category] ?? p.category,
      }))
    : pois.slice(0, 3).map((poi) => ({
        type: "poi" as const,
        id: poi.id,
        titulo: poi.nombre,
        imagen: poi.foto,
        href: `/pueblos/${puebloSlug}/pois/${poi.id}`,
        rotation: poi.rotation ?? undefined,
        detalle: poi.categoriaTematica ? (CATEGORIA_LABEL[poi.categoriaTematica.toUpperCase()] ?? poi.categoriaTematica) : "LUGAR DE INTERÉS",
      }))

  const hasTop = topItems.length > 0
  const hasMultiex = multiexperiencias.length > 0

  if (!hasTop && !hasMultiex) return null

  return (
    <Section spacing="md" background="default" id="que-hacer">
      <Container>
        <div className="mb-6">
          <Title as="h2">Qué hacer en {puebloNombre}</Title>
          <Body className="mt-2 text-muted-foreground">
            Rutas, experiencias y actividades para descubrir el pueblo.
          </Body>
        </div>

        {/* Primera fila: 3 items - diseño V0 (sin tarjeta, imagen + texto abajo, hover zoom) */}
        {hasTop && (
          <div className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <Eyebrow>
                {paginasTematicas.length > 0 ? "LUGARES A VISITAR" : "LUGARES DE INTERÉS"}
              </Eyebrow>
              <Link
                href={`/pueblos/${puebloSlug}/lugares`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {topItems.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="group block"
                >
                  {item.imagen && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted">
                      <Image
                        src={item.imagen}
                        alt={item.titulo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="mt-3">
                    <span className="mb-0.5 block text-xs uppercase tracking-wider text-muted-foreground">
                      {item.detalle}
                    </span>
                    <h3 className="font-serif text-lg leading-snug transition-colors group-hover:text-primary">
                      {item.titulo}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Segunda fila: MULTIEXPERIENCIAS - diseño V0 (sin tarjeta, imagen + texto abajo, hover zoom) */}
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
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {multiexperiencias.map(({ multiexperiencia: mx }) => (
                <Link
                  key={mx.id}
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
            </div>
          </div>
        )}
      </Container>
    </Section>
  )
}
