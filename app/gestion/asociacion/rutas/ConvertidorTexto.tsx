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

type ParadaPreview = {
  orden: number;
  nombreDetectado: string;
  descripcionDetectada: string;
  puebloId: number | null;
  puebloNombre: string | null;
  matchStatus: 'exact' | 'partial' | 'none';
};

type ConvertidorTextoProps = {
  onConvertir: (paradas: Parada[]) => void;
};

export default function ConvertidorTexto({ onConvertir }: ConvertidorTextoProps) {
  const [texto, setTexto] = useState('');
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParadaPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  async function handleGenerarPreview() {
    if (!texto.trim()) {
      setError('Por favor, pega el texto de la ruta');
      return;
    }

    setConvirtiendo(true);
    setError(null);
    setPreview([]);

    try {
      // 1. Obtener todos los pueblos
      const resPueblos = await fetch('/api/pueblos', { cache: 'no-store' });
      if (!resPueblos.ok) throw new Error('Error cargando pueblos');
      const pueblos = await resPueblos.json();

      // 2. Parser: detectar paradas numeradas
      const paradasDetectadas = parsearParadas(texto);
      
      if (paradasDetectadas.length === 0) {
        throw new Error('No se detectaron paradas en el formato "1. Nombre..."');
      }

      // 3. Resolver puebloId para cada parada
      const paradasConMatch: ParadaPreview[] = paradasDetectadas.map((p) => {
        const match = buscarPueblo(pueblos, p.nombreDetectado);
        return {
          ...p,
          puebloId: match?.id ?? null,
          puebloNombre: match?.nombre ?? null,
          matchStatus: match ? (match.exact ? 'exact' : 'partial') : 'none',
        };
      });

      setPreview(paradasConMatch);
      setShowPreview(true);
    } catch (e: any) {
      setError(e?.message ?? 'Error generando preview');
    } finally {
      setConvirtiendo(false);
    }
  }

  function handleConfirmarParadas() {
    // Verificar que todas tengan pueblo asignado
    const sinPueblo = preview.filter((p) => !p.puebloId);
    if (sinPueblo.length > 0) {
      setError(`Hay ${sinPueblo.length} parada(s) sin pueblo asignado. Corrígelas antes de confirmar.`);
      return;
    }

    // Convertir preview a Paradas
    const paradas: Parada[] = preview.map((p) => ({
      tempId: `parada-${Date.now()}-${p.orden}`,
      orden: p.orden,
      puebloId: p.puebloId!,
      puebloNombre: p.puebloNombre!,
      titulo: p.nombreDetectado,
      descripcion: p.descripcionDetectada,
      fotoUrl: '',
      lat: null,
      lng: null,
    }));

    onConvertir(paradas);
    setTexto('');
    setPreview([]);
    setShowPreview(false);
  }

  function parsearParadas(texto: string): Array<{ orden: number; nombreDetectado: string; descripcionDetectada: string }> {
    const paradas: Array<{ orden: number; nombreDetectado: string; descripcionDetectada: string }> = [];
    
    // Detectar todas las paradas con regex
    // Formato: "1. Nombre" o "1) Nombre" seguido de contenido hasta siguiente número o fin
    // Nota: sin flag 's' (dotAll) por compatibilidad TS
    const regex = /(?:^|\n)\s*(\d+)[.\)]\s*([\s\S]+?)(?=\n\s*\d+[.\)]|\n\s*TIPS|\n\s*CONOCE\s+M[ÁA]S|$)/gi;
    
    let match;
    while ((match = regex.exec(texto)) !== null) {
      const orden = parseInt(match[1], 10);
      let contenido = match[2].trim();
      
      // Separar nombre (primera línea) y descripción (resto)
      const lineas = contenido.split('\n').map(l => l.trim()).filter(l => l);
      
      if (lineas.length === 0) continue;
      
      // Primera línea es el nombre
      let nombre = lineas[0];
      
      // Limpiar "Saber más" del nombre si está pegado
      nombre = nombre.replace(/\s*Saber m[aá]s\s*$/gi, '').trim();
      
      // Resto son descripción
      let descripcion = lineas.slice(1).join('\n');
      
      // Limpiar "Saber más" de la descripción
      descripcion = descripcion.replace(/(\s*)Saber m[aá]s(\s*)/gi, '\n').trim();
      
      paradas.push({
        orden,
        nombreDetectado: nombre,
        descripcionDetectada: descripcion,
      });
    }
    
    return paradas;
  }

  function buscarPueblo(pueblos: any[], nombreDetectado: string): { id: number; nombre: string; exact: boolean } | null {
    const normalizado = normalizar(nombreDetectado);
    
    // Intentar match exacto
    let match = pueblos.find((p) => normalizar(p.nombre) === normalizado);
    if (match) return { id: match.id, nombre: match.nombre, exact: true };
    
    // Si tiene "–" o "-", probar con ambas partes
    const separadores = [' – ', ' - ', '–', '-'];
    for (const sep of separadores) {
      if (nombreDetectado.includes(sep)) {
        const partes = nombreDetectado.split(sep).map((s) => s.trim());
        for (const parte of partes) {
          const parteNorm = normalizar(parte);
          match = pueblos.find((p) => normalizar(p.nombre) === parteNorm);
          if (match) return { id: match.id, nombre: match.nombre, exact: false };
        }
      }
    }
    
    // Intentar match parcial (contains)
    match = pueblos.find((p) => normalizar(p.nombre).includes(normalizado));
    if (match) return { id: match.id, nombre: match.nombre, exact: false };
    
    // Invertir: buscar si el nombre detectado contiene el pueblo
    match = pueblos.find((p) => normalizado.includes(normalizar(p.nombre)));
    if (match) return { id: match.id, nombre: match.nombre, exact: false };
    
    return null;
  }

  function normalizar(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quitar tildes
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (showPreview && preview.length > 0) {
    const sinPueblo = preview.filter((p) => !p.puebloId).length;
    const matchesParciales = preview.filter((p) => p.matchStatus === 'partial').length;
    
    return (
      <div className="rounded-md border bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold">Preview de paradas detectadas</h3>
        
        {/* Estadísticas */}
        <div className="mb-4 flex gap-2 text-xs">
          <span className="rounded bg-green-100 px-2 py-1 text-green-700">
            {preview.length - sinPueblo} con pueblo
          </span>
          {matchesParciales > 0 && (
            <span className="rounded bg-yellow-100 px-2 py-1 text-yellow-700">
              {matchesParciales} parciales
            </span>
          )}
          {sinPueblo > 0 && (
            <span className="rounded bg-red-100 px-2 py-1 text-red-700">
              {sinPueblo} sin pueblo
            </span>
          )}
        </div>

        {/* Lista de paradas */}
        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
          {preview.map((p) => (
            <div
              key={p.orden}
              className={`rounded border p-3 ${
                !p.puebloId
                  ? 'border-red-300 bg-red-50'
                  : p.matchStatus === 'partial'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {p.orden}
                </span>
                <div className="flex-1 text-xs">
                  <div className="font-semibold">{p.nombreDetectado}</div>
                  {p.puebloId ? (
                    <div className="mt-1 text-green-700">
                      ✓ {p.puebloNombre} {p.matchStatus === 'partial' && '(match parcial)'}
                    </div>
                  ) : (
                    <div className="mt-1 text-red-700">✗ Pueblo no encontrado</div>
                  )}
                  {p.descripcionDetectada && (
                    <div className="mt-1 text-gray-600 line-clamp-2">
                      {p.descripcionDetectada}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

        {/* Botones */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirmarParadas}
            disabled={sinPueblo > 0}
            className="rounded-md bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:bg-gray-400"
          >
            Confirmar y añadir ({preview.length} paradas)
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPreview(false);
              setPreview([]);
            }}
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
          >
            Cancelar
          </button>
        </div>

        {sinPueblo > 0 && (
          <p className="mt-2 text-xs text-red-600">
            ⚠️ No se puede confirmar: hay paradas sin pueblo asignado. Ajusta el texto y
            vuelve a intentar.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-gray-50 p-4">
      <h3 className="mb-2 text-sm font-semibold">Generar paradas desde descripción</h3>
      <p className="mb-3 text-xs text-gray-600">
        Pega aquí el texto con formato &quot;1. Pueblo nombre ...&quot; y se detectarán
        automáticamente las paradas con match de pueblos.
      </p>

      <textarea
        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
        rows={8}
        placeholder="1. Ujué – Uxue&#10;Descripción...&#10;&#10;2. Roncal – Erronkari&#10;Más texto..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleGenerarPreview}
        disabled={convirtiendo || !texto.trim()}
        className="mt-3 rounded-md border bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {convirtiendo ? 'Analizando...' : 'Generar preview'}
      </button>

      <p className="mt-2 text-xs text-gray-500">
        Nota: Se hará un match automático con los pueblos. Podrás revisar antes de
        confirmar.
      </p>
    </div>
  );
}
