'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

/* ── Tipos ─────────────────────────────────────────── */

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  number?: number;
}

interface MapLocationPickerProps {
  center?: [number, number];
  zoom?: number;
  existingMarkers?: MapMarker[];
  selectedPosition?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number, name?: string) => void;
  /** Callback cuando se hace clic en un marcador existente (índice del marcador) */
  onExistingMarkerClick?: (index: number) => void;
  height?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  /** Mensaje que se muestra cuando el mapa está activo */
  activeHint?: string;
  /** Forzar fly a estas coordenadas cuando cambien */
  flyTo?: [number, number] | null;
}

/* ── Componente interno (solo se renderiza en cliente) ─── */

function MapLocationPickerInner({
  center = [40.4168, -3.7038],
  zoom = 14,
  existingMarkers = [],
  selectedPosition,
  onLocationSelect,
  onExistingMarkerClick,
  height = '400px',
  searchPlaceholder = 'Buscar lugar (ej: Castillo de Ainsa)...',
  showSearch = true,
  activeHint,
  flyTo,
}: MapLocationPickerProps) {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [ReactLeaflet, setReactLeaflet] = useState<typeof import('react-leaflet') | null>(null);
  const [ready, setReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showResults, setShowResults] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ★ REFs para callbacks — evita closures obsoletas en Leaflet
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const onExistingMarkerClickRef = useRef(onExistingMarkerClick);
  useEffect(() => {
    onExistingMarkerClickRef.current = onExistingMarkerClick;
  }, [onExistingMarkerClick]);

  // Cargar leaflet y react-leaflet dinámicamente
  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')]).then(([leaflet, rl]) => {
      setL(leaflet);
      setReactLeaflet(rl);

      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      setReady(true);
    });
  }, []);

  // Efecto flyTo: cuando la prop cambia, volar a esa posición
  const prevFlyToRef = useRef<[number, number] | null>(null);
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    if (prevFlyToRef.current && prevFlyToRef.current[0] === flyTo[0] && prevFlyToRef.current[1] === flyTo[1]) return;
    prevFlyToRef.current = flyTo;
    mapRef.current.flyTo(flyTo, 17, { duration: 1 });
  }, [flyTo]);

  const icons = useMemo(() => {
    if (!L) return {};
    const createIcon = (color: string) =>
      new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
    return {
      blue: createIcon('blue'),
      red: createIcon('red'),
      green: createIcon('green'),
      gold: createIcon('gold'),
      grey: createIcon('grey'),
    };
  }, [L]);

  const createNumberedIcon = useCallback(
    (num: number, color: string = 'blue') => {
      if (!L) return undefined;
      return L.divIcon({
        className: 'custom-numbered-marker',
        html: `<div style="
          background-color: ${color === 'red' ? '#dc2626' : color === 'green' ? '#16a34a' : color === 'gold' ? '#ca8a04' : color === 'grey' ? '#6b7280' : '#2563eb'};
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${num}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
    },
    [L],
  );

  // Búsqueda Nominatim (debounce)
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=es&accept-language=es`,
      );
      const data = await res.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchInput = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => handleSearch(value), 400);
    },
    [handleSearch],
  );

  // ★ Seleccionar resultado de búsqueda → usa REF, nunca se queda obsoleto
  const selectSearchResult = useCallback(
    (result: { display_name: string; lat: string; lon: string }) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 17, { duration: 1 });
      }
      onLocationSelectRef.current?.(lat, lng, result.display_name);
      setShowResults(false);
      setSearchQuery(result.display_name.split(',')[0]);
    },
    [],
  );

  // ★ Click en el mapa → usa REF
  const handleMapClick = useCallback((e: any) => {
    const { lat, lng } = e.latlng;
    onLocationSelectRef.current?.(lat, lng);
  }, []);

  // ★ Drag end → usa REF
  const handleMarkerDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      onLocationSelectRef.current?.(pos.lat, pos.lng);
    }
  }, []);

  // Quitar marcador
  const handleRemoveMarker = useCallback(() => {
    onLocationSelectRef.current?.(0, 0);
  }, []);

  if (!ready || !L || !ReactLeaflet) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: 8 }}>
        Cargando mapa...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = ReactLeaflet;

  function MapClickHandler() {
    useMapEvents({ click: handleMapClick });
    return null;
  }

  const isActive = !!onLocationSelect;

  return (
    <div className="relative" style={{ width: '100%' }}>
      {/* Hint activo */}
      {isActive && activeHint && (
        <div className="mb-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800 font-medium">
          {activeHint}
        </div>
      )}

      {/* Buscador */}
      {showSearch && isActive && (
        <div className="relative mb-2" style={{ zIndex: 1000 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchInput(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searching && (
            <div className="absolute right-2 top-2.5">
              <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg" style={{ zIndex: 1001 }}>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSearchResult(r)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-0"
                >
                  <span className="font-medium">{r.display_name.split(',')[0]}</span>
                  <span className="ml-1 text-xs text-gray-500">
                    {r.display_name.split(',').slice(1, 3).join(',')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mapa */}
      <div
        style={{
          height,
          borderRadius: 8,
          overflow: 'hidden',
          border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        }}
      >
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {isActive && <MapClickHandler />}

          {existingMarkers.map((m, i) => {
            const icon =
              m.number != null
                ? createNumberedIcon(m.number, m.color || 'blue')
                : (icons as any)[m.color || 'blue'] || icons.blue;
            return (
              <Marker
                key={`existing-${i}`}
                position={[m.lat, m.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onExistingMarkerClickRef.current?.(i),
                }}
              >
                {m.label && (
                  <Popup>
                    <div>
                      <span style={{ fontWeight: 600 }}>{m.label}</span>
                      <br />
                      <span style={{ fontSize: 11, color: '#666' }}>
                        {m.lat.toFixed(6)}, {m.lng.toFixed(6)}
                      </span>
                      {onExistingMarkerClickRef.current && (
                        <div style={{ marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExistingMarkerClickRef.current?.(i);
                            }}
                            style={{
                              background: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: 4,
                              padding: '2px 8px',
                              fontSize: 12,
                              cursor: 'pointer',
                            }}
                          >
                            Editar
                          </button>
                        </div>
                      )}
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}

          {selectedPosition && (
            <Marker
              position={[selectedPosition.lat, selectedPosition.lng]}
              icon={icons.red}
              draggable
              ref={markerRef}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            >
              <Popup>
                <strong>Ubicación seleccionada</strong>
                <br />
                <span style={{ fontSize: 11 }}>
                  {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </span>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Info debajo */}
      {isActive ? (
        <p className="mt-1 text-xs text-blue-600 font-medium">
          Haz clic en el mapa o busca un lugar. Puedes arrastrar el marcador rojo para ajustar.
        </p>
      ) : (
        <p className="mt-1 text-xs text-gray-400">
          Pulsa "Añadir" o "Editar" para poder situar puntos en el mapa.
        </p>
      )}

      {selectedPosition && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-blue-700">
            {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={handleRemoveMarker}
            className="text-red-500 hover:text-red-700"
            title="Quitar marcador"
          >
            Quitar
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Export con dynamic import (SSR disabled) ─────── */

const MapLocationPicker = dynamic(() => Promise.resolve(MapLocationPickerInner), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6',
        borderRadius: 8,
      }}
    >
      Cargando mapa...
    </div>
  ),
});

export default MapLocationPicker;
