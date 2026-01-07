'use client';

import { useState, useMemo } from 'react';

type Pueblo = {
  id: number;
  nombre: string;
  provincia?: string | null;
  comunidad?: string | null;
  slug: string;
};

type Suscripcion = {
  puebloId: number;
  tipo: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO';
  enabled: boolean;
};

type Props = {
  pueblos: Pueblo[];
  initial: Suscripcion[];
};

const TIPOS: Array<{ key: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO'; label: string }> = [
  { key: 'NOTICIA', label: 'Noticias' },
  { key: 'EVENTO', label: 'Eventos' },
  { key: 'SEMAFORO', label: 'Semáforos' },
  { key: 'METEO', label: 'Meteo' },
];

export default function PreferenciasNotificaciones({ pueblos, initial }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Convertir initial a un Map para acceso rápido
  const suscripcionesMap = useMemo(() => {
    const map = new Map<string, boolean>();
    initial.forEach((s) => {
      const key = `${s.puebloId}-${s.tipo}`;
      map.set(key, s.enabled);
    });
    return map;
  }, [initial]);

  const [estado, setEstado] = useState<Map<string, boolean>>(suscripcionesMap);

  const pueblosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return pueblos;
    const term = searchTerm.toLowerCase();
    return pueblos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.provincia?.toLowerCase().includes(term) ?? false) ||
        (p.comunidad?.toLowerCase().includes(term) ?? false)
    );
  }, [pueblos, searchTerm]);

  async function handleToggle(puebloId: number, tipo: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO') {
    const key = `${puebloId}-${tipo}`;
    const currentValue = estado.get(key) ?? false;
    const newValue = !currentValue;

    setSaving((prev) => new Set(prev).add(key));
    setError(null);

    try {
      const res = await fetch('/api/notificaciones/preferencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          puebloId,
          tipo,
          enabled: newValue,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`Error al guardar: ${text}`);
        return;
      }

      // Actualizar estado local
      setEstado((prev) => {
        const next = new Map(prev);
        next.set(key, newValue);
        return next;
      });
    } catch (e: any) {
      setError(`Error al guardar: ${e?.message ?? String(e)}`);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-2">
          Buscar pueblo
        </label>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nombre, provincia o comunidad..."
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {pueblosFiltrados.map((pueblo) => (
          <div key={pueblo.id} className="border-b pb-4">
            <div className="font-semibold">{pueblo.nombre}</div>
            <div className="text-sm text-gray-600">
              {pueblo.provincia ?? ''}
              {pueblo.provincia && pueblo.comunidad ? ' / ' : ''}
              {pueblo.comunidad ?? ''}
            </div>

            <div className="mt-2 flex flex-wrap gap-4">
              {TIPOS.map((tipo) => {
                const key = `${pueblo.id}-${tipo.key}`;
                const isEnabled = estado.get(key) ?? false;
                const isSaving = saving.has(key);

                return (
                  <label key={tipo.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggle(pueblo.id, tipo.key)}
                      disabled={isSaving}
                      className="rounded"
                    />
                    <span>
                      {tipo.label}
                      {isSaving && <span className="text-gray-500 ml-1">(Guardando...)</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {pueblosFiltrados.length === 0 && (
        <p className="text-sm text-gray-600">No se encontraron pueblos.</p>
      )}
    </div>
  );
}























