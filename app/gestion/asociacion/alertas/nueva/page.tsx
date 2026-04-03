'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconAlertTriangle } from '../../_components/asociacion-hero-icons';

const ALERTAS_BACK = '/gestion/asociacion/alertas';
const ALERTAS_BACK_LABEL = 'Volver a Alertas globales';

type EditorMode = 'edit' | 'html' | 'preview';

export default function NuevaAlertaGlobalPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = titulo.trim();
    if (!t) return setError('Título requerido');

    setLoading(true);
    try {
      const res = await fetch('/api/gestion/asociacion/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tipo: 'ALERTA',
          titulo: t,
          contenido,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message ?? 'No se pudo crear');
        return;
      }

      router.push('/gestion/asociacion/alertas');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <GestionAsociacionSubpageShell
      title="Nueva alerta global"
      subtitle="Aviso visible a nivel nacional en la web"
      heroIcon={<AsociacionHeroIconAlertTriangle />}
      maxWidthClass="max-w-3xl"
      backHref={ALERTAS_BACK}
      backLabel={ALERTAS_BACK_LABEL}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold">Título</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold">Contenido</label>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setEditorMode('edit')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-muted text-gray-700 hover:bg-gray-200'}`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('html')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'html' ? 'bg-amber-600 text-white' : 'bg-muted text-gray-700 hover:bg-gray-200'}`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${editorMode === 'preview' ? 'bg-green-600 text-white' : 'bg-muted text-gray-700 hover:bg-gray-200'}`}
            >
              Vista previa
            </button>
          </div>

          {editorMode === 'edit' && (
            <TipTapEditor
              content={contenido}
              onChange={setContenido}
              placeholder="Escribe el contenido de la alerta..."
              minHeight="200px"
            />
          )}
          {editorMode === 'html' && (
            <textarea
              className="w-full rounded-lg border border-border px-4 py-2 font-mono text-sm"
              rows={12}
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="<p>Contenido HTML...</p>"
            />
          )}
          {editorMode === 'preview' && (
            <div className="rounded-lg border border-border bg-white p-6 min-h-[150px]">
              {contenido ? (
                <SafeHtml html={contenido} />
              ) : (
                <p className="text-muted-foreground text-center py-6">Sin contenido</p>
              )}
            </div>
          )}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading} type="submit">
          {loading ? 'Creando…' : 'Crear alerta'}
        </button>
      </form>
    </GestionAsociacionSubpageShell>
  );
}
