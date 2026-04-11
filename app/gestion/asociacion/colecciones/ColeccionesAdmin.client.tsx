'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';

type Coleccion = {
  id: number;
  slug: string;
  fuente: string;
  icono: string;
  color: string;
  titulo_i18n: Record<string, string>;
  descripcion_i18n: Record<string, string>;
  seoTitle_i18n: Record<string, string> | null;
  seoDescription_i18n: Record<string, string> | null;
  filtro: any;
  minPueblos: number;
  orden: number;
  activa: boolean;
  imagenUrl: string | null;
  createdAt: string;
};

const field =
  'mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const btnSecondary =
  'inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted/50 active:scale-[0.98]';

const btnDanger =
  'inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-all hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400';

const sectionCard = 'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm';
const sectionHead = 'border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6';
const sectionBody = 'p-5 sm:p-6';

const FUENTE_LABELS: Record<string, string> = {
  caracteristica: '🏷️ Característica',
  servicio: '🔧 Servicio',
  highlight: '📊 Highlight',
  ids: '📋 IDs fijos',
  comunidad: '🗺️ Comunidad',
  meteo: '🌤️ Meteo',
};

export default function ColeccionesAdmin() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  const fetchColecciones = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch('/api/admin/colecciones', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setColecciones(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchColecciones(); }, [fetchColecciones]);

  async function toggleActiva(col: Coleccion) {
    try {
      const res = await fetch(`/api/admin/colecciones/${col.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !col.activa }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setColecciones((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, activa: !c.activa } : c)),
      );
      setMensaje(`"${col.titulo_i18n.es}" ${!col.activa ? 'activada' : 'desactivada'}`);
      setTimeout(() => setMensaje(null), 3000);
    } catch (e: any) {
      setMensaje(`Error: ${e.message}`);
    }
  }

  async function deleteCol(col: Coleccion) {
    if (!confirm(`¿Eliminar "${col.titulo_i18n.es}" permanentemente?`)) return;
    try {
      const res = await fetch(`/api/admin/colecciones/${col.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setColecciones((prev) => prev.filter((c) => c.id !== col.id));
      setMensaje(`"${col.titulo_i18n.es}" eliminada`);
      setTimeout(() => setMensaje(null), 3000);
    } catch (e: any) {
      setMensaje(`Error: ${e.message}`);
    }
  }

  async function updateOrden(col: Coleccion, newOrden: number) {
    try {
      const res = await fetch(`/api/admin/colecciones/${col.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orden: newOrden }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setColecciones((prev) =>
        prev.map((c) => (c.id === col.id ? { ...c, orden: newOrden } : c))
          .sort((a, b) => a.orden - b.orden),
      );
    } catch (e: any) {
      setMensaje(`Error: ${e.message}`);
    }
  }

  const shell = {
    title: 'Colecciones',
    subtitle: 'Páginas de "Descubre": crear, activar/desactivar, editar y ordenar colecciones temáticas.',
    heroAction: (
      <button
        onClick={() => setShowNew(true)}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Nueva colección
      </button>
    ),
  };

  if (loading) {
    return (
      <GestionAsociacionSubpageShell {...shell}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted/50" />)}
        </div>
      </GestionAsociacionSubpageShell>
    );
  }

  if (err) {
    return (
      <GestionAsociacionSubpageShell {...shell}>
        <p className="text-red-600">Error: {err}</p>
      </GestionAsociacionSubpageShell>
    );
  }

  const activas = colecciones.filter((c) => c.activa);
  const inactivas = colecciones.filter((c) => !c.activa);

  return (
    <GestionAsociacionSubpageShell {...shell}>
      {mensaje && (
        <div className={`mb-4 rounded-xl border px-4 py-2.5 text-sm font-medium ${
          mensaje.startsWith('Error')
            ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400'
        }`}>
          {mensaje}
        </div>
      )}

      {showNew && (
        <NewColeccionForm
          onCreated={() => { setShowNew(false); fetchColecciones(); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {/* Activas */}
      <div className={sectionCard}>
        <div className={sectionHead}>
          <h2 className="text-sm font-semibold text-foreground">
            Colecciones activas ({activas.length})
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Visibles en /descubre y en el sitemap
          </p>
        </div>
        <div className={sectionBody}>
          {activas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay colecciones activas.</p>
          ) : (
            <div className="space-y-2">
              {activas.map((col) => (
                <ColeccionRow
                  key={col.id}
                  col={col}
                  isEditing={editingId === col.id}
                  onToggleEdit={() => setEditingId(editingId === col.id ? null : col.id)}
                  onToggleActiva={() => toggleActiva(col)}
                  onDelete={() => deleteCol(col)}
                  onUpdateOrden={(n) => updateOrden(col, n)}
                  onSaved={() => { setEditingId(null); fetchColecciones(); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inactivas */}
      {inactivas.length > 0 && (
        <div className={`${sectionCard} mt-6`}>
          <div className={sectionHead}>
            <h2 className="text-sm font-semibold text-foreground">
              Colecciones desactivadas ({inactivas.length})
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              No se muestran en la web hasta activarlas
            </p>
          </div>
          <div className={sectionBody}>
            <div className="space-y-2">
              {inactivas.map((col) => (
                <ColeccionRow
                  key={col.id}
                  col={col}
                  isEditing={editingId === col.id}
                  onToggleEdit={() => setEditingId(editingId === col.id ? null : col.id)}
                  onToggleActiva={() => toggleActiva(col)}
                  onDelete={() => deleteCol(col)}
                  onUpdateOrden={(n) => updateOrden(col, n)}
                  onSaved={() => { setEditingId(null); fetchColecciones(); }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Las 11 colecciones originales (castillos, montaña, costeros…) están hardcodeadas y no aparecen aquí.
        <br />
        Solo se gestionan aquí las colecciones creadas desde la base de datos.
      </p>
    </GestionAsociacionSubpageShell>
  );
}

/* ────── Fila de colección ────── */

function ColeccionRow({
  col,
  isEditing,
  onToggleEdit,
  onToggleActiva,
  onDelete,
  onUpdateOrden,
  onSaved,
}: {
  col: Coleccion;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleActiva: () => void;
  onDelete: () => void;
  onUpdateOrden: (n: number) => void;
  onSaved: () => void;
}) {
  return (
    <div className={`rounded-xl border p-4 transition-all ${
      col.activa
        ? 'border-border/70 bg-card'
        : 'border-dashed border-border/50 bg-muted/20 opacity-75'
    }`}>
      <div className="flex items-center gap-3">
        {/* Color dot */}
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: col.color }}
        />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {col.titulo_i18n.es}
            </h3>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {FUENTE_LABELS[col.fuente] ?? col.fuente}
            </span>
            {!col.activa && (
              <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                Desactivada
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            /descubre/{col.slug} · Orden: {col.orden} · Min pueblos: {col.minPueblos}
          </p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/descubre/${col.slug}`}
            target="_blank"
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Ver página pública"
          >
            🔗
          </Link>
          <button onClick={onToggleActiva} className={btnSecondary} title={col.activa ? 'Desactivar' : 'Activar'}>
            {col.activa ? '⏸️' : '▶️'}
          </button>
          <button onClick={onToggleEdit} className={btnSecondary} title="Editar">
            ✏️
          </button>
          <button onClick={onDelete} className={btnDanger} title="Eliminar">
            🗑️
          </button>
        </div>
      </div>

      {isEditing && (
        <EditColeccionForm col={col} onSaved={onSaved} onCancel={onToggleEdit} />
      )}
    </div>
  );
}

/* ────── Formulario de edición ────── */

function EditColeccionForm({
  col,
  onSaved,
  onCancel,
}: {
  col: Coleccion;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [tituloEs, setTituloEs] = useState(col.titulo_i18n.es ?? '');
  const [descEs, setDescEs] = useState(col.descripcion_i18n.es ?? '');
  const [seoTitleEs, setSeoTitleEs] = useState(col.seoTitle_i18n?.es ?? '');
  const [seoDescEs, setSeoDescEs] = useState(col.seoDescription_i18n?.es ?? '');
  const [orden, setOrden] = useState(col.orden);
  const [minPueblos, setMinPueblos] = useState(col.minPueblos);
  const [icono, setIcono] = useState(col.icono);
  const [color, setColor] = useState(col.color);
  const [imagenUrl, setImagenUrl] = useState(col.imagenUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErr(null);
    try {
      const body: any = {
        orden,
        minPueblos,
        icono,
        color,
        imagenUrl: imagenUrl.trim() || null,
      };
      if (tituloEs !== col.titulo_i18n.es) {
        body.titulo_i18n = { ...col.titulo_i18n, es: tituloEs };
      }
      if (descEs !== col.descripcion_i18n.es) {
        body.descripcion_i18n = { ...col.descripcion_i18n, es: descEs };
      }
      if (seoTitleEs !== (col.seoTitle_i18n?.es ?? '')) {
        body.seoTitle_i18n = { ...(col.seoTitle_i18n ?? {}), es: seoTitleEs };
      }
      if (seoDescEs !== (col.seoDescription_i18n?.es ?? '')) {
        body.seoDescription_i18n = { ...(col.seoDescription_i18n ?? {}), es: seoDescEs };
      }

      const res = await fetch(`/api/admin/colecciones/${col.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Error ${res.status}`);
      }
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Título (ES)</label>
          <input value={tituloEs} onChange={(e) => setTituloEs(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">SEO Title (ES)</label>
          <input value={seoTitleEs} onChange={(e) => setSeoTitleEs(e.target.value)} className={field} />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripción (ES)</label>
        <textarea value={descEs} onChange={(e) => setDescEs(e.target.value)} rows={2} className={field} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">SEO Description (ES)</label>
        <textarea value={seoDescEs} onChange={(e) => setSeoDescEs(e.target.value)} rows={2} className={field} />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Orden</label>
          <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Mín. pueblos</label>
          <input type="number" value={minPueblos} onChange={(e) => setMinPueblos(Number(e.target.value))} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Icono (Lucide)</label>
          <input value={icono} onChange={(e) => setIcono(e.target.value)} className={field} placeholder="castle" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border border-input" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">URL imagen (opcional)</label>
        <input value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} className={field} placeholder="https://…" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Filtro:</span>
        <code className="rounded bg-muted px-1.5 py-0.5">{JSON.stringify(col.filtro)}</code>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
      </div>
    </div>
  );
}

/* ────── Formulario de nueva colección ────── */

function NewColeccionForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [slug, setSlug] = useState('');
  const [fuente, setFuente] = useState('caracteristica');
  const [tituloEs, setTituloEs] = useState('');
  const [descEs, setDescEs] = useState('');
  const [seoTitleEs, setSeoTitleEs] = useState('');
  const [seoDescEs, setSeoDescEs] = useState('');
  const [filtroJson, setFiltroJson] = useState('{ "tag": "" }');
  const [icono, setIcono] = useState('tag');
  const [color, setColor] = useState('#8B6F47');
  const [orden, setOrden] = useState(50);
  const [minPueblos, setMinPueblos] = useState(1);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleCreate() {
    setSaving(true);
    setErr(null);
    try {
      let filtro: any;
      try {
        filtro = JSON.parse(filtroJson);
      } catch {
        throw new Error('Filtro JSON inválido');
      }

      const finalSlug = slug.trim() || autoSlug(tituloEs);
      if (!finalSlug) throw new Error('Se necesita un slug');
      if (!tituloEs.trim()) throw new Error('Se necesita un título');

      const body = {
        slug: finalSlug,
        fuente,
        icono,
        color,
        titulo_i18n: { es: tituloEs.trim() },
        descripcion_i18n: { es: descEs.trim() },
        seoTitle_i18n: { es: seoTitleEs.trim() || `${tituloEs.trim()} | Los Pueblos Más Bonitos` },
        seoDescription_i18n: { es: seoDescEs.trim() || descEs.trim() },
        filtro,
        minPueblos,
        orden,
      };

      const res = await fetch('/api/admin/colecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || `Error ${res.status}`);
      }
      onCreated();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`${sectionCard} mb-6`}>
      <div className={sectionHead}>
        <h2 className="text-sm font-semibold text-foreground">Nueva colección</h2>
      </div>
      <div className={`${sectionBody} space-y-3`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Título (ES) *</label>
            <input
              value={tituloEs}
              onChange={(e) => {
                setTituloEs(e.target.value);
                if (!slug) setSlug('');
              }}
              className={field}
              placeholder="Pueblos con…"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Slug (auto o manual)</label>
            <input
              value={slug || autoSlug(tituloEs)}
              onChange={(e) => setSlug(e.target.value)}
              className={field}
              placeholder="pueblos-con-…"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Descripción (ES)</label>
          <textarea value={descEs} onChange={(e) => setDescEs(e.target.value)} rows={2} className={field} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">SEO Title (ES)</label>
            <input value={seoTitleEs} onChange={(e) => setSeoTitleEs(e.target.value)} className={field} placeholder="Autogenerado si vacío" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">SEO Description (ES)</label>
            <input value={seoDescEs} onChange={(e) => setSeoDescEs(e.target.value)} className={field} placeholder="Usa descripción si vacío" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Fuente</label>
            <select value={fuente} onChange={(e) => setFuente(e.target.value)} className={field}>
              <option value="caracteristica">Característica (tag)</option>
              <option value="servicio">Servicio</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Icono (Lucide)</label>
            <input value={icono} onChange={(e) => setIcono(e.target.value)} className={field} placeholder="castle" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border border-input" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Filtro (JSON) *</label>
            <input value={filtroJson} onChange={(e) => setFiltroJson(e.target.value)} className={field} placeholder='{ "tag": "CASTILLO" }' />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Característica: {'{ "tag": "NOMBRE_TAG" }'} · Servicio: {'{ "tipo": "TIPO" }'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Orden</label>
            <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={field} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Mín. pueblos</label>
            <input type="number" value={minPueblos} onChange={(e) => setMinPueblos(Number(e.target.value))} className={field} />
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex gap-2">
          <button onClick={handleCreate} disabled={saving} className={btnPrimary}>
            {saving ? 'Creando…' : 'Crear colección'}
          </button>
          <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
