'use client'

import { Shield, Backpack, Check, HardHat, Compass, Shirt, Droplets, Phone, BadgePlus, Award } from 'lucide-react'
import { useActivitySlice } from './activity-config-context'

const SAFETY_ICONS: Record<string, React.ElementType> = {
  shield: Shield, phone: Phone, 'first-aid': BadgePlus, helmet: HardHat, license: Award, check: Check,
}
const EQUIP_ICONS: Record<string, React.ElementType> = {
  backpack: Backpack, helmet: HardHat, rope: Shield, paddle: Shirt, bike: Compass, snowshoe: Droplets, binoculars: Compass,
}

const DEFAULT_SAFETY = [
  { id: '1', icon: 'check' as const, text: 'Guías con certificación AEGM y primeros auxilios' },
  { id: '2', icon: 'check' as const, text: 'Material revisado y homologado cada temporada' },
  { id: '3', icon: 'check' as const, text: 'Comunicación vía radio y teléfono satélite' },
  { id: '4', icon: 'check' as const, text: 'Seguros de accidentes y responsabilidad civil' },
  { id: '5', icon: 'check' as const, text: 'Protocolos de emergencia establecidos' },
  { id: '6', icon: 'check' as const, text: 'Grupos reducidos para mayor seguridad' },
]
const DEFAULT_EQUIPMENT = [
  { id: '1', icon: 'helmet'   as const, text: 'Casco' },
  { id: '2', icon: 'rope'     as const, text: 'Arnés' },
  { id: '3', icon: 'binoculars' as const, text: 'GPS' },
  { id: '4', icon: 'paddle'   as const, text: 'Neopreno' },
  { id: '5', icon: 'snowshoe' as const, text: 'Bidón estanco' },
  { id: '6', icon: 'backpack' as const, text: 'Mochila' },
]

export function SafetyAndEquipment() {
  const slice = useActivitySlice('safety')
  const measures = slice?.measures && slice.measures.length > 0 ? slice.measures : DEFAULT_SAFETY
  const equipment = slice?.equipment && slice.equipment.length > 0 ? slice.equipment : DEFAULT_EQUIPMENT
  const inclusionNote = slice?.inclusionNote || 'Todo incluido en el precio'
  const safetyTitle = slice?.title || 'Tu seguridad, nuestra prioridad'
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
                {safetyTitle}
              </h3>
            </div>

            <ul className="space-y-3">
              {measures.map((measure) => {
                const Icon = SAFETY_ICONS[measure.icon] ?? Check
                return (
                  <li 
                    key={measure.id}
                    className="flex items-start gap-3"
                  >
                    <Icon 
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{ color: 'var(--color-adventure)' }}
                    />
                    <span style={{ color: 'var(--color-slate)' }}>
                      {measure.text}
                    </span>
                  </li>
                )
              })}
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
              {equipment.map((item) => {
                const Icon = EQUIP_ICONS[item.icon] ?? Backpack
                return (
                  <div 
                    key={item.id}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white"
                  >
                    <Icon 
                      className="w-6 h-6"
                      style={{ color: 'var(--color-adventure)' }}
                    />
                    <span 
                      className="text-sm text-center"
                      style={{ color: 'var(--color-slate)' }}
                    >
                      {item.text}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Callout */}
            <div 
              className="p-4 rounded-xl text-center"
              style={{ 
                backgroundColor: 'var(--color-adventure)',
                color: 'white',
              }}
            >
              <p className="font-medium">✓ {inclusionNote}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SafetyAndEquipment
