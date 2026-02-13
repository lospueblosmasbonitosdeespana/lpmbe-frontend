"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Grid } from "@/app/components/ui/grid"
import { Headline, Eyebrow } from "@/app/components/ui/typography"

interface PointOfInterest {
  id: number
  name: string
  type: string
  description: string
  image?: string | null
  rotation?: number | null
  href?: string
}

interface PointsOfInterestProps {
  points: PointOfInterest[]
  className?: string
  /** Máximo de items (por defecto 6). Pasar 0 para mostrar todos. */
  maxItems?: number
  /** Ocultar el header "Qué ver / Lugares de interés" (útil en página de categoría) */
  hideHeader?: boolean
  /** Id para anchor (ej. #lugares-de-interes) */
  id?: string
  /** Enlace a la página "Todos los lugares de interés" (mapa + listado completo) */
  allHref?: string
  /** Mostrar descripción completa en lugar de truncar (para página dedicada) */
  showFullDescription?: boolean
}

export function PointsOfInterest({ points, className, maxItems = 6, hideHeader, id, allHref, showFullDescription }: PointsOfInterestProps) {
  if (points.length === 0) return null

  const toShow = maxItems === 0 ? points : points.slice(0, maxItems)

  const headerContent = allHref ? (
    <Link href={allHref} className="group inline-block">
      <Headline className="text-2xl sm:text-3xl transition-colors group-hover:text-primary">Lugares de interés</Headline>
    </Link>
  ) : (
    <Headline className="text-2xl sm:text-3xl">Lugares de interés</Headline>
  )

  return (
    <Section spacing="md" className={className} id={id}>
      <Container>
        {!hideHeader && (
          <div className="mb-6 lg:mb-8">
            <Eyebrow className="mb-3">Qué ver</Eyebrow>
            {headerContent}
            {allHref && (
              <Link
                href={allHref}
                className="mt-3 inline-flex items-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:border-primary/20"
              >
                Todos los lugares de interés
              </Link>
            )}
          </div>
        )}

        <Grid columns={2} gap="sm">
          {toShow.map((point, index) => (
            <PointOfInterestCard key={point.id} point={point} index={index} showFullDescription={showFullDescription} />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function PointOfInterestCard({ point, index, showFullDescription }: { point: PointOfInterest; index: number; showFullDescription?: boolean }) {
  const content = (
    <article
      className={cn(
        "flex gap-3 rounded-lg border border-border/60 bg-white/60 p-3 transition-colors sm:gap-4 sm:p-4",
        point.href && "cursor-pointer hover:border-primary/20 hover:bg-white/80"
      )}
    >
      {point.image && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted/50 sm:h-20 sm:w-20">
          <Image
            src={point.image}
            alt={point.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 items-start gap-2 min-w-0">
        <span className="font-serif text-2xl font-medium leading-none text-primary/25 sm:text-3xl">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <span className="mb-0.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {point.type}
          </span>
          <h3 className={cn("font-serif text-base font-medium text-foreground sm:text-lg", point.href && "group-hover:text-primary transition-colors")}>
            {point.name}
          </h3>
          <p className={cn(
            "text-xs leading-relaxed text-muted-foreground sm:text-sm",
            !showFullDescription && "line-clamp-2"
          )}>
            {point.description}
          </p>
        </div>
      </div>
    </article>
  )

  if (point.href) {
    return (
      <Link href={point.href} className="group block">
        {content}
      </Link>
    )
  }

  return content
}
