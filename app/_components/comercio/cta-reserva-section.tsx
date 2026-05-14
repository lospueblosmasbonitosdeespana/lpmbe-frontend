import { Phone, MessageCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import type { CTAReservaConfig } from './comercio-config'

interface CTAReservaSectionProps {
  config: CTAReservaConfig
}

export function CTAReservaSection({ config }: CTAReservaSectionProps) {
  return (
    <section id="reserva" className="bg-primary py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-4 font-serif text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
          {config.title}
        </h2>
        <p className="mb-8 text-lg text-primary-foreground/80">
          {config.subtitle}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-background text-foreground hover:bg-background/90"
          >
            <a href={config.buttons.reserva.href}>
              {config.buttons.reserva.text}
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <a href={config.buttons.llamar.href} className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {config.buttons.llamar.text}
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
          >
            <a
              href={config.buttons.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {config.buttons.whatsapp.text}
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
