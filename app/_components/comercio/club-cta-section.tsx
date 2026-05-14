import { Button } from '@/app/components/ui/button'
import type { ClubCTAConfig } from './comercio-config'

interface ClubCTASectionProps {
  config: ClubCTAConfig
}

export function ClubCTASection({ config }: ClubCTASectionProps) {
  return (
    <section className="bg-foreground py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="mb-4 font-serif text-3xl font-bold text-background md:text-4xl">
          {config.title}
        </h2>
        <p className="mb-8 text-background/80">{config.description}</p>
        <Button
          asChild
          size="lg"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <a href={config.ctaHref}>{config.ctaText}</a>
        </Button>
      </div>
    </section>
  )
}
