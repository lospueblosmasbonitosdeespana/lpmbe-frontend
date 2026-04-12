'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

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
  cantidad: number | null;
  poiId: number | null;
  pageId: number | null;
  multiexperienciaId: number | null;
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
  cantidad: number | null;
  detalle: string;
  poiId: number | null;
  pageId: number | null;
  multiexperienciaId: number | null;
  fotoOverride: string;
};

type LinkedContent = {
  pois: { id: number; nombre: string; foto: string | null }[];
  pages: { id: number; titulo: string; slug: string; coverUrl: string | null }[];
};

/* ────── Estilos ────── */

const field =
  'mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

const sectionCard = 'overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm';
const sectionHead = 'border-b border-border/60 bg-muted/30 px-5 py-3 sm:px-6';
const sectionBody = 'p-5 sm:p-6';

/* ────── Labels ────── */

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
  const [linkedContent, setLinkedContent] = useState<LinkedContent | null>(null);
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

      if (existRes.status === 401) { window.location.href = '/entrar'; return; }
      if (existRes.status === 403) { setErr('No tienes permisos para editar este pueblo.'); return; }
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
                cantidad: ex.cantidad,
                detalle: ex.detalle ?? '',
                poiId: ex.poiId,
                pageId: ex.pageId,
                multiexperienciaId: ex.multiexperienciaId ?? null,
                fotoOverride: ex.fotoOverride ?? '',
              }
            : {
                activo: false,
                nivel: null,
                siglo: '',
                visitable: null,
                cantidad: null,
                detalle: '',
                poiId: null,
                pageId: null,
                multiexperienciaId: null,
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

  useEffect(() => { loadData(); }, [loadData]);

  const loadLinkedContent = useCallback(async () => {
    if (linkedContent) return;
    try {
      const res = await fetch(`/api/admin/pueblos/${puebloId}/linked-content`, {
        credentials: 'include', cache: 'no-store',
      });
      if (res.ok) setLinkedContent(await res.json());
    } catch { /* silently fail */ }
  }, [puebloId, linkedContent]);

  function toggle(tagId: number) {
    setLocalState((prev) => {
      const cur = prev[tagId];
      if (!cur) return prev;
      return { ...prev, [tagId]: { ...cur, activo: !cur.activo } };
    });
  }

  function updateField(tagId: number, key: keyof LocalState, value: any) {
    setLocalState((prev) => {
      const cur = prev[tagId];
      if (!cur) return prev;
      return { ...prev, [tagId]: { ...cur, [key]: value } };
    });
  }

  function handleExpand(tag: TagDef) {
    const newId = expandedTag === tag.id ? null : tag.id;
    setExpandedTag(newId);
    if (newId !== null) loadLinkedContent();
  }

  function selectLinked(tagId: number, type: 'poi' | 'page', id: number | null) {
    setLocalState(prev => {
      const cur = prev[tagId];
      if (!cur) return prev;
      return {
          ...prev,
          [tagId]: {
            ...cur,
            poiId: type === 'poi' ? id : null,
            pageId: type === 'page' ? id : null,
            multiexperienciaId: null,
          },
        };
    });
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
            cantidad: s.cantidad != null && s.cantidad > 0 ? s.cantidad : null,
            poiId: s.poiId,
            pageId: s.pageId,
            multiexperienciaId: s.multiexperienciaId,
            fotoOverride: s.fotoOverride.trim() || null,
          };
        });

      const res = await fetch(`/api/admin/pueblos/${puebloId}/caracteristicas/sync`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
        credentials: 'include',
      });

      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (res.status === 403) { setMensaje('No tienes permisos'); return; }
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
        {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-muted/50" />)}
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
                      {/* Toggle */}
                      <div className="flex items-center gap-3">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <input type="checkbox" checked={state.activo} onChange={() => toggle(tag.id)} className="h-4 w-4 shrink-0 rounded border-input text-amber-600 accent-amber-600" />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{nombre}</span>
                        </label>
                        {state.activo && (
                          <div className="flex shrink-0 items-center gap-2">
                            <div className="flex items-center gap-1" title="¿Cuántos hay? (ej. 8 palacios)">
                              <span className="text-[10px] text-muted-foreground">×</span>
                              <input
                                type="number" min={1} max={99}
                                value={state.cantidad ?? ''}
                                onChange={(e) => updateField(tag.id, 'cantidad', e.target.value ? parseInt(e.target.value, 10) : null)}
                                placeholder="1"
                                className="h-7 w-11 rounded-lg border border-input bg-background px-1.5 text-center text-xs tabular-nums shadow-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20"
                              />
                            </div>
                            <button type="button" onClick={() => handleExpand(tag)} className="text-xs font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300" title="Editar detalles">
                              {isExpanded ? '▲' : '▼'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Detalles expandidos */}
                      {state.activo && isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                          {niveles && niveles.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Nivel / Estado</label>
                              <select value={state.nivel ?? ''} onChange={(e) => updateField(tag.id, 'nivel', e.target.value || null)} className={field}>
                                <option value="">— Sin especificar —</option>
                                {niveles.map((n) => <option key={n} value={n}>{nivelLabel(n)}</option>)}
                              </select>
                            </div>
                          )}

                          {tag.tieneSiglo && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Siglo / Época</label>
                              <input type="text" value={state.siglo} onChange={(e) => updateField(tag.id, 'siglo', e.target.value)} placeholder="Ej: S. XII, S. XVI-XVIII" maxLength={30} className={field} />
                            </div>
                          )}

                          {tag.tieneVisitable && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">¿Es visitable?</label>
                              <select
                                value={state.visitable === true ? 'true' : state.visitable === false ? 'false' : ''}
                                onChange={(e) => updateField(tag.id, 'visitable', e.target.value === '' ? null : e.target.value === 'true')}
                                className={field}
                              >
                                <option value="">— Sin especificar —</option>
                                <option value="true">Sí, visitable</option>
                                <option value="false">No visitable</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="text-xs font-medium text-muted-foreground">Detalle (opcional)</label>
                            <input type="text" value={state.detalle} onChange={(e) => updateField(tag.id, 'detalle', e.target.value)} placeholder="Breve nota visible en la web" maxLength={120} className={field} />
                          </div>

                          {/* Contenido vinculado */}
                          <ContentLinker
                            tagId={tag.id}
                            puebloId={puebloId}
                            linkedContent={linkedContent}
                            selectedPoiId={state.poiId}
                            selectedPageId={state.pageId}
                            fotoOverride={state.fotoOverride}
                            onSelect={(type, id) => selectLinked(tag.id, type, id)}
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

      {/* Barra guardado */}
      <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/95 px-5 py-4 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{activoCount}</span> característica{activoCount !== 1 ? 's' : ''} seleccionada{activoCount !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-3">
          {mensaje && (
            <p className={`text-sm font-medium ${mensajeEsError ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`} role="status">
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

/* ────── Sub-componente: selector de contenido vinculado ────── */

function ContentLinker({
  tagId,
  puebloId,
  linkedContent,
  selectedPoiId,
  selectedPageId,
  fotoOverride,
  onSelect,
  onFotoOverride,
}: {
  tagId: number;
  puebloId: number;
  linkedContent: LinkedContent | null;
  selectedPoiId: number | null;
  selectedPageId: number | null;
  fotoOverride: string;
  onSelect: (type: 'poi' | 'page', id: number | null) => void;
  onFotoOverride: (url: string) => void;
}) {
  const [showList, setShowList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasLink = selectedPoiId || selectedPageId;

  const selectedName = useMemo(() => {
    if (!linkedContent) return null;
    if (selectedPoiId) {
      const p = linkedContent.pois.find(x => x.id === selectedPoiId);
      if (p) return `📍 ${p.nombre}`;
    }
    if (selectedPageId) {
      const pg = linkedContent.pages.find(x => x.id === selectedPageId);
      return pg ? `📄 ${pg.titulo}` : null;
    }
    return null;
  }, [linkedContent, selectedPoiId, selectedPageId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/admin/pueblos/${puebloId}/media`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      if (data.url) onFotoOverride(data.url);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">Imagen y enlace para colecciones</p>
      <p className="text-[11px] text-muted-foreground/80">
        Si esta característica pertenece a un contenido existente del pueblo (POI, experiencia o página temática),
        vincúlalo para usar su foto en la tarjeta de colección y enlazar directamente.
      </p>

      {/* Enlace actual o botón para vincular */}
      {hasLink && selectedName ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/50 bg-amber-50/40 px-3 py-2 text-xs dark:border-amber-700/40 dark:bg-amber-950/20">
          <span className="flex-1 truncate font-medium">{selectedName}</span>
          <button type="button" onClick={() => { onSelect('poi', null); setShowList(false); }} className="shrink-0 text-muted-foreground hover:text-destructive">✕</button>        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowList(!showList)}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-amber-400 hover:text-foreground transition-colors"
        >
          {showList ? '▲ Cerrar lista' : '🔗 Vincular a un contenido existente'}
        </button>
      )}

      {/* Lista expandida de contenidos */}
      {showList && linkedContent && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-background">
          {linkedContent.pois.length > 0 && (
            <div>
              <div className="sticky top-0 bg-muted/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Puntos de interés (POIs)
              </div>
              {linkedContent.pois.map(p => (
                <button
                  key={`poi-${p.id}`} type="button"
                  onClick={() => { onSelect('poi', p.id); setShowList(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors ${selectedPoiId === p.id ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                >
                  {p.foto ? <img src={p.foto} alt="" className="h-6 w-6 shrink-0 rounded object-cover" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px]">📍</span>}
                  <span className="truncate">{p.nombre}</span>
                  {p.foto && <span className="ml-auto shrink-0 text-[10px] text-emerald-600">con foto</span>}
                </button>
              ))}
            </div>
          )}

          {linkedContent.pages.length > 0 && (
            <div>
              <div className="sticky top-0 bg-muted/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Páginas temáticas
              </div>
              {linkedContent.pages.map(pg => (
                <button
                  key={`pg-${pg.id}`} type="button"
                  onClick={() => { onSelect('page', pg.id); setShowList(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors ${selectedPageId === pg.id ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                >
                  {pg.coverUrl ? <img src={pg.coverUrl} alt="" className="h-6 w-6 shrink-0 rounded object-cover" /> : <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px]">📄</span>}
                  <span className="truncate">{pg.titulo}</span>
                  {pg.coverUrl && <span className="ml-auto shrink-0 text-[10px] text-emerald-600">con foto</span>}
                </button>
              ))}
            </div>
          )}

          {linkedContent.pois.length === 0 && linkedContent.pages.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">No hay contenidos disponibles en este pueblo.</p>
          )}
        </div>
      )}

      {/* Subida manual de foto */}
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id={`foto-upload-${tagId}`} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? 'Subiendo…' : '📷 Subir foto'}
        </button>
        {fotoOverride && (
          <div className="flex items-center gap-1.5">
            <img src={fotoOverride} alt="" className="h-7 w-7 rounded object-cover" />
            <button type="button" onClick={() => onFotoOverride('')} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
          </div>
        )}
      </div>
      {!hasLink && !fotoOverride && (
        <p className="text-[10px] text-muted-foreground/60 italic">Sin enlace ni foto: se usará la foto general del pueblo.</p>
      )}
    </div>
  );
}
