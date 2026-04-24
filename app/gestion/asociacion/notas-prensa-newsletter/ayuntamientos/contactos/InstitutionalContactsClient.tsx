'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type InstitutionalContact = {
  id: number;
  email: string;
  name: string | null;
  role: string | null;
  roleRaw: string | null;
  puebloSlug: string;
  puebloName: string | null;
  provincia: string;
  comunidad: string;
  region: string | null;
  phone: string | null;
  status: 'subscribed' | 'unsubscribed' | 'bounced';
  unsubscribedAt: string | null;
  source: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

type Overview = {
  total: number;
  subscribed: number;
  unsubscribed: number;
  byRegion: Array<{ region: string | null; count: number }>;
  byRole: Array<{ role: string | null; count: number }>;
};

type PuebloOption = {
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  region: string | null;
};

type VcfPreviewItem = {
  email: string;
  name: string;
  role: string;
  roleRaw: string;
  phone: string;
  puebloSlug: string;
  puebloName: string;
  provincia: string;
  comunidad: string;
  region: string | null;
  action:
    | 'import'
    | 'skip_user_alcalde'
    | 'skip_duplicate_vcf'
    | 'skip_no_email'
    | 'update_existing';
  reason?: string;
};

type VcfPreview = {
  total: number;
  toImport: number;
  toSkipUserAlcalde: number;
  toSkipDuplicateVcf: number;
  toUpdateExisting: number;
  items: VcfPreviewItem[];
  applied?: number;
};

const PAGE_SIZE = 200;

const ROLE_LABELS: Record<string, string> = {
  ALCALDE: 'Alcalde',
  ALCALDESA: 'Alcaldesa',
  CONCEJAL: 'Concejal',
  CONCEJALA: 'Concejala',
  TECNICO_TURISMO: 'Técnico de turismo',
  OFICINA_TURISMO: 'Oficina de turismo',
  SECRETARIO: 'Secretario/a',
  INTERVENTOR: 'Interventor/a',
  GERENTE: 'Gerente',
  AYUNTAMIENTO: 'Ayuntamiento',
  OTRO: 'Otro / sin clasificar',
};

const REGION_LABELS: Record<string, string> = {
  NORTE: 'Norte',
  SUR: 'Sur',
  ESTE: 'Este',
  CENTRO: 'Centro',
};

