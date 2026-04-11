'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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

type TagDef = {
  id: number;
  tag: string;
  categoria: string;
  nombre_i18n: Record<string, string>;
  icono: string;
  color: string;
  activo: boolean;
};

type ServicioOption = {
  tipo: string;
  etiqueta: string;
  emoji: string;
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
  caracteristica: '🏰 Característica',
  servicio: '📍 Servicio del mapa',
  highlight: '📊 Highlight',
  ids: '📋 IDs fijos',
  comunidad: '🗺️ Comunidad',
  meteo: '🌤️ Meteo',
};

const SERVICIOS_PARA_COLECCION: ServicioOption[] = [
  { tipo: 'CARAVANAS', etiqueta: 'Área de caravanas', emoji: '🚐' },
  { tipo: 'BANO_NATURAL', etiqueta: 'Zona natural de baño', emoji: '🏊' },
  { tipo: 'PLAYA', etiqueta: 'Playa', emoji: '🏖️' },
  { tipo: 'COCHE_ELECTRICO', etiqueta: 'Cargador eléctrico', emoji: '⚡' },
  { tipo: 'COCHE_ELECTRICO_ULTRA', etiqueta: 'Cargador ultra-rápido (150+ kW)', emoji: '⚡' },
  { tipo: 'PIPICAN', etiqueta: 'Pipicán (pet-friendly)', emoji: '🐕' },
  { tipo: 'ALQUILER_BICI', etiqueta: 'Alquiler de bicicletas', emoji: '🚲' },
  { tipo: 'PICNIC', etiqueta: 'Zona picnic / Merendero', emoji: '🧺' },
  { tipo: 'PARQUE_INFANTIL', etiqueta: 'Parque infantil', emoji: '🎠' },
  { tipo: 'DESFIBRILADOR', etiqueta: 'Desfibrilador', emoji: '❤️' },
];

const CATEGORY_LABELS: Record<string, string> = {
  PATRIMONIO_MILITAR: '⚔️ Patrimonio militar',
  PATRIMONIO_RELIGIOSO: '⛪ Patrimonio religioso',
  PATRIMONIO_CIVIL: '🏛️ Patrimonio civil',
  PATRIMONIO_ARQUEOLOGICO: '🏺 Patrimonio y estilos',
  NATURALEZA: '🌿 Naturaleza',
  GASTRONOMIA: '🍷 Gastronomía y tradición',
  ATMOSFERA: '✨ Atmósfera',
  ACCESIBILIDAD: '♿ Accesibilidad y práctica',
};

type PuebloCounts = { tags: Record<string, number>; servicios: Record<string, number> };

export default function ColeccionesAdmin() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [tags, setTags] = useState<TagDef[]>([]);
  const [counts, setCounts] = useState<PuebloCounts>({ tags: {}, servicios: {} });
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const [resCol, resTags, resCounts] = await Promise.all([
        fetch('/api/admin/colecciones', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/public/tag-definiciones', { cache: 'no-store' }),
        fetch('/api/public/caracteristicas/counts', { cache: 'no-store' }),
      ]);
      if (resCol.status === 401) { window.location.href = '/entrar'; return; }
      if (!resCol.ok) throw new Error(`Error ${resCol.status}`);
      const colData = await resCol.json();
      setColecciones(Array.isArray(colData) ? colData : []);

      if (resTags.ok) {
        const tagData = await resTags.json();
        if (Array.isArray(tagData)) {
          setTags(tagData);
        } else if (tagData && typeof tagData === 'object') {
          const flat: TagDef[] = [];
          for (const catTags of Object.values(tagData)) {
            if (Array.isArray(catTags)) flat.push(...(catTags as TagDef[]));
          }
          setTags(flat);
        }
      }

      if (resCounts.ok) {
        const countsData = await resCounts.json();
        if (countsData && countsData.tags) {
          setCounts(countsData);
        }
      }
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const usedTags = useMemo(() => {
    const set = new Set<string>();
    for (const col of colecciones) {
      if (col.fuente === 'caracteristica' && col.filtro?.tag) {
        set.add(col.filtro.tag);
      }
    }
    return set;
  }, [colecciones]);

  const usedServicios = useMemo(() => {
    const set = new Set<string>();
    for (const col of colecciones) {
      if (col.fuente === 'servicio' && col.filtro?.tipo) {
        set.add(col.filtro.tipo);
      }
    }
    return set;
  }, [colecciones]);

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
    subtitle: 'Crear y gestionar páginas temáticas de "Descubre" basadas en características de los pueblos o en los servicios del mapa.',
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
          tags={tags}
          usedTags={usedTags}
          usedServicios={usedServicios}
          counts={counts}
          onCreated={() => { setShowNew(false); fetchAll(); }}
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
                  counts={counts}
                  isEditing={editingId === col.id}
                  onToggleEdit={() => setEditingId(editingId === col.id ? null : col.id)}
                  onToggleActiva={() => toggleActiva(col)}
                  onDelete={() => deleteCol(col)}
                  onUpdateOrden={(n) => updateOrden(col, n)}
                  onSaved={() => { setEditingId(null); fetchAll(); }}
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
                  counts={counts}
                  isEditing={editingId === col.id}
                  onToggleEdit={() => setEditingId(editingId === col.id ? null : col.id)}
                  onToggleActiva={() => toggleActiva(col)}
                  onDelete={() => deleteCol(col)}
                  onUpdateOrden={(n) => updateOrden(col, n)}
                  onSaved={() => { setEditingId(null); fetchAll(); }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Las 11 colecciones originales (castillos, montaña, costeros…) están incluidas por defecto y no aparecen aquí.
        <br />
        Aquí se gestionan las colecciones nuevas creadas por el equipo.
      </p>
    </GestionAsociacionSubpageShell>
  );
}

