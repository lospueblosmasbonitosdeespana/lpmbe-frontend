'use client';

import { useCallback, useEffect, useState } from 'react';
import R2ImageUploader from '@/app/components/R2ImageUploader';

type CampanaKey = 'semana-santa' | 'navidad' | 'noche-romantica';

interface Edicion {
  anio: number;
  activa: boolean;
  editable: boolean;
  cartelUrl?: string | null;
}

interface LandingAdmin {
  pueblo: { id: number; slug: string; nombre: string };
  landing: {
    descripcion: string | null;
    heroImageUrl: string | null;
  } | null;
}

const CAMPAIGN_META: Record<CampanaKey, {
  title: string;
  description: string;
  archiveBaseUrl: (slug: string, anio: number) => string;
  r2Folder: string;
}> = {
  'semana-santa': {
    title: 'Historia y tradición (perenne)',
    description:
      'Este texto describe la tradición de Semana Santa en tu pueblo y se mostrará siempre, incluso cuando la campaña anual esté cerrada. Úsalo para contar la historia, curiosidades y lo que hace especial vuestra Semana Santa.',
    archiveBaseUrl: (slug, anio) => `/planifica/semana-santa/pueblo/${slug}/${anio}`,
    r2Folder: 'semana-santa/landing',
  },
  navidad: {
    title: 'Historia y tradición navideña (perenne)',
    description:
      'Describe la tradición navideña de tu pueblo. Este texto aparece siempre, independiente de la campaña anual: ideal para contar la historia de vuestra Navidad.',
    archiveBaseUrl: (slug, anio) => `/planifica/navidad/pueblo/${slug}/${anio}`,
    r2Folder: 'navidad/landing',
  },
  'noche-romantica': {
    title: 'La Noche Romántica en tu pueblo (perenne)',
    description:
      'Describe por qué tu pueblo es un destino romántico y qué ofrece durante la Noche Romántica. Este texto aparece siempre, independiente de la edición anual.',
    archiveBaseUrl: (slug, anio) =>
      `/noche-romantica/pueblos-participantes/${slug}/${anio}`,
    r2Folder: 'noche-romantica/landing',
  },
};

interface Props {
  campana: CampanaKey;
  puebloId: number | null;
  puebloSlug: string;
}

export default function CampanaLandingEditor({ campana, puebloId, puebloSlug }: Props) {
  const meta = CAMPAIGN_META[campana];
  const [data, setData] = useState<LandingAdmin | null>(null);
  const [ediciones, setEdiciones] = useState<Edicion[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!puebloId) return;
    setLoading(true);
    setError(null);
    try {
      const [landingRes, edicionesRes] = await Promise.all([
        fetch(`/api/admin/${campana}/pueblos/by-pueblo/${puebloId}/landing`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/admin/${campana}/pueblos/by-pueblo/${puebloId}/ediciones`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);
      if (landingRes.ok) {
        const json = (await landingRes.json()) as LandingAdmin;
        setData(json);
        setDescripcion(json.landing?.descripcion ?? '');
        setHeroImageUrl(json.landing?.heroImageUrl ?? null);
      } else if (landingRes.status !== 404) {
        setError('No se pudo cargar el contenido perenne.');
      }
      if (edicionesRes.ok) {
        const list = (await edicionesRes.json()) as Edicion[];
        setEdiciones(list);
      }
    } catch {
      setError('No se pudo cargar el contenido perenne.');
    } finally {
      setLoading(false);
    }
  }, [campana, puebloId]);

  useEffect(() => {
    if (puebloId) void load();
  }, [puebloId, load]);

  const save = async () => {
    if (!puebloId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${campana}/pueblos/by-pueblo/${puebloId}/landing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          descripcion: descripcion.trim() || null,
          heroImageUrl: heroImageUrl || null,
        }),
      });
      if (!res.ok) throw new Error('No se pudo guardar');
      setSuccess('Guardado correctamente');
      setTimeout(() => setSuccess(null), 2500);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!puebloId) return null;

  const edicionesPasadas = ediciones.filter((e) => !e.activa);

  return (
    <section className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50/30 p-5">
      <h2 className="text-lg font-semibold text-emerald-900">{meta.title}</h2>
      <p className="mt-1 text-sm text-emerald-800/80">{meta.description}</p>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Cargando…</p>
      ) : (
        <div className="mt-4 grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción perenne</label>
            <textarea
              rows={6}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
              placeholder="Escribe aquí la historia y tradición de tu pueblo..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Máx. 10.000 caracteres. Se traducirá automáticamente a otros idiomas.
            </p>
          </div>

          <R2ImageUploader
            label="Imagen perenne (opcional)"
            value={heroImageUrl}
            onChange={setHeroImageUrl}
            folder={meta.r2Folder}
            previewHeight="h-40"
          />

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="w-fit rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar contenido perenne'}
          </button>
        </div>
      )}

      {edicionesPasadas.length > 0 && (
        <div className="mt-6 rounded-md border border-emerald-200 bg-white p-4">
          <h3 className="text-sm font-semibold">Ediciones anteriores publicadas</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Estas ediciones históricas están congeladas y son visibles en la web como archivo
            SEO. No se pueden editar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {edicionesPasadas.map((e) => (
              <a
                key={e.anio}
                href={meta.archiveBaseUrl(puebloSlug, e.anio)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                Ver {e.anio}
                <span className="text-[10px] opacity-60">↗</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
