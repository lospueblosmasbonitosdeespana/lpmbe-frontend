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
}

export function PointsOfInterest({ points, className }: PointsOfInterestProps) {
  if (points.length === 0) return null

  return (
    <Section spacing="md" className={className}>
      <Container>
        <div className="mb-10 lg:mb-12">
          <Eyebrow className="mb-4">Qué ver</Eyebrow>
          <Headline>Puntos de Interés</Headline>
        </div>

        <Grid columns={2} gap="md">
          {points.map((point, index) => (
            <PointOfInterestCard key={point.id} point={point} index={index} />
          ))}
        </Grid>
      </Container>
    </Section>
  )
}

function PointOfInterestCard({ point, index }: { point: PointOfInterest; index: number }) {
  const content = (
    <article
      className={cn(
        "flex gap-4 border border-border bg-card p-4 transition-colors lg:p-5",
        point.href && "cursor-pointer hover:border-primary/30"
      )}
    >
      {point.image && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-muted lg:h-24 lg:w-24">
          <Image
            src={point.image}
            alt={point.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 items-start gap-3">
        <span className="font-serif text-3xl font-medium leading-none text-primary/30 lg:text-4xl">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="flex-1">
          <span className="mb-1 block text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            {point.type}
          </span>
          <h3 className={cn("mb-1 font-serif text-lg font-medium text-foreground lg:text-xl", point.href && "group-hover:text-primary transition-colors")}>
            {point.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
