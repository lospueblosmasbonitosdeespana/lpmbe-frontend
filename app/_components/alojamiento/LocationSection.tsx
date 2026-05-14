'use client'

import { useState } from 'react'
import { MapPin, Car, Bus, Plane, Copy, ExternalLink, ChevronDown } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

const address = 'Plaza Mayor, 2 · 22330 Aínsa, Huesca, Aragón'

const nearbyPoi = [
  { name: 'Parque Nacional Ordesa y Monte Perdido', distance: '25 min en coche' },
  { name: 'Cañón de Añisclo', distance: '20 min en coche' },
  { name: 'Lago de Bujaruelo', distance: '35 min en coche' },
  { name: 'Castillo Medieval de Aínsa', distance: '5 min a pie' },
]

const directions = [
  {
    icon: Car,
    title: 'En coche',
    content:
      'Desde Huesca capital: N-240 hasta Barbastro, luego A-138 hasta Aínsa (110 km · ±1 h 30 min). GPS: Plaza Mayor, 2, Aínsa. Aparcamiento privado gratuito para huéspedes.',
  },
  {
    icon: Bus,
    title: 'Transporte público',
    content:
      'Autobús Alosa desde Huesca con parada en Aínsa (3 servicios/día). También desde Barbastro. La parada de autobús se encuentra a 100 m del hotel.',
  },
  {
    icon: Plane,
    title: 'Desde el aeropuerto',
    content:
      'Aeropuerto de Zaragoza (ZAZ): 155 km · ±1 h 45 min. Aeropuerto de Huesca-Pirineos (HSK): 85 km · ±55 min. Servicio de transfer privado bajo reserva.',
  },
]

export default function LocationSection() {
  const [openDir, setOpenDir] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  function copyAddress() {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: '#fff' }}
      aria-labelledby="location-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Ubicación
          </p>
          <h2
            id="location-heading"
            className="font-serif text-3xl md:text-4xl font-bold text-balance"
            style={{ color: 'var(--color-midnight)' }}
          >
            Encuentra tu camino hasta nosotros
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Map placeholder — styled Google Maps iframe */}
          <div className="rounded-2xl overflow-hidden shadow-lg border" style={{ borderColor: 'oklch(0.90 0.005 80)', minHeight: '360px' }}>
            <iframe
              title="Ubicación Hotel La Posada del Sobrarbe"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2944.802!2d0.1284!3d42.4195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd5913b3a85f9f1b%3A0x3e4e4b4b4b4b4b4b!2sA%C3%ADnsa%2C%20Huesca!5e0!3m2!1ses!2ses!4v1700000000000"
              width="100%"
              height="100%"
              className="w-full h-full min-h-[360px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Right side: address + directions + POI */}
          <div className="flex flex-col gap-6">
            {/* Address card */}
            <div
              className="flex items-start gap-4 p-5 rounded-xl"
              style={{ background: 'var(--color-cream)', border: '1px solid oklch(0.90 0.005 80)' }}
            >
              <MapPin size={20} style={{ color: 'var(--color-terracotta)', marginTop: '2px' }} />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-midnight)' }}>
                  Dirección
                </p>
                <p className="text-sm" style={{ color: 'oklch(0.45 0.02 250)' }}>{address}</p>
              </div>
              <button
                onClick={copyAddress}
                aria-label="Copiar dirección"
                className="text-xs flex items-center gap-1 font-medium transition-opacity hover:opacity-60 shrink-0"
                style={{ color: 'var(--color-terracotta)' }}
              >
                <Copy size={13} />
                {copied ? 'Copiada' : 'Copiar'}
              </button>
            </div>

            {/* How to get here — accordion */}
            <div className="flex flex-col gap-2">
              {directions.map((dir, i) => {
                const Icon = dir.icon
                return (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid oklch(0.90 0.005 80)', background: 'var(--color-cream)' }}
                  >
                    <button
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                      onClick={() => setOpenDir(openDir === i ? null : i)}
                      aria-expanded={openDir === i}
                    >
                      <span className="flex items-center gap-2.5 font-semibold text-sm" style={{ color: 'var(--color-midnight)' }}>
                        <Icon size={15} style={{ color: 'var(--color-terracotta)' }} />
                        {dir.title}
                      </span>
                      <ChevronDown
                        size={16}
                        className="transition-transform duration-200"
                        style={{
                          color: 'oklch(0.50 0.02 250)',
                          transform: openDir === i ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    {openDir === i && (
                      <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: 'oklch(0.42 0.02 250)' }}>
                        {dir.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Nearby POI */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'oklch(0.50 0.02 250)' }}>
                Puntos de interés cercanos
              </p>
              <ul className="space-y-2">
                {nearbyPoi.map((poi, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--color-midnight)' }}>{poi.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'oklch(0.62 0.12 45 / 0.12)', color: 'var(--color-terracotta)' }}
                    >
                      {poi.distance}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <Button
              className="self-start flex items-center gap-2"
              style={{ background: 'var(--color-midnight)', color: '#fff' }}
              asChild
            >
              <a
                href="https://maps.google.com/?q=Aínsa+Huesca+Spain"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />
                Cómo llegar en Google Maps
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export { LocationSection }
