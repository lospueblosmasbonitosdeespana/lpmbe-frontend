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

interface QueHacerSectionProps {
  puebloNombre: string
  puebloSlug: string
  multiexperiencias: PuebloMultiexperiencia[]
}

export function QueHacerSection({ puebloNombre, puebloSlug, multiexperiencias }: QueHacerSectionProps) {
  return (
    <Section spacing="md" background="default">
      <Container>
        <div className="mb-10">
          <Headline>Qué hacer en {puebloNombre}</Headline>
          <Lead className="mt-2">Rutas, experiencias y actividades para descubrir el pueblo.</Lead>
        </div>

        {multiexperiencias.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Eyebrow>Multiexperiencias</Eyebrow>
              <Link
                href={`/pueblos/${puebloSlug}/actualidad`}
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {multiexperiencias.map(({ multiexperiencia: mx }) => (
                <Link
                  key={mx.id}
                  href={`/pueblos/${puebloSlug}/experiencias/${mx.slug}`}
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
