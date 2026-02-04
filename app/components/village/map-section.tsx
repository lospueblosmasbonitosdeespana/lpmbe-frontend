"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Title, Lead, Caption } from "@/app/components/ui/typography"

interface MapMarker {
  id: string
  lat: number
  lng: number
  label: string
}

interface MapSectionProps {
  title?: string
  description?: string
  center: { lat: number; lng: number }
  markers?: MapMarker[]
  height?: "sm" | "md" | "lg"
  boldestMapUrl?: string
  boldestMapId?: string
  className?: string
}

const heightClasses = {
  sm: "h-64 sm:h-80",
  md: "h-80 sm:h-96",
  lg: "h-96 sm:h-[28rem]",
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function MapSection({
  title = "Ubicación",
  description,
  center,
  markers = [],
  height = "md",
  boldestMapUrl,
  boldestMapId,
  className,
}: MapSectionProps) {
  return (
    <Section spacing="md" className={className}>
      <Container>
        {(title || description) && (
          <div className="mb-6">
            {title && <Title>{title}</Title>}
            {description && <Lead className="mt-2">{description}</Lead>}
          </div>
        )}

        {boldestMapUrl ? (
          <div className="space-y-4">
            <iframe
              src={boldestMapUrl}
              width="100%"
              height="480"
              frameBorder={0}
              className="rounded-lg"
              title={title}
            />
            <a
              href={boldestMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Mapa interactivo
            </a>
          </div>
        ) : (
          <div
            className={cn(
              "relative overflow-hidden rounded-lg bg-muted",
              heightClasses[height]
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-dashed border-border bg-card/80 px-4 py-3 text-center backdrop-blur-sm">
                <MapPinIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">
                  Mapa interactivo
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </p>
              </div>
            </div>
            {markers.length > 0 && (
              <div className="absolute bottom-3 left-3 rounded-md bg-card/90 px-2 py-1 text-xs backdrop-blur-sm">
                {markers.length} puntos de interés
              </div>
            )}
          </div>
        )}

        {boldestMapId && (
          <Caption className="mt-2 block">Map ID: {boldestMapId}</Caption>
        )}
      </Container>
    </Section>
  )
}
