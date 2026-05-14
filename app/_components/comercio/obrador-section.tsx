import Image from 'next/image'
import { Button } from '@/app/components/ui/button'
import type { ObradorConfig } from './comercio-config'

interface ObradorSectionProps {
  config: ObradorConfig
}

export function ObradorSection({ config }: ObradorSectionProps) {
  return (
    <section className="relative h-[600px] w-full md:h-[700px]">
      {/* Full-bleed background image */}
      <Image
        src={config.image}
        alt="Nuestra cueva y obrador"
        fill
        className="object-cover"
        sizes="100vw"
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content card */}
      <div className="relative z-10 flex h-full items-center justify-end px-4 md:px-8">
        <div className="w-full max-w-md rounded-xl bg-card/95 p-8 shadow-xl backdrop-blur-sm md:mr-12 lg:mr-24">
          <h2 className="mb-4 font-serif text-2xl font-bold text-foreground md:text-3xl">
            {config.title}
          </h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            {config.description}
          </p>
          <Button
            asChild
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
          >
            <a href={config.ctaHref}>{config.ctaText}</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
