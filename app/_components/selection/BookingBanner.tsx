'use client'

import { Phone, Mail, ShieldCheck, ArrowRight } from 'lucide-react'
import ReservaButton from '@/app/_components/reservas/ReservaButton'

interface Props {
  phone: string
  email: string
  negocioId?: number | null
  negocioNombre?: string | null
}

export default function BookingBanner({ phone, email, negocioId, negocioNombre }: Props) {
  const usarModal = !!(negocioId && negocioNombre)
  return (
    <section
      className="w-full py-24 md:py-32 px-8 md:px-16 lg:px-24 relative overflow-hidden"
      style={{ background: 'var(--hotel-stone)' }}
    >
      {/* Gold accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, var(--hotel-gold) 30%, var(--hotel-gold) 70%, transparent)',
        }}
      />

      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            var(--hotel-gold),
            var(--hotel-gold) 1px,
            transparent 1px,
            transparent 40px
          )`,
        }}
      />

      <div className="max-w-screen-xl mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-serif mb-4 text-balance"
            style={{
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              color: 'var(--hotel-ivory)',
              fontWeight: 300,
              letterSpacing: '-0.01em',
            }}
          >
            Reserve su estancia
          </h2>

          <p
            className="font-sans mb-12"
            style={{
              fontSize: '0.9rem',
              color: 'var(--hotel-ivory-dim)',
              letterSpacing: '0.03em',
              lineHeight: 1.7,
            }}
          >
            Contacte directamente para disponibilidad y tarifas personalizadas
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {/* Phone CTA */}
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-3 font-sans transition-all"
              style={{
                fontSize: '0.72rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--hotel-gold)',
                border: '1px solid rgba(201,169,110,0.5)',
                padding: '1rem 2.5rem',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <Phone size={14} />
              Llamar
            </a>

            {/* Reservar CTA (modal LPMBE) o fallback email */}
            {usarModal ? (
              <ReservaButton
                negocioId={negocioId!}
                negocioNombre={negocioNombre!}
                tipoNegocio="ALOJAMIENTO"
                label="Solicitar disponibilidad"
                renderTrigger={(open) => (
                  <button
                    type="button"
                    onClick={open}
                    className="flex items-center justify-center gap-3 font-sans transition-all"
                    style={{
                      fontSize: '0.72rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--hotel-charcoal)',
                      background: 'var(--hotel-gold)',
                      padding: '1rem 2.5rem',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hotel-gold-light)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hotel-gold)' }}
                  >
                    <Mail size={14} />
                    Solicitar disponibilidad
                    <ArrowRight size={13} />
                  </button>
                )}
              />
            ) : (
              <a
                href={`mailto:${email}`}
                className="flex items-center justify-center gap-3 font-sans transition-all"
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--hotel-charcoal)',
                  background: 'var(--hotel-gold)',
                  padding: '1rem 2.5rem',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hotel-gold-light)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hotel-gold)' }}
              >
                <Mail size={14} />
                Solicitar disponibilidad
                <ArrowRight size={13} />
              </a>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <ShieldCheck size={13} style={{ color: 'var(--hotel-gold)', opacity: 0.7 }} />
            <span
              className="font-sans"
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: 'var(--hotel-ivory-muted)',
              }}
            >
              Cancelación flexible hasta 48h antes de la llegada
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
