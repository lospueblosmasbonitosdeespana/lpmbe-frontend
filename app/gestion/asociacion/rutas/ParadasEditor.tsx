'use client';

import { useState } from 'react';

type Parada = {
  tempId: string;
  orden: number;
  puebloId: number | null;
  puebloNombre?: string;
  titulo?: string;
  descripcion?: string;
  fotoUrl?: string;
  lat?: number | null;
  lng?: number | null;
};

type ParadasEditorProps = {
  paradas: Parada[];
  setParadas: (paradas: Parada[]) => void;
};

export default function ParadasEditor({ paradas, setParadas }: ParadasEditorProps) {
  const [busqueda, setBusqueda] = useState('');
  const [resultadosPueblos, setResultadosPueblos] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selectedParadaId, setSelectedParadaId] = useState<string | null>(null);

  // Buscar pueblos
  async function buscarPueblos(query: string) {
    if (!query.trim()) {
      setResultadosPueblos([]);
      return;
    }

    setBuscando(true);
    try {
      const res = await fetch(`/api/pueblos?search=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setResultadosPueblos(Array.isArray(data) ? data : []);
      }
    } finally {
      setBuscando(false);
    }
  }

  function añadirParada(pueblo?: any) {
    const nuevaParada: Parada = {
      tempId: `parada-${Date.now()}`,
      orden: paradas.length + 1,
      puebloId: pueblo?.id ?? null,
      puebloNombre: pueblo?.nombre ?? '',
      titulo: '',
      descripcion: '',
      fotoUrl: '',
      lat: null,
      lng: null,
    };
    setParadas([...paradas, nuevaParada]);
    setBusqueda('');
    setResultadosPueblos([]);
  }

  function eliminarParada(tempId: string) {
    const filtered = paradas.filter((p) => p.tempId !== tempId);
    // Reordenar
    const reordenadas = filtered.map((p, idx) => ({ ...p, orden: idx + 1 }));
    setParadas(reordenadas);
  }

  function moverArriba(tempId: string) {
    const idx = paradas.findIndex((p) => p.tempId === tempId);
    if (idx <= 0) return;
    const copy = [...paradas];
    [copy[idx], copy[idx - 1]] = [copy[idx - 1], copy[idx]];
    const reordenadas = copy.map((p, i) => ({ ...p, orden: i + 1 }));
    setParadas(reordenadas);
  }

  function moverAbajo(tempId: string) {
    const idx = paradas.findIndex((p) => p.tempId === tempId);
    if (idx < 0 || idx >= paradas.length - 1) return;
    const copy = [...paradas];
    [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
    const reordenadas = copy.map((p, i) => ({ ...p, orden: i + 1 }));
    setParadas(reordenadas);
  }

  function updateParada(tempId: string, field: keyof Parada, value: any) {
    setParadas(
      paradas.map((p) =>
        p.tempId === tempId ? { ...p, [field]: value } : p
      )
    );
  }

  async function uploadFotoParada(tempId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Cache-busting para ver cambio al instante
          const busted = `${data.url}${data.url.includes('?') ? '&' : '?'}v=${Date.now()}`;
          updateParada(tempId, 'fotoUrl', busted);
        }
      } else {
        const text = await res.text();
        console.error('Error subiendo foto parada:', text);
        alert('Error subiendo foto: ' + (text || res.status));
      }
    } catch (e) {
      console.error('Error subiendo foto:', e);
      alert('Error subiendo foto');
    }
  }

  return (
    <div className="space-y-4">
      {/* Buscador de pueblos */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Añadir pueblo</label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md border px-3 py-2 text-sm"
            placeholder="Buscar pueblo..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              buscarPueblos(e.target.value);
            }}
          />
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => añadirParada()}
          >
            + Añadir vacía
          </button>
        </div>

        {buscando && <p className="text-xs text-gray-500">Buscando...</p>}

        {resultadosPueblos.length > 0 && (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-white p-2">
            {resultadosPueblos.map((pueblo) => (
              <button
                key={pueblo.id}
                type="button"
                className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-gray-100"
                onClick={() => añadirParada(pueblo)}
              >
                {pueblo.nombre} ({pueblo.provincia})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de paradas */}
      {paradas.length === 0 ? (
        <p className="text-sm text-gray-500">No hay paradas todavía.</p>
      ) : (
        <div className="space-y-4">
          {paradas.map((parada, idx) => (
            <div key={parada.tempId} className="rounded-md border bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-semibold text-gray-700">
                  Parada {idx + 1}
                  {parada.puebloNombre && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({parada.puebloNombre})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moverArriba(parada.tempId)}
                    className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                    disabled={idx === 0}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverAbajo(parada.tempId)}
                    className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                    disabled={idx === paradas.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarParada(parada.tempId)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Pueblo no asignado */}
              {!parada.puebloId && (
                <div className="mb-2 rounded bg-yellow-50 p-2 text-xs text-yellow-700">
                  ⚠️ Pueblo no asignado. Usa el buscador de arriba para añadir uno con
                  pueblo, o edita los campos manualmente.
                </div>
              )}

              {/* Título opcional */}
              <div className="mb-2 space-y-1">
                <label className="block text-xs font-medium">Título (opcional)</label>
                <input
                  className="w-full rounded border px-2 py-1 text-sm"
                  value={parada.titulo ?? ''}
                  onChange={(e) => updateParada(parada.tempId, 'titulo', e.target.value)}
                  placeholder="Ej: Plaza Mayor"
                />
              </div>

              {/* Descripción */}
              <div className="mb-2 space-y-1">
                <label className="block text-xs font-medium">Descripción</label>
                <textarea
                  className="w-full rounded border px-2 py-1 text-sm"
                  rows={3}
                  value={parada.descripcion ?? ''}
                  onChange={(e) =>
                    updateParada(parada.tempId, 'descripcion', e.target.value)
                  }
                />
              </div>

              {/* Foto */}
              <div className="mb-2 space-y-1">
                <label className="block text-xs font-medium">Foto</label>
                
                {parada.fotoUrl && (
                  <div className="relative inline-block">
                    <img
                      src={parada.fotoUrl}
                      alt="Foto parada"
                      className="h-20 w-auto rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => updateParada(parada.tempId, 'fotoUrl', '')}
                      className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFotoParada(parada.tempId, file);
                  }}
                  className="text-xs"
                />
              </div>

              {/* Coordenadas opcionales */}
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600">
                  Coordenadas (opcional)
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Lat"
                    className="rounded border px-2 py-1"
                    value={parada.lat ?? ''}
                    onChange={(e) =>
                      updateParada(
                        parada.tempId,
                        'lat',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Lng"
                    className="rounded border px-2 py-1"
                    value={parada.lng ?? ''}
                    onChange={(e) =>
                      updateParada(
                        parada.tempId,
                        'lng',
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                  />
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
