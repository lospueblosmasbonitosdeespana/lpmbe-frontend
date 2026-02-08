'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ParadasEditor from './ParadasEditor';
import ConvertidorTexto from './ConvertidorTexto';
import { sanitizeRutaDescripcionForTextarea, stripLegacyStops } from '@/lib/rutaHelpers';

// Helper para generar slug automático
function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

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

type RutaFormProps = {
  rutaId?: number;
  initialData?: {
    titulo?: string;
    slug?: string;
    fotoPortada?: string;
    foto_portada?: string; // snake_case del backend
    descripcionLarga?: string;
    descripcion?: string; // legacy
    boldestMapSlug?: string;
    distanciaKm?: number;
    distancia?: number; // legacy
    tiempoEstimado?: number;
    tiempo?: number; // legacy
    dificultad?: string;
    tipo?: string;
    programa?: string;
    activo?: boolean;
    paradas?: Array<{
      id: number;
      orden: number;
      puebloId: number;
      puebloNombre?: string;
      titulo?: string;
      descripcion?: string;
      fotoUrl?: string;
      lat?: number | null;
      lng?: number | null;
    }>;
  };
};

export default function RutaForm({ rutaId, initialData }: RutaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Control de slug automático
  const [slugTocado, setSlugTocado] = useState(false);

  // Campos básicos - con fallbacks para diferentes formatos del backend
  const [titulo, setTitulo] = useState(initialData?.titulo ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [fotoPortada, setFotoPortada] = useState(
    initialData?.fotoPortada ?? initialData?.foto_portada ?? ''
  );
  
  // Descripción: limpiar HTML para textarea
  const descripcionRaw = initialData?.descripcionLarga ?? initialData?.descripcion ?? '';
  const [descripcionLarga, setDescripcionLarga] = useState(
    sanitizeRutaDescripcionForTextarea(descripcionRaw)
  );
  
  const [boldestMapSlug, setBoldestMapSlug] = useState(initialData?.boldestMapSlug ?? '');
  const [distanciaKm, setDistanciaKm] = useState<string>(
    String((initialData as any)?.distanciaKm ?? (initialData as any)?.distancia_km ?? '')
  );
  const [tiempoEstimado, setTiempoEstimado] = useState<string>(
    String((initialData as any)?.tiempoEstimado ?? (initialData as any)?.tiempo_estimado ?? '')
  );
  const [dificultad, setDificultad] = useState(initialData?.dificultad ?? '');
  const [tipo, setTipo] = useState<string>(String(initialData?.tipo ?? ''));
  const [programa, setPrograma] = useState(initialData?.programa ?? '');
  const [activo, setActivo] = useState(initialData?.activo ?? true);
  const [logoId, setLogoId] = useState<number | null>(
    (initialData as any)?.logoId ?? (initialData as any)?.logo?.id ?? null
  );
  const [logos, setLogos] = useState<{ id: number; nombre: string; url: string }[]>([]);
  
  // Actualizar descripción si cambia initialData (para evitar loops)
  useEffect(() => {
    if (initialData) {
      const desc = initialData?.descripcionLarga ?? initialData?.descripcion ?? '';
      if (desc) {
        setDescripcionLarga(sanitizeRutaDescripcionForTextarea(desc));
      }
    }
  }, [initialData?.descripcionLarga, initialData?.descripcion]);
  
  useEffect(() => {
    fetch('/api/admin/logos', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setLogos(data))
      .catch(() => setLogos([]));
  }, []);

  // En modo editar, marcar slug como tocado para no sobrescribirlo
  useEffect(() => {
    const initialId = (initialData as any)?.id;
    if (rutaId || initialId) {
      setSlugTocado(true);
    }
  }, [rutaId, initialData]);

  // Paradas - con fallbacks para diferentes formatos del backend (pueblos = RutaPueblo[])
  const rawStopsRaw = (initialData as any)?.pueblos ?? 
                      (initialData as any)?.rutaPueblos ?? 
                      (initialData as any)?.ruta_pueblos ?? 
                      initialData?.paradas ?? 
                      [];
  const rawStops = Array.isArray(rawStopsRaw) ? rawStopsRaw : [];
  
  const [paradas, setParadas] = useState<Parada[]>(
    rawStops
      .map((rp: any, idx: number) => ({
        tempId: `parada-${rp.puebloId ?? rp.pueblo?.id ?? idx}`,
        orden: rp.orden ?? idx + 1,
        puebloId: rp.puebloId ?? rp.pueblo?.id ?? null,
        puebloNombre: rp.puebloNombre ?? rp.pueblo?.nombre ?? '',
        titulo: rp.titulo ?? '',
        descripcion: rp.descripcion ?? '',
        fotoUrl: rp.fotoUrl ?? '',
        lat: rp.lat ?? null,
        lng: rp.lng ?? null,
      }))
      .sort((a: Parada, b: Parada) => a.orden - b.orden)
  );
  
  // Actualizar paradas si cambia initialData
  useEffect(() => {
    const rawStopsUpdatedRaw = (initialData as any)?.pueblos ?? 
                               (initialData as any)?.rutaPueblos ?? 
                               (initialData as any)?.ruta_pueblos ?? 
                               initialData?.paradas ?? 
                               [];
    const rawStopsUpdated = Array.isArray(rawStopsUpdatedRaw) ? rawStopsUpdatedRaw : [];
    
    setParadas(
      rawStopsUpdated.length > 0
        ? rawStopsUpdated
            .map((rp: any, idx: number) => ({
              tempId: `parada-${rp.puebloId ?? rp.pueblo?.id ?? idx}`,
              orden: rp.orden ?? idx + 1,
              puebloId: rp.puebloId ?? rp.pueblo?.id ?? null,
              puebloNombre: rp.puebloNombre ?? rp.pueblo?.nombre ?? '',
              titulo: rp.titulo ?? '',
              descripcion: rp.descripcion ?? '',
              fotoUrl: rp.fotoUrl ?? '',
              lat: rp.lat ?? null,
              lng: rp.lng ?? null,
            }))
            .sort((a: Parada, b: Parada) => a.orden - b.orden)
        : []
    );
  }, [
    (initialData as any)?.pueblos,
    (initialData as any)?.rutaPueblos,
    (initialData as any)?.ruta_pueblos,
    initialData?.paradas
  ]);

  // Upload foto portada
  const [uploadingPortada, setUploadingPortada] = useState(false);

  async function handleUploadPortada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPortada(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Error subiendo foto');
      }

      const data = await res.json();
      if (data.url) {
        setFotoPortada(data.url);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error subiendo foto');
    } finally {
      setUploadingPortada(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!titulo.trim()) {
      setError('El título es requerido');
      return;
    }
    if (!slug.trim()) {
      setError('El slug es requerido');
      return;
    }

    setLoading(true);
    try {
      // 1. Construir payload limpio (solo campos con valor)
      const rutaPayload: any = {
        titulo: titulo.trim(),
        slug: slug.trim(),
        activo,
      };

      // Solo añadir campos si tienen valor
      if (fotoPortada.trim()) {
        rutaPayload.fotoPortada = fotoPortada.trim();
      }
      if (descripcionLarga.trim()) {
        rutaPayload.descripcion = descripcionLarga.trim(); // Backend espera "descripcion"
      }
      if (boldestMapSlug.trim()) {
        rutaPayload.boldestMapSlug = boldestMapSlug.trim();
      }
      const dk = distanciaKm.trim();
      if (dk) {
        const n = Number(dk.replace(',', '.'));
        if (!Number.isNaN(n)) {
          rutaPayload.distanciaKm = n;
        }
      }
      if (tiempoEstimado.trim()) {
        rutaPayload.tiempoEstimado = tiempoEstimado.trim();
      }
      if (dificultad.trim()) {
        rutaPayload.dificultad = dificultad.trim();
      }
      if (tipo.trim()) {
        rutaPayload.tipo = tipo.trim();
      }
      if (programa.trim()) {
        rutaPayload.programa = programa.trim();
      }
      if (logoId !== null && logoId > 0) {
        rutaPayload.logoId = logoId;
      } else {
        rutaPayload.logoId = null;
      }

      const method = rutaId ? 'PUT' : 'POST';
      const url = rutaId
        ? `/api/gestion/asociacion/rutas/${rutaId}`
        : '/api/gestion/asociacion/rutas';

      console.log('[RUTAS] Guardando ruta:', rutaPayload);

      const resRuta = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rutaPayload),
      });

      if (!resRuta.ok) {
        const text = await resRuta.text();
        console.error('[RUTAS] Error guardando ruta (raw):', text);
        
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {
          // No es JSON, usar texto directo
        }
        
        const errorMsg = data?.message || text || `Error ${resRuta.status}`;
        throw new Error(errorMsg);
      }

      const savedRuta = await resRuta.json();
      const savedRutaId = savedRuta.id ?? rutaId;

      console.log('[RUTAS] Ruta guardada:', savedRuta);

      // 2. Guardar paradas
      if (paradas.length > 0) {
        // Validar que todas tengan puebloId
        const sinPueblo = paradas.filter(p => !p.puebloId);
        if (sinPueblo.length > 0) {
          throw new Error(`Hay ${sinPueblo.length} parada(s) sin pueblo asignado. Corrígelas antes de guardar.`);
        }

        // Construir payload con wrapper { pueblos: [...] }
        const pueblos = paradas
          .filter(p => p.puebloId) // asegurar puebloId
          .map((p, idx) => ({
            puebloId: Number(p.puebloId),
            orden: Number(p.orden ?? (idx + 1)),
            titulo: p.titulo?.trim() || null,
            descripcion: p.descripcion?.trim() || null,
            fotoUrl: p.fotoUrl?.trim() || null,
            lat: p.lat ?? null,
            lng: p.lng ?? null,
          }));

        const payload = { pueblos }; // ✅ wrapper correcto

        console.log('[RUTAS] Guardando paradas:', payload);

        const resParadas = await fetch(
          `/api/gestion/asociacion/rutas/${savedRutaId}/paradas`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload), // ✅ con wrapper
          }
        );

        console.log('[RUTAS] Respuesta paradas:', resParadas.status);

        if (!resParadas.ok) {
          const text = await resParadas.text();
          console.error('[RUTAS] Error guardando paradas (raw):', text);
          
          let data: any = {};
          try {
            data = JSON.parse(text);
          } catch {
            // No es JSON
          }
          
          const errorMsg = data?.message || text || 'Error guardando paradas';
          throw new Error(errorMsg);
        }
      }

      router.replace('/gestion/asociacion/rutas');
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">
        {rutaId ? 'Editar Ruta' : 'Nueva Ruta'}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Título */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Título *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => {
              const v = e.target.value;
              setTitulo(v);
              // Auto-generar slug solo si no ha sido tocado manualmente
              if (!slugTocado) {
                setSlug(slugify(v));
              }
            }}
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Slug *</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={slug}
            onChange={(e) => {
              setSlugTocado(true);
              setSlug(e.target.value);
            }}
            required
          />
          <p className="text-xs text-gray-500">
            Se genera automáticamente desde el título. Puedes editarlo manualmente.
          </p>
        </div>

        {/* Paradas (Pueblos) - visible de inmediato al editar */}
        <div className="rounded-md border border-amber-200 bg-amber-50/50 p-4">
          <h2 className="mb-4 text-lg font-semibold">Pueblos de la ruta</h2>
          
          <ConvertidorTexto
            onConvertir={(nuevasParadas) => {
              setParadas([...paradas, ...nuevasParadas]);
            }}
          />
          
          <div className="my-6 border-t border-amber-200" />
          
          <ParadasEditor paradas={paradas} setParadas={setParadas} />
        </div>

        {/* Foto Portada */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Foto Portada</label>
          
          {fotoPortada && (
            <div className="relative inline-block">
              <img
                src={fotoPortada}
                alt="Portada"
                className="h-32 w-auto rounded border"
              />
              <button
                type="button"
                onClick={() => setFotoPortada('')}
                className="absolute -right-2 -top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          )}
          
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadPortada}
              disabled={uploadingPortada}
              className="block text-sm"
            />
            {uploadingPortada && <p className="text-xs text-gray-500">Subiendo...</p>}
          </div>
        </div>

        {/* Descripción Larga */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Descripción</label>
            {descripcionLarga.includes('¡Empezamos!') && (
              <button
                type="button"
                onClick={() => setDescripcionLarga(stripLegacyStops(descripcionLarga))}
                className="text-xs text-blue-600 hover:underline"
              >
                Eliminar bloque de paradas del texto
              </button>
            )}
          </div>
          <textarea
            className="w-full rounded-md border px-3 py-2"
            rows={8}
            value={descripcionLarga}
            onChange={(e) => setDescripcionLarga(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            El texto se ha limpiado de HTML. Si ves "¡Empezamos!" puedes eliminar el bloque
            numerado con el botón de arriba.
          </p>
        </div>

        {/* Logo de la ruta */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Logo de la ruta</label>
          {logos.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay logos disponibles.{' '}
              <a href="/gestion/asociacion/logos" className="text-primary hover:underline">
                Añade logos en la biblioteca
              </a>
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {/* Opción sin logo */}
              <button
                type="button"
                onClick={() => setLogoId(null)}
                className={`flex flex-col items-center rounded-lg border-2 p-2 transition ${
                  logoId === null
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-gray-400'
                }`}
              >
                <div className="flex h-12 w-full items-center justify-center text-gray-400 text-sm">
                  —
                </div>
                <span className="mt-1 text-[10px] font-medium">Sin logo</span>
              </button>
              {logos.map((l) => {
                const isSelected = logoId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLogoId(l.id)}
                    className={`flex flex-col items-center rounded-lg border-2 p-2 transition ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-gray-400'
                    }`}
                  >
                    <div className="flex h-12 w-full items-center justify-center">
                      <img src={l.url} alt={l.nombre} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="mt-1 text-[10px] font-medium text-center leading-tight">{l.nombre}</span>
                    {isSelected && (
                      <span className="text-[10px] font-semibold text-primary">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Se muestra a la derecha del título. Gestiona logos en{' '}
            <a href="/gestion/asociacion/logos" className="text-primary hover:underline">
              Biblioteca de logos
            </a>
          </p>
        </div>

        {/* Boldest Map Slug */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Boldest Map Slug</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={boldestMapSlug}
            onChange={(e) => setBoldestMapSlug(e.target.value)}
            placeholder="ej: ruta-de-los-pueblos-mas-bonitos"
          />
        </div>

        {/* Metadatos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Distancia (km)</label>
            <input
              type="number"
              step="0.1"
              className="w-full rounded-md border px-3 py-2"
              value={distanciaKm}
              onChange={(e) => setDistanciaKm(String(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Tiempo estimado (h)</label>
            <input
              type="number"
              step="0.5"
              className="w-full rounded-md border px-3 py-2"
              value={tiempoEstimado}
              onChange={(e) => setTiempoEstimado(String(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Dificultad</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={dificultad}
            onChange={(e) => setDificultad(e.target.value)}
            placeholder="ej: Fácil, Media, Difícil"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Tipo</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={tipo}
            onChange={(e) => setTipo(String(e.target.value))}
            placeholder="ej: Circular, Lineal"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Programa</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={programa}
            onChange={(e) => setPrograma(e.target.value)}
            placeholder="ej: Ruta Historica, Ruta del Bosque"
          />
        </div>

        {/* Activo */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="activo"
            checked={activo}
            onChange={(e) => setActivo(e.target.checked)}
          />
          <label htmlFor="activo" className="text-sm">
            Ruta activa (visible públicamente)
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Guardando...' : rutaId ? 'Actualizar' : 'Crear'}
          </button>
          <Link
            href="/gestion/asociacion/rutas"
            className="rounded-md border px-4 py-2 hover:underline"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}
