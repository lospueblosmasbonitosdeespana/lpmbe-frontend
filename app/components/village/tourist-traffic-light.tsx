"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"

type TrafficStatus = "green" | "yellow" | "red"
type ComponentState = "idle" | "loading" | "error"

interface TouristTrafficLightProps {
  status: TrafficStatus
  message: string
  state?: ComponentState
  className?: string
}

const statusKeys: Record<TrafficStatus, "labelGreen" | "labelYellow" | "labelRed"> = {
  green: "labelGreen",
  yellow: "labelYellow",
  red: "labelRed",
}
const statusStyles: Record<TrafficStatus, { color: string; icon: string }> = {
  green: { color: "text-green-700", icon: "bg-green-500" },
  yellow: { color: "text-amber-700", icon: "bg-amber-500" },
  red: { color: "text-red-700", icon: "bg-red-500" },
}

function TrafficLightIndicator({ status }: { status: TrafficStatus }) {
  return (
    <div className="flex flex-col gap-1 rounded-full bg-foreground/90 p-1.5">
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-opacity",
          status === "red" ? "bg-red-500" : "bg-red-500/20"
        )}
      />
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-opacity",
          status === "yellow" ? "bg-amber-500" : "bg-amber-500/20"
        )}
      />
      <div
        className={cn(
          "h-3 w-3 rounded-full transition-opacity",
          status === "green" ? "bg-green-500" : "bg-green-500/20"
        )}
      />
    </div>
  )
}

export function TouristTrafficLight({
  status,
  message,
  state = "idle",
  className,
}: TouristTrafficLightProps) {
  const t = useTranslations("pueblo")
  const label = t(`trafficLight.${statusKeys[status]}`)
  const style = statusStyles[status]

  if (state === "loading") {
    return (
      <Section spacing="none" className={className}>
        <Container>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-4">
            <div className="flex flex-col gap-1 rounded-full bg-muted p-1.5">
              <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/20" />
              <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/20" />
              <div className="h-3 w-3 animate-pulse rounded-full bg-muted-foreground/20" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </Container>
      </Section>
    )
  }

  return (
    <Section spacing="none" className={className}>
      <Container>
        <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
          <TrafficLightIndicator status={status} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-semibold", style.color)}>
                {t("semaforoTuristico")} · {label}
              </span>
              <span className={cn("h-2 w-2 rounded-full", style.icon)} />
            </div>
            <p className="mt-0.5 text-sm text-foreground/80">{message}</p>
          </div>
        </div>
      </Container>
    </Section>
  )
}
