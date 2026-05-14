import { Mountain, Clock, Users, Award, MapPin, Calendar } from 'lucide-react'

const stats = [
  { icon: Mountain, value: '15+', label: 'Rutas' },
  { icon: Calendar, value: 'Todo el año', label: 'Disponibilidad' },
  { icon: Users, value: '2-12', label: 'Personas' },
  { icon: Award, value: 'Certificados', label: 'Guías' },
  { icon: MapPin, value: 'Ordesa', label: 'y Monte Perdido' },
  { icon: Clock, value: 'Desde 2008', label: 'Experiencia' },
]

export function ActivityHighlights() {
  return (
    <section 
      className="py-8 overflow-x-auto"
      style={{ backgroundColor: 'var(--color-sand)' }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex gap-4 md:gap-6 pb-2 min-w-max md:min-w-0 md:flex-wrap md:justify-center">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-white px-5 py-4 rounded-xl shadow-sm min-w-[160px]"
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'oklch(0.45 0.18 155 / 0.1)' }}
              >
                <stat.icon 
                  className="w-5 h-5" 
                  style={{ color: 'var(--color-adventure)' }}
                />
              </div>
              <div>
                <p 
                  className="font-semibold text-sm"
                  style={{ color: 'var(--color-slate)' }}
                >
                  {stat.value}
                </p>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                >
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ActivityHighlights
