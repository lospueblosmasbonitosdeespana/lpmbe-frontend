"use client"

import { useState, useRef } from "react"
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
  rotation?: number
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

  // Swipe táctil para Safari móvil
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    // Swipe horizontal con al menos 40px y más horizontal que vertical
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.preventDefault()
      if (dx < 0) goToNext()
      else goToPrevious()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  const renderGridLayout = () => (
    <div className={cn("grid gap-4", colsClass[columns])}>
      {images.map((image, index) => {
        const rot = image.rotation ?? 0
        return (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            aria-label={`Ver foto: ${image.alt}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Image
              src={image.src || "/placeholder.svg"}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
            />
            <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
          </button>
        )
      })}
    </div>
  )

  const renderFeaturedLayout = () => {
    if (images.length === 0) return null

    // 1 foto: mostrar grande a ancho completo
    if (images.length === 1) {
      const rot = images[0].rotation ?? 0
      return (
        <button
          onClick={() => openLightbox(0)}
          aria-label={`Ver foto: ${images[0].alt}`}
          className="group relative aspect-[16/9] w-full overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Image
            src={images[0].src || "/placeholder.svg"}
            alt={images[0].alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
          />
          <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
        </button>
      )
    }

    // 2 fotos: dos columnas iguales
    if (images.length === 2) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => {
            const rot = image.rotation ?? 0
            return (
              <button
                key={index}
                onClick={() => openLightbox(index)}
                aria-label={`Ver foto: ${image.alt}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
                />
                <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
              </button>
            )
          })}
        </div>
      )
    }

    // 3 fotos: principal grande + 2 pequeñas apiladas
    if (images.length === 3) {
      const [featured, ...rest] = images
      const featuredRot = featured.rotation ?? 0
      return (
        <div className="grid gap-4 lg:grid-cols-2">
          <button
            onClick={() => openLightbox(0)}
            aria-label={`Ver foto: ${featured.alt}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 lg:row-span-2"
          >
            <Image
              src={featured.src || "/placeholder.svg"}
              alt={featured.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={featuredRot ? { transform: `rotate(${featuredRot}deg)` } : undefined}
            />
            <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
          </button>
          {rest.map((image, index) => {
            const rot = image.rotation ?? 0
            return (
              <button
                key={index}
                onClick={() => openLightbox(index + 1)}
                aria-label={`Ver foto: ${image.alt}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
                />
                <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
              </button>
            )
          })}
        </div>
      )
    }

    // 4+ fotos: layout original (principal grande + grid 2x2)
    const [featured, ...rest] = images
    const featuredRot = featured.rotation ?? 0

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <button
          onClick={() => openLightbox(0)}
          aria-label={`Ver foto: ${featured.alt}`}
          className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 lg:aspect-auto lg:row-span-2"
        >
          <Image
            src={featured.src || "/placeholder.svg"}
            alt={featured.alt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            style={featuredRot ? { transform: `rotate(${featuredRot}deg)` } : undefined}
          />
          <div className="absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/10" />
        </button>
        <div className="grid grid-cols-2 gap-4">
          {rest.slice(0, 4).map((image, index) => {
            const rot = image.rotation ?? 0
            return (
              <button
                key={index}
                onClick={() => openLightbox(index + 1)}
                aria-label={`Ver foto: ${image.alt}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <Image
                  src={image.src || "/placeholder.svg"}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={rot ? { transform: `rotate(${rot}deg)` } : undefined}
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
            )
          })}
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full p-3 text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              {/* Botones más grandes y con área táctil amplia para móvil */}
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 transition-colors active:bg-black/70 touch-manipulation"
                aria-label="Anterior"
                style={{ minWidth: 48, minHeight: 48 }}
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white hover:bg-black/60 transition-colors active:bg-black/70 touch-manipulation"
                aria-label="Siguiente"
                style={{ minWidth: 48, minHeight: 48 }}
              >
                <ChevronRight className="h-7 w-7" />
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
              style={images[selectedIndex].rotation ? { transform: `rotate(${images[selectedIndex].rotation}deg)` } : undefined}
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
