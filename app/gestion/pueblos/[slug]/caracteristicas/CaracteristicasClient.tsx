'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

/* ────── Tipos ────── */

type TagDef = {
  id: number;
  tag: string;
  categoria: string;
  nombre_i18n: Record<string, string>;
  icono: string;
  color: string;
  tieneNivel: boolean;
  niveles: string[] | null;
  tieneSiglo: boolean;
  tieneVisitable: boolean;
};

type CaracteristicaExistente = {
  id: number;
  tagId: number;
  nivel: string | null;
  siglo: string | null;
  detalle: string | null;
  visitable: boolean | null;
  poiId: number | null;
  pageId: number | null;
  fotoOverride: string | null;
  tag: TagDef;
  poi?: { id: number; nombre: string; foto: string | null } | null;
  page?: { id: number; titulo: string; coverUrl: string | null } | null;
};

type LocalState = {
  activo: boolean;
  nivel: string | null;
  siglo: string;
  visitable: boolean | null;
  detalle: string;
  poiId: number | null;
  pageId: number | null;
  fotoOverride: string;
};

type Suggestion = {
  pois: { id: number; nombre: string; foto: string | null }[];
  pages: { id: number; titulo: string; coverUrl: string | null }[];
};

/* ────── Estilos reutilizables (misma familia que en-cifras, descripcion) ────── */

const field =
  'mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const sectionCard = 'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm';
const sectionHead = 'border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6';
const sectionBody = 'p-5 sm:p-6';

/* ────── Nombres legibles de categorías ────── */

const CATEGORY_LABELS: Record<string, string> = {
  PATRIMONIO_MILITAR: '🏰 Patrimonio Militar',
  PATRIMONIO_RELIGIOSO: '⛪ Patrimonio Religioso',
  PATRIMONIO_CIVIL: '🏛️ Patrimonio Civil',
  PATRIMONIO_ARTISTICO: '🎨 Estilos Artísticos',
  NATURALEZA: '🌿 Naturaleza y Paisaje',
  GASTRONOMIA: '🍷 Gastronomía y Tradición',
  ATMOSFERA: '✨ Atmósfera y Certificaciones',
  ACCESIBILIDAD: '♿ Accesibilidad y Servicios',
};

function categoryLabel(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat;
}

/* ────── Nombres de nivel para UI ────── */

const NIVEL_LABELS: Record<string, string> = {
  VISITABLE: '🏰 Visitable / Monumental',
  RUINAS_CONSOLIDADAS: '🏚️ Ruinas Consolidadas',
  VESTIGIOS: '🧱 Vestigios / Restos',
  BIEN_CONSERVADO: '✅ Bien Conservado',
  PARCIAL: '🔧 Parcialmente Conservado',
  RESTOS: '🧱 Restos',
  TRAMO_VISITABLE: '🚶 Tramo Visitable',
  RECINTO_PARCIAL: '🧩 Recinto Parcial',
  PUERTA_AISLADA: '🚪 Puerta Aislada',
  ACTIVIDAD: '🏭 En Actividad',
  MUSEO: '🏛️ Museo / Visitable',
  ABANDONADA: '🏚️ Abandonada (con encanto)',
  NATURAL: '🌊 Piscina / Playa Natural',
  PISCINA_MUNICIPAL_VERANO: '🏊 Piscina Municipal Verano',
};

function nivelLabel(n: string) {
  return NIVEL_LABELS[n] ?? n;
}

/* ────── Componente principal ────── */

