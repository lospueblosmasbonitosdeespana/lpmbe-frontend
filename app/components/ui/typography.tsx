import React from "react"
import { cn } from "@/lib/utils"

interface DisplayProps {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "span"
}

export function Display({ children, className, as: Component = "h1" }: DisplayProps) {
  return (
    <Component
      className={cn(
        "font-serif text-3xl font-medium tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl",
        className
      )}
    >
      {children}
    </Component>
  )
}

interface HeadlineProps {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4"
}

export function Headline({ children, className, as: Component = "h2" }: HeadlineProps) {
  return (
    <Component
      className={cn(
        "font-serif text-xl font-medium tracking-tight text-balance sm:text-2xl md:text-3xl",
        className
      )}
    >
      {children}
    </Component>
  )
}

interface TitleProps {
  children: React.ReactNode
  className?: string
  as?: "h2" | "h3" | "h4" | "h5" | "h6"
}

export function Title({ children, className, as: Component = "h3" }: TitleProps) {
  return (
    <Component
      className={cn(
        "font-serif text-lg font-medium tracking-tight sm:text-xl md:text-2xl",
        className
      )}
    >
      {children}
    </Component>
  )
}

interface EyebrowProps {
  children: React.ReactNode
  className?: string
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-widest text-primary",
        className
      )}
    >
      {children}
    </span>
  )
}

interface LeadProps {
  children: React.ReactNode
  className?: string
}

export function Lead({ children, className }: LeadProps) {
  return (
    <p
      className={cn(
        "text-lg leading-relaxed text-muted-foreground sm:text-xl",
        className
      )}
    >
      {children}
    </p>
  )
}

interface BodyProps {
  children: React.ReactNode
  className?: string
  size?: "sm" | "base" | "lg"
}

const bodySizeClasses = {
  sm: "text-sm leading-relaxed",
  base: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
}

export function Body({ children, className, size = "base" }: BodyProps) {
  return (
    <p className={cn(bodySizeClasses[size], className)}>
      {children}
    </p>
  )
}

interface CaptionProps {
  children: React.ReactNode
  className?: string
}

export function Caption({ children, className }: CaptionProps) {
  return (
    <span className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </span>
  )
}
