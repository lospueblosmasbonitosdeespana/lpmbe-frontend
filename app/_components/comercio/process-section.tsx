import Image from 'next/image'
import type { ProcessStep } from './comercio-config'

interface ProcessSectionProps {
  steps: ProcessStep[]
}

export function ProcessSection({ steps }: ProcessSectionProps) {
  if (steps.length === 0) return null

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            De la oveja a tu mesa
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            El proceso
          </h2>
        </div>

        {/* Steps - horizontal scroll on mobile */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 md:grid md:grid-cols-4 md:gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="group flex min-w-[280px] flex-col md:min-w-0"
              >
                {/* Image */}
                <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 280px, 25vw"
                  />
                  {/* Warm filter overlay */}
                  <div className="absolute inset-0 bg-amber-900/10 mix-blend-multiply" />
                </div>

                {/* Number */}
                <div className="mb-3 flex items-center gap-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent font-serif text-lg font-bold text-accent">
                    {step.number}
                  </span>
                  <div className="hidden h-px flex-1 bg-border md:block" />
                </div>

                {/* Title */}
                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
