import { Clock, CreditCard, Truck, RotateCcw, Globe } from 'lucide-react'
import type { PracticalInfo } from './comercio-config'

interface PracticalInfoSectionProps {
  info: PracticalInfo
}

export function PracticalInfoSection({ info }: PracticalInfoSectionProps) {
  const cards = [
    {
      icon: Clock,
      title: 'Horario',
      content: info.schedule.map((s) => `${s.days}: ${s.hours}`),
    },
    {
      icon: CreditCard,
      title: 'Formas de pago',
      content: info.paymentMethods,
    },
    {
      icon: Truck,
      title: 'Envíos',
      content: [
        `España peninsular: ${info.shipping.peninsula}`,
        `Baleares y Canarias: ${info.shipping.islands}`,
      ],
    },
    {
      icon: RotateCcw,
      title: 'Devoluciones',
      content: [info.returns],
    },
    {
      icon: Globe,
      title: 'Idiomas',
      content: info.languages,
      chips: true,
    },
  ]

  return (
    <section className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="small-caps mb-4 inline-block text-sm font-medium tracking-wider text-accent">
            Info práctica
          </span>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Información práctica
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {cards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-6"
            >
              <card.icon className="mb-4 h-6 w-6 text-accent" />
              <h3 className="mb-3 font-serif text-lg font-bold text-foreground">
                {card.title}
              </h3>
              {card.chips ? (
                <div className="flex flex-wrap gap-2">
                  {card.content.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-secondary px-3 py-1 text-sm text-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1">
                  {card.content.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
