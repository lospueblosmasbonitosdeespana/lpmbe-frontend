'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { AwardsConfig } from './comercio-config'

interface AwardsSectionProps {
  config: AwardsConfig
}

export function AwardsSection({ config }: AwardsSectionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (config.awards.length === 0 && config.pressQuotes.length === 0) return null

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            Reconocimientos
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Premios y reconocimientos
          </h2>
        </div>

        {/* Awards logos */}
        {config.awards.length > 0 && (
          <div className="mb-12 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {config.awards.map((award, index) => (
              <div
                key={index}
                className="relative h-16 w-24 transition-opacity duration-300 md:h-20 md:w-32"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  filter: hoveredIndex === index ? 'none' : 'grayscale(100%)',
                  opacity: hoveredIndex === index ? 1 : 0.5,
                }}
              >
                <Image
                  src={award.logo}
                  alt={award.name}
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              </div>
            ))}
          </div>
        )}

        {/* Press quotes */}
        {config.pressQuotes.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {config.pressQuotes.map((quote, index) => (
              <blockquote
                key={index}
                className="rounded-lg border border-border bg-card p-6"
              >
                <p className="mb-4 font-serif text-lg italic text-foreground">
                  &ldquo;{quote.quote}&rdquo;
                </p>
                <footer className="text-sm text-muted-foreground">
                  — {quote.source}, {quote.year}
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
