"use client"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Grid } from "@/app/components/ui/grid"
import { Headline, Eyebrow } from "@/app/components/ui/typography"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("poi")
  if (points.length === 0) return null

  const toShow = maxItems === 0 ? points : points.slice(0, maxItems)

  return (
    <Section spacing="md" className={className} id={id}>
      <Container>
        {!hideHeader && (
          <div className="mb-10 max-w-2xl md:mb-12">
            <Eyebrow className="mb-3 block">{t("eyebrow")}</Eyebrow>
            {allHref ? (
              <Link href={allHref} className="group inline-block">
                <Headline className="text-2xl sm:text-3xl transition-colors group-hover:text-primary">{t("title")}</Headline>
              </Link>
            ) : (
              <Headline className="text-2xl sm:text-3xl">{t("title")}</Headline>
            )}
          </div>
        )}

        <Grid columns={2} gap="sm">
          {toShow.map((point, index) => (
            <PointOfInterestCard key={point.id} point={point} index={index} showFullDescription={showFullDescription} />
          ))}
        </Grid>

        {!hideHeader && allHref && (
          <div className="mt-6 flex justify-start">
            <Link
              href={allHref}
              className="inline-flex items-center rounded-lg border border-primary/25 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 hover:border-primary/35"
            >
              {t("viewAll")}
            </Link>
          </div>
        )}
      </Container>
    </Section>
  )
}

function PointOfInterestCard({ point, index, showFullDescription }: { point: PointOfInterest; index: number; showFullDescription?: boolean }) {
  const hasDescription = point.description?.trim() && !/^sin descripción\.?$/i.test(point.description.trim())
  const content = (
    <article
      className={cn(
        "flex flex-col sm:flex-row gap-3 rounded-lg border border-border/60 bg-white/60 dark:bg-card p-3 transition-colors sm:gap-4 sm:p-4",
        point.href && "cursor-pointer hover:border-primary/20 hover:bg-white/80 dark:hover:bg-card/90"
      )}
    >
      {point.image && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-muted/50 sm:h-20 sm:w-20 self-start">
          <Image
            src={point.image}
            alt={point.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 items-start gap-2 min-w-0 w-full">
        <span className="font-serif text-2xl font-medium leading-none text-primary/25 dark:text-primary/40 sm:text-3xl shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          <span className="mb-0.5 block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {point.type}
          </span>
          <h3 className={cn("font-serif text-base font-medium text-foreground sm:text-lg", point.href && "group-hover:text-primary transition-colors")}>
            {point.name}
          </h3>
          {hasDescription && (
            <p className={cn(
              "text-xs leading-relaxed text-foreground/90 dark:text-muted-foreground sm:text-sm mt-0.5",
              !showFullDescription && "line-clamp-2"
            )}>
              {point.description}
            </p>
          )}
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
