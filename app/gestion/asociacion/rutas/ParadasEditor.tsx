'use client';

import { useState, useEffect, useCallback } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';

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

function PuebloAsignar({
  parada,
  onAsignar,
  onQuitar,
}: {
  parada: Parada;
  onAsignar: (pueblo: { id: number; nombre: string; provincia?: string }) => void;
  onQuitar: () => void;
}) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await fetch(`/api/pueblos?search=${encodeURIComponent(query)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setResultados(Array.isArray(data) ? data : []);
        }
      } finally {
        setBuscando(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  if (parada.puebloId && parada.puebloNombre) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-600">Pueblo:</span>
        <span className="rounded bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
          {parada.puebloNombre}
        </span>
        <button
          type="button"
          onClick={onQuitar}
          className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
        >
          cambiar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-medium text-gray-700">
        Pueblo <span className="text-amber-600">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 pr-20 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Escribe el nombre del pueblo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {buscando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Buscando...</span>
        )}
      </div>
      {focused && resultados.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-44 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-primary/5"
              onMouseDown={(e) => {
                e.preventDefault();
                onAsignar(p);
                setQuery('');
                setResultados([]);
              }}
            >
              <span className="font-medium">{p.nombre}</span>
              <span className="text-xs text-gray-500">{p.provincia}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DescripcionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'edit' | 'html'>('edit');
  return (
    <div className="mb-2 space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium">Descripción</label>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`rounded px-2 py-1 text-xs ${mode === 'edit' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`rounded px-2 py-1 text-xs ${mode === 'html' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            HTML
          </button>
        </div>
      </div>
      {mode === 'edit' ? (
        <TipTapEditor
          content={value}
          onChange={onChange}
          placeholder="Descripción de la parada (negritas, listas, enlaces...)"
          minHeight="120px"
        />
      ) : (
        <textarea
          className="w-full rounded border px-2 py-1 font-mono text-xs"
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="<p>Texto HTML...</p>"
        />
      )}
    </div>
  );
}

export default function ParadasEditor({ paradas, setParadas }: ParadasEditorProps) {
  const [busqueda, setBusqueda] = useState('');
  const [resultadosPueblos, setResultadosPueblos] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Buscar pueblos (debounced)
  const buscarPueblos = useCallback(async (query: string) => {
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
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarPueblos(busqueda), 250);
    return () => clearTimeout(t);
  }, [busqueda, buscarPueblos]);

  function añadirParada(pueblo?: any) {
    const nuevaParada: Parada = {
      tempId: `parada-${Date.now()}`,
      orden: paradas.length + 1,
      puebloId: pueblo?.id ?? null,
      puebloNombre: pueblo?.nombre ?? '',
      titulo: pueblo?.nombre ?? '',
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
      const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
      const { url, warning } = await uploadImageToR2(file, 'rutas/paradas');
      if (warning) console.warn("[ParadasEditor]", warning);
      if (url) {
        const busted = `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;
        updateParada(tempId, 'fotoUrl', busted);
      }
    } catch (e: any) {
      console.error('Error subiendo foto:', e);
      alert('Error subiendo foto: ' + (e?.message || 'Error desconocido'));
    }
  }

  return (
    <div className="space-y-4">
      {/* Añadir parada: buscar pueblo por nombre */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Añadir parada</label>
        <p className="text-xs text-gray-600">
          Escribe el nombre del pueblo para buscarlo y añadirlo como parada. También puedes añadir una parada vacía (útil para puntos de interés que no sean pueblos).
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Escribe el nombre del pueblo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && resultadosPueblos.length > 0) {
                  e.preventDefault();
                  añadirParada(resultadosPueblos[0]);
                }
              }}
            />
            {buscando && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">Buscando...</span>
            )}
          </div>
          <button
            type="button"
            className="rounded-md border border-dashed px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            onClick={() => añadirParada()}
          >
            + Parada vacía
          </button>
        </div>

        {resultadosPueblos.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-white p-2">
            {resultadosPueblos.map((pueblo) => (
              <button
                key={pueblo.id}
                type="button"
                className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-primary/5"
                onClick={() => añadirParada(pueblo)}
              >
                <span>{pueblo.nombre}</span>
                <span className="text-xs text-gray-500">{pueblo.provincia}</span>
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moverArriba(parada.tempId)}
                    className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={idx === 0}
                    title="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moverAbajo(parada.tempId)}
                    className="rounded border px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={idx === paradas.length - 1}
                    title="Bajar"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarParada(parada.tempId)}
                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Asignar pueblo: búsqueda por nombre (prioritario) */}
              <div className="mb-3">
                <PuebloAsignar
                  parada={parada}
                  onAsignar={(pueblo) => {
                    setParadas(paradas.map((p) =>
                      p.tempId === parada.tempId
                        ? {
                            ...p,
                            puebloId: pueblo.id,
                            puebloNombre: pueblo.nombre,
                            titulo: p.titulo || pueblo.nombre,
                          }
                        : p
                    ));
                  }}
                  onQuitar={() => {
                    setParadas(paradas.map((p) =>
                      p.tempId === parada.tempId
                        ? { ...p, puebloId: null, puebloNombre: '' }
                        : p
                    ));
                  }}
                />
              </div>

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

              {/* Descripción: Editor visual o HTML */}
              <DescripcionEditor
                value={parada.descripcion ?? ''}
                onChange={(v) => updateParada(parada.tempId, 'descripcion', v)}
              />

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
