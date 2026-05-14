import { Percent, Truck, Gift } from 'lucide-react'
import type { ClubOffersConfig } from './comercio-config'

interface ClubOffersSectionProps {
  config: ClubOffersConfig
}

const iconMap = {
  percent: Percent,
  truck: Truck,
  gift: Gift,
}

export function ClubOffersSection({ config }: ClubOffersSectionProps) {
  if (config.offers.length === 0) return null

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            {config.eyebrow}
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            {config.title}
          </h2>
        </div>

        {/* Offers grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {config.offers.map((offer) => {
            const Icon = iconMap[offer.icon as keyof typeof iconMap] || Percent

            return (
              <div
                key={offer.id}
                className="relative rounded-xl border border-border bg-card p-6"
              >
                {/* Badge */}
                {offer.badge && (
                  <span
                    className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-medium ${
                      offer.badge === 'destacada'
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-highlight text-highlight-foreground'
                    }`}
                  >
                    {offer.badge === 'destacada' ? 'Destacada' : 'Nueva'}
                  </span>
                )}

                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                  <Icon className="h-6 w-6 text-accent" />
                </div>

                {/* Content */}
                <h3 className="mb-2 font-serif text-xl font-bold text-foreground">
                  {offer.title}
                </h3>
                <p className="text-muted-foreground">{offer.highlight}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
