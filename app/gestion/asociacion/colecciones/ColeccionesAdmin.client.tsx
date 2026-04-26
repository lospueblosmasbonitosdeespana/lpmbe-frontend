'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { uploadImageToR2 } from '@/src/lib/uploadHelper';

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
  ranking: '🏆 Valoraciones y usuarios',
  highlight: '📊 Highlight',
  ids: '📋 IDs fijos',
  comunidad: '🗺️ Comunidad',
  meteo: '🌤️ Meteo',
  campo_pueblo: '📐 Campo del pueblo',
};

// Métricas disponibles para colecciones tipo ranking (Bloque A+B+C+D)
const RANKING_METRICAS: Array<{
  metric: 'rating' | 'visitas' | 'pageviews';
  etiqueta: string;
  emoji: string;
  desc: string;
}> = [
  { metric: 'rating', etiqueta: 'Mejor valorados', emoji: '⭐', desc: 'Pueblos con mejor nota media (Wilson, mín. 3 valoraciones)' },
  { metric: 'visitas', etiqueta: 'Más visitados', emoji: '📍', desc: 'Pueblos con más visitas registradas (GPS + manuales)' },
  { metric: 'pageviews', etiqueta: 'Más buscados online', emoji: '🔍', desc: 'Pueblos cuya página oficial recibe más visitas' },
];

