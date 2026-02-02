import Image from "next/image"
import Link from "next/link"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Headline, Lead, Eyebrow } from "@/app/components/ui/typography"
import RotatedImage from "@/app/components/RotatedImage"

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
  slug: string
  foto: string | null
  categoria: string
}

type Poi = {
  id: number
  nombre: string
  descripcion_corta: string | null
  foto: string | null
  rotation?: number | null
}

interface QueHacerSectionProps {
  puebloNombre: string
  puebloSlug: string
  multiexperiencias: PuebloMultiexperiencia[]
  paginasTematicas?: PaginaTematica[]
  poisFallback?: Poi[]
}

export function QueHacerSection({ 
  puebloNombre, 
  puebloSlug, 
  multiexperiencias,
  paginasTematicas = [],
  poisFallback = []
}: QueHacerSectionProps) {
  const lugaresVisitar = paginasTematicas.length > 0 ? paginasTematicas : poisFallback.slice(0, 6)
  
  return (
    <Section spacing="md" background="default">
      <Container>
        <div className="mb-10">
          <Headline>Qué hacer en {puebloNombre}</Headline>
          <Lead className="mt-2">Rutas, experiencias y actividades para descubrir el pueblo.</Lead>
        </div>

        {/* Primera fila: Lugares a visitar */}
        {lugaresVisitar.length > 0 && (
          <div className="mb-12">
            <div className="mb-4">
              <Eyebrow>Lugares a visitar</Eyebrow>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lugaresVisitar.slice(0, 6).map((lugar) => {
                const esPagina = 'categoria' in lugar
                const href = esPagina 
                  ? `/pueblos/${puebloSlug}/tematicas/${(lugar as PaginaTematica).slug}`
                  : `/pueblos/${puebloSlug}/pois/${lugar.id}`
                const imagen = lugar.foto
                const titulo = esPagina ? (lugar as PaginaTematica).titulo : (lugar as Poi).nombre
                const descripcion = esPagina ? '' : (lugar as Poi).descripcion_corta
                const rotation = !esPagina ? (lugar as Poi).rotation : undefined

                return (
                  <Link
                    key={lugar.id}
                    href={href}
                    className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
                  >
                    {imagen && (
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        {rotation !== undefined ? (
                          <RotatedImage
                            src={imagen}
                            alt={titulo}
                            rotation={rotation ?? 0}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <Image
                            src={imagen}
                            alt={titulo}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                        {titulo}
                      </h3>
                      {descripcion && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {descripcion}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Segunda fila: MULTIEXPERIENCIAS en rojo */}
        {multiexperiencias.length > 0 && (
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {multiexperiencias.map(({ multiexperiencia: mx }) => (
                <Link
                  key={mx.id}
                  href={`/experiencias/${mx.slug}/pueblo/${puebloSlug}`}
                  className="group block overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
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

