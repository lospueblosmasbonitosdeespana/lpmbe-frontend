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

interface QueHacerSectionProps {
  puebloNombre: string
  puebloSlug: string
  multiexperiencias: PuebloMultiexperiencia[]
}

export function QueHacerSection({
  puebloNombre,
  puebloSlug,
  multiexperiencias,
}: QueHacerSectionProps) {
  const hasMultiex = multiexperiencias.length > 0

  if (!hasMultiex) return null

  return (
    <Section spacing="md" background="default" id="que-hacer">
      <Container>
        <div className="mb-6">
          <Title as="h2">Qué hacer en {puebloNombre}</Title>
          <Body className="mt-2 text-muted-foreground">
            Rutas, experiencias y actividades para descubrir el pueblo.
          </Body>
        </div>

        {/* MULTIEXPERIENCIAS - diseño V0 (sin tarjeta, imagen + texto abajo, hover zoom) */}
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
      </Container>
    </Section>
  )
}
