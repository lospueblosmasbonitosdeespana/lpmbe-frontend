"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Container } from "@/app/components/ui/container"
import { Section } from "@/app/components/ui/section"
import { SectionHeader } from "@/app/components/ui/section-header"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

interface GalleryImage {
  src: string
  alt: string
  caption?: string
}

type GalleryLayout = "grid" | "masonry" | "featured"

interface DetailGallerySectionProps {
  eyebrow?: string
  title?: string
  description?: string
  images: GalleryImage[]
  layout?: GalleryLayout
  columns?: 2 | 3 | 4
  background?: "default" | "muted" | "card"
  className?: string
}

export function DetailGallerySection({
  eyebrow,
  title,
  description,
  images,
  layout = "featured",
  columns = 3,
  background = "card",
  className,
}: DetailGallerySectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const colsClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }

  const openLightbox = (index: number) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)

  const goToPrevious = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
  }

  const goToNext = () => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
  }

  const renderGridLayout = () => (
    <div className={cn("grid gap-4", colsClass[columns])}>
      {images.map((image, index) => (
        <button
          key={index}
          onClick={() => openLightbox(index)}
          className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
        </button>
      ))}
    </div>
  )

  const renderFeaturedLayout = () => {
    const [featured, ...rest] = images
    if (!featured) return null

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <button
          onClick={() => openLightbox(0)}
          className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 lg:aspect-auto lg:row-span-2"
        >
          <Image
            src={featured.src || "/placeholder.svg"}
            alt={featured.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
        </button>
        <div className="grid grid-cols-2 gap-4">
          {rest.slice(0, 4).map((image, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index + 1)}
              className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <Image
                src={image.src || "/placeholder.svg"}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
              {index === 3 && rest.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
                  <span className="text-lg font-medium text-primary-foreground">
                    +{rest.length - 4}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Section background={background} className={className}>
      <Container>
        {(title || eyebrow) && (
          <SectionHeader
            eyebrow={eyebrow}
            title={title || ""}
            description={description}
          />
        )}

        {layout === "featured" ? renderFeaturedLayout() : renderGridLayout()}
      </Container>

      {selectedIndex !== null && images[selectedIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/95 p-4"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                className="absolute left-4 rounded-full p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-4 rounded-full p-2 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div
            className="relative max-h-[85vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selectedIndex].src || "/placeholder.svg"}
              alt={images[selectedIndex].alt}
              width={1200}
              height={800}
              className="max-h-[85vh] w-auto rounded-sm object-contain"
            />
            {images[selectedIndex].caption && (
              <p className="mt-4 text-center text-sm text-primary-foreground/80">
                {images[selectedIndex].caption}
              </p>
            )}
            <p className="mt-2 text-center text-xs text-primary-foreground/60">
              {selectedIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </Section>
  )
}
