'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { MapPin, Car, Bus, Plane, ChevronDown } from 'lucide-react'

const transportOptions = [
  {
    id: 'car',
    icon: Car,
    title: 'En coche',
    content: 'Desde Huesca: A-138 dirección Barbastro, luego N-260 hasta Aínsa (1h 15min). Desde Zaragoza: A-23 hasta Huesca, luego A-138 (2h). Parking gratuito junto a la muralla.',
  },
  {
    id: 'bus',
    icon: Bus,
    title: 'En autobús',
    content: 'Línea regular Alosa desde Barbastro (1h). Conexiones desde Huesca y Zaragoza con transbordo en Barbastro. Horarios en alosa.es',
  },
  {
    id: 'plane',
    icon: Plane,
    title: 'En avión',
    content: 'Aeropuerto más cercano: Huesca-Pirineos (a 1h 15min en coche). Alternativas: Zaragoza (2h) o Barcelona (3h 30min).',
  },
]

const nearbyPOIs = [
  { name: 'Parque Nacional de Ordesa', distance: '25 min' },
  { name: 'Cañón de Añisclo', distance: '30 min' },
  { name: 'Sierra de Guara', distance: '45 min' },
  { name: 'Valle de Pineta', distance: '40 min' },
]

export function LocationMap() {
  const [mounted, setMounted] = useState(false)
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const coordinates: [number, number] = [42.4171, 0.1391] // Aínsa coordinates

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
              <MapComponent coordinates={coordinates} />
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
                    Sobrarbe Aventura
                  </p>
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--color-slate)', opacity: 0.7 }}
                  >
                    Plaza Mayor, 1<br />
                    22330 Aínsa, Huesca<br />
                    España
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
              {transportOptions.map(option => (
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
                      <option.icon 
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
              ))}
            </div>

            {/* Nearby POIs */}
            <h3 
              className="font-serif text-xl font-bold mb-4"
              style={{ color: 'var(--color-slate)' }}
            >
              Puntos de interés cercanos
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {nearbyPOIs.map((poi, i) => (
                <div 
                  key={i}
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
                    {poi.distance}
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

function MapComponent({ coordinates }: { coordinates: [number, number] }) {
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
          <strong>Sobrarbe Aventura</strong><br />
          Plaza Mayor, Aínsa
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default LocationMap
