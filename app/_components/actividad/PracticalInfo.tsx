'use client'

import { 
  MapPin, Clock, Gauge, Users, Baby, Globe, XCircle, ShoppingBag, Mountain
} from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const ICONS = {
  'map-pin': MapPin, clock: Clock, gauge: Gauge, users: Users, baby: Baby,
  globe: Globe, 'x-circle': XCircle, 'shopping-bag': ShoppingBag,
} as const

const DEFAULT_ITEMS = [
  { id: '1', icon: 'map-pin'      as const, label: 'Punto de encuentro', detail: 'Plaza Mayor de Aínsa, junto a la Oficina de Turismo' },
  { id: '2', icon: 'clock'        as const, label: 'Duración',           detail: 'Variable según actividad (2-8 horas)' },
  { id: '3', icon: 'gauge'        as const, label: 'Dificultad',         detail: 'Actividades adaptadas a todos los niveles' },
  { id: '4', icon: 'users'        as const, label: 'Tamaño del grupo',   detail: 'Mínimo 2, máximo 12 personas' },
  { id: '5', icon: 'baby'         as const, label: 'Edad mínima',        detail: 'Según actividad (desde 8 años)' },
  { id: '6', icon: 'globe'        as const, label: 'Idiomas',            detail: 'Español, inglés y francés' },
  { id: '7', icon: 'x-circle'     as const, label: 'Cancelación',        detail: 'Gratuita hasta 48h antes' },
  { id: '8', icon: 'shopping-bag' as const, label: 'Qué traer',          detail: 'Ropa cómoda, calzado deportivo, agua' },
]

export function PracticalInfo() {
  const slice = useActivitySlice('practicalInfo')
  const infoItems = slice?.items && slice.items.length > 0 ? slice.items : DEFAULT_ITEMS
  return (
    <section 
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--color-sand)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p 
            className="text-sm font-medium tracking-wider uppercase mb-3"
            style={{ color: 'var(--color-adventure)' }}
          >
            Antes de venir
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            Información práctica
          </h2>
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {infoItems.map((item) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS] ?? Mountain
            return (
            <div 
              key={item.id}
              className="bg-white p-5 rounded-2xl flex items-start gap-4"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-adventure)', opacity: 0.1 }}
              >
                <Icon 
                  className="w-5 h-5"
                  style={{ color: 'var(--color-adventure)' }}
                />
              </div>
              <div>
                <p 
                  className="font-semibold mb-1"
                  style={{ color: 'var(--color-slate)' }}
                >
                  {item.label}
                </p>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                >
                  {item.detail}
                </p>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default PracticalInfo
