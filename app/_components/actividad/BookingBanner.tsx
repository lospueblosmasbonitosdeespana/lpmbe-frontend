'use client'

import { useActivitySlice, useActivityMeta } from './activity-config-context'
import ReservaButton from '@/app/_components/reservas/ReservaButton'

export function BookingBanner() {
  const slice = useActivitySlice('booking')
  const meta = useActivityMeta()
  const eyebrow = slice?.eyebrow || '¿Listo para la aventura?'
  const title = slice?.title || 'Reserva tu experiencia hoy'
  const subtitle = slice?.subtitle || 'Elige entre más de 15 actividades guiadas y vive el Pirineo como nunca antes. Nuestros guías expertos te esperan.'
  const primaryCta = slice?.primaryCta || 'Reservar actividad'
  const secondaryCta = slice?.secondaryCta || 'Consultar disponibilidad'
  const groupNote = slice?.groupNote || '💡 Descuento del 10% para grupos de 6 o más personas'
  const secondaryHref = meta.telefono ? `tel:${meta.telefono.replace(/\s+/g, '')}` : meta.web || '#contacto'
  const usarModal = !!(meta.id && meta.nombre)
  return (
    <section 
      className="py-16 md:py-20"
      style={{ 
        background: 'linear-gradient(135deg, var(--color-adventure) 0%, var(--color-adventure-light) 100%)',
      }}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        {/* Eyebrow */}
        <p 
          className="text-sm font-medium tracking-wider uppercase mb-3"
          style={{ color: 'rgba(255,255,255,0.8)' }}
        >
          {eyebrow}
        </p>

        {/* Title */}
        <h2 
          className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
        >
          {title}
        </h2>

        {/* Subtitle */}
        <p 
          className="text-lg mb-8 max-w-2xl mx-auto"
          style={{ color: 'rgba(255,255,255,0.9)' }}
        >
          {subtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          {usarModal ? (
            <ReservaButton
              negocioId={meta.id!}
              negocioNombre={meta.nombre!}
              tipoNegocio="ACTIVIDAD"
              label={primaryCta}
              renderTrigger={(open) => (
                <button
                  type="button"
                  onClick={open}
                  className="px-8 py-4 rounded-full font-medium transition-all hover:opacity-90 w-full sm:w-auto inline-flex items-center justify-center"
                  style={{
                    backgroundColor: 'white',
                    color: 'var(--color-adventure)',
                  }}
                >
                  {primaryCta}
                </button>
              )}
            />
          ) : (
            <a
              href={meta.bookingUrl || (meta.email ? `mailto:${meta.email}` : '#reservar')}
              target={meta.bookingUrl ? '_blank' : undefined}
              rel={meta.bookingUrl ? 'noopener noreferrer' : undefined}
              className="px-8 py-4 rounded-full font-medium transition-all hover:opacity-90 w-full sm:w-auto inline-flex items-center justify-center"
              style={{
                backgroundColor: 'white',
                color: 'var(--color-adventure)',
              }}
            >
              {primaryCta}
            </a>
          )}
          <a
            href={secondaryHref}
            className="px-8 py-4 rounded-full font-medium transition-all hover:bg-white/10 w-full sm:w-auto inline-flex items-center justify-center"
            style={{
              border: '2px solid white',
              color: 'white',
              backgroundColor: 'transparent',
            }}
          >
            {secondaryCta}
          </a>
        </div>

        {/* Note */}
        {groupNote && (
          <p 
            className="text-sm"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {groupNote}
          </p>
        )}
      </div>
    </section>
  )
}

export default BookingBanner