const ACTION_LABELS: Record<VcfPreviewItem['action'], { label: string; tone: string }> = {
  import: { label: 'Se importará', tone: 'text-green-700' },
  update_existing: { label: 'Actualizará existente', tone: 'text-blue-700' },
  skip_user_alcalde: {
    label: 'Descartado: ya es alcalde web',
    tone: 'text-amber-700',
  },
  skip_duplicate_vcf: { label: 'Duplicado en VCF', tone: 'text-muted-foreground' },
  skip_no_email: { label: 'Sin email', tone: 'text-muted-foreground' },
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function InstitutionalContactsClient() {
  const [items, setItems] = useState<InstitutionalContact[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [overview, setOverview] = useState<Overview | null>(null);
  const [pueblos, setPueblos] = useState<PuebloOption[]>([]);

  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [puebloSlug, setPuebloSlug] = useState<string>('');
  const [status, setStatus] = useState<'subscribed' | 'unsubscribed' | 'all'>(
    'subscribed',
  );

  const [editing, setEditing] = useState<InstitutionalContact | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: 'OTRO',
    puebloSlug: '',
    phone: '',
  });

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<VcfPreview | null>(null);
  const [importExRoles, setImportExRoles] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const page = useMemo(() => Math.floor(offset / PAGE_SIZE) + 1, [offset]);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/admin/newsletter/institutional-contacts/overview',
        { cache: 'no-store' },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) setOverview(data as Overview);
    } catch {
      /* noop */
    }
  }, []);

  const loadPueblos = useCallback(async () => {
    try {
      const res = await fetch(
        '/api/admin/newsletter/institutional-contacts/pueblos',
        { cache: 'no-store' },
      );
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) setPueblos(data);
    } catch {
      /* noop */
    }
  }, []);

  const loadData = useCallback(
    async (nextOffset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(nextOffset));
        if (search.trim()) params.set('search', search.trim());
        if (region) params.set('region', region);
        if (role) params.set('role', role);
        if (puebloSlug) params.set('puebloSlug', puebloSlug);
        params.set('status', status);
        const res = await fetch(
          `/api/admin/newsletter/institutional-contacts?${params.toString()}`,
          { cache: 'no-store' },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Error al cargar');
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
        setOffset(nextOffset);
        setSelected(new Set());
      } catch (e: any) {
        setError(e?.message || 'Error');
      } finally {
        setLoading(false);
      }
    },
    [search, region, role, puebloSlug, status],
  );

  useEffect(() => {
    loadOverview();
    loadPueblos();
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, role, puebloSlug, status]);

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/newsletter/institutional-contacts/${editing.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: editing.email,
            name: editing.name || '',
            role: editing.role || '',
            roleRaw: editing.roleRaw || '',
            puebloSlug: editing.puebloSlug || '',
            puebloName: editing.puebloName || '',
            provincia: editing.provincia || '',
            comunidad: editing.comunidad || '',
            region: editing.region || '',
            phone: editing.phone || '',
            status: editing.status,
          }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo guardar');
      setMessage('Contacto actualizado.');
      setEditing(null);
      await Promise.all([loadData(offset), loadOverview()]);
    } catch (e: any) {
      setError(e?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(id: number) {
    if (!window.confirm('¿Eliminar este contacto institucional?')) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/newsletter/institutional-contacts/${id}`,
        { method: 'DELETE' },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar');
      setMessage('Contacto eliminado.');
      await Promise.all([loadData(offset), loadOverview()]);
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `¿Eliminar ${selected.size} contactos seleccionados? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setBulkBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        '/api/admin/newsletter/institutional-contacts/bulk-delete',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selected) }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudieron eliminar');
      setMessage(`${data?.deleted || 0} contactos eliminados.`);
      setSelected(new Set());
      await Promise.all([loadData(0), loadOverview()]);
    } catch (e: any) {
      setError(e?.message || 'Error en borrado masivo');
    } finally {
      setBulkBusy(false);
    }
  }

  async function createContact() {
    if (!createForm.email.trim()) {
      setError('Email obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const puebloRef = pueblos.find((p) => p.slug === createForm.puebloSlug);
      const res = await fetch('/api/admin/newsletter/institutional-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createForm.email.trim(),
          name: createForm.name.trim() || undefined,
          role: createForm.role,
          puebloSlug: createForm.puebloSlug || undefined,
          puebloName: puebloRef?.nombre,
          provincia: puebloRef?.provincia,
          comunidad: puebloRef?.comunidad,
          region: puebloRef?.region || undefined,
          phone: createForm.phone.trim() || undefined,
          source: 'manual_admin',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo crear');
      setMessage('Contacto creado.');
      setCreateForm({ email: '', name: '', role: 'OTRO', puebloSlug: '', phone: '' });
      setShowCreate(false);
      await Promise.all([loadData(0), loadOverview()]);
    } catch (e: any) {
      setError(e?.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const arr: File[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = (list as any)[i] as File;
      const name = (f.name || '').toLowerCase();
      if (name.endsWith('.vcf') || name.endsWith('.vcard')) {
        arr.push(f);
      }
    }
    if (arr.length === 0) {
      setError('Solo se aceptan archivos .vcf / .vcard');
      return;
    }
    setPendingFiles((prev) => {
      const existing = prev || [];
      // Dedupe por nombre+size para que no se dupliquen al arrastrar varias veces
      const key = (f: File) => `${f.name}::${f.size}`;
      const existingKeys = new Set(existing.map(key));
      const merged = [...existing];
      for (const f of arr) {
        if (!existingKeys.has(key(f))) merged.push(f);
      }
      return merged;
    });
    setPreview(null);
    setMessage(null);
    setError(null);
  }

  function onPickVcfFiles(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files);
    // limpiamos el input para poder volver a seleccionar el mismo archivo si hiciera falta
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePendingFile(idx: number) {
    setPendingFiles((prev) => {
      if (!prev) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next.length === 0 ? null : next;
    });
    setPreview(null);
  }

  function clearPendingFiles() {
    setPendingFiles(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function runVcfImport(apply: boolean) {
    if (!pendingFiles || pendingFiles.length === 0) {
      setError('Selecciona al menos un archivo .vcf.');
      return;
    }
    setImporting(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      for (const f of pendingFiles) fd.append('files', f);
      fd.append('apply', apply ? 'true' : 'false');
      fd.append('importExRoles', importExRoles ? 'true' : 'false');
      const res = await fetch(
        '/api/admin/newsletter/institutional-contacts/import-vcf',
        { method: 'POST', body: fd },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error importando');
      setPreview(data as VcfPreview);
      if (apply) {
        setMessage(
          `Importación aplicada: ${data?.applied || 0} contactos escritos.`,
        );
        setPendingFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await Promise.all([loadData(0), loadOverview()]);
      }
    } catch (e: any) {
      setError(e?.message || 'Error importando VCF');
    } finally {
      setImporting(false);
    }
  }

  const allSelected = items.length > 0 && items.every((c) => selected.has(c.id));

  return (
    <div className="mt-6 space-y-6">
      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {overview ? (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Contactos totales"
            value={overview.total.toLocaleString('es-ES')}
            hint="Suscritos + bajas + rebotes"
          />
          <Kpi
            label="Suscritos"
            value={overview.subscribed.toLocaleString('es-ES')}
            hint="Reciben correos y newsletter"
            tone="green"
          />
          <Kpi
            label="Bajas"
            value={overview.unsubscribed.toLocaleString('es-ES')}
            hint="Se borraron del envío (ex-cargos o manual)"
            tone="amber"
          />
          <Kpi
            label="Por región (top)"
            value={
              overview.byRegion
                .slice(0, 4)
                .map((r) => `${REGION_LABELS[r.region || ''] || r.region || '—'}:${r.count}`)
                .join(' · ') || '—'
            }
            hint="Distribución rápida"
          />
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Filtros</h2>
            <p className="text-xs text-muted-foreground">
              Son contactos institucionales de ayuntamiento. No son usuarios de la web; solo reciben correos y newsletters.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium"
            >
              {showImport ? 'Cerrar importación VCF' : 'Importar .vcf'}
            </button>
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {showCreate ? 'Cerrar alta' : '+ Nuevo contacto'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-sm">
            Estado
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as 'subscribed' | 'unsubscribed' | 'all')
              }
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="subscribed">Suscritos</option>
              <option value="unsubscribed">Bajas / ex-cargos</option>
              <option value="all">Todos</option>
            </select>
          </label>
          <label className="text-sm">
            Región
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="NORTE">Norte</option>
              <option value="CENTRO">Centro</option>
              <option value="SUR">Sur</option>
              <option value="ESTE">Este</option>
            </select>
          </label>
          <label className="text-sm">
            Cargo
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Pueblo
            <select
              value={puebloSlug}
              onChange={(e) => setPuebloSlug(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {pueblos.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nombre} ({p.provincia})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadData(0);
            }}
            placeholder="Buscar por email, nombre o pueblo…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={() => loadData(0)}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? '…' : 'Buscar'}
          </button>
          {search ? (
            <button
              onClick={() => {
                setSearch('');
                setTimeout(() => loadData(0), 0);
              }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
            >
              Limpiar
            </button>
          ) : null}
        </div>
      </section>

      {showImport ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50/40 p-5">
          <h2 className="text-base font-semibold">Importar desde .vcf</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Sube uno o varios vCards (p. ej. Región Norte / Sur / Centro / Este).
            Primero haz un <strong>dry-run</strong> para revisar el plan antes de
            aplicar. El sistema descarta automáticamente los que ya son{' '}
            <strong>alcalde usuario</strong> (rol ALCALDE activo en la web).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vcf,.vcard,text/vcard,text/x-vcard"
            multiple
            onChange={onPickVcfFiles}
            disabled={importing}
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (e.dataTransfer?.files?.length) {
                addFiles(e.dataTransfer.files);
              }
            }}
            disabled={importing}
            className={[
              'mt-3 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-amber-400 bg-white hover:border-primary hover:bg-amber-50',
              importing ? 'cursor-wait opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            <svg
              className="h-10 w-10 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.9-1A5.5 5.5 0 0117 16h-1m-4-4v8m0-8l-3 3m3-3l3 3"
              />
            </svg>
            <div className="text-sm font-semibold text-amber-900">
              Pulsa aquí o arrastra los .vcf
            </div>
            <div className="text-xs text-amber-800">
              Acepta varios archivos a la vez (Norte, Sur, Centro, Este). Solo
              .vcf / .vcard.
            </div>
          </button>

          {pendingFiles && pendingFiles.length > 0 ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-amber-900">
                  {pendingFiles.length}{' '}
                  {pendingFiles.length === 1 ? 'archivo listo' : 'archivos listos'}
                </div>
                <button
                  type="button"
                  onClick={clearPendingFiles}
                  className="text-xs text-muted-foreground underline"
                >
                  Vaciar lista
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                {pendingFiles.map((f, idx) => (
                  <li
                    key={`${f.name}-${f.size}-${idx}`}
                    className="flex items-center justify-between rounded border border-amber-100 bg-amber-50/40 px-2 py-1 text-xs"
                  >
                    <span className="truncate">
                      <span className="font-mono">{f.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removePendingFile(idx)}
                      className="shrink-0 text-red-700 hover:underline"
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <label className="mt-3 flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={importExRoles}
              onChange={(e) => setImportExRoles(e.target.checked)}
            />
            Importar ex-cargos como <strong>baja</strong> (quedan archivados,
            no reciben envíos)
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => runVcfImport(false)}
              disabled={importing || !pendingFiles || pendingFiles.length === 0}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {importing ? '…' : '1 · Previsualizar (dry-run)'}
            </button>
            <button
              onClick={() => runVcfImport(true)}
              disabled={
                importing || !pendingFiles || pendingFiles.length === 0 || !preview
              }
              className="rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {importing ? '…' : '2 · Aplicar importación'}
            </button>
            {!preview && pendingFiles && pendingFiles.length > 0 ? (
              <span className="self-center text-[11px] text-amber-800">
                Primero pulsa «Previsualizar» para ver el plan.
              </span>
            ) : null}
          </div>

          {preview ? (
            <div className="mt-4 space-y-3">
              <div className="grid gap-2 text-xs sm:grid-cols-5">
                <Kpi
                  label="Total entradas"
                  value={String(preview.total)}
                  compact
                />
                <Kpi
                  label="Se importarán"
                  value={String(preview.toImport)}
                  tone="green"
                  compact
                />
                <Kpi
                  label="Ya existen"
                  value={String(preview.toUpdateExisting)}
                  tone="blue"
                  compact
                />
                <Kpi
                  label="Descartados alcaldes"
                  value={String(preview.toSkipUserAlcalde)}
                  tone="amber"
                  compact
                />
                <Kpi
                  label="Duplicados VCF"
                  value={String(preview.toSkipDuplicateVcf)}
                  compact
                />
              </div>

              <div className="max-h-96 overflow-auto rounded-lg border border-amber-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-amber-50 text-[11px] uppercase tracking-wide text-amber-900">
                    <tr>
                      <th className="px-2 py-1 text-left">Email</th>
                      <th className="px-2 py-1 text-left">Nombre</th>
                      <th className="px-2 py-1 text-left">Cargo</th>
                      <th className="px-2 py-1 text-left">Pueblo</th>
                      <th className="px-2 py-1 text-left">Región</th>
                      <th className="px-2 py-1 text-left">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.slice(0, 500).map((it, i) => {
                      const a = ACTION_LABELS[it.action];
                      return (
                        <tr key={i} className="border-t border-amber-100">
                          <td className="px-2 py-1 font-mono">{it.email || '—'}</td>
                          <td className="px-2 py-1">{it.name}</td>
                          <td className="px-2 py-1">
                            {ROLE_LABELS[it.role] || it.role}
                            {it.roleRaw?.includes('[EX]') ? (
                              <span className="ml-1 rounded border border-amber-300 bg-amber-50 px-1 text-[10px] text-amber-800">
                                EX
                              </span>
                            ) : null}
                          </td>
                          <td className="px-2 py-1">
                            {it.puebloName || (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {it.provincia ? (
                              <span className="text-muted-foreground">
                                {' '}
                                · {it.provincia}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-2 py-1">
                            {REGION_LABELS[it.region || ''] || it.region || '—'}
                          </td>
                          <td className={`px-2 py-1 font-medium ${a.tone}`}>
                            {a.label}
                            {it.reason ? (
                              <div className="text-[10px] font-normal text-muted-foreground">
                                {it.reason}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {preview.items.length > 500 ? (
                  <div className="border-t border-amber-100 bg-amber-50 px-2 py-1 text-center text-[11px] text-amber-800">
                    Mostrando las primeras 500 filas de {preview.items.length}.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showCreate ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Nuevo contacto institucional</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Email *
              <input
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, email: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Nombre
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, name: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Cargo
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, role: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Pueblo
              <select
                value={createForm.puebloSlug}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, puebloSlug: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">(ninguno)</option>
                {pueblos.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nombre} ({p.provincia})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Teléfono
              <input
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, phone: e.target.value }))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={createContact}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Creando…' : 'Crear'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      {editing ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Editar contacto</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Email
              <input
                value={editing.email}
                onChange={(e) =>
                  setEditing((s) => (s ? { ...s, email: e.target.value } : s))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Nombre
              <input
                value={editing.name || ''}
                onChange={(e) =>
                  setEditing((s) => (s ? { ...s, name: e.target.value } : s))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Cargo
              <select
                value={editing.role || 'OTRO'}
                onChange={(e) =>
                  setEditing((s) => (s ? { ...s, role: e.target.value } : s))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Pueblo
              <select
                value={editing.puebloSlug || ''}
                onChange={(e) => {
                  const slug = e.target.value;
                  const p = pueblos.find((x) => x.slug === slug);
                  setEditing((s) =>
                    s
                      ? {
                          ...s,
                          puebloSlug: slug,
                          puebloName: p?.nombre || '',
                          provincia: p?.provincia || '',
                          comunidad: p?.comunidad || '',
                          region: p?.region || '',
                        }
                      : s,
                  );
                }}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">(ninguno)</option>
                {pueblos.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.nombre} ({p.provincia})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Teléfono
              <input
                value={editing.phone || ''}
                onChange={(e) =>
                  setEditing((s) => (s ? { ...s, phone: e.target.value } : s))
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Estado
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing((s) =>
                    s ? { ...s, status: e.target.value as any } : s,
                  )
                }
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="subscribed">Suscrito</option>
                <option value="unsubscribed">Baja</option>
                <option value="bounced">Rebote</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Listado</h2>
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString('es-ES')} contactos · página {page} de {totalPages}
            </p>
          </div>
          {selected.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium">{selected.size} seleccionados</span>
              <button
                onClick={bulkDelete}
                disabled={bulkBusy}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                Borrar seleccionados
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="w-8 px-2 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(items.map((x) => x.id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                  />
                </th>
                <th className="px-2 py-2 text-left">Email / Nombre</th>
                <th className="px-2 py-2 text-left">Cargo</th>
                <th className="px-2 py-2 text-left">Pueblo</th>
                <th className="px-2 py-2 text-left">Región</th>
                <th className="px-2 py-2 text-left">Estado</th>
                <th className="px-2 py-2 text-left">Origen</th>
                <th className="px-2 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-2 py-4 text-center text-muted-foreground"
                  >
                    {loading ? 'Cargando…' : 'Sin contactos para este filtro.'}
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const sel = selected.has(c.id);
                  const isEx = !!c.metadata?.isExRole;
                  return (
                    <tr key={c.id} className="border-b border-border align-top">
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(c.id);
                              else next.delete(c.id);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div className="font-medium">{c.email}</div>
                        {c.name ? (
                          <div className="text-xs text-muted-foreground">{c.name}</div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        {ROLE_LABELS[c.role || ''] || c.role || '—'}
                        {isEx ? (
                          <span className="ml-1 rounded border border-amber-300 bg-amber-50 px-1 text-[10px] text-amber-800">
                            EX
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        {c.puebloName || '—'}
                        {c.provincia ? (
                          <div className="text-[11px] text-muted-foreground">
                            {c.provincia}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        {REGION_LABELS[c.region || ''] || c.region || '—'}
                      </td>
                      <td className="px-2 py-2">
                        <StatusBadge status={c.status} />
                        {c.unsubscribedAt ? (
                          <div className="text-[11px] text-muted-foreground">
                            Baja: {formatDate(c.unsubscribedAt)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">
                        {c.source}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditing(c)}
                            className="rounded border border-border px-2 py-1 text-xs font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => removeContact(c.id)}
                            className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700"
                          >
                            Borrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Página {page} de {totalPages} · {total} contactos
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => loadData(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset <= 0 || loading}
              className="rounded border border-border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => loadData(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || loading}
              className="rounded border border-border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = 'gray',
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'green' | 'amber' | 'red' | 'gray' | 'blue';
  compact?: boolean;
}) {
  const tones: Record<string, string> = {
    green: 'border-green-200 bg-green-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-border bg-card',
    blue: 'border-blue-200 bg-blue-50',
  };
  return (
    <div className={['rounded-xl border', tones[tone], compact ? 'p-2' : 'p-4'].join(' ')}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={[
          'mt-0.5 font-semibold tabular-nums',
          compact ? 'text-lg' : 'text-2xl',
        ].join(' ')}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      ) : null}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: 'subscribed' | 'unsubscribed' | 'bounced';
}) {
  const map: Record<string, { label: string; cls: string }> = {
    subscribed: {
      label: 'Suscrito',
      cls: 'border-green-300 bg-green-50 text-green-800',
    },
    unsubscribed: {
      label: 'Baja',
      cls: 'border-amber-300 bg-amber-50 text-amber-800',
    },
    bounced: {
      label: 'Rebote',
      cls: 'border-red-300 bg-red-50 text-red-700',
    },
  };
  const s = map[status] || map.subscribed;
  return (
    <span
      className={['inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium', s.cls].join(' ')}
    >
      {s.label}
    </span>
  );
}
