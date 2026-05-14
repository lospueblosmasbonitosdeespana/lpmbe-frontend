'use client'

import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix iconos de Leaflet con Next.js (los assets por defecto no se sirven).
const defaultIcon = L.icon({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Props {
  lat: number
  lng: number
  onPositionChange: (lat: number, lng: number) => void
}

function ResizeFix() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function RecenterOnChange({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      map.setView([lat, lng], map.getZoom())
    }
  }, [lat, lng, map])
  return null
}

export default function MapPreview({ lat, lng, onPositionChange }: Props) {
  const validCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
  const center: [number, number] = validCoords ? [lat, lng] : [40.4168, -3.7038]
  const markerRef = useRef<L.Marker | null>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const m = markerRef.current
        if (!m) return
        const pos = m.getLatLng()
        onPositionChange(pos.lat, pos.lng)
      },
    }),
    [onPositionChange],
  )

  return (
    <MapContainer
      center={center}
      zoom={validCoords ? 15 : 6}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ResizeFix />
      <RecenterOnChange lat={lat} lng={lng} />
      {validCoords ? (
        <Marker
          position={center}
          draggable
          icon={defaultIcon}
          eventHandlers={eventHandlers}
          ref={(ref) => {
            markerRef.current = ref
          }}
        />
      ) : null}
    </MapContainer>
  )
}
