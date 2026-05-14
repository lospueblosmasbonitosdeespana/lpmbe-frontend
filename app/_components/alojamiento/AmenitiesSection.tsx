import {
  Wifi, ParkingSquare, Flame, Wind, Waves, UtensilsCrossed,
  PawPrint, Baby, Accessibility, Dumbbell, Flower2, Car,
  ShowerHead, Tv, BookOpen, Phone,
} from 'lucide-react'

const categories = [
  {
    title: 'En la habitación',
    items: [
      { icon: Wifi, label: 'WiFi gratuito' },
      { icon: ShowerHead, label: 'Baño privado' },
      { icon: Flame, label: 'Calefacción' },
      { icon: Wind, label: 'Ventilador' },
      { icon: Tv, label: 'Smart TV' },
      { icon: Phone, label: 'Teléfono' },
    ],
  },
  {
    title: 'En el alojamiento',
    items: [
      { icon: UtensilsCrossed, label: 'Restaurante' },
      { icon: BookOpen, label: 'Biblioteca' },
      { icon: Dumbbell, label: 'Zona fitness' },
      { icon: Flower2, label: 'Spa & bienestar' },
      { icon: Baby, label: 'Zona infantil' },
      { icon: Accessibility, label: 'Accesible' },
    ],
  },
  {
    title: 'Exterior',
    items: [
      { icon: Waves, label: 'Jacuzzi exterior' },
      { icon: ParkingSquare, label: 'Aparcamiento' },
      { icon: Car, label: 'Garaje privado' },
      { icon: PawPrint, label: 'Admite mascotas' },
      { icon: Flower2, label: 'Jardín y terraza' },
      { icon: Wifi, label: 'WiFi en jardín' },
    ],
  },
]

export default function AmenitiesSection() {
  return (
    <section
      className="py-20 md:py-28 px-6 md:px-14 lg:px-20"
      style={{ background: 'oklch(0.94 0.008 250)' }}
      aria-labelledby="amenities-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-terracotta)' }}
          >
            Servicios
          </p>
          <h2
            id="amenities-heading"
            className="font-serif text-3xl md:text-4xl font-bold text-balance"
            style={{ color: 'var(--color-midnight)' }}
          >
            Todo lo que necesitas,<br className="hidden md:block" /> donde lo necesitas
          </h2>
        </div>

        {/* Category grids */}
        <div className="space-y-10">
          {categories.map((cat, ci) => (
            <div key={ci}>
              <h3
                className="text-xs font-semibold tracking-widest uppercase mb-5"
                style={{ color: 'oklch(0.50 0.03 250)' }}
              >
                {cat.title}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {cat.items.map((item, ii) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={ii}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl text-center"
                      style={{
                        background: '#fff',
                        border: '1px solid oklch(0.90 0.005 80)',
                        boxShadow: '0 1px 6px oklch(0.22 0.05 250 / 0.05)',
                      }}
                    >
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-full"
                        style={{ background: 'oklch(0.62 0.12 45 / 0.10)' }}
                      >
                        <Icon size={16} style={{ color: 'var(--color-terracotta)' }} />
                      </div>
                      <span className="text-xs leading-tight font-medium" style={{ color: 'oklch(0.38 0.02 250)' }}>
                        {item.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { AmenitiesSection }
