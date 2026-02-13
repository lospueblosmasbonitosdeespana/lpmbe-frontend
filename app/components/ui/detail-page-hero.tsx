import React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Container } from "@/app/components/ui/container"
import { Display, Eyebrow } from "@/app/components/ui/typography"
import { ChevronLeft } from "lucide-react"

type HeroVariant = "fullscreen" | "compact" | "split"
type HeroOverlay = "dark" | "light" | "gradient" | "none"

interface BreadcrumbItem {
  label: string
  href: string
}

interface DetailPageHeroProps {
  eyebrow?: string
  title: string
  metadata?: React.ReactNode
  image?: string | null
  imageAlt?: string
  breadcrumbs?: BreadcrumbItem[]
  backLink?: { label: string; href: string }
  variant?: HeroVariant
  overlay?: HeroOverlay
  className?: string
}

const overlayClasses: Record<HeroOverlay, string> = {
  dark: "bg-foreground/60",
  light: "bg-background/60",
  // Overlay más suave para que la foto luzca más resplandeciente (menos oscuro)
  gradient: "bg-gradient-to-t from-foreground/55 via-foreground/25 to-transparent",
  none: "",
}

export function DetailPageHero({
  eyebrow,
  title,
  metadata,
  image,
  imageAlt = "",
  breadcrumbs,
  backLink,
  variant = "fullscreen",
  overlay = "gradient",
  className,
}: DetailPageHeroProps) {
  const linkCls = (hasImg: boolean) =>
    hasImg ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"

  const renderBreadcrumbs = (hasImage: boolean) => {
    if (!breadcrumbs?.length) return null
    return (
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <Link href={item.href} className={cn("transition-colors", linkCls(hasImage))}>
                {item.label}
              </Link>
              {index < breadcrumbs.length - 1 && <span className={hasImage ? "text-primary-foreground/50" : "text-muted-foreground/70"}>/</span>}
            </li>
          ))}
        </ol>
      </nav>
    )
  }

  const renderBackLink = (hasImage: boolean) => {
    if (!backLink) return null
    return (
      <Link href={backLink.href} className={cn("mb-4 inline-flex items-center gap-1 text-sm transition-colors", linkCls(hasImage))}>
        <ChevronLeft className="h-4 w-4" />
        {backLink.label}
      </Link>
    )
  }

  if (variant === "fullscreen") {
    const hasImage = !!image
    return (
      <section className={cn("relative h-[50vh] min-h-[280px] max-h-[500px] sm:h-[60vh] sm:min-h-[400px] sm:max-h-[600px] md:h-[70vh] md:min-h-[500px] md:max-h-[700px]", !hasImage && "bg-muted", className)}>
        {image && (
          <>
            <Image
              src={image}
              alt={imageAlt || title}
              fill
              priority
              className="object-cover"
              quality={90}
              sizes="100vw"
            />
            <div className={cn("absolute inset-0", overlayClasses[overlay])} />
          </>
        )}
        <Container className="relative flex h-full flex-col justify-end pb-12 md:pb-16">
          {renderBreadcrumbs(hasImage)}
          {renderBackLink(hasImage)}
          <div className={cn("max-w-3xl", hasImage ? "text-primary-foreground" : "text-foreground")}>
            {eyebrow && <Eyebrow className={cn("mb-3", hasImage ? "text-primary-foreground/80" : "text-muted-foreground")}>{eyebrow}</Eyebrow>}
            <Display className={hasImage ? "text-primary-foreground" : undefined}>{title}</Display>
            {metadata && (
              <div className={cn("mt-4 flex flex-wrap items-center gap-x-4 gap-y-2", hasImage ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {metadata}
              </div>
            )}
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className={cn("relative py-16 md:py-20", className)}>
      {image && (
        <>
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            priority
            className="object-cover"
            quality={90}
            sizes="100vw"
          />
          <div className={cn("absolute inset-0", overlayClasses[overlay])} />
        </>
      )}
      <Container className="relative">
        {renderBreadcrumbs(!!image)}
        {renderBackLink(!!image)}
        <div className="max-w-3xl text-primary-foreground">
          {eyebrow && <Eyebrow className="mb-3 text-primary-foreground/80">{eyebrow}</Eyebrow>}
          <Display as="h1" className="text-primary-foreground text-3xl sm:text-4xl md:text-5xl">{title}</Display>
          {metadata && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-primary-foreground/80">
              {metadata}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
