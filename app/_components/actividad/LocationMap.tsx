'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapPin, Car, Bus, Plane, ChevronDown } from 'lucide-react'
import { useActivitySlice, useActivityMeta } from './activity-config-context'

const ICONS = { car: Car, bus: Bus, plane: Plane } as const

const DEFAULT_TRANSPORT = [
  { id: 'car',   icon: 'car'   as const, title: 'En coche',  content: 'Desde Huesca: A-138 dirección Barbastro, luego N-260 hasta Aínsa (1h 15min). Desde Zaragoza: A-23 hasta Huesca, luego A-138 (2h). Parking gratuito junto a la muralla.' },
  { id: 'bus',   icon: 'bus'   as const, title: 'En autobús', content: 'Línea regular Alosa desde Barbastro (1h). Conexiones desde Huesca y Zaragoza con transbordo en Barbastro. Horarios en alosa.es' },
  { id: 'plane', icon: 'plane' as const, title: 'En avión',  content: 'Aeropuerto más cercano: Huesca-Pirineos (a 1h 15min en coche). Alternativas: Zaragoza (2h) o Barcelona (3h 30min).' },
]

const DEFAULT_POIS = [
  { id: 'p1', name: 'Parque Nacional de Ordesa', detail: '25 min' },
  { id: 'p2', name: 'Cañón de Añisclo',          detail: '30 min' },
  { id: 'p3', name: 'Sierra de Guara',           detail: '45 min' },
  { id: 'p4', name: 'Valle de Pineta',           detail: '40 min' },
]

export function LocationMap() {
  const [mounted, setMounted] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)
  const slice = useActivitySlice('location')
  const meta = useActivityMeta()

  useEffect(() => {
    setMounted(true)
  }, [])

  const coordinates: [number, number] =
    meta.lat != null && meta.lng != null ? [meta.lat, meta.lng] : [42.4171, 0.1391]
  const businessName = meta.nombre || 'Sobrarbe Aventura'
  const address = slice?.address || 'Plaza Mayor, 1\n22330 Aínsa, Huesca\nEspaña'
  const transports = slice?.directions && slice.directions.length > 0 ? slice.directions : DEFAULT_TRANSPORT
  const pois = slice?.nearbyMeetingPoints && slice.nearbyMeetingPoints.length > 0 ? slice.nearbyMeetingPoints : DEFAULT_POIS

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p 
            className="text-sm font-medium tracking-wider uppercase mb-3"
            style={{ color: 'var(--color-adventure)' }}
          >
            Dónde encontrarnos
          </p>
          <h2 
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{ color: 'var(--color-slate)' }}
          >
            Ubicación
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Map */}
          <div className="h-[400px] rounded-2xl overflow-hidden bg-gray-100">
            {mounted ? (
              <MapComponent coordinates={coordinates} businessName={businessName} address={address} />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-sand)' }}
              >
                <p style={{ color: 'var(--color-slate)', opacity: 0.5 }}>
                  Cargando mapa...
                </p>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {/* Address */}
            <div 
              className="p-5 rounded-2xl mb-6"
              style={{ backgroundColor: 'var(--color-sand)' }}
            >
              <div className="flex items-start gap-3">
                <MapPin 
                  className="w-5 h-5 mt-1 flex-shrink-0"
                  style={{ color: 'var(--color-adventure)' }}
                />
                <div>
                  <p 
                    className="font-semibold mb-1"
                    style={{ color: 'var(--color-slate)' }}
                  >
                    {businessName}
                  </p>
                  <p 
                    className="text-sm whitespace-pre-line"
                    style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                  >
                    {address}
                  </p>
                </div>
              </div>
            </div>

            {/* How to get there */}
            <h3 
              className="font-serif text-xl font-bold mb-4"
              style={{ color: 'var(--color-slate)' }}
            >
              Cómo llegar
            </h3>

            <div className="space-y-2 mb-6">
              {transports.map((option) => {
                const Icon = ICONS[option.icon as keyof typeof ICONS] ?? Car
                return (
                <div 
                  key={option.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                >
                  <button
                    onClick={() => setOpenAccordion(openAccordion === option.id ? null : option.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        className="w-5 h-5"
                        style={{ color: 'var(--color-adventure)' }}
                      />
                      <span 
                        className="font-medium"
                        style={{ color: 'var(--color-slate)' }}
                      >
                        {option.title}
                      </span>
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform ${openAccordion === option.id ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--color-slate)', opacity: 0.5 }}
                    />
                  </button>
                  {openAccordion === option.id && (
                    <div 
                      className="px-4 pb-4 text-sm"
                      style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                    >
                      {option.content}
                    </div>
                  )}
                </div>
                )
              })}
            </div>

            {/* Nearby POIs */}
            <h3 
              className="font-serif text-xl font-bold mb-4"
              style={{ color: 'var(--color-slate)' }}
            >
              Puntos de interés cercanos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {pois.map((poi) => (
                <div 
                  key={poi.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-sand)' }}
                >
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--color-slate)' }}
                  >
                    {poi.name}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: 'var(--color-adventure)' }}
                  >
                    {poi.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MapComponent({ coordinates, businessName, address }: { coordinates: [number, number]; businessName: string; address: string }) {
  const [MapContainer, setMapContainer] = useState<any>(null)
  const [TileLayer, setTileLayer] = useState<any>(null)
  const [Marker, setMarker] = useState<any>(null)
  const [Popup, setPopup] = useState<any>(null)

  useEffect(() => {
    import('react-leaflet').then(mod => {
      setMapContainer(() => mod.MapContainer)
      setTileLayer(() => mod.TileLayer)
      setMarker(() => mod.Marker)
      setPopup(() => mod.Popup)
    })
  }, [])

  if (!MapContainer || !TileLayer || !Marker || !Popup) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-sand)' }}
      >
        <p style={{ color: 'var(--color-slate)', opacity: 0.5 }}>
          Cargando mapa...
        </p>
      </div>
    )
  }

  return (
    <MapContainer 
      center={coordinates} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={coordinates}>
        <Popup>
          <strong>{businessName}</strong>
          <br />
          {address.split('\n')[0]}
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default LocationMap
