'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useScrollReveal } from './useScrollReveal'
import type { HotelConfig } from './types'

interface Props {
  gallery: HotelConfig['gallery']
}

export default function GallerySection({ gallery }: Props) {
  const ref = useScrollReveal()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (i: number) => setLightboxIndex(i)
  const closeLightbox = () => setLightboxIndex(null)
  const prevImage = () =>
    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + gallery.length) % gallery.length : null))
  const nextImage = () =>
    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % gallery.length : null))

  return (
    <>
      <section
        ref={ref as React.RefObject<HTMLElement>}
        className="reveal w-full py-24 md:py-32 px-8 md:px-16 lg:px-24"
        style={{ background: 'var(--hotel-charcoal)' }}
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-12">
            <span className="eyebrow">Galería</span>
            <div className="gold-line" />
            <h2
              className="font-serif mt-2"
              style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                color: 'var(--hotel-ivory)',
                fontWeight: 300,
                letterSpacing: '-0.01em',
              }}
            >
              El palacio en imágenes
            </h2>
          </div>

          {/* Masonry/bento grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gallery.map((item, i) => (
              <div
                key={i}
                className={`group overflow-hidden cursor-pointer ${item.aspectClass}`}
                onClick={() => openLightbox(i)}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          {/* Close */}
          <button
            className="absolute top-6 right-6 z-50"
            style={{ color: 'var(--hotel-ivory)', opacity: 0.7 }}
            onClick={closeLightbox}
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 md:left-8 z-50 p-3"
            style={{ color: 'var(--hotel-ivory)', opacity: 0.7 }}
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            aria-label="Anterior"
          >
            <ChevronLeft size={36} />
          </button>

          {/* Image */}
          <div className="max-w-5xl max-h-[85vh] w-full mx-12" onClick={(e) => e.stopPropagation()}>
            <img
              src={gallery[lightboxIndex].src}
              alt={gallery[lightboxIndex].alt}
              className="w-full h-full object-contain"
              style={{ maxHeight: '85vh' }}
            />
            <p
              className="font-sans text-center mt-4"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                color: 'rgba(245,240,232,0.4)',
                textTransform: 'uppercase',
              }}
            >
              {lightboxIndex + 1} / {gallery.length}
            </p>
          </div>

          {/* Next */}
          <button
            className="absolute right-4 md:right-8 z-50 p-3"
            style={{ color: 'var(--hotel-ivory)', opacity: 0.7 }}
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            aria-label="Siguiente"
          >
            <ChevronRight size={36} />
          </button>
        </div>
      )}
    </>
  )
}