const RANKING_SCOPES: Array<{
  scope: 'nacional' | 'norte' | 'sur' | 'este' | 'centro';
  etiqueta: string;
  desc: string;
}> = [
  { scope: 'nacional', etiqueta: 'Nacional', desc: 'Toda España' },
  { scope: 'norte', etiqueta: 'Región Norte', desc: 'Galicia, Asturias, Cantabria, País Vasco, La Rioja, Burgos, Palencia, León' },
  { scope: 'sur', etiqueta: 'Región Sur', desc: 'Canarias, Andalucía, Murcia, Albacete, Badajoz' },
  { scope: 'este', etiqueta: 'Región Este', desc: 'Baleares, Aragón, Cataluña, Comunidad Valenciana, Navarra' },
  { scope: 'centro', etiqueta: 'Región Centro', desc: 'Castilla y León (resto), Castilla-La Mancha (resto), Cáceres, Madrid' },
];

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
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [colCounts, setColCounts] = useState<Record<number, number>>({});
  const [deleteTarget, setDeleteTarget] = useState<Coleccion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const [resCol, resTags, resCounts, resColCounts] = await Promise.all([
        fetch('/api/admin/colecciones', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/public/tag-definiciones', { cache: 'no-store' }),
        fetch('/api/public/caracteristicas/counts', { cache: 'no-store' }),
        fetch('/api/admin/colecciones/counts', { credentials: 'include', cache: 'no-store' }),
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

      if (resColCounts.ok) {
        const cc = await resColCounts.json();
        if (cc && typeof cc === 'object') setColCounts(cc);
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
      if ((col.fuente === 'servicio' || col.fuente === 'service') && col.filtro?.tipo) {
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/colecciones/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setColecciones((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setMensaje(`"${deleteTarget.titulo_i18n.es}" eliminada`);
      setTimeout(() => setMensaje(null), 3000);
      setDeleteTarget(null);
    } catch (e: any) {
      setMensaje(`Error: ${e.message}`);
    } finally {
      setDeleting(false);
    }
  }

  const activas = colecciones.filter((c) => c.activa);
  const inactivas = colecciones.filter((c) => !c.activa);
  const totalPueblosActivas = activas.reduce((sum, c) => sum + (colCounts[c.id] ?? 0), 0);

  const shell = {
    title: 'Colecciones',
    subtitle: (
      <span>
        Gestiona las páginas temáticas de <strong className="text-white">/descubre</strong>.
        Las 8 primeras aparecen en la home.
      </span>
    ),
    heroBadges: (
      <div className="flex flex-wrap gap-2">
        <span className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {activas.length} activas
        </span>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
          {inactivas.length} desactivadas
        </span>
        <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
          ~{totalPueblosActivas} pueblos en total
        </span>
      </div>
    ),
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

  async function persistOrder(reordered: Coleccion[]) {
    setSavingOrder(true);
    const items = reordered.map((c, i) => ({ id: c.id, orden: i }));
    try {
      const res = await fetch('/api/admin/colecciones/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setMensaje('Orden actualizado');
      setTimeout(() => setMensaje(null), 2000);
      fetchAll();
    } catch (e: any) {
      setMensaje(`Error: ${e.message}`);
    } finally {
      setSavingOrder(false);
    }
  }

  function handleDragEnd(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    const list = [...activas];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setColecciones((prev) => {
      const inactive = prev.filter(c => !c.activa);
      return [...list.map((c, i) => ({ ...c, orden: i })), ...inactive];
    });
    persistOrder(list);
  }

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

      {/* Modal de confirmación de borrado */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="mx-4 w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-lg dark:bg-red-950/50">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-foreground">Eliminar colección</h3>
            </div>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-foreground">
                Vas a eliminar permanentemente <strong>&quot;{deleteTarget.titulo_i18n.es}&quot;</strong>.
              </p>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
                <p className="font-semibold text-red-700 dark:text-red-400">Consecuencias:</p>
                <ul className="mt-1.5 list-inside list-disc space-y-1 text-red-600 dark:text-red-400">
                  <li>La página <code className="rounded bg-red-100 px-1 dark:bg-red-950/50">/descubre/{deleteTarget.slug}</code> dejará de existir</li>
                  <li>Si Google la tiene indexada, generará un <strong>error 404</strong> que puede afectar al SEO</li>
                  <li>Los enlaces compartidos en redes sociales dejarán de funcionar</li>
                  <li>Esta acción <strong>no se puede deshacer</strong></li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                Si solo quieres ocultarla temporalmente, usa el botón <strong>&quot;Desactivar&quot;</strong> en su lugar.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
              </button>
            </div>
          </div>
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
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Colecciones activas
                <span className="ml-1.5 text-muted-foreground font-normal">({activas.length})</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Arrastra las filas para cambiar el orden.
                {savingOrder && <span className="ml-2 font-medium text-amber-600">Guardando…</span>}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 sm:inline-flex">
                Visibles en /descubre
              </span>
            </div>
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {activas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No hay colecciones activas.</p>
          ) : (
            <>
              {activas.map((col, idx) => (
                <div key={col.id}>
                  {/* Separador HOME/resto */}
                  {idx === 8 && (
                    <div className="flex items-center gap-3 bg-muted/20 px-5 py-2">
                      <div className="h-px flex-1 bg-border/60" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Resto de colecciones (no aparecen en Home)
                      </span>
                      <div className="h-px flex-1 bg-border/60" />
                    </div>
                  )}
                  <div
                    draggable
                    onDragStart={(e) => {
                      setDragIdx(idx);
                      e.dataTransfer.effectAllowed = 'move';
                      if (e.currentTarget instanceof HTMLElement) {
                        e.currentTarget.style.opacity = '0.4';
                      }
                    }}
                    onDragEnd={(e) => {
                      if (e.currentTarget instanceof HTMLElement) {
                        e.currentTarget.style.opacity = '1';
                      }
                      if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
                        handleDragEnd(dragIdx, dragOverIdx);
                      }
                      setDragIdx(null);
                      setDragOverIdx(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverIdx(idx);
                    }}
                    onDragLeave={() => {
                      if (dragOverIdx === idx) setDragOverIdx(null);
                    }}
                    className={`transition-all duration-100 ${
                      dragOverIdx === idx && dragIdx !== null && dragIdx !== idx
                        ? 'bg-primary/5 ring-1 ring-inset ring-primary/30'
                        : ''
                    }`}
                  >
                    <ColeccionRow
                      col={col}
                      idx={idx}
                      totalActivas={activas.length}
                      counts={counts}
                      colPuebloCount={colCounts[col.id] ?? null}
                      isEditing={editingId === col.id}
                      onToggleEdit={() => setEditingId(editingId === col.id ? null : col.id)}
                      onToggleActiva={() => toggleActiva(col)}
                      onDelete={() => setDeleteTarget(col)}
                      onSaved={() => { setEditingId(null); fetchAll(); }}
                      isDragging={dragIdx === idx}
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Inactivas */}
      {inactivas.length > 0 && (
        <div className={`${sectionCard} mt-6`}>
          <div className={sectionHead}>
            <h2 className="text-sm font-semibold text-foreground">
              Colecciones desactivadas
              <span className="ml-1.5 text-muted-foreground font-normal">({inactivas.length})</span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              No se muestran en la web. Puedes activarlas cuando quieras.
            </p>
          </div>
          <div className="divide-y divide-border/40">
            {inactivas.map((col, idx) => (
              <ColeccionRow
                key={col.id}
                col={col}
                idx={idx}
                totalActivas={0}
                counts={counts}
                colPuebloCount={colCounts[col.id] ?? null}
                isEditing={editingId === col.id}
                onToggleEdit={() => setEditingId(editingId === col.id ? null : col.id)}
                onToggleActiva={() => toggleActiva(col)}
                onDelete={() => setDeleteTarget(col)}
                onSaved={() => { setEditingId(null); fetchAll(); }}
              />
            ))}
          </div>
        </div>
      )}
    </GestionAsociacionSubpageShell>
  );
}

/* ────── Fila de colección ────── */

function ColeccionRow({
  col,
  idx,
  totalActivas,
  counts,
  colPuebloCount,
  isEditing,
  onToggleEdit,
  onToggleActiva,
  onDelete,
  onSaved,
  isDragging,
}: {
  col: Coleccion;
  idx: number;
  totalActivas: number;
  counts: PuebloCounts;
  colPuebloCount: number | null;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleActiva: () => void;
  onDelete: () => void;
  onSaved: () => void;
  isDragging?: boolean;
}) {
  const isHome = col.activa && idx < 8;
  const displayCount = colPuebloCount;

  return (
    <div className={`transition-all ${isDragging ? 'opacity-30 scale-[0.98]' : ''}`}>
      <div className={`flex items-center gap-0 ${col.activa ? 'hover:bg-muted/20' : 'opacity-60 hover:opacity-80'} transition-colors`}>
        {/* Drag handle + posición */}
        {col.activa && (
          <div
            className="flex w-12 shrink-0 cursor-grab flex-col items-center justify-center gap-0.5 py-3 text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
            title="Arrastra para reordenar"
          >
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground/50">{idx + 1}</span>
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="5" r="1.2" /><circle cx="11" cy="5" r="1.2" />
              <circle cx="5" cy="11" r="1.2" /><circle cx="11" cy="11" r="1.2" />
            </svg>
          </div>
        )}

        {/* Miniatura */}
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[88px]">
          {col.imagenUrl ? (
            <Image src={col.imagenUrl} alt="" fill className="object-cover" sizes="88px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-muted-foreground/30">{col.icono || '📷'}</div>
          )}
          {isHome && (
            <div className="absolute left-0 top-0 rounded-br-md bg-primary/90 px-1 py-0.5 text-[7px] font-bold uppercase leading-none text-white">
              HOME
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-foreground">{col.titulo_i18n.es}</span>
            {displayCount !== null && (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none ${
                col.fuente === 'meteo'
                  ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400'
                  : displayCount === 0
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                  : displayCount < 3
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
              }`}>
                {col.fuente === 'meteo' ? 'Dinámico' : `${displayCount}`}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="truncate">/descubre/{col.slug}</span>
            <span className="shrink-0 text-muted-foreground/30">·</span>
            <span className="shrink-0">{FUENTE_LABELS[col.fuente] ?? col.fuente}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex shrink-0 items-center gap-0.5 px-3">
          <Link
            href={`/descubre/${col.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            <span className="hidden sm:inline">Ver</span>
          </Link>
          <button
            onClick={onToggleEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            onClick={onToggleActiva}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              col.activa
                ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30'
                : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30'
            }`}
            title={col.activa ? 'Ocultar temporalmente (no elimina)' : 'Hacer visible en la web'}
          >
            {col.activa ? (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
            ) : (
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            )}
            <span className="hidden sm:inline">{col.activa ? 'Ocultar' : 'Activar'}</span>
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
            title="Eliminar permanentemente"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="border-t border-border/40">
          <EditColeccionForm col={col} onSaved={onSaved} onCancel={onToggleEdit} />
        </div>
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
  const [translating, setTranslating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const idiomasCubiertos = useMemo(() => {
    const required = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'];
    const t = col.titulo_i18n ?? {};
    const d = col.descripcion_i18n ?? {};
    return required.filter((l) => (t[l] ?? '').trim() && (d[l] ?? '').trim()).length;
  }, [col]);

  async function handleUploadFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrMsg(null);
    try {
      const result = await uploadImageToR2(file, 'colecciones');
      setImagenUrl(result.url);
      if (result.warning) setErrMsg(result.warning);
    } catch (err: any) {
      setErrMsg(err.message ?? 'Error subiendo imagen');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

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

  async function handleTranslate() {
    if (!confirm('Traducir esta colección a inglés, francés, alemán, portugués, italiano y catalán con DeepL?\n\nSe sobrescribirán los textos existentes en esos idiomas (el español se mantiene tal cual).')) {
      return;
    }
    setTranslating(true);
    setErrMsg(null);
    try {
      const res = await fetch(`/api/admin/colecciones/${col.id}/translate`, {
        method: 'POST',
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
      setTranslating(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border/40 p-4">
      {/* Foto de portada */}
      <div>
        <label className="text-xs font-semibold text-foreground">Foto de portada</label>
        <p className="mb-2 text-[10px] text-muted-foreground">
          Esta imagen aparece en la tarjeta de la home y en la cabecera de la coleccion. Sube una nueva o pega una URL.
        </p>
        <div className="flex items-start gap-3">
          {imagenUrl ? (
            <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
              <Image src={imagenUrl} alt="" fill className="object-cover" sizes="128px" />
              <button
                onClick={() => setImagenUrl('')}
                className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white hover:bg-black/80"
                title="Quitar imagen"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/30 text-muted-foreground/40">
              <span className="text-2xl">📷</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFoto}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={btnSecondary}
            >
              {uploading ? 'Subiendo...' : 'Subir foto'}
            </button>
            <input
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              className={`${field} mt-0 text-xs`}
              placeholder="o pega una URL directa..."
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Titulo de la pagina</label>
          <input value={tituloEs} onChange={(e) => setTituloEs(e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Titulo SEO (Google)</label>
          <input value={seoTitleEs} onChange={(e) => setSeoTitleEs(e.target.value)} className={field} placeholder="Se genera automaticamente si lo dejas vacio" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripcion de la pagina</label>
        <textarea value={descEs} onChange={(e) => setDescEs(e.target.value)} rows={2} className={field} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descripcion SEO (Google)</label>
        <textarea value={seoDescEs} onChange={(e) => setSeoDescEs(e.target.value)} rows={2} className={field} placeholder="Se usa la descripcion si lo dejas vacio" />
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Posicion</label>
          <input type="number" value={orden} onChange={(e) => setOrden(Number(e.target.value))} className={field} />
          <p className="mt-0.5 text-[10px] text-muted-foreground">Menor = mas arriba</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Min. pueblos para mostrar</label>
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

      {/* Idiomas / DeepL */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🌐</span>
          <div>
            <div className="text-xs font-semibold text-foreground">
              Idiomas: <span className={idiomasCubiertos === 7 ? 'text-emerald-600' : 'text-amber-600'}>{idiomasCubiertos}/7</span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {idiomasCubiertos === 7
                ? 'Cubiertos: es · en · fr · de · pt · it · ca'
                : 'Faltan idiomas para SEO internacional. Pulsa traducir.'}
            </div>
          </div>
        </div>
        <div className="ml-auto">
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating || saving}
            className={btnSecondary}
            title="Traduce título, descripción y meta SEO al resto de idiomas con DeepL"
          >
            {translating ? 'Traduciendo…' : '🌐 Traducir a 6 idiomas'}
          </button>
        </div>
      </div>

      {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving || uploading} className={btnPrimary}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
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
  const [fuente, setFuente] = useState<'caracteristica' | 'servicio' | 'ranking'>('caracteristica');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedServicio, setSelectedServicio] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');

  // Solo para fuente='ranking'
  const [rankMetric, setRankMetric] = useState<'rating' | 'visitas' | 'pageviews'>('rating');
  const [rankLimit, setRankLimit] = useState<10 | 20 | 30>(10);
  const [rankScope, setRankScope] =
    useState<'nacional' | 'norte' | 'sur' | 'este' | 'centro'>('nacional');
  const [rankPreviewCount, setRankPreviewCount] = useState<number | null>(null);
  const [rankPreviewLoading, setRankPreviewLoading] = useState(false);

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

  // Preview en vivo del título/slug/descripción para fuente='ranking'
  const rankingPreview = useMemo(() => {
    if (fuente !== 'ranking') return null;
    const metricLbl =
      rankMetric === 'rating' ? 'más bonitos'
      : rankMetric === 'visitas' ? 'más visitados'
      : 'más buscados online';
    const scopeLbl =
      rankScope === 'nacional'
        ? 'de España'
        : `del ${rankScope.charAt(0).toUpperCase()}${rankScope.slice(1)}`;
    const titulo = `Los ${rankLimit} pueblos ${metricLbl} ${scopeLbl}`;
    const desc = `Ranking dinámico de los ${rankLimit} pueblos ${metricLbl}${
      rankScope === 'nacional' ? '' : ' ' + scopeLbl
    } de la red Los Pueblos Más Bonitos de España. Calculado en tiempo real con datos reales.`;
    const slugPv = titulo
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return { titulo, desc, slug: slugPv };
  }, [fuente, rankMetric, rankLimit, rankScope]);

  // Cuenta en tiempo real cuántos pueblos coincidirían con el filtro de ranking
  useEffect(() => {
    if (fuente !== 'ranking') return;
    const filtro: any = { metric: rankMetric, limit: rankLimit };
    if (rankMetric === 'rating') filtro.minVotos = 3;
    if (rankScope !== 'nacional') {
      filtro.scope = { region: rankScope };
    }

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setRankPreviewLoading(true);
        const res = await fetch('/api/admin/colecciones/preview-count', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fuente: 'ranking', filtro }),
          credentials: 'include',
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setRankPreviewCount(typeof data.count === 'number' ? data.count : null);
        }
      } catch {
        // ignore aborts/errores
      } finally {
        setRankPreviewLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [fuente, rankMetric, rankLimit, rankScope]);

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

  function applyRankingPreset() {
    const metricLbl =
      rankMetric === 'rating' ? 'más bonitos'
      : rankMetric === 'visitas' ? 'más visitados'
      : 'más buscados online';
    const scopeLbl =
      rankScope === 'nacional'
        ? 'de España'
        : `del ${rankScope.charAt(0).toUpperCase()}${rankScope.slice(1)}`;
    const titulo = `Los ${rankLimit} pueblos ${metricLbl} ${scopeLbl}`;

    setTituloEs(titulo);
    setSlug(autoSlug(titulo));
    setIcono(rankMetric === 'rating' ? 'star' : rankMetric === 'visitas' ? 'users' : 'search');
    setColor(rankMetric === 'rating' ? '#D4AF37' : rankMetric === 'visitas' ? '#5A8B6A' : '#4A7BB7');
    setDescEs(
      `Ranking dinámico de los ${rankLimit} pueblos ${metricLbl}${
        rankScope === 'nacional' ? '' : ' ' + scopeLbl
      } de la red Los Pueblos Más Bonitos de España. Calculado en tiempo real con datos reales.`,
    );
    setSeoTitleEs(`${titulo} | Los Pueblos Más Bonitos de España`);
    setSeoDescEs(
      `Descubre los ${rankLimit} pueblos ${metricLbl} ${scopeLbl} de la red oficial Los Pueblos Más Bonitos de España. Ranking actualizado.`,
    );
    setOrden(200);
    setStep('details');
  }

  function buildRankingFiltro(): any {
    const filtro: any = { metric: rankMetric, limit: rankLimit };
    if (rankMetric === 'rating') filtro.minVotos = 3;
    if (rankScope !== 'nacional') {
      filtro.scope = { region: rankScope };
    }
    return filtro;
  }

  async function handleCreate() {
    setSaving(true);
    setErrMsg(null);
    try {
      const finalSlug = slug.trim() || autoSlug(tituloEs);
      if (!finalSlug) throw new Error('Se necesita un título');
      if (!tituloEs.trim()) throw new Error('Se necesita un título');

      const filtro =
        fuente === 'caracteristica'
          ? { tag: selectedTag }
          : fuente === 'servicio'
          ? { tipo: selectedServicio }
          : buildRankingFiltro();

      const body: any = {
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
      // Las colecciones tipo ranking se crean ocultas: las activan los admin tras revisar.
      if (fuente === 'ranking') body.activa = false;

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
          {step === 'pick' && `Nueva colección — Paso 2: ${
            fuente === 'caracteristica' ? 'Elige la característica' :
            fuente === 'servicio' ? 'Elige el servicio' :
            'Configura el ranking'
          }`}
          {step === 'details' && 'Nueva colección — Paso 3: Detalles de la página'}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {step === 'source' && '¿Qué tipo de dato alimenta esta colección?'}
          {step === 'pick' && fuente === 'caracteristica' && `Se muestran las características que aún no tienen página (${availableTags.length} disponibles)`}
          {step === 'pick' && fuente === 'servicio' && `Se muestran los servicios del mapa que aún no tienen página (${availableServicios.length} disponibles)`}
          {step === 'pick' && fuente === 'ranking' && 'Define qué métrica, tamaño y ámbito quieres rankear. Se actualizará automáticamente.'}
          {step === 'details' && 'Revisa y personaliza los textos antes de crear la página'}
        </p>
      </div>
      <div className={`${sectionBody} space-y-4`}>

        {/* STEP 1: Elegir fuente */}
        {step === 'source' && (
          <div className="space-y-3">
            <p className="text-sm text-foreground">
              Cada colección agrupa pueblos que comparten algo en común. Elige de dónde viene ese dato:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                onClick={() => { setFuente('caracteristica'); setStep('pick'); }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50 hover:shadow-md ${
                  fuente === 'caracteristica' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="text-lg">🏰</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Característica del pueblo</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Catedrales, castillos, bodegas, murallas… marcadas por los alcaldes en la sección &quot;Características&quot;.
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
              <button
                onClick={() => { setFuente('ranking'); setStep('pick'); }}
                className={`rounded-xl border-2 p-4 text-left transition-all hover:border-primary/50 hover:shadow-md ${
                  fuente === 'ranking' ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="text-lg">🏆</div>
                <div className="mt-1 text-sm font-semibold text-foreground">Valoraciones y usuarios</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Top 10/20/30 dinámicos por valoración (Wilson), visitas reales o búsquedas online. Ámbito nacional, regional o por característica.
                </p>
                <p className="mt-1 text-[10px] font-medium text-amber-600">
                  Se crea oculta · solo admins
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

        {step === 'pick' && fuente === 'ranking' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('source')} className={btnSecondary}>
                ← Atrás
              </button>
              <p className="text-xs text-muted-foreground">
                Estas colecciones se calculan en tiempo real y se crean <strong>ocultas</strong> hasta que las actives.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              {/* Columna principal: selectores */}
              <div className="space-y-4">
                {/* Métrica */}
                <div>
                  <label className="text-xs font-semibold text-foreground">1. Métrica del ranking</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {RANKING_METRICAS.map((m) => (
                      <button
                        key={m.metric}
                        type="button"
                        onClick={() => setRankMetric(m.metric)}
                        className={`rounded-xl border-2 p-3 text-left text-sm transition-all hover:border-primary/50 ${
                          rankMetric === m.metric ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="text-base">{m.emoji}</div>
                        <div className="mt-1 font-semibold">{m.etiqueta}</div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Límite */}
                <div>
                  <label className="text-xs font-semibold text-foreground">2. Tamaño del Top</label>
                  <div className="mt-2 flex gap-2">
                    {[10, 20, 30].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRankLimit(n as 10 | 20 | 30)}
                        className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-all hover:border-primary/50 ${
                          rankLimit === n ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground'
                        }`}
                      >
                        Top {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Máximo 30 (la red tiene 126 pueblos).</p>
                </div>

                {/* Ámbito */}
                <div>
                  <label className="text-xs font-semibold text-foreground">3. Ámbito</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {RANKING_SCOPES.map((s) => (
                      <button
                        key={s.scope}
                        type="button"
                        onClick={() => setRankScope(s.scope)}
                        className={`rounded-xl border-2 p-2.5 text-left text-sm transition-all hover:border-primary/50 ${
                          rankScope === s.scope ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                      >
                        <div className="font-semibold text-foreground">{s.etiqueta}</div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Para rankings por característica (castillo, costeros, altura…) usa el tipo «Característica» o «Servicio» del paso 1.
                  </p>
                </div>
              </div>

              {/* Columna lateral: vista previa en vivo */}
              <aside className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Vista previa
                </div>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  {rankingPreview?.titulo ?? '—'}
                </h3>
                <p className="mt-2 break-all rounded-md bg-background/60 px-2 py-1 text-[11px] font-mono text-muted-foreground">
                  /descubre/{rankingPreview?.slug ?? ''}
                </p>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {rankingPreview?.desc ?? ''}
                </p>
                <div className="mt-3 flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">Pueblos disponibles</div>
                  <div className="text-sm font-semibold text-foreground">
                    {rankPreviewLoading ? (
                      <span className="text-muted-foreground">…</span>
                    ) : rankPreviewCount === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <>
                        {Math.min(rankPreviewCount, rankLimit)} <span className="text-[11px] font-normal text-muted-foreground">/ {rankLimit}</span>
                      </>
                    )}
                  </div>
                </div>
                {rankPreviewCount !== null && rankPreviewCount < rankLimit && (
                  <p className="mt-2 text-[11px] text-amber-700">
                    ⚠️ Solo hay {rankPreviewCount} pueblos elegibles para este filtro. Considera bajar el tamaño del Top.
                  </p>
                )}
                <p className="mt-3 text-[10px] text-muted-foreground">
                  En el siguiente paso podrás <strong>editar título, slug, descripción, SEO e icono</strong> antes de crear la página.
                </p>
              </aside>
            </div>

            {/* Continuar */}
            <div className="flex gap-2 border-t border-border/40 pt-3">
              <button
                type="button"
                onClick={applyRankingPreset}
                className={btnPrimary}
              >
                Continuar a edición de texto y SEO →
              </button>
              <button onClick={onCancel} className={btnSecondary}>Cancelar</button>
            </div>
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
                  {fuente === 'caracteristica' && (tags.find((t) => t.tag === selectedTag)?.nombre_i18n.es ?? selectedTag)}
                  {fuente === 'servicio' && (SERVICIOS_PARA_COLECCION.find((s) => s.tipo === selectedServicio)?.etiqueta ?? selectedServicio)}
                  {fuente === 'ranking' && (
                    <>
                      Top {rankLimit} ·{' '}
                      {RANKING_METRICAS.find((m) => m.metric === rankMetric)?.etiqueta} ·{' '}
                      {RANKING_SCOPES.find((s) => s.scope === rankScope)?.etiqueta}
                    </>
                  )}
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
