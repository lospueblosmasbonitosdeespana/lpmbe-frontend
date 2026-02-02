import React from "react"
import { cn } from "@/lib/utils"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Eyebrow, Headline } from "@/app/components/ui/typography"

interface StatItem {
  value: string
  label: string
}

interface DetailStatsBlockProps {
  eyebrow?: string
  title?: string
  stats: StatItem[]
  columns?: 2 | 3 | 4
  background?: "default" | "muted" | "card"
  className?: string
}

const colsClass = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
}

export function DetailStatsBlock({
  eyebrow = "EN CIFRAS",
  title = "Patrimonio y Tradición",
  stats,
  columns = 4,
  background = "muted",
  className,
}: DetailStatsBlockProps) {
  if (!stats?.length) return null

  return (
    <Section background={background} spacing="md" className={className}>
      <Container>
        <div className="mb-10 text-center">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
          {title && <Headline>{title}</Headline>}
        </div>
        <div className={cn("grid gap-8", colsClass[columns])}>
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
                {stat.value}
              </div>
              <div className="mt-2 text-sm uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