export default function CaracteristicasClient({
  puebloId,
  slug,
  puebloNombre,
}: {
  puebloId: number;
  slug: string;
  puebloNombre: string;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const mensajeEsError = mensaje != null && (mensaje.includes('Error') || mensaje.includes('permisos'));

  const [tagsByCategory, setTagsByCategory] = useState<Record<string, TagDef[]>>({});
  const [localState, setLocalState] = useState<Record<number, LocalState>>({});
  const [suggestions, setSuggestions] = useState<Record<number, Suggestion>>({});
  const [expandedTag, setExpandedTag] = useState<number | null>(null);
  const [filterText, setFilterText] = useState('');

  const allTags = useMemo(() => Object.values(tagsByCategory).flat(), [tagsByCategory]);
  const activoCount = useMemo(() => Object.values(localState).filter((s) => s.activo).length, [localState]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);

      const [tagsRes, existRes] = await Promise.all([
        fetch('/api/public/tag-definiciones', { cache: 'no-store' }),
        fetch(`/api/admin/pueblos/${puebloId}/caracteristicas`, {
          credentials: 'include',
          cache: 'no-store',
        }),
      ]);

      if (existRes.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (existRes.status === 403) {
        setErr('No tienes permisos para editar este pueblo.');
        return;
      }

      if (!tagsRes.ok) throw new Error('Error al cargar tags');
      if (!existRes.ok) throw new Error('Error al cargar características');

      const tagsGrouped: Record<string, TagDef[]> = await tagsRes.json();
      const existing: CaracteristicaExistente[] = await existRes.json();

      setTagsByCategory(tagsGrouped);

      const existingMap = new Map<number, CaracteristicaExistente>();
      for (const c of existing) existingMap.set(c.tagId, c);

      const initial: Record<number, LocalState> = {};
      for (const tags of Object.values(tagsGrouped)) {
        for (const t of tags) {
          const ex = existingMap.get(t.id);
          initial[t.id] = ex
            ? {
                activo: true,
                nivel: ex.nivel,
                siglo: ex.siglo ?? '',
                visitable: ex.visitable,
                detalle: ex.detalle ?? '',
                poiId: ex.poiId,
                pageId: ex.pageId,
                fotoOverride: ex.fotoOverride ?? '',
              }
            : {
                activo: false,
                nivel: null,
                siglo: '',
                visitable: null,
                detalle: '',
                poiId: null,
                pageId: null,
                fotoOverride: '',
              };
        }
      }
      setLocalState(initial);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggle(tagId: number) {
    setLocalState((prev) => {
      const cur = prev[tagId];
      if (!cur) return prev;
      return { ...prev, [tagId]: { ...cur, activo: !cur.activo } };
    });
  }

  function updateField(tagId: number, field: keyof LocalState, value: any) {
    setLocalState((prev) => {
      const cur = prev[tagId];
      if (!cur) return prev;
      return { ...prev, [tagId]: { ...cur, [field]: value } };
    });
  }

  async function loadSuggestions(tagId: number, tagName: string) {
    if (suggestions[tagId]) return;
    try {
      const res = await fetch(`/api/admin/pueblos/${puebloId}/caracteristicas/suggest/${tagName}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data: Suggestion = await res.json();
        setSuggestions((prev) => ({ ...prev, [tagId]: data }));
      }
    } catch {
      // silently fail
    }
  }

  function handleExpand(tag: TagDef) {
    const newId = expandedTag === tag.id ? null : tag.id;
    setExpandedTag(newId);
    if (newId !== null) {
      loadSuggestions(tag.id, tag.tag);
    }
  }

  async function handleGuardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const items = allTags
        .filter((t) => localState[t.id]?.activo)
        .map((t) => {
          const s = localState[t.id]!;
          return {
            tagId: t.id,
            nivel: s.nivel || null,
            siglo: s.siglo.trim() || null,
            detalle: s.detalle.trim() || null,
            visitable: s.visitable,
            poiId: s.poiId,
            pageId: s.pageId,
            fotoOverride: s.fotoOverride.trim() || null,
          };
        });

      const res = await fetch(`/api/admin/pueblos/${puebloId}/caracteristicas/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });

      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (res.status === 403) {
        setMensaje('No tienes permisos');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? `Error ${res.status}`);
      }

      setMensaje('Cambios guardados correctamente.');
      setTimeout(() => setMensaje(null), 5000);
    } catch (e: unknown) {
      setMensaje(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  /* ────── Render ────── */

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 rounded-2xl bg-muted/60" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted/50" />
        ))}
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
        {err}
      </div>
    );
  }

  const categories = Object.keys(tagsByCategory);

  return (
    <div className="space-y-6">
      {/* Resumen + filtro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{activoCount}</span> característica{activoCount !== 1 ? 's' : ''} marcada{activoCount !== 1 ? 's' : ''}
        </p>
        <input
          type="text"
          placeholder="Buscar etiqueta…"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 sm:max-w-xs"
        />
      </div>

      {/* Categorías */}
      {categories.map((cat) => {
        const tags = tagsByCategory[cat];
        const filtered = filterText
          ? tags.filter((t) => {
              const nombre = (t.nombre_i18n as Record<string, string>).es ?? t.tag;
              return nombre.toLowerCase().includes(filterText.toLowerCase()) || t.tag.toLowerCase().includes(filterText.toLowerCase());
            })
          : tags;

        if (filtered.length === 0) return null;

        return (
          <div key={cat} className={sectionCard}>
            <div className={sectionHead}>
              <h2 className="text-sm font-semibold text-foreground">{categoryLabel(cat)}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {filtered.filter((t) => localState[t.id]?.activo).length} de {filtered.length} marcadas
              </p>
            </div>
            <div className={sectionBody}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((tag) => {
                  const state = localState[tag.id];
                  if (!state) return null;
                  const nombre = (tag.nombre_i18n as Record<string, string>).es ?? tag.tag;
                  const isExpanded = expandedTag === tag.id;
                  const niveles = tag.tieneNivel && tag.niveles ? (tag.niveles as string[]) : null;

                  return (
                    <div
                      key={tag.id}
                      className={`rounded-xl border p-3 transition-all ${
                        state.activo
                          ? 'border-amber-400/50 bg-amber-50/40 shadow-sm dark:border-amber-700/40 dark:bg-amber-950/20'
                          : 'border-border/60 bg-muted/10 hover:border-border'
                      }`}
                    >
                      {/* Toggle row */}
                      <label className="flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={state.activo}
                          onChange={() => toggle(tag.id)}
                          className="h-4 w-4 shrink-0 rounded border-input text-amber-600 accent-amber-600"
                        />
                        <span className="flex-1 text-sm font-medium text-foreground">{nombre}</span>
                        {state.activo && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleExpand(tag);
                            }}
                            className="text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300"
                            title="Editar detalles"
                          >
                            {isExpanded ? '▲' : '▼'}
                          </button>
                        )}
                      </label>

                      {/* Detalles expandidos */}
                      {state.activo && isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                          {/* Nivel */}
                          {niveles && niveles.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Nivel / Estado</label>
                              <select
                                value={state.nivel ?? ''}
                                onChange={(e) => updateField(tag.id, 'nivel', e.target.value || null)}
                                className={field}
                              >
                                <option value="">— Sin especificar —</option>
                                {niveles.map((n) => (
                                  <option key={n} value={n}>{nivelLabel(n)}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Siglo */}
                          {tag.tieneSiglo && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Siglo / Época</label>
                              <input
                                type="text"
                                value={state.siglo}
                                onChange={(e) => updateField(tag.id, 'siglo', e.target.value)}
                                placeholder="Ej: S. XII, S. XVI-XVIII"
                                maxLength={30}
                                className={field}
                              />
                            </div>
                          )}

                          {/* Visitable */}
                          {tag.tieneVisitable && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">¿Es visitable?</label>
                              <select
                                value={state.visitable === true ? 'true' : state.visitable === false ? 'false' : ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  updateField(tag.id, 'visitable', v === '' ? null : v === 'true');
                                }}
                                className={field}
                              >
                                <option value="">— Sin especificar —</option>
                                <option value="true">Sí, visitable</option>
                                <option value="false">No visitable</option>
                              </select>
                            </div>
                          )}

                          {/* Detalle */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Detalle (opcional)</label>
                            <input
                              type="text"
                              value={state.detalle}
                              onChange={(e) => updateField(tag.id, 'detalle', e.target.value)}
                              placeholder="Breve nota visible en la web"
                              maxLength={120}
                              className={field}
                            />
                          </div>

                          {/* Vincular POI / Page */}
                          <SuggestionPicker
                            tagId={tag.id}
                            suggestion={suggestions[tag.id]}
                            selectedPoiId={state.poiId}
                            selectedPageId={state.pageId}
                            fotoOverride={state.fotoOverride}
                            onSelectPoi={(id) => {
                              updateField(tag.id, 'poiId', id);
                              updateField(tag.id, 'pageId', null);
                            }}
                            onSelectPage={(id) => {
                              updateField(tag.id, 'pageId', id);
                              updateField(tag.id, 'poiId', null);
                            }}
                            onFotoOverride={(url) => updateField(tag.id, 'fotoOverride', url)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Barra de guardado */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/95 px-5 py-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{activoCount}</span> característica{activoCount !== 1 ? 's' : ''} seleccionada{activoCount !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          {mensaje && (
            <p
              className={`text-sm font-medium ${mensajeEsError ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`}
              role="status"
            >
              {mensaje}
            </p>
          )}
          <button type="button" onClick={handleGuardar} disabled={guardando} className={btnPrimary}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────── Sub-componente: selector de POI / Page / foto ────── */

function SuggestionPicker({
  tagId,
  suggestion,
  selectedPoiId,
  selectedPageId,
  fotoOverride,
  onSelectPoi,
  onSelectPage,
  onFotoOverride,
}: {
  tagId: number;
  suggestion?: Suggestion;
  selectedPoiId: number | null;
  selectedPageId: number | null;
  fotoOverride: string;
  onSelectPoi: (id: number | null) => void;
  onSelectPage: (id: number | null) => void;
  onFotoOverride: (url: string) => void;
}) {
  const hasSuggestions = suggestion && (suggestion.pois.length > 0 || suggestion.pages.length > 0);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Foto para colecciones</p>

      {!suggestion && (
        <p className="text-xs text-muted-foreground/70 italic">Cargando sugerencias…</p>
      )}

      {suggestion && !hasSuggestions && (
        <p className="text-xs text-muted-foreground/70">No se encontraron POIs ni páginas relacionadas.</p>
      )}

      {hasSuggestions && (
        <div className="space-y-1.5">
          {suggestion!.pois.map((p) => (
            <label
              key={`poi-${p.id}`}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                selectedPoiId === p.id ? 'border-amber-400 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30' : 'border-border/50 hover:border-border'
              }`}
            >
              <input
                type="radio"
                name={`foto-source-${tagId}`}
                checked={selectedPoiId === p.id}
                onChange={() => onSelectPoi(p.id)}
                className="h-3 w-3 accent-amber-600"
              />
              {p.foto && (
                <img src={p.foto} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
              )}
              <span className="truncate">POI: {p.nombre}</span>
            </label>
          ))}
          {suggestion!.pages.map((p) => (
            <label
              key={`page-${p.id}`}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                selectedPageId === p.id ? 'border-amber-400 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-950/30' : 'border-border/50 hover:border-border'
              }`}
            >
              <input
                type="radio"
                name={`foto-source-${tagId}`}
                checked={selectedPageId === p.id}
                onChange={() => onSelectPage(p.id)}
                className="h-3 w-3 accent-amber-600"
              />
              {p.coverUrl && (
                <img src={p.coverUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
              )}
              <span className="truncate">Página: {p.titulo}</span>
            </label>
          ))}
          {(selectedPoiId || selectedPageId) && (
            <button
              type="button"
              onClick={() => { onSelectPoi(null); onSelectPage(null); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕ Quitar enlace
            </button>
          )}
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground">URL de foto manual (override)</label>
        <input
          type="url"
          value={fotoOverride}
          onChange={(e) => onFotoOverride(e.target.value)}
          placeholder="https://…"
          className={field}
        />
      </div>
    </div>
  );
}
