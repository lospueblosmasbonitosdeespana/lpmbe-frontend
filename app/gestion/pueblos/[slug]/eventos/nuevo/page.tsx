'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';

type EditorMode = 'edit' | 'html' | 'preview';

export default function NuevoEventoPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || '';
  const router = useRouter();
  const [rol, setRol] = useState<string | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [ocultoEnPlanifica, setOcultoEnPlanifica] = useState(false);
  const [incluidoEnClub, setIncluidoEnClub] = useState(false);
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [puntosCustom, setPuntosCustom] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((me) => me?.rol && setRol(me.rol))
      .catch(() => {});
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) {
      setError('Título requerido');
      return;
    }

    setLoading(true);
    try {
      let imagen: string | null = null;

      if (file) {
        try {
          const { uploadImageToR2 } = await import("@/src/lib/uploadHelper");
          const { url, warning } = await uploadImageToR2(file, 'eventos-pueblo', '/api/media/upload');
          if (warning) console.warn("[Eventos pueblo]", warning);
          imagen = url;
        } catch (e: any) {
          setError(`Error subiendo foto: ${e?.message || 'Error desconocido'}`);
          setLoading(false);
          return;
        }
      }

      const latNum = lat.trim() ? Number(lat) : null;
      const lngNum = lng.trim() ? Number(lng) : null;
      const puntosNum = puntosCustom.trim() ? Math.max(0, Math.floor(Number(puntosCustom))) : null;

      const res = await fetch('/api/gestion/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          puebloSlug: slug,
          titulo: t,
          descripcion: descripcion.trim() || '',
          fecha_inicio: fechaInicio || null,
          fecha_fin: fechaFin || null,
          ...(imagen && { imagen }),
          ...(rol === 'ADMIN' && { ocultoEnPlanificaFinDeSemana: ocultoEnPlanifica }),
          incluidoEnClub,
          ...(incluidoEnClub && latNum != null && Number.isFinite(latNum) && { lat: latNum }),
          ...(incluidoEnClub && lngNum != null && Number.isFinite(lngNum) && { lng: lngNum }),
          ...(incluidoEnClub && rol === 'ADMIN' && puntosNum != null && Number.isFinite(puntosNum) && {
            puntosCustom: puntosNum,
          }),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear el evento');
        return;
      }

      router.replace(`/gestion/pueblos/${slug}/eventos`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Nuevo evento</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pueblo: <strong>{slug}</strong>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm">Título</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Descripción</label>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-muted text-gray-700 hover:bg-gray-200'}`}>
              Editor
            </button>
            <button type="button" onClick={() => setEditorMode('html')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'html' ? 'bg-amber-600 text-white' : 'bg-muted text-gray-700 hover:bg-gray-200'}`}>
              HTML
            </button>
            <button type="button" onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'preview' ? 'bg-green-600 text-white' : 'bg-muted text-gray-700 hover:bg-gray-200'}`}>
              Vista previa
            </button>
            {uploading && <span className="text-sm text-muted-foreground self-center">Subiendo…</span>}
          </div>
          {editorMode === 'edit' && (
            <TipTapEditor content={descripcion} onChange={setDescripcion}
              onUploadImage={async (f) => { setUploading(true); try { const { uploadImageToR2 } = await import('@/src/lib/uploadHelper'); const { url } = await uploadImageToR2(f, 'eventos-pueblo', '/api/media/upload'); return url; } finally { setUploading(false); } }}
              placeholder="Describe el evento..." minHeight="250px" />
          )}
          {editorMode === 'html' && (
            <textarea className="w-full rounded-lg border border-border px-4 py-2 font-mono text-sm"
              rows={10} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="<p>Descripción HTML...</p>" />
          )}
          {editorMode === 'preview' && (
            <div className="rounded-lg border border-border bg-white p-6 min-h-[150px]">
              {descripcion ? <SafeHtml html={descripcion} /> : <p className="text-muted-foreground text-center py-8">Sin descripción</p>}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Imagen (opcional)</label>
          <input
            type="file"
            accept="image/*"
            className="w-full rounded-md border px-3 py-2"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {rol === 'ADMIN' && (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <input
              type="checkbox"
              id="ocultoPlanifica"
              checked={ocultoEnPlanifica}
              onChange={(e) => setOcultoEnPlanifica(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="ocultoPlanifica" className="text-sm">
              Ocultar en &quot;Planifica tu fin de semana&quot; (solo este evento; seguirá en actualidad y notificaciones)
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm">Fecha inicio</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Fecha fin</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-4 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/20">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={incluidoEnClub}
              onChange={(e) => setIncluidoEnClub(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-fuchsia-400"
            />
            <div className="flex-1">
              <div className="font-semibold text-fuchsia-900 dark:text-fuchsia-200">
                Incluir en el Club de Amigos
              </div>
              <p className="mt-1 text-xs text-fuchsia-900/80 dark:text-fuchsia-300/80">
                Si activas esta casilla, el evento se promocionará dentro del Club de Amigos
                y los socios podrán validar su asistencia escaneando un código QR
                con la app de LPMBE. Recibirán puntos por su asistencia.
              </p>
              <p className="mt-1 text-xs text-fuchsia-900/70 dark:text-fuchsia-300/70">
                <strong>Importante:</strong> al guardar el evento se generará un código QR
                único que tendrás que mostrar el día del evento (impreso o en pantalla)
                para que los socios lo escaneen con su app.
              </p>
            </div>
          </label>

          {incluidoEnClub && (
            <div className="mt-4 space-y-3 border-t border-fuchsia-200 pt-3 dark:border-fuchsia-900/50">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-fuchsia-900 dark:text-fuchsia-200">
                    Latitud (opcional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                    placeholder="42.42"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fuchsia-900 dark:text-fuchsia-200">
                    Longitud (opcional)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                    placeholder="-2.84"
                  />
                </div>
              </div>
              <p className="text-[11px] text-fuchsia-900/70 dark:text-fuchsia-300/70">
                Coordenadas opcionales del lugar del evento. Si las rellenas, los socios
                podrán validar también por geolocalización (estando físicamente cerca)
                como alternativa al QR. Útil si esperas mucha afluencia.
              </p>
              {rol === 'ADMIN' && (
                <div>
                  <label className="block text-xs font-medium text-fuchsia-900 dark:text-fuchsia-200">
                    Puntos personalizados (opcional · solo admin)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={puntosCustom}
                    onChange={(e) => setPuntosCustom(e.target.value)}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm font-mono"
                    placeholder="Vacío = usar genérico (10)"
                  />
                  <p className="mt-1 text-[11px] text-fuchsia-900/70 dark:text-fuchsia-300/70">
                    Si dejas vacío, se aplica la regla genérica EVENTO_PUEBLO_QR
                    (10 puntos). Edita la regla genérica desde Gamificación de la asociación.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="rounded-md border px-3 py-2" disabled={loading} type="submit">
          {loading ? 'Creando…' : 'Crear'}
        </button>
      </form>
    </main>
  );
}





