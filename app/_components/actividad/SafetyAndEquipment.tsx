import { Shield, Backpack, Check, HardHat, Compass, Shirt, Droplets } from 'lucide-react'

const safetyMeasures = [
  'Guías con certificación AEGM y primeros auxilios',
  'Material revisado y homologado cada temporada',
  'Comunicación vía radio y teléfono satélite',
  'Seguros de accidentes y responsabilidad civil',
  'Protocolos de emergencia establecidos',
  'Grupos reducidos para mayor seguridad',
]

const equipment = [
  { name: 'Casco', icon: HardHat },
  { name: 'Arnés', icon: Shield },
  { name: 'GPS', icon: Compass },
  { name: 'Neopreno', icon: Shirt },
  { name: 'Bidón estanco', icon: Droplets },
  { name: 'Mochila', icon: Backpack },
]

export function SafetyAndEquipment() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Safety */}
          <div 
            className="p-8 rounded-2xl"
            style={{ 
              backgroundColor: 'var(--color-sand)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-adventure)' }}
              >
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 
                className="font-serif text-2xl font-bold"
                style={{ color: 'var(--color-slate)' }}
              >
                Tu seguridad, nuestra prioridad
              </h3>
            </div>

            <ul className="space-y-3">
              {safetyMeasures.map((measure, i) => (
                <li 
                  key={i}
                  className="flex items-start gap-3"
                >
                  <Check 
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--color-adventure)' }}
                  />
                  <span style={{ color: 'var(--color-slate)' }}>
                    {measure}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipment */}
          <div 
            className="p-8 rounded-2xl"
            style={{ 
              backgroundColor: 'var(--color-sand)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-adventure)' }}
              >
                <Backpack className="w-6 h-6 text-white" />
              </div>
              <h3 
                className="font-serif text-2xl font-bold"
                style={{ color: 'var(--color-slate)' }}
              >
                Material incluido
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {equipment.map((item, i) => (
                <div 
                  key={i}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white"
                >
                  <item.icon 
                    className="w-6 h-6"
                    style={{ color: 'var(--color-adventure)' }}
                  />
                  <span 
                    className="text-sm text-center"
                    style={{ color: 'var(--color-slate)' }}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Callout */}
            <div 
              className="p-4 rounded-xl text-center"
              style={{ 
                backgroundColor: 'var(--color-adventure)',
                color: 'white',
              }}
            >
              <p className="font-medium">✓ Todo incluido en el precio</p>
              <p className="text-sm opacity-80">No necesitas traer material técnico</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SafetyAndEquipment
