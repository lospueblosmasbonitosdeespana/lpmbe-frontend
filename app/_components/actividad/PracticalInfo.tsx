import { 
  MapPin, 
  Clock, 
  Mountain, 
  Users, 
  Baby, 
  Languages, 
  CalendarX, 
  Backpack 
} from 'lucide-react'

const infoItems = [
  {
    icon: MapPin,
    label: 'Punto de encuentro',
    detail: 'Plaza Mayor de Aínsa, junto a la Oficina de Turismo',
  },
  {
    icon: Clock,
    label: 'Duración',
    detail: 'Variable según actividad (2-8 horas)',
  },
  {
    icon: Mountain,
    label: 'Dificultad',
    detail: 'Actividades adaptadas a todos los niveles',
  },
  {
    icon: Users,
    label: 'Tamaño del grupo',
    detail: 'Mínimo 2, máximo 12 personas',
  },
  {
    icon: Baby,
    label: 'Edad mínima',
    detail: 'Según actividad (desde 8 años)',
  },
  {
    icon: Languages,
    label: 'Idiomas',
    detail: 'Español, inglés y francés',
  },
  {
    icon: CalendarX,
    label: 'Cancelación',
    detail: 'Gratuita hasta 48h antes',
  },
  {
    icon: Backpack,
    label: 'Qué traer',
    detail: 'Ropa cómoda, calzado deportivo, agua',
  },
]

export function PracticalInfo() {
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
          {infoItems.map((item, i) => (
            <div 
              key={i}
              className="bg-white p-5 rounded-2xl flex items-start gap-4"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'var(--color-adventure)', opacity: 0.1 }}
              >
                <item.icon 
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
          ))}
        </div>
      </div>
    </section>
  )
}

export default PracticalInfo
