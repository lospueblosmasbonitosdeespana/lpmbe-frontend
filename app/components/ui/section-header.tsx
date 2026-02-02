import React from "react"
import { cn } from "@/lib/utils"
import { Eyebrow, Headline, Lead } from "./typography"

type Alignment = "left" | "center"

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  align?: Alignment
  className?: string
  children?: React.ReactNode
}

const alignClasses: Record<Alignment, string> = {
  left: "text-left",
  center: "text-center mx-auto",
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  children,
}: SectionHeaderProps) {
  return (
    <header
      className={cn(
        "mb-10 max-w-2xl md:mb-12",
        alignClasses[align],
        className
      )}
    >
      {eyebrow && (
        <Eyebrow className="mb-3 block">{eyebrow}</Eyebrow>
      )}
      <Headline>{title}</Headline>
      {description && (
        <Lead className="mt-4">{description}</Lead>
      )}
      {children}
    </header>
  )
}
