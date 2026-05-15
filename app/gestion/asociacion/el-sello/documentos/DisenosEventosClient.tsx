'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EventoIcon, NocheRomanticaIcon } from '@/app/_components/eventos/EventoIcon';

type EventoTipo = 'NOCHE_ROMANTICA' | 'NAVIDAD' | 'SEMANA_SANTA';

type DocumentoEvento = {
  id: number;
  eventoTipo: EventoTipo;
  anio: number;
  nombre: string;
  descripcion: string | null;
  url: string;
  contentType: string | null;
  size: number | null;
  orden: number;
  createdAt: string;
  updatedAt: string;
};

const EVENTOS: Array<{ tipo: EventoTipo; label: string; emoji: string; color: string }> = [
  { tipo: 'NOCHE_ROMANTICA', label: 'La Noche Romántica', emoji: '🌹', color: 'rose' },
  { tipo: 'NAVIDAD', label: 'Navidad', emoji: '🎄', color: 'green' },
  { tipo: 'SEMANA_SANTA', label: 'Semana Santa', emoji: '✝️', color: 'amber' },
];

const CURRENT_YEAR = new Date().getFullYear();

// Acepta cualquier formato común que pueda usar la asociación
const ACCEPT_ALL = '.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.ai,.eps,.psd,.indd,.tif,.tiff,.mp4,.mov,image/*,application/pdf,application/zip';

function isImageUrl(url: string) { return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url); }
function isPdfUrl(url: string) { return /\.pdf(\?|$)/i.test(url); }