/* ────── Fila de colección ────── */

function ColeccionRow({
  col,
  counts,
  isEditing,
  onToggleEdit,
  onToggleActiva,
  onDelete,
  onUpdateOrden,
  onSaved,
}: {
  col: Coleccion;
  counts: PuebloCounts;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleActiva: () => void;
  onDelete: () => void;
  onUpdateOrden: (n: number) => void;
  onSaved: () => void;
}) {
  const filtroLabel = col.fuente === 'caracteristica' && col.filtro?.tag
    ? col.filtro.tag
    : col.fuente === 'servicio' && col.filtro?.tipo
    ? col.filtro.tipo
    : '';

  const puebloCount = col.fuente === 'caracteristica' && col.filtro?.tag
    ? counts.tags[col.filtro.tag] ?? 0
    : col.fuente === 'servicio' && col.filtro?.tipo
    ? counts.servicios[col.filtro.tipo] ?? 0
    : null;

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      col.activa
        ? 'border-border/70 bg-card'
        : 'border-dashed border-border/50 bg-muted/20 opacity-75'
    }`}>
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: col.color }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {col.titulo_i18n.es}
            </h3>
            {puebloCount !== null && (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                puebloCount === 0
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                  : puebloCount < 3
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
              }`}>
                {puebloCount} pueblo{puebloCount !== 1 ? 's' : ''}
              </span>
            )}
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
            /descubre/{col.slug} · Orden: {col.orden} · Mín. pueblos: {col.minPueblos}
          </p>
        </div>

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
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setErrMsg(null);
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
      setErrMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Título de la página</label>
          <input value={tituloEs} onChange={(e) => setTituloEs(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Título SEO (Google)</label>
          <input value={seoTitleEs} onChange={(e) => setSeoTitleEs(e.target.value)} className={field} placeholder="Se genera automáticamente si lo dejas vacío" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripción de la página</label>
        <textarea value={descEs} onChange={(e) => setDescEs(e.target.value)} rows={2} className={field} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripción SEO (Google)</label>
        <textarea value={seoDescEs} onChange={(e) => setSeoDescEs(e.target.value)} rows={2} className={field} placeholder="Se usa la descripción si lo dejas vacío" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Posición</label>
          <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={field} />
          <p className="mt-0.5 text-[10px] text-muted-foreground">Menor = más arriba</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Mín. pueblos para mostrar</label>
          <input type="number" value={minPueblos} onChange={(e) => setMinPueblos(Number(e.target.value))} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Icono</label>
          <input value={icono} onChange={(e) => setIcono(e.target.value)} className={field} placeholder="castle" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border border-input" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Imagen de cabecera (URL, opcional)</label>
        <input value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} className={field} placeholder="https://…" />
      </div>

      {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className={btnPrimary}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
      </div>
    </div>
  );
}

/* ────── Formulario de nueva colección (rediseñado) ────── */

