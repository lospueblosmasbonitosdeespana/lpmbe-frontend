'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type PressContact = {
  id: number;
  email: string;
  name?: string | null;
  mediaOutlet?: string | null;
  scope: string;
  ccaa: string;
  provincia: string;
  puebloSlug: string;
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  bouncedCount?: number;
  lastDeliveredAt?: string | null;
  lastOpenedAt?: string | null;
  lastClickedAt?: string | null;
  lastBouncedAt?: string | null;
};

type Editable = {
  id: number;
  email: string;
  name: string;
  mediaOutlet: string;
  scope: string;
  ccaa: string;
  provincia: string;
  puebloSlug: string;
};

type FilterOption = { value: string; count: number };

type FiltersResponse = {
  scopes: FilterOption[];
  ccaas: FilterOption[];
  provincias: FilterOption[];
};

type QuickScope = '' | 'NACIONAL' | 'CCAA' | 'PROVINCIA' | 'LOCAL';

const PAGE_SIZE = 100;

const SCOPE_LABELS: Record<string, string> = {
  NACIONAL: 'Nacional',
  CCAA: 'Autonómico',
  PROVINCIA: 'Provincial',
  LOCAL: 'Local',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } catch {
    return '—';
  }
}

function pct(num: number, den: number): string {
  if (!den || den <= 0) return '—';
  const v = (num / den) * 100;
  if (!Number.isFinite(v)) return '—';
  return `${v.toFixed(0)}%`;
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function PressContactsManagerClient() {
  const [items, setItems] = useState<PressContact[]>([]);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editable | null>(null);

  const [quickScope, setQuickScope] = useState<QuickScope>('');
  const [ccaa, setCcaa] = useState('');
  const [provincia, setProvincia] = useState('');

  const [filters, setFilters] = useState<FiltersResponse>({ scopes: [], ccaas: [], provincias: [] });
  const [filtersLoading, setFiltersLoading] = useState(false);

  // Alta rápida
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    mediaOutlet: '',
    scope: 'NACIONAL' as QuickScope,
    ccaa: '',
    provincia: '',
    puebloSlug: '',
  });

  const page = useMemo(() => Math.floor(offset / PAGE_SIZE) + 1, [offset]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadFilters = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter/press-contacts/filters', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFilters({
          scopes: Array.isArray(data?.scopes) ? data.scopes : [],
          ccaas: Array.isArray(data?.ccaas) ? data.ccaas : [],
          provincias: Array.isArray(data?.provincias) ? data.provincias : [],
        });
      }
    } catch {
      // ignore
    } finally {
      setFiltersLoading(false);
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
        if (quickScope) params.set('scope', quickScope);
        if (ccaa) params.set('ccaa', ccaa);
        if (provincia) params.set('provincia', provincia);
        const res = await fetch(
          `/api/admin/newsletter/press-contacts?${params.toString()}`,
          { cache: 'no-store' },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'No se pudieron cargar contactos');
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
        setOffset(nextOffset);
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Error cargando contactos');
      } finally {
        setLoading(false);
      }
    },
    [search, quickScope, ccaa, provincia],
  );

  useEffect(() => {
    loadFilters();
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambian los filtros rápidos, recargamos desde 0.
  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickScope, ccaa, provincia]);

  function startEdit(c: PressContact) {
    setEditing({
      id: c.id,
      email: c.email || '',
      name: c.name || '',
      mediaOutlet: c.mediaOutlet || '',
      scope: c.scope || 'NACIONAL',
      ccaa: c.ccaa || '',
      provincia: c.provincia || '',
      puebloSlug: c.puebloSlug || '',
    });
    setMessage(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/press-contacts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo guardar');
      setMessage('Contacto actualizado correctamente.');
      setEditing(null);
      await loadData(offset);
      await loadFilters();
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function removeContact(id: number) {
    const ok = window.confirm('¿Seguro que quieres eliminar este contacto de prensa?');
    if (!ok) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/press-contacts/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar');
      setMessage('Contacto eliminado correctamente.');
      await loadData(offset);
      await loadFilters();
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  async function createContact() {
    if (!createForm.email.trim()) {
      setError('El email es obligatorio para dar de alta un contacto.');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/newsletter/press-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createForm.email.trim(),
          name: createForm.name.trim() || undefined,
          mediaOutlet: createForm.mediaOutlet.trim() || undefined,
          scope: createForm.scope || 'NACIONAL',
          ccaa: createForm.ccaa.trim() || undefined,
          provincia: createForm.provincia.trim() || undefined,
          puebloSlug: createForm.puebloSlug.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo crear');
      setMessage('Contacto dado de alta correctamente.');
      setCreateForm({
        email: '',
        name: '',
        mediaOutlet: '',
        scope: 'NACIONAL',
        ccaa: '',
        provincia: '',
        puebloSlug: '',
      });
      setShowCreate(false);
      await loadData(0);
      await loadFilters();
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error al crear el contacto');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    if (items.length === 0) {
      setError('No hay contactos en la página actual para exportar.');
      return;
    }
    const header = [
      'email',
      'nombre',
      'medio',
      'ambito',
      'ccaa',
      'provincia',
      'pueblo_slug',
      'enviados',
      'entregados',
      'abiertos',
      'clicks',
      'rebotes',
      'ultimo_envio',
      'ultimo_abierto',
      'ultimo_click',
    ];
    const rows = items.map((c) => [
      c.email,
      c.name || '',
      c.mediaOutlet || '',
      c.scope || '',
      c.ccaa || '',
      c.provincia || '',
      c.puebloSlug || '',
      c.sentCount ?? 0,
      c.deliveredCount ?? 0,
      c.openedCount ?? 0,
      c.clickedCount ?? 0,
      c.bouncedCount ?? 0,
      c.lastDeliveredAt ? new Date(c.lastDeliveredAt).toISOString() : '',
      c.lastOpenedAt ? new Date(c.lastOpenedAt).toISOString() : '',
      c.lastClickedAt ? new Date(c.lastClickedAt).toISOString() : '',
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const stamp = new Date().toISOString().slice(0, 10);
    const scopeTag = quickScope ? `-${quickScope.toLowerCase()}` : '';
    const ccaaTag = ccaa ? `-${ccaa.toLowerCase().replace(/\s+/g, '_')}` : '';
    const provinciaTag = provincia ? `-${provincia.toLowerCase().replace(/\s+/g, '_')}` : '';
    a.download = `contactos-prensa${scopeTag}${ccaaTag}${provinciaTag}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Totales agregados de la página visible (información útil cuando se filtra).
  const pageTotals = useMemo(() => {
    return items.reduce(
      (acc, c) => {
        acc.sent += c.sentCount ?? 0;
        acc.opened += c.openedCount ?? 0;
        acc.clicked += c.clickedCount ?? 0;
        acc.bounced += c.bouncedCount ?? 0;
        return acc;
      },
      { sent: 0, opened: 0, clicked: 0, bounced: 0 },
    );
  }, [items]);

  const quickFilters: { value: QuickScope; label: string; helper?: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'NACIONAL', label: 'Solo nacionales', helper: 'Scope = NACIONAL' },
    { value: 'CCAA', label: 'Autonómicos', helper: 'Scope = CCAA' },
    { value: 'PROVINCIA', label: 'Provinciales', helper: 'Scope = PROVINCIA' },
    { value: 'LOCAL', label: 'Locales', helper: 'Scope = LOCAL' },
  ];

  return (
    <div className="mt-8 space-y-6">
      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Filtros rápidos</h2>
            <p className="text-xs text-muted-foreground">
              Combina ámbito, comunidad y provincia con la búsqueda libre. Todo filtra sobre la misma tabla.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCsv}
              disabled={loading || items.length === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              title="Exporta los contactos visibles en esta página (respetando los filtros)"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
            >
              {showCreate ? 'Cerrar alta' : '+ Nuevo contacto'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickFilters.map((f) => {
            const active = quickScope === f.value;
            const count = f.value ? filters.scopes.find((s) => s.value === f.value)?.count ?? 0 : undefined;
            return (
              <button
                key={f.label}
                onClick={() => {
                  setQuickScope(f.value);
                  if (f.value !== 'CCAA') setCcaa('');
                  if (f.value !== 'PROVINCIA') setProvincia('');
                }}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-medium transition',
                  active
                    ? 'border border-primary bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-foreground hover:border-primary/40',
                ].join(' ')}
                title={f.helper}
              >
                {f.label}
                {typeof count === 'number' ? (
                  <span className={['ml-1 text-[10px]', active ? 'text-primary-foreground/80' : 'text-muted-foreground'].join(' ')}>
                    ({count})
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Comunidad Autónoma
            <select
              value={ccaa}
              onChange={(e) => {
                setCcaa(e.target.value);
                if (e.target.value) setProvincia('');
              }}
              disabled={filtersLoading}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {filters.ccaas.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.value} ({c.count})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Provincia
            <select
              value={provincia}
              onChange={(e) => {
                setProvincia(e.target.value);
              }}
              disabled={filtersLoading}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {filters.provincias.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value} ({p.count})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Búsqueda (email, medio, nombre, CCAA, provincia)
            <div className="mt-1 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadData(0);
                }}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="ej. elpais, @medio.es, madrid..."
              />
              <button
                onClick={() => loadData(0)}
                disabled={loading || saving}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? '…' : 'Buscar'}
              </button>
            </div>
          </label>
        </div>

        {(quickScope || ccaa || provincia || search.trim()) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Filtros activos:</span>
            {quickScope ? (
              <span className="rounded-full border border-border bg-background px-2 py-0.5">
                Ámbito: {SCOPE_LABELS[quickScope] || quickScope}
              </span>
            ) : null}
            {ccaa ? (
              <span className="rounded-full border border-border bg-background px-2 py-0.5">CCAA: {ccaa}</span>
            ) : null}
            {provincia ? (
              <span className="rounded-full border border-border bg-background px-2 py-0.5">Provincia: {provincia}</span>
            ) : null}
            {search.trim() ? (
              <span className="rounded-full border border-border bg-background px-2 py-0.5">
                “{search.trim()}”
              </span>
            ) : null}
            <button
              onClick={() => {
                setQuickScope('');
                setCcaa('');
                setProvincia('');
                setSearch('');
                setTimeout(() => loadData(0), 0);
              }}
              className="rounded-full border border-border bg-background px-2 py-0.5 text-xs hover:border-primary/40"
            >
              Limpiar
            </button>
          </div>
        ) : null}
      </section>

      {showCreate ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Nuevo contacto de prensa</h2>
          <p className="text-xs text-muted-foreground">
            Da de alta un contacto individual. El email es obligatorio; el resto de campos son opcionales pero ayudan a
            segmentar los envíos.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Email *
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Nombre
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Medio
              <input
                value={createForm.mediaOutlet}
                onChange={(e) => setCreateForm((s) => ({ ...s, mediaOutlet: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Ámbito
              <select
                value={createForm.scope}
                onChange={(e) => setCreateForm((s) => ({ ...s, scope: e.target.value as QuickScope }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="NACIONAL">Nacional</option>
                <option value="CCAA">Autonómico</option>
                <option value="PROVINCIA">Provincial</option>
                <option value="LOCAL">Local</option>
              </select>
            </label>
            <label className="text-sm">
              CCAA
              <input
                value={createForm.ccaa}
                onChange={(e) => setCreateForm((s) => ({ ...s, ccaa: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="ej. Comunidad Valenciana"
              />
            </label>
            <label className="text-sm">
              Provincia
              <input
                value={createForm.provincia}
                onChange={(e) => setCreateForm((s) => ({ ...s, provincia: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="ej. Valencia"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={createContact}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Creando…' : 'Crear contacto'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      {editing ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Editar contacto</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Medio
              <input
                value={editing.mediaOutlet}
                onChange={(e) => setEditing((s) => (s ? { ...s, mediaOutlet: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Email
              <input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing((s) => (s ? { ...s, email: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Nombre
              <input
                value={editing.name}
                onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Ámbito
              <select
                value={editing.scope}
                onChange={(e) => setEditing((s) => (s ? { ...s, scope: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="NACIONAL">Nacional</option>
                <option value="CCAA">Autonómico</option>
                <option value="PROVINCIA">Provincial</option>
                <option value="LOCAL">Local</option>
              </select>
            </label>
            <label className="text-sm">
              CCAA
              <input
                value={editing.ccaa}
                onChange={(e) => setEditing((s) => (s ? { ...s, ccaa: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Provincia
              <input
                value={editing.provincia}
                onChange={(e) => setEditing((s) => (s ? { ...s, provincia: e.target.value } : s))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button
              onClick={() => setEditing(null)}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Listado de contactos</h2>
            <p className="text-xs text-muted-foreground">
              {total.toLocaleString('es-ES')} contactos para los filtros activos · página {page} de {totalPages}
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            En esta página: {pageTotals.sent} enviados · {pageTotals.opened} abiertos (
            {pct(pageTotals.opened, pageTotals.sent)}) · {pageTotals.clicked} clicks · {pageTotals.bounced} rebotes
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-2 py-2 text-left">Email</th>
                <th className="px-2 py-2 text-left">Medio</th>
                <th className="px-2 py-2 text-left">Ámbito</th>
                <th className="px-2 py-2 text-left">CCAA</th>
                <th className="px-2 py-2 text-left">Provincia</th>
                <th className="px-2 py-2 text-right" title="Total de envíos en campañas de prensa">
                  Env.
                </th>
                <th className="px-2 py-2 text-right" title="Abiertos (y % sobre enviados)">
                  Abiertos
                </th>
                <th className="px-2 py-2 text-right" title="Clicks">
                  Clicks
                </th>
                <th className="px-2 py-2 text-right" title="Rebotes">
                  Reb.
                </th>
                <th className="px-2 py-2 text-left" title="Último abierto">
                  Últ. abierto
                </th>
                <th className="px-2 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={11}>
                    {loading ? 'Cargando contactos...' : 'Sin contactos para este filtro.'}
                  </td>
                </tr>
              ) : (
                items.map((c) => {
                  const sent = c.sentCount ?? 0;
                  const opened = c.openedCount ?? 0;
                  const clicked = c.clickedCount ?? 0;
                  const bounced = c.bouncedCount ?? 0;
                  const neverOpened = sent > 0 && opened === 0;
                  return (
                    <tr key={c.id} className="border-b border-border align-top">
                      <td className="px-2 py-2">
                        <div className="font-medium">{c.email}</div>
                        {c.name ? <div className="text-xs text-muted-foreground">{c.name}</div> : null}
                      </td>
                      <td className="px-2 py-2">{c.mediaOutlet || '—'}</td>
                      <td className="px-2 py-2">{SCOPE_LABELS[c.scope] || c.scope || '—'}</td>
                      <td className="px-2 py-2">{c.ccaa || '—'}</td>
                      <td className="px-2 py-2">{c.provincia || '—'}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{sent}</td>
                      <td
                        className={[
                          'px-2 py-2 text-right tabular-nums',
                          neverOpened ? 'text-red-600' : opened > 0 ? 'text-green-700' : '',
                        ].join(' ')}
                      >
                        {opened}{' '}
                        <span className="text-xs text-muted-foreground">({pct(opened, sent)})</span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{clicked}</td>
                      <td
                        className={[
                          'px-2 py-2 text-right tabular-nums',
                          bounced > 0 ? 'text-red-600 font-medium' : '',
                        ].join(' ')}
                      >
                        {bounced}
                      </td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">
                        {formatDate(c.lastOpenedAt)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(c)}
                            disabled={saving}
                            className="rounded border border-border px-2 py-1 text-xs font-medium disabled:opacity-50"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => removeContact(c.id)}
                            disabled={saving}
                            className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
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
              disabled={offset <= 0 || loading || saving}
              className="rounded border border-border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => loadData(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || loading || saving}
              className="rounded border border-border px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Las métricas (enviados, abiertos, clicks, rebotes) solo cuentan campañas de <strong>Notas de prensa</strong>{' '}
          (kind=PRESS). Los porcentajes se calculan sobre los envíos registrados para cada email. Para ver el detalle
          de una campaña concreta utiliza el apartado “Historial de campañas”.
        </p>
      </section>
    </div>
  );
}
