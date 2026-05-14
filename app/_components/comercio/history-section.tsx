import Image from 'next/image'
import type { HistoryConfig } from './comercio-config'

interface HistorySectionProps {
  config: HistoryConfig
}

export function HistorySection({ config }: HistorySectionProps) {
  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column - Image and text */}
          <div>
            {/* Eyebrow */}
            <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
              {config.eyebrow}
            </span>

            {/* Title */}
            <h2 className="mb-8 font-serif text-3xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl text-balance">
              {config.title}
            </h2>

            {/* Main image */}
            <div className="relative mb-8 aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src={config.mainImage}
                alt="La historia de nuestra quesería"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            {/* Paragraphs */}
            <div className="space-y-4">
              {config.paragraphs.map((paragraph, index) => (
                <p key={index} className="leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Pull quote */}
            <blockquote className="mt-8 border-l-4 border-accent pl-6">
              <p className="font-serif text-xl italic text-foreground md:text-2xl">
                &ldquo;{config.pullQuote}&rdquo;
              </p>
            </blockquote>
          </div>

          {/* Right column - Photo timeline */}
          <div className="flex flex-col gap-6 lg:pt-24">
            {config.photos.map((photo, index) => (
              <div key={index} className="group relative">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  <Image
                    src={photo.image}
                    alt={photo.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 25vw"
                  />
                  {/* Year overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <span className="font-serif text-3xl font-bold text-white">
                      {photo.year}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