function NewColeccionForm({
  tags,
  usedTags,
  usedServicios,
  counts,
  onCreated,
  onCancel,
}: {
  tags: TagDef[];
  usedTags: Set<string>;
  usedServicios: Set<string>;
  counts: PuebloCounts;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<'source' | 'pick' | 'details'>('source');
  const [fuente, setFuente] = useState<'caracteristica' | 'servicio'>('caracteristica');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  const [tituloEs, setTituloEs] = useState('');
  const [slug, setSlug] = useState('');
  const [descEs, setDescEs] = useState('');
  const [seoTitleEs, setSeoTitleEs] = useState('');
  const [seoDescEs, setSeoDescEs] = useState('');
  const [icono, setIcono] = useState('tag');
  const [color, setColor] = useState('#8B6F47');
  const [orden, setOrden] = useState(50);
  const [minPueblos, setMinPueblos] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableTags = useMemo(() => {
    return tags
      .filter((t) => t.activo && !usedTags.has(t.tag))
      .sort((a, b) => {
        if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
        return (a.nombre_i18n.es ?? a.tag).localeCompare(b.nombre_i18n.es ?? b.tag);
      });
  }, [tags, usedTags]);

  const availableServicios = useMemo(() => {
    return SERVICIOS_PARA_COLECCION.filter((s) => !usedServicios.has(s.tipo));
  }, [usedServicios]);

  const filteredTags = useMemo(() => {
    if (!searchQ.trim()) return availableTags;
    const q = searchQ.toLowerCase();
    return availableTags.filter(
      (t) =>
        (t.nombre_i18n.es ?? '').toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q),
    );
  }, [availableTags, searchQ]);

  const groupedTags = useMemo(() => {
    const groups: Record<string, TagDef[]> = {};
    for (const t of filteredTags) {
      if (!groups[t.categoria]) groups[t.categoria] = [];
      groups[t.categoria].push(t);
    }
    return groups;
  }, [filteredTags]);

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function selectTag(tag: TagDef) {
    setSelectedTag(tag.tag);
    setSelectedServicio(null);
    const nombre = tag.nombre_i18n.es ?? tag.tag;
    const titulo = `Pueblos con ${nombre.toLowerCase()}`;
    setTituloEs(titulo);
    setSlug(autoSlug(titulo));
    setIcono(tag.icono);
    setColor(tag.color);
    setDescEs(`Descubre los pueblos más bonitos de España que cuentan con ${nombre.toLowerCase()}.`);
    setStep('details');
  }

  function selectServicio(srv: ServicioOption) {
    setSelectedServicio(srv.tipo);
    setSelectedTag(null);
    const titulo = `Pueblos con ${srv.etiqueta.toLowerCase()}`;
    setTituloEs(titulo);
    setSlug(autoSlug(titulo));
    setIcono('map-pin');
    setColor('#8B6F47');
    setDescEs(`Pueblos bonitos de España que disponen de ${srv.etiqueta.toLowerCase()} para los visitantes.`);
    setStep('details');
  }

  async function handleCreate() {
    setSaving(true);
    setErrMsg(null);
    try {
      const finalSlug = slug.trim() || autoSlug(tituloEs);
      if (!finalSlug) throw new Error('Se necesita un título');
      if (!tituloEs.trim()) throw new Error('Se necesita un título');

      const filtro = fuente === 'caracteristica'
        ? { tag: selectedTag }
        : { tipo: selectedServicio };

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
      setErrMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`${sectionCard} mb-6`}>
      <div className={sectionHead}>
        <h2 className="text-sm font-semibold text-foreground">
          {step === 'source' && 'Nueva colección — Paso 1: Tipo de página'}
          {step === 'pick' && `Nueva colección — Paso 2: Elige ${fuente === 'caracteristica' ? 'la característica' : 'el servicio'}`}
          {step === 'details' && 'Nueva colección — Paso 3: Detalles de la página'}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {step === 'source' && '¿Qué tipo de dato alimenta esta colección?'}
          {step === 'pick' && fuente === 'caracteristica'
            ? `Se muestran las características que aún no tienen página (${availableTags.length} disponibles)`
            : step === 'pick'
            ? `Se muestran los servicios del mapa que aún no tienen página (${availableServicios.length} disponibles)`
            : 'Revisa y personaliza los textos antes de crear la página'}
        </p>
      </div>
      <div className={`${sectionBody} space-y-4`}>

        {/* STEP 1: Elegir fuente */}
        {step === 'source' && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Cada colección agrupa pueblos que comparten algo en común. Elige de dónde viene ese dato:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => { setFuente('caracteristica'); setStep('pick'); }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50 hover:shadow-md ${
                  fuente === 'caracteristica' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="text-lg">🏰</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Característica del pueblo</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Catedrales, castillos, bodegas, murallas… marcadas por los alcaldes en la sección "Características".
                </p>
                <p className="mt-1 text-[10px] font-medium text-emerald-600">
                  {availableTags.length} disponibles sin página
                </p>
              </button>
              <button
                onClick={() => { setFuente('servicio'); setStep('pick'); }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50 hover:shadow-md ${
                  fuente === 'servicio' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="text-lg">📍</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Servicio del mapa</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Áreas de caravanas, cargadores eléctricos, pipicán… marcados en el mapa con ubicación exacta.
                </p>
                <p className="mt-1 text-[10px] font-medium text-emerald-600">
                  {availableServicios.length} disponibles sin página
                </p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Elegir tag o servicio */}
        {step === 'pick' && fuente === 'caracteristica' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('source')} className={btnSecondary}>
                ← Atrás
              </button>
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Buscar característica…"
                className={`${field} mt-0`}
              />
            </div>

            {filteredTags.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {searchQ
                  ? 'No se encontraron características con ese nombre'
                  : 'Todas las características ya tienen colección'}
              </p>
            ) : (
              <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
                {Object.entries(groupedTags).map(([cat, catTags]) => (
                  <div key={cat}>
                    <h4 className="sticky top-0 z-10 mb-2 rounded-lg bg-muted/80 px-2 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                      {CATEGORY_LABELS[cat] ?? cat}
                    </h4>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {catTags.map((tag) => {
                        const cnt = counts.tags[tag.tag] ?? 0;
                        return (
                          <button
                            key={tag.id}
                            onClick={() => selectTag(tag)}
                            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-left text-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-foreground">{tag.nombre_i18n.es ?? tag.tag}</span>
                            <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold tabular-nums ${
                              cnt === 0 ? 'text-muted-foreground/50' : cnt < 3 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {cnt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'pick' && fuente === 'servicio' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('source')} className={btnSecondary}>
                ← Atrás
              </button>
            </div>

            {availableServicios.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Todos los servicios ya tienen colección
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableServicios.map((srv) => {
                  const cnt = counts.servicios[srv.tipo] ?? 0;
                  return (
                    <button
                      key={srv.tipo}
                      onClick={() => selectServicio(srv)}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2.5 text-left text-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                    >
                      <span className="shrink-0 text-base">{srv.emoji}</span>
                      <span className="min-w-0 flex-1 truncate text-foreground">{srv.etiqueta}</span>
                      <span className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold tabular-nums ${
                        cnt === 0 ? 'text-muted-foreground/50' : cnt < 3 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {cnt}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Detalles */}
        {step === 'details' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('pick')} className={btnSecondary}>
                ← Cambiar selección
              </button>
              <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium text-foreground">
                  {fuente === 'caracteristica'
                    ? tags.find((t) => t.tag === selectedTag)?.nombre_i18n.es ?? selectedTag
                    : SERVICIOS_PARA_COLECCION.find((s) => s.tipo === selectedServicio)?.etiqueta ?? selectedServicio}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Título de la página *</label>
                <input
                  value={tituloEs}
                  onChange={(e) => {
                    setTituloEs(e.target.value);
                    setSlug(autoSlug(e.target.value));
                  }}
                  className={field}
                  placeholder="Pueblos con…"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">URL de la página</label>
                <div className="mt-1.5 flex items-center gap-0 rounded-xl border border-input bg-muted/30 text-sm">
                  <span className="shrink-0 pl-3 text-muted-foreground">/descubre/</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 border-0 bg-transparent py-2.5 pr-3 text-sm text-foreground focus:outline-none"
                    placeholder="pueblos-con-…"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Descripción de la página</label>
              <textarea value={descEs} onChange={(e) => setDescEs(e.target.value)} rows={2} className={field} />
              <p className="mt-0.5 text-[10px] text-muted-foreground">Texto introductorio que verán los visitantes en la parte superior de la página.</p>
            </div>

            {/* Opciones avanzadas colapsables */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
              Opciones avanzadas (SEO, posición, icono)
            </button>

            {showAdvanced && (
              <div className="space-y-3 rounded-xl border border-border/40 bg-muted/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Título SEO (Google)</label>
                    <input value={seoTitleEs} onChange={(e) => setSeoTitleEs(e.target.value)} className={field} placeholder="Se genera automáticamente si lo dejas vacío" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Descripción SEO (Google)</label>
                    <input value={seoDescEs} onChange={(e) => setSeoDescEs(e.target.value)} className={field} placeholder="Se usa la descripción si lo dejas vacío" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Posición</label>
                    <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={field} />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Menor = más arriba en la lista</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Mín. pueblos</label>
                    <input type="number" value={minPueblos} onChange={(e) => setMinPueblos(Number(e.target.value))} className={field} />
                    <p className="mt-0.5 text-[10px] text-muted-foreground">Solo se muestra si hay al menos este nº de pueblos</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Icono</label>
                    <input value={icono} onChange={(e) => setIcono(e.target.value)} className={field} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Color</label>
                    <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1.5 h-10 w-full cursor-pointer rounded-xl border border-input" />
                  </div>
                </div>
              </div>
            )}

            {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}

            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={saving} className={btnPrimary}>
                {saving ? 'Creando página…' : 'Crear página de colección'}
              </button>
              <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Cancel en steps 1 y 2 */}
        {(step === 'source' || step === 'pick') && (
          <div className="flex justify-end">
            <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
