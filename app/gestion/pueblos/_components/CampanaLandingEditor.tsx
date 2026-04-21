'use client';

import { useCallback, useEffect, useState } from 'react';
import R2ImageUploader from '@/app/components/R2ImageUploader';

type CampanaKey = 'semana-santa' | 'navidad' | 'noche-romantica';

interface Edicion {
  id: number;
  anio: number;
  activo: boolean;
  editable: boolean;
  cartelHorizontalUrl?: string | null;
  cartelVerticalUrl?: string | null;
  updatedAt?: string;
  _count?: { agenda: number; dias: number };
}

interface EdicionesResponse {
  activeAnio: number;
  ediciones: Edicion[];
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
  const [activeAnio, setActiveAnio] = useState<number | null>(null);
  const [userRol, setUserRol] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneDestino, setCloneDestino] = useState<string>('');
  const [cloneOrigen, setCloneOrigen] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!puebloId) return;
    setLoading(true);
    setError(null);
    try {
      const [landingRes, edicionesRes, meRes] = await Promise.all([
        fetch(`/api/admin/${campana}/pueblos/by-pueblo/${puebloId}/landing`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(`/api/admin/${campana}/pueblos/by-pueblo/${puebloId}/ediciones`, {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }),
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
        const body = (await edicionesRes.json()) as EdicionesResponse | Edicion[];
        if (Array.isArray(body)) {
          setEdiciones(body);
          setActiveAnio(null);
        } else {
          setEdiciones(body.ediciones ?? []);
          setActiveAnio(body.activeAnio);
          setCloneDestino(String((body.activeAnio ?? new Date().getFullYear()) + 1));
        }
      }
      if (meRes.ok) {
        const me = await meRes.json();
        setUserRol(me?.rol ?? null);
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

  const clonar = async (anioOrigen: number) => {
    if (!puebloId) return;
    const destino = Number(cloneDestino);
    if (!Number.isInteger(destino) || destino < 2000 || destino > 2100) {
      setError('Año destino inválido');
      return;
    }
    if (destino === anioOrigen) {
      setError('El año destino debe ser distinto del origen');
      return;
    }
    if (ediciones.some((e) => e.anio === destino)) {
      setError(`Ya existe una edición ${destino}. Elige otro año o borra la existente.`);
      return;
    }
    const confirmar = window.confirm(
      `¿Clonar la edición ${anioOrigen} a ${destino}? Se copiarán los datos del pueblo, agenda y días. Podrás editarla después.`,
    );
    if (!confirmar) return;
    setCloning(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/${campana}/pueblos/by-pueblo/${puebloId}/ediciones/${destino}/clonar-desde/${anioOrigen}`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo clonar la edición');
      }
      setSuccess(`Edición ${destino} creada a partir de ${anioOrigen}`);
      setTimeout(() => setSuccess(null), 3500);
      setCloneOrigen(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo clonar la edición');
    } finally {
      setCloning(false);
    }
  };

  if (!puebloId) return null;

  const isAdmin = userRol === 'ADMIN';
  const edicionesOrdenadas = [...ediciones].sort((a, b) => b.anio - a.anio);

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

      {!loading && edicionesOrdenadas.length > 0 && (
        <div className="mt-6 rounded-md border border-emerald-200 bg-white p-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-sm font-semibold">Ediciones</h3>
            {activeAnio != null && (
              <span className="text-xs text-muted-foreground">
                Año activo: <strong>{activeAnio}</strong>
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Cada edición es un snapshot anual. Las anteriores quedan congeladas como archivo SEO
            y solo un administrador puede crear nuevas ediciones clonando años anteriores.
          </p>

          {isAdmin && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-dashed border-emerald-300 bg-emerald-50/50 p-2 text-xs">
              <span className="font-medium">Clonar a año destino:</span>
              <input
                type="number"
                min={2000}
                max={2100}
                value={cloneDestino}
                onChange={(e) => setCloneDestino(e.target.value)}
                className="w-24 rounded border bg-white px-2 py-1 text-xs"
              />
              <span className="text-muted-foreground">
                (selecciona debajo desde qué año clonar)
              </span>
            </div>
          )}

          <div className="mt-3 divide-y divide-border rounded border">
            {edicionesOrdenadas.map((e) => {
              const isActive = activeAnio != null && e.anio === activeAnio;
              const cartel = e.cartelHorizontalUrl || e.cartelVerticalUrl;
              return (
                <div
                  key={e.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {cartel && (
                      <img
                        src={cartel}
                        alt=""
                        className="h-12 w-12 rounded object-cover"
                        loading="lazy"
                      />
                    )}
                    <div>
                      <div className="font-semibold text-sm">
                        {e.anio}{' '}
                        {isActive ? (
                          <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                            activa
                          </span>
                        ) : (
                          <span className="ml-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            archivo
                          </span>
                        )}
                      </div>
                      {e._count && (
                        <div className="text-[10px] text-muted-foreground">
                          {e._count.dias} días · {e._count.agenda} actos
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={meta.archiveBaseUrl(puebloSlug, e.anio)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-border bg-background px-3 py-1 font-medium hover:bg-accent"
                    >
                      Ver ↗
                    </a>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => clonar(e.anio)}
                        disabled={cloning}
                        className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {cloning && cloneOrigen === e.anio
                          ? 'Clonando…'
                          : `Clonar → ${cloneDestino || '?'}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
