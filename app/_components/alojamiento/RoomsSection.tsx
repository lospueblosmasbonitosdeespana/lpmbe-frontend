import Image from 'next/image'
import { Users, BedDouble, ChevronRight } from 'lucide-react'
import { Button } from '@/app/components/ui/button'

const rooms = [
  {
    image: '/images/room-1.jpg',
    name: 'Habitación Superior Pirenaica',
    description: 'Vistas panorámicas al Cotiella, vigas de roble y bañera exenta de cobre en el baño.',
    guests: 2,
    beds: 'Cama king',
    price: 'Desde 165 €/noche',
  },
  {
    image: '/images/room-2.jpg',
    name: 'Junior Suite El Sobrarbe',
    description: 'El mayor espacio del hotel: sala de estar independiente, chimenea y terraza privada.',
    guests: 2,
    beds: 'Cama king',
    price: 'Desde 220 €/noche',
  },
  {
    image: '/images/room-3.jpg',
    name: 'Estancia Familiar con Buhardilla',
    description: 'Planta baja con acceso directo al jardín y altillo con dos camas para los más pequeños.',
    guests: 4,
    beds: '1 matrimonio + 2 individuales',
    price: 'Desde 195 €/noche',
  },
  {
    image: '/images/hero-2.jpg',
    name: 'Habitación Clásica Medieval',
    description: 'El espíritu original de la casona: bóvedas de sillería, suelo de terracota y luz suave.',
    guests: 2,
    beds: 'Cama queen',
    price: 'Desde 120 €/noche',
  },
]

export default function RoomsSection() {
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: '#fff' }}
      aria-labelledby="rooms-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: 'var(--color-terracotta)' }}
            >
              Nuestras estancias
            </p>
            <h2
              id="rooms-heading"
              className="font-serif text-3xl md:text-4xl font-bold text-balance"
              style={{ color: 'var(--color-midnight)' }}
            >
              Ocho formas de dormir<br />entre piedra y montaña
            </h2>
          </div>
          <Button
            variant="outline"
            className="self-start md:self-auto flex items-center gap-1.5 shrink-0"
            style={{ borderColor: 'var(--color-midnight)', color: 'var(--color-midnight)' }}
          >
            Ver todas las habitaciones
            <ChevronRight size={15} />
          </Button>
        </div>

        {/* Cards grid — horizontal scroll on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {rooms.map((room, i) => (
            <article
              key={i}
              className="group rounded-xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--color-cream)',
                border: '1px solid oklch(0.90 0.005 80)',
                boxShadow: '0 2px 12px oklch(0.22 0.05 250 / 0.06)',
                transition: 'box-shadow 0.25s, transform 0.25s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px oklch(0.22 0.05 250 / 0.14)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px oklch(0.22 0.05 250 / 0.06)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1 gap-3">
                <h3
                  className="font-serif font-semibold text-base leading-snug"
                  style={{ color: 'var(--color-midnight)' }}
                >
                  {room.name}
                </h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'oklch(0.45 0.02 250)' }}>
                  {room.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs" style={{ color: 'oklch(0.50 0.02 250)' }}>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {room.guests} personas
                  </span>
                  <span className="flex items-center gap-1">
                    <BedDouble size={12} />
                    {room.beds}
                  </span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'oklch(0.90 0.005 80)' }}>
                  <span className="font-serif font-semibold text-sm" style={{ color: 'var(--color-terracotta)' }}>
                    {room.price}
                  </span>
                  <button
                    className="text-xs font-semibold underline underline-offset-2 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--color-midnight)' }}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export { RoomsSection }
