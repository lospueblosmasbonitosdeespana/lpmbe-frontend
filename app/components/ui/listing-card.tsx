import React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface ListingCardData {
  title: string
  href?: string
  image?: string
  imageAlt?: string
  metadata?: string
  description?: string
  badge?: string
  aspect?: "square" | "portrait" | "landscape" | "wide"
}

type CardLayout = "vertical" | "horizontal" | "minimal"
type CardSize = "default" | "compact"

interface ListingCardProps {
  data: ListingCardData
  layout?: CardLayout
  aspect?: "square" | "portrait" | "landscape" | "wide"
  size?: CardSize
  showDescription?: boolean
}

const aspectClasses = {
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  landscape: "aspect-[16/10]",
  wide: "aspect-[21/9]",
}

export function ListingCard({
  data,
  layout = "vertical",
  aspect = "landscape",
  size = "default",
  showDescription = false,
}: ListingCardProps) {
  const content = (
    <div
      className={cn(
        "group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md",
        layout === "horizontal" && "flex"
      )}
    >
      {data.image && layout !== "minimal" && (
        <div
          className={cn(
            "relative overflow-hidden",
            aspectClasses[data.aspect ?? aspect],
            layout === "horizontal" && "w-1/3 shrink-0"
          )}
        >
          <Image
            src={data.image}
            alt={data.imageAlt ?? data.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {data.badge && (
            <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {data.badge}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col justify-center",
          size === "compact" ? "p-3" : "p-4",
          layout === "horizontal" && "flex-1"
        )}
      >
        {data.metadata && (
          <p
            className={cn(
              "uppercase tracking-wider text-muted-foreground",
              size === "compact" ? "text-[10px]" : "text-xs"
            )}
          >
            {data.metadata}
          </p>
        )}
        <h3
          className={cn(
            "font-serif font-medium text-foreground transition-colors group-hover:text-primary",
            size === "compact" ? "mt-1 text-sm" : "mt-2 text-base"
          )}
        >
          {data.title}
        </h3>
        {showDescription && data.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {data.description}
          </p>
        )}
      </div>
    </div>
  )

  if (data.href) {
    return (
      <Link href={data.href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
