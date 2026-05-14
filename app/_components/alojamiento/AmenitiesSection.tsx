'use client'

import {
  Wifi, ParkingSquare, Flame, Wind, Waves, UtensilsCrossed,
  PawPrint, Baby, Accessibility, Dumbbell, Flower2, Car,
  ShowerHead, Tv, BookOpen, Phone, Star,
} from 'lucide-react'
import { useLodgingSlice } from './lodging-config-context'

const ICONS: Record<string, React.ElementType> = {
  wifi: Wifi, 'parking-square': ParkingSquare, parking: ParkingSquare, flame: Flame, wind: Wind,
  waves: Waves, 'utensils-crossed': UtensilsCrossed, restaurant: UtensilsCrossed,
  'paw-print': PawPrint, paw: PawPrint, baby: Baby, accessibility: Accessibility,
  dumbbell: Dumbbell, 'flower-2': Flower2, flower: Flower2, car: Car,
  'shower-head': ShowerHead, shower: ShowerHead, tv: Tv, 'book-open': BookOpen, book: BookOpen,
  phone: Phone, star: Star,
}

const DEFAULT_CATEGORIES = [
  { id: 'c1', title: 'En la habitación',   items: [
    { id: 'i1', icon: 'wifi',         label: 'WiFi gratuito' },
    { id: 'i2', icon: 'shower-head',  label: 'Baño privado' },
    { id: 'i3', icon: 'flame',        label: 'Calefacción' },
    { id: 'i4', icon: 'wind',         label: 'Ventilador' },
    { id: 'i5', icon: 'tv',           label: 'Smart TV' },
    { id: 'i6', icon: 'phone',        label: 'Teléfono' },
  ]},
  { id: 'c2', title: 'En el alojamiento', items: [
    { id: 'i7', icon: 'utensils-crossed', label: 'Restaurante' },
    { id: 'i8', icon: 'book-open',        label: 'Biblioteca' },
    { id: 'i9', icon: 'dumbbell',         label: 'Zona fitness' },
    { id: 'i10', icon: 'flower-2',        label: 'Spa & bienestar' },
    { id: 'i11', icon: 'baby',            label: 'Zona infantil' },
    { id: 'i12', icon: 'accessibility',   label: 'Accesible' },
  ]},
  { id: 'c3', title: 'Exterior', items: [
    { id: 'i13', icon: 'waves',           label: 'Jacuzzi exterior' },
    { id: 'i14', icon: 'parking-square',  label: 'Aparcamiento' },
    { id: 'i15', icon: 'car',             label: 'Garaje privado' },
    { id: 'i16', icon: 'paw-print',       label: 'Admite mascotas' },
    { id: 'i17', icon: 'flower-2',        label: 'Jardín y terraza' },
    { id: 'i18', icon: 'wifi',            label: 'WiFi en jardín' },
  ]},
]

export default function AmenitiesSection() {
  const slice = useLodgingSlice('amenities')
  const categories = slice?.categories && slice.categories.length > 0 ? slice.categories : DEFAULT_CATEGORIES
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
          {categories.map((cat) => (
            <div key={cat.id}>
              <h3
                className="text-xs font-semibold tracking-widest uppercase mb-5"
                style={{ color: 'oklch(0.50 0.03 250)' }}
              >
                {cat.title}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {cat.items.map((item) => {
                  const Icon = ICONS[item.icon] ?? Star
                  return (
                    <div
                      key={item.id}
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
