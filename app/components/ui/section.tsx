import React from "react"
import { cn } from "@/lib/utils"

type SectionSpacing = "sm" | "md" | "lg" | "none"
type SectionBackground = "default" | "muted" | "card" | "primary" | "accent"

interface SectionProps {
  children: React.ReactNode
  spacing?: SectionSpacing
  background?: SectionBackground
  className?: string
  id?: string
}

const spacingClasses: Record<SectionSpacing, string> = {
  none: "",
  sm: "py-8 md:py-12",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-20",
}

const backgroundClasses: Record<SectionBackground, string> = {
  default: "bg-background",
  muted: "bg-muted",
  card: "bg-card",
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
}

export function Section({
  children,
  spacing = "md",
  background = "default",
  className,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        spacingClasses[spacing],
        backgroundClasses[background],
        className
      )}
    >
      {children}
    </section>
  )
}
