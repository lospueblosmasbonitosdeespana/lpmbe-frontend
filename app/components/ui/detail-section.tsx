import React from "react"
import { cn } from "@/lib/utils"
import { Container } from "@/app/components/ui/container"
import { Section } from "@/app/components/ui/section"
import { Headline, Lead, Eyebrow, Body } from "@/app/components/ui/typography"

interface DetailIntroSectionProps {
  eyebrow?: string
  title?: string
  lead: string
  body?: string | React.ReactNode
  background?: "default" | "muted" | "card"
  align?: "left" | "center"
  className?: string
}

export function DetailIntroSection(props: DetailIntroSectionProps) {
  const {
    eyebrow,
    title,
    lead,
    body,
    background = "default",
    align = "left",
    className,
  } = props
  return (
    <Section background={background} className={className}>
      <Container size="lg">
        <div className={cn(align === "center" && "text-center")}>
          {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
          {title && <Headline className="mb-6">{title}</Headline>}
          <Lead>{lead}</Lead>
          {body && (
            <div className="mt-6 space-y-4 text-muted-foreground">
              {typeof body === "string" ? <Body>{body}</Body> : body}
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
