import { CalendarCheck, Phone, MessageCircle } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

export default function BookingBanner() {
  return (
    <section
      className="py-20 md:py-24 px-6 md:px-14 lg:px-20 text-center"
      style={{ background: 'var(--color-terracotta)' }}
      aria-labelledby="booking-heading"
    >
      <div className="max-w-3xl mx-auto">
        {/* Eyebrow */}
        <p className="text-xs font-semibold tracking-widest uppercase mb-4 text-white/70">
          Reservas directas
        </p>

        <h2
          id="booking-heading"
          className="font-serif text-4xl md:text-5xl font-bold text-white text-balance mb-4 leading-tight"
        >
          Reserva tu escapada al Pirineo
        </h2>

        <p className="text-white/80 text-base md:text-lg mb-3 text-pretty max-w-xl mx-auto">
          Contacta directamente con nosotros — sin comisiones de intermediarios.
          La mejor tarifa, siempre, en nuestra web oficial.
        </p>

        <p className="text-white/60 text-sm mb-10">
          Cancelación gratuita hasta 72 h antes · Sin tarjetas de crédito obligatorias
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            className="flex items-center gap-2 px-8 py-3 text-base font-semibold rounded-full shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: 'var(--color-midnight)', color: '#fff' }}
          >
            <CalendarCheck size={18} />
            Reservar online
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-2 px-7 py-3 text-base font-semibold rounded-full border-2 transition-all hover:bg-white/10"
            style={{ borderColor: '#fff', color: '#fff', background: 'transparent' }}
            asChild
          >
            <a href="tel:+34974500000">
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
            <a
              href="https://wa.me/34974500000"
              target="_blank"
              rel="noopener noreferrer"
            >
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
