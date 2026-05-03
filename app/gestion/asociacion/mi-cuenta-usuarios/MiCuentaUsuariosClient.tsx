'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Upload, X, Trash2, Save } from 'lucide-react';
import {
  NIVEL_SLOTS,
  type MiCuentaAssets,
} from '@/app/mi-cuenta/components/miCuentaAssets';

type ClubSlot = { key: 'clubLogo' | 'clubLogoCard'; label: string; description: string };

const CLUB_SLOTS: ClubSlot[] = [
  {
    key: 'clubLogo',
    label: 'Logo del Club (cabecera de Mi cuenta)',
    description:
      'Aparece arriba del todo, junto a tus puntos. Recomendado: PNG transparente cuadrado.',
  },
  {
    key: 'clubLogoCard',
    label: 'Logo del Club (tarjeta "Club de Amigos")',
    description:
      'Tarjeta que enlaza al Club. Si está vacío, usa el de cabecera. Recomendado: PNG transparente.',
  },
];

type Slot = { kind: 'club'; key: 'clubLogo' | 'clubLogoCard'; label: string; description: string }
          | { kind: 'nivel'; slug: string; label: string };

const SLOTS: Slot[] = [
  ...CLUB_SLOTS.map((s) => ({ kind: 'club' as const, ...s })),
  ...NIVEL_SLOTS.map((s) => ({ kind: 'nivel' as const, slug: s.slug, label: s.label })),
];

export default function MiCuentaUsuariosClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<MiCuentaAssets>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  // ── Cargar settings actuales ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }
        if (!res.ok) throw new Error(`Error cargando ajustes (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        const next: MiCuentaAssets = data?.miCuentaAssets ?? {};
        if (!next.nivelAvatares || typeof next.nivelAvatares !== 'object') {
          next.nivelAvatares = {};
        }
        setAssets(next);
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setClubUrl = useCallback((key: 'clubLogo' | 'clubLogoCard', url: string | null) => {
    setAssets((prev) => ({ ...prev, [key]: url }));
    setDirty(true);
  }, []);

  const setNivelUrl = useCallback((slug: string, url: string | null) => {
    setAssets((prev) => ({
      ...prev,
      nivelAvatares: { ...(prev.nivelAvatares ?? {}), [slug]: url },
    }));
    setDirty(true);
  }, []);

  // ── Subida a R2 ──────────────────────────────────────────
  async function handleUpload(slotKey: string, file: File, applier: (url: string) => void) {
    setUploadingKey(slotKey);
    setError(null);
    try {
      const { uploadImageToR2 } = await import('@/src/lib/uploadHelper');
      const { url, warning } = await uploadImageToR2(file, 'mi-cuenta');
      if (warning) console.warn('[mi-cuenta]', warning);
      applier(url);
    } catch (e: any) {
      setError(e?.message ?? 'Error subiendo imagen');
    } finally {
      setUploadingKey(null);
    }
  }

  // ── Guardar ──────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      // Limpiamos: si quedó { nivelAvatares: {} } sin nada, lo dejamos vacío.
      const body = { miCuentaAssets: assets };
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message ?? `Error guardando (${res.status})`);
      }
      setSavedAt(Date.now());
      setDirty(false);
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  const justSaved = useMemo(() => savedAt && Date.now() - savedAt < 4000, [savedAt]);

  if (loading) {
    return <div className="mt-6 text-sm text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {justSaved && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          Guardado correctamente.
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold">Logo del Club de Amigos</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Hay dos posiciones porque las tarjetas tienen tamaños distintos. Recomendado: PNG con
          fondo transparente real (no PNG con negro detrás).
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {CLUB_SLOTS.map((slot) => {
            const value = assets[slot.key] ?? null;
            return (
              <SlotCard
                key={slot.key}
                slotKey={slot.key}
                label={slot.label}
                description={slot.description}
                value={value}
                onUpload={(file) => handleUpload(slot.key, file, (url) => setClubUrl(slot.key, url))}
                onClear={() => setClubUrl(slot.key, null)}
                uploading={uploadingKey === slot.key}
                background="cream"
              />
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Avatares de niveles (1 a 9)</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Aparecen en{' '}
          <code className="rounded bg-muted px-1 py-0.5">/mi-cuenta</code>,{' '}
          <code className="rounded bg-muted px-1 py-0.5">/mi-cuenta/puntos</code> y{' '}
          <code className="rounded bg-muted px-1 py-0.5">/mi-cuenta/niveles</code>. Si no subes
          uno, se usa el del bundle por defecto.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NIVEL_SLOTS.map((slot) => {
            const value = assets.nivelAvatares?.[slot.slug] ?? null;
            const slotKey = `nivel:${slot.slug}`;
            return (
              <SlotCard
                key={slot.slug}
                slotKey={slotKey}
                label={slot.label}
                description="PNG transparente cuadrado, mínimo 512×512."
                value={value}
                onUpload={(file) =>
                  handleUpload(slotKey, file, (url) => setNivelUrl(slot.slug, url))
                }
                onClear={() => setNivelUrl(slot.slug, null)}
                uploading={uploadingKey === slotKey}
                background="cream"
              />
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-0 -mx-6 flex items-center justify-end gap-3 border-t bg-background/95 px-6 py-3 backdrop-blur">
        <span className="text-xs text-muted-foreground">
          {dirty ? 'Cambios sin guardar' : 'Sin cambios pendientes'}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type SlotCardProps = {
  slotKey: string;
  label: string;
  description: string;
  value: string | null | undefined;
  onUpload: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
  background?: 'cream' | 'transparent';
};

function SlotCard({
  slotKey,
  label,
  description,
  value,
  onUpload,
  onClear,
  uploading,
  background = 'cream',
}: SlotCardProps) {
  const bgClass =
    background === 'cream'
      ? 'bg-[radial-gradient(circle_at_top,_#fff7e6_0%,_#fdf3da_70%)]'
      : 'bg-[conic-gradient(at_top_left,_#f5f5f5_0%,_#e5e5e5_25%,_#f5f5f5_50%,_#e5e5e5_75%,_#f5f5f5_100%)]';
  return (
    <div className="flex flex-col rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium leading-tight">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>

      <div className={`mt-3 flex h-32 items-center justify-center overflow-hidden rounded-lg border ${bgClass}`}>
        {value ? (
          <img
            src={value}
            alt={label}
            className="max-h-[120px] max-w-[80%] object-contain"
          />
        ) : (
          <span className="text-xs text-muted-foreground italic">Sin imagen — usa la por defecto</span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label
          className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition hover:bg-muted ${
            uploading ? 'opacity-50' : ''
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          {uploading ? 'Subiendo…' : value ? 'Reemplazar' : 'Subir imagen'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.currentTarget.value = '';
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Quitar
          </button>
        )}
      </div>

      {value && (
        <p className="mt-2 truncate text-[10px] text-muted-foreground" title={value}>
          {value}
        </p>
      )}
    </div>
  );
}
