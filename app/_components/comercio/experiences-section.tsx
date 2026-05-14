import Image from 'next/image'
import { Clock, Users } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import type { Experience } from './comercio-config'

interface ExperiencesSectionProps {
  experiences: Experience[]
}

export function ExperiencesSection({ experiences }: ExperiencesSectionProps) {
  if (experiences.length === 0) {
    return (
      <section id="experiencias" className="bg-secondary py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            Experiencias
          </span>
          <h2 className="mb-6 font-serif text-3xl font-bold text-foreground md:text-4xl">
            Experiencias para visitantes
          </h2>
          <p className="text-muted-foreground">Próximamente</p>
        </div>
      </section>
    )
  }

  return (
    <section id="experiencias" className="bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            Experiencias
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Experiencias para visitantes
          </h2>
        </div>

        {/* Experiences grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className={`group overflow-hidden rounded-xl bg-card shadow-sm ${
                !exp.available ? 'opacity-60' : ''
              }`}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
                {/* Discount badge */}
                {exp.clubDiscount && exp.available && (
                  <div className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    {exp.clubDiscount}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="mb-3 font-serif text-lg font-bold text-foreground">
                  {exp.title}
                </h3>

                {/* Info row */}
                <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {exp.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Máx. {exp.maxPeople}
                  </span>
                </div>

                {/* Price */}
                <p className="mb-4 text-sm text-muted-foreground">
                  Desde{' '}
                  <span className="font-serif text-xl font-bold text-accent">
                    {exp.priceFrom} €
                  </span>
                  /persona
                </p>

                {/* CTA */}
                {exp.available ? (
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    Reservar
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" size="sm" disabled>
                    Próximamente
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