function formatBytes(b: number | null) {
  if (!b || b <= 0) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ url, className = 'h-5 w-5' }: { url: string; className?: string }) {
  if (isImageUrl(url)) {
    return (
      <svg className={`${className} text-sky-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (isPdfUrl(url)) {
    return (
      <svg className={`${className} text-rose-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  return (
    <svg className={`${className} text-slate-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export default function DisenosEventosClient() {
  const [docs, setDocs] = useState<DocumentoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterTipo, setFilterTipo] = useState<EventoTipo | 'TODOS'>('TODOS');
  const [filterAnio, setFilterAnio] = useState<number | 'TODOS'>('TODOS');

  // Form de subida
  const [showForm, setShowForm] = useState(false);
  const [formTipo, setFormTipo] = useState<EventoTipo>('NOCHE_ROMANTICA');
  const [formAnio, setFormAnio] = useState<number>(CURRENT_YEAR);
  const [formNombre, setFormNombre] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Edición inline
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editTipo, setEditTipo] = useState<EventoTipo>('NOCHE_ROMANTICA');
  const [editAnio, setEditAnio] = useState<number>(CURRENT_YEAR);
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/documentos-evento', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Error cargando diseños');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Subida directa a R2
  async function uploadFileViaPresign(file: File, folder: string): Promise<string> {
    const contentType = file.type?.trim() || 'application/octet-stream';
    const presignRes = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType, folder }),
    });
    if (!presignRes.ok) {
      const txt = await presignRes.text().catch(() => '');
      throw new Error(txt || 'No se pudo preparar la subida');
    }
    const presign = await presignRes.json();
    const uploadRes = await fetch(String(presign.uploadUrl), {
      method: 'PUT',
      headers: { 'Content-Type': String(presign.contentType || contentType) },
      body: file,
    });
    if (!uploadRes.ok) throw new Error(`Error subiendo a R2 (status ${uploadRes.status})`);
    const publicUrl = String(presign.publicUrl || '');
    if (!publicUrl) throw new Error('R2 no devolvió URL pública');
    return publicUrl;
  }

  async function uploadFileDirectToR2(file: File, folder: string): Promise<string> {
    const ticketRes = await fetch('/api/media/upload-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
    if (!ticketRes.ok) {
      const raw = await ticketRes.text().catch(() => '');
      if (ticketRes.status === 404 || /Cannot POST \/media\/upload-ticket/i.test(raw)) {
        return uploadFileViaPresign(file, folder);
      }
      throw new Error(raw || 'No se pudo preparar la subida');
    }
    const ticketData = await ticketRes.json();
    const uploadUrl = String(ticketData.uploadUrl || '');
    const ticket = String(ticketData.ticket || '');
    if (!uploadUrl || !ticket) throw new Error('No se pudo preparar la subida');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('ticket', ticket);
    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: fd });
    if (!uploadRes.ok) {
      const txt = await uploadRes.text().catch(() => '');
      throw new Error(`Error subiendo (status ${uploadRes.status})${txt ? `: ${txt}` : ''}`);
    }
    const data = await uploadRes.json().catch(() => ({}));
    return String(data.publicUrl || data.url || '');
  }

  async function handleSubmit() {
    if (!pendingFile) {
      setError('Selecciona un archivo primero.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const folder = `disenos-eventos/${formTipo.toLowerCase()}-${formAnio}`;
      const url = await uploadFileDirectToR2(pendingFile, folder);
      if (!url) throw new Error('R2 no devolvió URL pública');

      const res = await fetch('/api/admin/documentos-evento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoTipo: formTipo,
          anio: formAnio,
          nombre: formNombre.trim() || pendingFile.name.replace(/\.[^.]+$/, ''),
          descripcion: formDescripcion.trim() || null,
          url,
          contentType: pendingFile.type || null,
          size: pendingFile.size,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando');
      }
      setFormNombre('');
      setFormDescripcion('');
      setPendingFile(null);
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = '';
      await loadDocs();
    } catch (e: any) {
      setError(e?.message || 'Error subiendo el diseño');
    } finally {
      setUploading(false);
    }
  }

  function startEdit(doc: DocumentoEvento) {
    setEditingId(doc.id);
    setEditNombre(doc.nombre);
    setEditDescripcion(doc.descripcion ?? '');
    setEditTipo(doc.eventoTipo);
    setEditAnio(doc.anio);
  }

  async function saveEdit(id: number) {
    if (!editNombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/documentos-evento/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          descripcion: editDescripcion.trim() || null,
          eventoTipo: editTipo,
          anio: editAnio,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando');
      }
      setEditingId(null);
      await loadDocs();
    } catch (e: any) {
      alert(e?.message || 'Error');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar este diseño? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/documentos-evento/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error borrando');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Error');
    } finally {
      setDeletingId(null);
    }
  }

  // Lista de años disponibles a partir de los datos + siempre incluyendo el año actual y los 2 siguientes
  const aniosDisponibles = useMemo(() => {
    const set = new Set<number>([CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]);
    for (const d of docs) set.add(d.anio);
    return Array.from(set).sort((a, b) => b - a);
  }, [docs]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (filterTipo !== 'TODOS' && d.eventoTipo !== filterTipo) return false;
      if (filterAnio !== 'TODOS' && d.anio !== filterAnio) return false;
      return true;
    });
  }, [docs, filterTipo, filterAnio]);

  // Agrupar por (tipo, anio) para mostrar secciones ordenadas
  const grouped = useMemo(() => {
    const groups = new Map<string, { tipo: EventoTipo; anio: number; docs: DocumentoEvento[] }>();
    for (const d of filtered) {
      const key = `${d.eventoTipo}|${d.anio}`;
      if (!groups.has(key)) groups.set(key, { tipo: d.eventoTipo, anio: d.anio, docs: [] });
      groups.get(key)!.docs.push(d);
    }
    // Orden de evento + año desc
    const tipoOrden = (t: EventoTipo) => EVENTOS.findIndex((e) => e.tipo === t);
    return Array.from(groups.values()).sort((a, b) => {
      if (a.anio !== b.anio) return b.anio - a.anio;
      return tipoOrden(a.tipo) - tipoOrden(b.tipo);
    });
  }, [filtered]);

  function eventoMeta(t: EventoTipo) {
    return EVENTOS.find((e) => e.tipo === t)!;
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-white" style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #ec4899 100%)' }}>
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎨</span>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Diseños para eventos</h2>
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/85 leading-relaxed">
              Carteles, folletos y artes finales que la asociación sube para que los alcaldes puedan descargarlos
              y usarlos en <strong>La Noche Romántica</strong>, <strong>Navidad</strong> y <strong>Semana Santa</strong>.
              Sin límite de archivos, organiza por evento y año.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); if (showForm) { setPendingFile(null); setError(null); } }}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 transition-all hover:bg-white/25 hover:ring-white/40 active:scale-95 shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancelar' : 'Subir diseño'}
          </button>
        </div>
        {!loading && docs.length > 0 && (
          <div className="relative mt-5 flex flex-wrap gap-3">
            {EVENTOS.map((ev) => {
              const count = docs.filter((d) => d.eventoTipo === ev.tipo).length;
              if (count === 0) return null;
              return (
                <div key={ev.tipo} className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-4 py-2 ring-1 ring-white/15">
                  <EventoIcon tipo={ev.tipo} emoji={ev.emoji} size={ev.tipo === 'NOCHE_ROMANTICA' ? 28 : 18} />
                  <span className="text-lg font-bold">{count}</span>
                  <span className="text-xs text-white/75">{ev.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form subida */}
      {showForm && (
        <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/40 to-white p-6 shadow-lg shadow-purple-100/30 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <svg className="h-5 w-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">Nuevo diseño</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evento *</label>
              <div className="flex flex-wrap gap-2">
                {EVENTOS.map((ev) => {
                  const active = formTipo === ev.tipo;
                  return (
                    <button
                      key={ev.tipo}
                      type="button"
                      onClick={() => setFormTipo(ev.tipo)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? 'border-purple-500 bg-purple-600 text-white shadow-sm'
                          : 'border-purple-200 bg-white text-purple-800 hover:border-purple-400'
                      }`}
                    >
                      <EventoIcon tipo={ev.tipo} emoji={ev.emoji} size={ev.tipo === 'NOCHE_ROMANTICA' ? 22 : 16} />
                      {ev.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Año *</label>
              <input
                type="number"
                value={formAnio}
                onChange={(e) => setFormAnio(parseInt(e.target.value) || CURRENT_YEAR)}
                min={2000}
                max={2100}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                placeholder="Si lo dejas vacío, se usa el nombre del archivo"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descripción</label>
              <textarea
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                rows={2}
                placeholder="Ej: Cartel A3 oficial · Pendón vertical 80×200 cm · Folleto díptico"
                className="w-full resize-y rounded-xl border border-border px-4 py-2.5 text-sm shadow-sm"
              />
            </div>
          </div>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center pt-2 border-t border-border/50">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-muted hover:border-purple-300 disabled:opacity-50 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Seleccionar archivo
            </button>
            <button
              type="button"
              disabled={uploading || !pendingFile}
              onClick={() => void handleSubmit()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-purple-700 hover:to-fuchsia-700 disabled:pointer-events-none disabled:opacity-50 shadow-sm transition-all active:scale-95"
            >
              {uploading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Subiendo…</>
              ) : 'Guardar diseño'}
            </button>
            {pendingFile && (
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                <svg className="h-4 w-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="truncate text-sm font-medium text-emerald-700">{pendingFile.name}</span>
                <span className="shrink-0 text-xs text-emerald-600">{formatBytes(pendingFile.size)}</span>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="shrink-0 ml-auto text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground sm:ml-auto">PDF, imagen, Word, Excel, ZIP, AI, EPS, PSD, MP4…</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_ALL}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setPendingFile(f); setError(null); }
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Filtros */}
      {!loading && docs.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evento</span>
            <button
              type="button"
              onClick={() => setFilterTipo('TODOS')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterTipo === 'TODOS' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Todos
            </button>
            {EVENTOS.map((ev) => (
              <button
                key={ev.tipo}
                type="button"
                onClick={() => setFilterTipo(ev.tipo)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${filterTipo === ev.tipo ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <EventoIcon tipo={ev.tipo} emoji={ev.emoji} size={ev.tipo === 'NOCHE_ROMANTICA' ? 18 : 14} />
                {ev.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Año</span>
            <button
              type="button"
              onClick={() => setFilterAnio('TODOS')}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterAnio === 'TODOS' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Todos
            </button>
            {aniosDisponibles.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setFilterAnio(y)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filterAnio === y ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Cargando diseños…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && docs.length === 0 && !showForm && (
        <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-white p-16 text-center ring-1 ring-purple-100">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 shadow-inner">
            <span className="text-2xl">🎨</span>
          </div>
          <p className="font-semibold text-foreground">Sin diseños todavía</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Pulsa "Subir diseño" para añadir el primero.</p>
        </div>
      )}

      {/* Listado agrupado */}
      {!loading && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map((g) => {
            const meta = eventoMeta(g.tipo);
            return (
              <section key={`${g.tipo}-${g.anio}`} className="overflow-hidden rounded-2xl ring-1 ring-purple-100 bg-card shadow-sm">
                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b border-purple-100">
                  {g.tipo === 'NOCHE_ROMANTICA' ? (
                    <NocheRomanticaIcon size={42} />
                  ) : (
                    <span className="text-2xl">{meta.emoji}</span>
                  )}
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-purple-900">{meta.label}</h3>
                    <p className="text-xs text-purple-700/70">Año {g.anio}</p>
                  </div>
                  <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-bold text-purple-700">
                    {g.docs.length} {g.docs.length === 1 ? 'archivo' : 'archivos'}
                  </span>
                </div>
                <div className="divide-y divide-purple-50">
                  {g.docs.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-3 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 overflow-hidden">
                        {isImageUrl(doc.url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={doc.url} alt={doc.nombre} className="h-10 w-10 object-cover rounded" />
                        ) : (
                          <FileIcon url={doc.url} className="h-6 w-6" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {editingId === doc.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editNombre}
                              onChange={(e) => setEditNombre(e.target.value)}
                              className="w-full rounded-lg border border-border px-3 py-1.5 text-sm"
                            />
                            <textarea
                              value={editDescripcion}
                              onChange={(e) => setEditDescripcion(e.target.value)}
                              rows={2}
                              placeholder="Descripción (opcional)"
                              className="w-full rounded-lg border border-border px-3 py-1.5 text-sm resize-y"
                            />
                            <div className="flex flex-wrap gap-2">
                              <select
                                value={editTipo}
                                onChange={(e) => setEditTipo(e.target.value as EventoTipo)}
                                className="rounded-lg border border-border bg-white px-2 py-1 text-xs"
                              >
                                {EVENTOS.map((ev) => (
                                  <option key={ev.tipo} value={ev.tipo}>{ev.emoji} {ev.label}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={editAnio}
                                onChange={(e) => setEditAnio(parseInt(e.target.value) || CURRENT_YEAR)}
                                className="w-20 rounded-lg border border-border bg-white px-2 py-1 text-xs"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => saveEdit(doc.id)}
                                className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                              >
                                {savingEdit ? 'Guardando…' : 'Guardar'}
                              </button>
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => setEditingId(null)}
                                className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-foreground leading-tight">{doc.nombre}</p>
                            {doc.descripcion && (
                              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{doc.descripcion}</p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              {doc.size ? <span>{formatBytes(doc.size)}</span> : null}
                              <span>{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {editingId !== doc.id && (
                        <div className="flex shrink-0 gap-1.5">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          >
                            Ver
                          </a>
                          <a
                            href={doc.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:from-purple-600 hover:to-purple-700"
                          >
                            Descargar
                          </a>
                          <button
                            type="button"
                            onClick={() => startEdit(doc)}
                            className="rounded-lg border border-border bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            title="Editar"
                          >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === doc.id}
                            onClick={() => handleDelete(doc.id)}
                            className="rounded-lg border border-red-200 p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Borrar"
                          >
                            {deletingId === doc.id ? (
                              <span className="h-3.5 w-3.5 block animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                            ) : (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading && docs.length > 0 && grouped.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center text-amber-800">
          No hay diseños que coincidan con los filtros activos.
        </div>
      )}
    </div>
  );
}
