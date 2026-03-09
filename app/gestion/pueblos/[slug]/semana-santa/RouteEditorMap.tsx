'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';

export type RouteStop = { lat: number; lng: number; label?: string };
export type RouteDraft = {
  inicioLat?: number;
  inicioLng?: number;
  finLat?: number;
  finLng?: number;
  paradas: RouteStop[];
};

type Mode = 'inicio' | 'fin' | 'parada';

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

function ClickHandler({ mode, onPick }: { mode: Mode; onPick: (lat: number, lng: number, mode: Mode) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng, mode);
    },
  });
  return null;
}

function FlyToPoint({ point }: { point: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo(point, 16, { duration: 0.8 });
  }, [map, point]);
  return null;
}

function SearchAndManualPicker({
  mode,
  onPick,
}: {
  mode: Mode;
  onPick: (lat: number, lng: number, mode: Mode) => void;
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=es&accept-language=es&q=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo buscar la dirección');
      const json = (await res.json()) as SearchResult[];
      setResults(json);
      if (json.length === 0) setError('Sin resultados. Prueba otra calle, plaza o pueblo.');
    } catch {
      setError('No se pudo completar la búsqueda en mapa.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const pickFromSearch = (item: SearchResult) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    onPick(lat, lng, mode);
  };

  const pickManual = () => {
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Coordenadas manuales no válidas.');
      return;
    }
    setError(null);
    onPick(lat, lng, mode);
  };

  return (
    <div className="space-y-2 border-b bg-background p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Buscar pueblo, calle, plaza..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runSearch();
            }
          }}
        />
        <button type="button" onClick={() => void runSearch()} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-36 overflow-auto rounded-md border">
          {results.map((r) => (
            <button
              key={`${r.lat}-${r.lon}-${r.display_name}`}
              type="button"
              onClick={() => pickFromSearch(r)}
              className="block w-full border-b px-3 py-2 text-left text-xs hover:bg-muted"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="number"
          step="any"
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Lat manual"
          value={manualLat}
          onChange={(e) => setManualLat(e.target.value)}
        />
        <input
          type="number"
          step="any"
          className="rounded-md border px-3 py-2 text-sm"
          placeholder="Lng manual"
          value={manualLng}
          onChange={(e) => setManualLng(e.target.value)}
        />
        <button type="button" onClick={pickManual} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
          Ir + marcar
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Modo activo: <strong>{mode}</strong>. Buscar/seleccionar marca el punto en el modo activo; también puedes clicar manualmente en el mapa.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function RouteEditorMap({
  value,
  mode,
  onChange,
}: {
  value: RouteDraft;
  mode: Mode;
  onChange: (next: RouteDraft) => void;
}) {
  const [flyToPoint, setFlyToPoint] = useState<[number, number] | null>(null);

  const center: [number, number] = useMemo(() => {
    if (value.inicioLat != null && value.inicioLng != null) return [value.inicioLat, value.inicioLng];
    if (value.finLat != null && value.finLng != null) return [value.finLat, value.finLng];
    if (value.paradas.length > 0) return [value.paradas[0].lat, value.paradas[0].lng];
    return [40.4168, -3.7038];
  }, [value]);

  const linePoints: Array<[number, number]> = useMemo(() => {
    const points: Array<[number, number]> = [];
    if (value.inicioLat != null && value.inicioLng != null) points.push([value.inicioLat, value.inicioLng]);
    for (const p of value.paradas) points.push([p.lat, p.lng]);
    if (value.finLat != null && value.finLng != null) points.push([value.finLat, value.finLng]);
    return points;
  }, [value]);

  const applyPick = (lat: number, lng: number, currentMode: Mode) => {
    setFlyToPoint([lat, lng]);
    if (currentMode === 'inicio') {
      onChange({ ...value, inicioLat: lat, inicioLng: lng });
      return;
    }
    if (currentMode === 'fin') {
      onChange({ ...value, finLat: lat, finLng: lng });
      return;
    }
    onChange({ ...value, paradas: [...value.paradas, { lat, lng }] });
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <SearchAndManualPicker mode={mode} onPick={applyPick} />
      <MapContainer center={center} zoom={15} className="h-72 w-full">
        <FlyToPoint point={flyToPoint} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler mode={mode} onPick={applyPick} />

        {value.inicioLat != null && value.inicioLng != null && (
          <CircleMarker center={[value.inicioLat, value.inicioLng]} radius={7} pathOptions={{ color: '#16a34a' }} />
        )}
        {value.finLat != null && value.finLng != null && (
          <CircleMarker center={[value.finLat, value.finLng]} radius={7} pathOptions={{ color: '#dc2626' }} />
        )}
        {value.paradas.map((p, i) => (
          <CircleMarker key={`${p.lat}-${p.lng}-${i}`} center={[p.lat, p.lng]} radius={5} pathOptions={{ color: '#2563eb' }} />
        ))}

        {linePoints.length >= 2 && <Polyline positions={linePoints} pathOptions={{ color: '#1d4ed8', weight: 4 }} />}
      </MapContainer>
    </div>
  );
}
