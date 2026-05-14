'use client'

import { CalendarCheck, Phone, MessageCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useLodgingSlice, useLodgingMeta } from './lodging-config-context'

export default function BookingBanner() {
  const slice = useLodgingSlice('booking')
  const meta = useLodgingMeta()
  const eyebrow = slice?.eyebrow || 'Reservas directas'
  const title = slice?.title || 'Reserva tu escapada al Pirineo'
  const subtitle = slice?.subtitle || 'Contacta directamente con nosotros — sin comisiones de intermediarios. La mejor tarifa, siempre, en nuestra web oficial.'
  const cancelNote = slice?.cancelNote || 'Cancelación gratuita hasta 72 h antes · Sin tarjetas de crédito obligatorias'

  const phoneHref = meta.telefono ? `tel:${meta.telefono.replace(/\s+/g, '')}` : 'tel:+34974500000'
  const waNumber = (meta.whatsapp ?? meta.telefono ?? '+34974500000').replace(/[^\d]/g, '')
  const waHref = `https://wa.me/${waNumber}`
  const bookingHref = meta.bookingUrl || '#reservar'

  return (
    <section
      className="py-20 md:py-24 px-6 md:px-14 lg:px-20 text-center"
      style={{ background: 'var(--color-terracotta)' }}
      aria-labelledby="booking-heading"
    >
      <div className="max-w-3xl mx-auto">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-widest uppercase mb-4 text-white/70">
          {eyebrow}
        </p>

        <h2
          id="booking-heading"
          className="font-serif text-4xl md:text-5xl font-bold text-white text-balance mb-4 leading-tight"
        >
          {title}
        </h2>

        <p className="text-white/80 text-base md:text-lg mb-3 text-pretty max-w-xl mx-auto">
          {subtitle}
        </p>

        <p className="text-white/60 text-sm mb-10">{cancelNote}</p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            className="flex items-center gap-2 px-8 py-3 text-base font-semibold rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: 'var(--color-midnight)', color: '#fff' }}
            asChild
          >
            <a href={bookingHref} target={meta.bookingUrl ? '_blank' : undefined} rel={meta.bookingUrl ? 'noopener noreferrer' : undefined}>
              <CalendarCheck size={18} />
              Reservar online
            </a>
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 px-7 py-3 text-base font-semibold rounded-full border-2 transition-all hover:bg-white/10"
            style={{ borderColor: '#fff', color: '#fff', background: 'transparent' }}
            asChild
          >
            <a href={phoneHref}>
              <Phone size={17} />
              Llamar al hotel
            </a>
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 px-7 py-3 text-base font-semibold rounded-full border-2 transition-all hover:bg-white/10"
            style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', background: 'transparent' }}
            asChild
          >
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={17} />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

export { BookingBanner }
