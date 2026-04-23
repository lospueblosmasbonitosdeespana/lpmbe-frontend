'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

type OverviewResponse = {
  total: number;
  byScope: Array<{ scope: string; total: number }>;
  nationalMediaTotal?: number;
  withSent: number;
  withOpens: number;
  activos90d: number;
  dormidos: number;
  neverOpened: number;
  neverSent: number;
  withBounces: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
};

type QuickScope = '' | 'NACIONAL' | 'CCAA' | 'PROVINCIA' | 'LOCAL';
type Health =
  | ''
  | 'active_90d'
  | 'never_opened'
  | 'dormant'
  | 'bounced'
  | 'never_sent'
  | 'clicked';

type SortKey =
  | 'createdAt'
  | 'email'
  | 'mediaOutlet'
  | 'scope'
  | 'ccaa'
  | 'provincia'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'lastOpenedAt';

type CampaignHistoryItem = {
  campaignId: number;
  subject: string;
  kind: string;
  campaignStatus: string;
  campaignSentAt: string | null;
  recipientStatus: string | null;
  lastEvent: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  error: string | null;
};

type DuplicatesResponse = {
  total: number;
  groups: Array<{
    email: string;
    rows: Array<{
      id: number;
      email: string;
      name: string | null;
      mediaOutlet: string | null;
      scope: string;
      ccaa: string;
      provincia: string;
      puebloSlug: string;
      createdAt: string;
    }>;
  }>;
};

const PAGE_SIZE = 100;

const SCOPE_LABELS: Record<string, string> = {
  NACIONAL: 'Nacional',
  CCAA: 'Autonómico',
  PROVINCIA: 'Provincial',
  LOCAL: 'Local',
};

const HEALTH_OPTIONS: { value: Health; label: string; helper: string }[] = [
  { value: '', label: 'Todos', helper: 'Sin filtro por salud' },
  { value: 'active_90d', label: 'Abridores activos', helper: 'Abrieron algo en los últimos 90 días' },
  { value: 'clicked', label: 'Con clicks', helper: 'Han hecho click al menos una vez' },
  { value: 'dormant', label: 'Dormidos', helper: 'Abrieron alguna vez pero nada en los últimos 180 días' },
  { value: 'never_opened', label: 'Nunca abrieron', helper: 'Han recibido envíos y nunca los abrieron' },
  { value: 'bounced', label: 'Con rebotes', helper: 'Al menos un rebote (hard o soft)' },
  { value: 'never_sent', label: 'Sin envíos', helper: 'Contactos a los que nunca se les ha enviado' },
];

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

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function daysSince(value?: string | null): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function getHealthBadge(c: PressContact): { label: string; tone: 'green' | 'amber' | 'red' | 'gray' } | null {
  const sent = c.sentCount ?? 0;
  const opened = c.openedCount ?? 0;
  const bounced = c.bouncedCount ?? 0;
  const lastOpenDays = daysSince(c.lastOpenedAt);

  if (bounced > 0 && sent <= bounced + 1) {
    return { label: 'Rebota', tone: 'red' };
  }
  if (sent === 0) return { label: 'Sin envíos', tone: 'gray' };
  if (opened === 0) return { label: 'Nunca abre', tone: 'red' };
  if (lastOpenDays !== null && lastOpenDays <= 90) {
    return { label: 'Activo', tone: 'green' };
  }
  if (lastOpenDays !== null && lastOpenDays > 180) {
    return { label: 'Dormido', tone: 'amber' };
  }
  return { label: 'Ocasional', tone: 'gray' };
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
  const [health, setHealth] = useState<Health>('');
  const [ccaa, setCcaa] = useState('');
  const [provincia, setProvincia] = useState('');
  // Eje ortogonal a scope: identifica cabeceras nacionales (RTVE, EFE,
  // Europa Press, COPE, SER, ABC, El País, etc.) aunque el contacto
  // concreto sea una delegación autonómica o provincial.
  const [nationalMedia, setNationalMedia] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [filters, setFilters] = useState<FiltersResponse>({ scopes: [], ccaas: [], provincias: [] });
  const [filtersLoading, setFiltersLoading] = useState(false);

  const [overview, setOverview] = useState<OverviewResponse | null>(null);

  const [duplicates, setDuplicates] = useState<DuplicatesResponse | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [historyFor, setHistoryFor] = useState<PressContact | null>(null);
  const [historyItems, setHistoryItems] = useState<CampaignHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletter/press-contacts/overview', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setOverview(data as OverviewResponse);
    } catch {
      // ignore
    }
  }, []);

  const loadDuplicates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/newsletter/press-contacts/duplicates?limit=50', {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setDuplicates(data as DuplicatesResponse);
    } catch {
      // ignore
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
        if (health) params.set('health', health);
        if (nationalMedia) params.set('nationalMedia', 'true');
        params.set('sort', sortKey);
        params.set('sortDir', sortDir);
        const res = await fetch(
          `/api/admin/newsletter/press-contacts?${params.toString()}`,
          { cache: 'no-store' },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'No se pudieron cargar contactos');
        setItems(Array.isArray(data?.items) ? data.items : []);
        setTotal(Number(data?.total || 0));
        setOffset(nextOffset);
        // Al cambiar de página, conservamos la selección solo si sigue en la tabla.
        setSelected((prev) => {
          const ids = new Set((data.items || []).map((x: PressContact) => x.id));
          const next = new Set<number>();
          prev.forEach((id) => {
            if (ids.has(id)) next.add(id);
          });
          return next;
        });
      } catch (e: unknown) {
        setError((e as Error)?.message || 'Error cargando contactos');
      } finally {
        setLoading(false);
      }
    },
    [search, quickScope, ccaa, provincia, health, nationalMedia, sortKey, sortDir],
  );

  useEffect(() => {
    loadFilters();
    loadOverview();
    loadDuplicates();
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickScope, ccaa, provincia, health, nationalMedia, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(
        ['sent', 'opened', 'clicked', 'bounced', 'lastOpenedAt', 'createdAt'].includes(key)
          ? 'desc'
          : 'asc',
      );
    }
  }

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
      await Promise.all([loadData(offset), loadFilters(), loadOverview(), loadDuplicates()]);
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
      await Promise.all([loadData(offset), loadFilters(), loadOverview(), loadDuplicates()]);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    const ok = window.confirm(
      `¿Eliminar ${selected.size} contactos seleccionados? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;
    setBulkBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/newsletter/press-contacts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudieron eliminar');
      setMessage(`${data?.deleted || 0} contactos eliminados.`);
      setSelected(new Set());
      await Promise.all([loadData(0), loadFilters(), loadOverview(), loadDuplicates()]);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error en el borrado masivo');
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkScope(scope: string) {
    if (selected.size === 0) return;
    const label = SCOPE_LABELS[scope] || scope;
    const ok = window.confirm(`¿Cambiar el ámbito de ${selected.size} contactos a "${label}"?`);
    if (!ok) return;
    setBulkBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/newsletter/press-contacts/bulk-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), scope }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo actualizar');
      setMessage(`${data?.updated || 0} contactos actualizados a ${label}.`);
      await Promise.all([loadData(offset), loadFilters(), loadOverview()]);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error en la actualización masiva');
    } finally {
      setBulkBusy(false);
    }
  }

  async function createContact() {
    if (!createForm.email.trim()) {
      setError('El email es obligatorio.');
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
      setMessage('Contacto dado de alta.');
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
      await Promise.all([loadData(0), loadFilters(), loadOverview(), loadDuplicates()]);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error al crear');
    } finally {
      setSaving(false);
    }
  }

  async function handleImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (importInputRef.current) importInputRef.current.value = '';
    setImporting(true);
    setImportResult(null);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/newsletter/press-contacts/import-csv', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error importando CSV');
      const imp = Number(data?.imported || 0);
      setImportResult(`${imp} contactos importados/actualizados.`);
      setMessage(`CSV importado: ${imp} contactos.`);
      await Promise.all([loadData(0), loadFilters(), loadOverview(), loadDuplicates()]);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Error importando CSV');
      setImportResult(null);
    } finally {
      setImporting(false);
    }
  }

  async function openHistory(c: PressContact) {
    setHistoryFor(c);
    setHistoryItems([]);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter/press-contacts/${c.id}/campaigns?limit=100`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHistoryItems(Array.isArray(data?.items) ? data.items : []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  function exportCsv(scope: 'page' | 'all') {
    const source = scope === 'all' ? items : items;
    if (source.length === 0) {
      setError('No hay contactos para exportar.');
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
    const rows = source.map((c) => [
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
    const healthTag = health ? `-${health}` : '';
    const ccaaTag = ccaa ? `-${ccaa.toLowerCase().replace(/\s+/g, '_')}` : '';
    const provinciaTag = provincia ? `-${provincia.toLowerCase().replace(/\s+/g, '_')}` : '';
    a.download = `contactos-prensa${scopeTag}${healthTag}${ccaaTag}${provinciaTag}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportAllFiltered() {
    // Trae hasta 5000 respetando todos los filtros activos
    try {
      const params = new URLSearchParams();
      params.set('limit', '5000');
      params.set('offset', '0');
      if (search.trim()) params.set('search', search.trim());
      if (quickScope) params.set('scope', quickScope);
      if (ccaa) params.set('ccaa', ccaa);
      if (provincia) params.set('provincia', provincia);
      if (health) params.set('health', health);
      if (nationalMedia) params.set('nationalMedia', 'true');
      params.set('sort', sortKey);
      params.set('sortDir', sortDir);
      const res = await fetch(`/api/admin/newsletter/press-contacts?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo exportar');
      const all: PressContact[] = Array.isArray(data?.items) ? data.items : [];
      if (all.length === 0) {
        setError('No hay contactos que cumplan los filtros actuales.');
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
      const rows = all.map((c) => [
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
      a.download = `contactos-prensa-filtrados-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError((e as Error)?.message || 'Error exportando');
    }
  }

  const allSelected = items.length > 0 && items.every((c) => selected.has(c.id));
  const someSelected = selected.size > 0;

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

  return (
    <div className="mt-8 space-y-6">
      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* KPIs globales */}
      {overview ? (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Contactos activos"
            value={overview.total.toLocaleString('es-ES')}
            hint={`${overview.withSent} han recibido al menos una nota`}
          />
          <KpiCard
            label="Abridores activos (90d)"
            value={overview.activos90d.toLocaleString('es-ES')}
            hint={`${overview.openRate}% tasa de apertura global`}
            tone={overview.activos90d > 0 ? 'green' : 'gray'}
          />
          <KpiCard
            label="Nunca abrieron"
            value={overview.neverOpened.toLocaleString('es-ES')}
            hint={`${overview.dormidos} dormidos (>180 días) · considera depurarlos`}
            tone={overview.neverOpened > overview.activos90d ? 'red' : 'amber'}
          />
          <KpiCard
            label="Rebotes"
            value={overview.withBounces.toLocaleString('es-ES')}
            hint={`${overview.totalBounced} eventos · ${overview.bounceRate}% sobre envíos totales`}
            tone={overview.withBounces > 0 ? 'red' : 'gray'}
          />
        </section>
      ) : null}

      {/* Banner de duplicados */}
      {duplicates && duplicates.total > 0 ? (
        <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-amber-900">
                {duplicates.total} {duplicates.total === 1 ? 'email duplicado' : 'emails duplicados'} en la base
              </div>
              <div className="mt-1 text-xs text-amber-800">
                El mismo email aparece en varias filas (normalmente con distinto ámbito/CCAA/provincia). Para no
                enviarle la misma nota varias veces, revisa y quédate con una sola entrada por contacto.
              </div>
            </div>
            <button
              onClick={() => setShowDuplicates((v) => !v)}
              className="shrink-0 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              {showDuplicates ? 'Ocultar' : 'Revisar duplicados'}
            </button>
          </div>
          {showDuplicates ? (
            <div className="mt-3 space-y-3">
              {duplicates.groups.map((g) => (
                <div key={g.email} className="rounded-lg border border-amber-200 bg-white p-3">
                  <div className="text-xs font-semibold text-amber-900">{g.email}</div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-amber-200 text-[11px] text-amber-900">
                          <th className="px-2 py-1 text-left">ID</th>
                          <th className="px-2 py-1 text-left">Ámbito</th>
                          <th className="px-2 py-1 text-left">CCAA</th>
                          <th className="px-2 py-1 text-left">Provincia</th>
                          <th className="px-2 py-1 text-left">Medio</th>
                          <th className="px-2 py-1 text-left">Creado</th>
                          <th className="px-2 py-1 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.rows.map((r) => (
                          <tr key={r.id} className="border-b border-amber-100 last:border-0">
                            <td className="px-2 py-1 font-mono">{r.id}</td>
                            <td className="px-2 py-1">{SCOPE_LABELS[r.scope] || r.scope}</td>
                            <td className="px-2 py-1">{r.ccaa || '—'}</td>
                            <td className="px-2 py-1">{r.provincia || '—'}</td>
                            <td className="px-2 py-1">{r.mediaOutlet || '—'}</td>
                            <td className="px-2 py-1">{formatDate(r.createdAt)}</td>
                            <td className="px-2 py-1 text-right">
                              <button
                                onClick={() => removeContact(r.id)}
                                className="rounded border border-red-300 px-2 py-0.5 text-[11px] font-medium text-red-700 hover:bg-red-50"
                              >
                                Borrar esta
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-amber-800">
                Consejo: conserva la fila con el ámbito más específico (LOCAL &gt; PROVINCIA &gt; CCAA &gt; NACIONAL),
                normalmente es la más útil para segmentar envíos.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Filtros */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Filtros</h2>
            <p className="text-xs text-muted-foreground">
              Combina ámbito, salud del contacto, comunidad, provincia y búsqueda libre.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium"
            >
              {showImport ? 'Cerrar importación' : 'Importar CSV'}
            </button>
            <button
              onClick={exportAllFiltered}
              disabled={loading}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              title="Exporta TODOS los contactos que cumplen los filtros actuales (hasta 5000)"
            >
              Exportar filtrados
            </button>
            <button
              onClick={() => exportCsv('page')}
              disabled={loading || items.length === 0}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              title="Solo la página visible"
            >
              Exportar página
            </button>
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              {showCreate ? 'Cerrar alta' : '+ Nuevo contacto'}
            </button>
          </div>
        </div>

        {/* Ámbito */}
        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground">Ámbito</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {([
              { value: '', label: 'Todos' },
              { value: 'NACIONAL', label: 'Nacionales' },
              { value: 'CCAA', label: 'Autonómicos' },
              { value: 'PROVINCIA', label: 'Provinciales' },
              { value: 'LOCAL', label: 'Locales' },
            ] as { value: QuickScope; label: string }[]).map((f) => {
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
                >
                  {f.label}
                  {typeof count === 'number' ? (
                    <span
                      className={['ml-1 text-[10px]', active ? 'text-primary-foreground/80' : 'text-muted-foreground'].join(' ')}
                    >
                      ({count})
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cabeceras nacionales (eje ortogonal a Ámbito) */}
        <div className="mt-3">
          <div className="text-xs font-medium text-muted-foreground">Cabeceras de medios nacionales</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setNationalMedia((v) => !v)}
              title={
                'Incluye delegaciones autonómicas/provinciales de cabeceras nacionales ' +
                '(RTVE, EFE, Europa Press, COPE, SER, ABC, El País, El Mundo, Onda Cero, ' +
                'La Sexta, Antena 3, Mediaset, El Confidencial, El Español, La Vanguardia, La Razón…).'
              }
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition',
                nationalMedia
                  ? 'border border-primary bg-primary text-primary-foreground'
                  : 'border border-border bg-background text-foreground hover:border-primary/40',
              ].join(' ')}
            >
              {nationalMedia ? 'Solo cabeceras nacionales' : 'Mostrar solo cabeceras nacionales'}
              {overview?.nationalMediaTotal !== undefined ? (
                <span
                  className={['ml-1 text-[10px]', nationalMedia ? 'text-primary-foreground/80' : 'text-muted-foreground'].join(' ')}
                >
                  ({overview.nationalMediaTotal})
                </span>
              ) : null}
            </button>
            <span className="text-[11px] text-muted-foreground">
              Incluye delegaciones autonómicas/provinciales. No cambia el ámbito ni afecta a los envíos segmentados por CCAA/provincia.
            </span>
          </div>
        </div>

        {/* Salud */}
        <div className="mt-4">
          <div className="text-xs font-medium text-muted-foreground">Salud del contacto</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {HEALTH_OPTIONS.map((h) => {
              const active = health === h.value;
              return (
                <button
                  key={h.value || 'all'}
                  onClick={() => setHealth(h.value)}
                  title={h.helper}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-medium transition',
                    active
                      ? 'border border-primary bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-foreground hover:border-primary/40',
                  ].join(' ')}
                >
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CCAA / Provincia / Búsqueda */}
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
              onChange={(e) => setProvincia(e.target.value)}
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
                placeholder="ej. elpais, @medio.es, valencia..."
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

        {/* Chips activos */}
        {(quickScope || health || ccaa || provincia || search.trim() || nationalMedia) ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Filtros activos:</span>
            {quickScope ? <ActiveChip>Ámbito: {SCOPE_LABELS[quickScope] || quickScope}</ActiveChip> : null}
            {nationalMedia ? <ActiveChip>Cabeceras nacionales</ActiveChip> : null}
            {health ? (
              <ActiveChip>
                Salud: {HEALTH_OPTIONS.find((h) => h.value === health)?.label || health}
              </ActiveChip>
            ) : null}
            {ccaa ? <ActiveChip>CCAA: {ccaa}</ActiveChip> : null}
            {provincia ? <ActiveChip>Provincia: {provincia}</ActiveChip> : null}
            {search.trim() ? <ActiveChip>“{search.trim()}”</ActiveChip> : null}
            <button
              onClick={() => {
                setQuickScope('');
                setHealth('');
                setCcaa('');
                setProvincia('');
                setSearch('');
                setNationalMedia(false);
                setTimeout(() => loadData(0), 0);
              }}
              className="rounded-full border border-border bg-background px-2 py-0.5 text-xs hover:border-primary/40"
            >
              Limpiar
            </button>
          </div>
        ) : null}
      </section>

      {/* Importación CSV */}
      {showImport ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Importar contactos desde CSV</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cabeceras aceptadas: <code className="rounded bg-muted px-1">email</code>,{' '}
            <code className="rounded bg-muted px-1">name</code>,{' '}
            <code className="rounded bg-muted px-1">media_outlet</code>,{' '}
            <code className="rounded bg-muted px-1">scope</code>{' '}
            (NACIONAL / CCAA / PROVINCIA / LOCAL),{' '}
            <code className="rounded bg-muted px-1">ccaa</code>,{' '}
            <code className="rounded bg-muted px-1">provincia</code>,{' '}
            <code className="rounded bg-muted px-1">pueblo_slug</code>. Si el email ya existe con el mismo
            ámbito/CCAA/provincia, se actualiza (upsert).
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleImportCsv}
              disabled={importing}
              className="text-sm"
            />
            {importing ? <span className="text-xs text-muted-foreground">Importando…</span> : null}
          </div>
          {importResult ? (
            <p className="mt-2 text-xs text-green-700">{importResult}</p>
          ) : null}
        </section>
      ) : null}

      {/* Alta manual */}
      {showCreate ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Nuevo contacto de prensa</h2>
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

      {/* Editar */}
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

      {/* Listado */}
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

        {/* Acciones en lote */}
        {someSelected ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2 text-xs">
            <span className="font-medium">
              {selected.size} seleccionados
            </span>
            <button
              onClick={bulkDelete}
              disabled={bulkBusy}
              className="rounded border border-red-300 bg-white px-2 py-1 font-medium text-red-700 disabled:opacity-50"
            >
              Borrar seleccionados
            </button>
            <div className="ml-2 flex items-center gap-1">
              <span>Cambiar ámbito a:</span>
              {(['NACIONAL', 'CCAA', 'PROVINCIA', 'LOCAL'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => bulkScope(s)}
                  disabled={bulkBusy}
                  className="rounded border border-border bg-white px-2 py-1 font-medium disabled:opacity-50"
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSelected(new Set())}
              disabled={bulkBusy}
              className="ml-auto rounded border border-border bg-white px-2 py-1 font-medium disabled:opacity-50"
            >
              Deseleccionar
            </button>
          </div>
        ) : null}

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
                    aria-label="Seleccionar todos los de esta página"
                  />
                </th>
                <SortHeader label="Email" col="email" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Medio" col="mediaOutlet" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Ámbito" col="scope" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="CCAA" col="ccaa" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Provincia" col="provincia" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Salud" col="createdAt" current={sortKey} dir={sortDir} onClick={toggleSort} disabled />
                <SortHeader label="Env." col="sent" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader label="Abiertos" col="opened" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader label="Clicks" col="clicked" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader label="Reb." col="bounced" current={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                <SortHeader label="Últ. abierto" col="lastOpenedAt" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <th className="px-2 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={13}>
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
                  const badge = getHealthBadge(c);
                  const isSelected = selected.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      className={[
                        'border-b border-border align-top',
                        isSelected ? 'bg-primary/5' : '',
                      ].join(' ')}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
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
                        {c.name ? <div className="text-xs text-muted-foreground">{c.name}</div> : null}
                      </td>
                      <td className="px-2 py-2">{c.mediaOutlet || '—'}</td>
                      <td className="px-2 py-2">{SCOPE_LABELS[c.scope] || c.scope || '—'}</td>
                      <td className="px-2 py-2">{c.ccaa || '—'}</td>
                      <td className="px-2 py-2">{c.provincia || '—'}</td>
                      <td className="px-2 py-2">
                        {badge ? <HealthBadge label={badge.label} tone={badge.tone} /> : null}
                      </td>
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
                      <td className="px-2 py-2 text-xs text-muted-foreground">{formatDate(c.lastOpenedAt)}</td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openHistory(c)}
                            disabled={saving}
                            className="rounded border border-border px-2 py-1 text-xs font-medium disabled:opacity-50"
                            title="Ver historial de campañas"
                          >
                            Historial
                          </button>
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
          por campaña pulsa «Historial» en un contacto.
        </p>
      </section>

      {/* Modal historial */}
      {historyFor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setHistoryFor(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Historial de notas de prensa</h3>
                <p className="text-xs text-muted-foreground">
                  {historyFor.email}
                  {historyFor.mediaOutlet ? ` · ${historyFor.mediaOutlet}` : ''}
                </p>
              </div>
              <button
                onClick={() => setHistoryFor(null)}
                className="rounded-lg border border-border px-3 py-1.5 text-xs"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-4">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Cargando historial…</p>
              ) : historyItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este contacto no aparece en ninguna campaña de prensa registrada.
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="px-2 py-2 text-left">Campaña</th>
                      <th className="px-2 py-2 text-left">Enviada</th>
                      <th className="px-2 py-2 text-left">Estado</th>
                      <th className="px-2 py-2 text-left">Abierto</th>
                      <th className="px-2 py-2 text-left">Click</th>
                      <th className="px-2 py-2 text-left">Rebote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyItems.map((h) => (
                      <tr key={h.campaignId} className="border-b border-border align-top">
                        <td className="px-2 py-2">
                          <div className="font-medium">{h.subject || `(campaña #${h.campaignId})`}</div>
                          {h.error ? (
                            <div className="mt-0.5 text-[11px] text-red-600">{h.error}</div>
                          ) : null}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">{formatDate(h.campaignSentAt)}</td>
                        <td className="px-2 py-2">
                          {h.lastEvent ? (
                            <span className="rounded-full border border-border bg-background px-2 py-0.5">
                              {h.lastEvent.replace('email.', '')}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={['px-2 py-2', h.openedAt ? 'text-green-700' : 'text-muted-foreground'].join(' ')}>
                          {formatDateTime(h.openedAt)}
                        </td>
                        <td className={['px-2 py-2', h.clickedAt ? 'text-green-700' : 'text-muted-foreground'].join(' ')}>
                          {formatDateTime(h.clickedAt)}
                        </td>
                        <td className={['px-2 py-2', h.bouncedAt ? 'text-red-600' : 'text-muted-foreground'].join(' ')}>
                          {formatDateTime(h.bouncedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* --- Subcomponentes --- */

function KpiCard({
  label,
  value,
  hint,
  tone = 'gray',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'green' | 'amber' | 'red' | 'gray';
}) {
  const tones: Record<string, string> = {
    green: 'border-green-200 bg-green-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-border bg-card',
  };
  return (
    <div className={['rounded-xl border p-4', tones[tone]].join(' ')}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function ActiveChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-background px-2 py-0.5">{children}</span>
  );
}

function HealthBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'amber' | 'red' | 'gray';
}) {
  const tones: Record<string, string> = {
    green: 'border-green-300 bg-green-50 text-green-800',
    amber: 'border-amber-300 bg-amber-50 text-amber-800',
    red: 'border-red-300 bg-red-50 text-red-700',
    gray: 'border-border bg-muted text-muted-foreground',
  };
  return (
    <span className={['inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone]].join(' ')}>
      {label}
    </span>
  );
}

function SortHeader({
  label,
  col,
  current,
  dir,
  onClick,
  align = 'left',
  disabled = false,
}: {
  label: string;
  col: SortKey;
  current: SortKey;
  dir: 'asc' | 'desc';
  onClick: (k: SortKey) => void;
  align?: 'left' | 'right';
  disabled?: boolean;
}) {
  const isCurrent = current === col && !disabled;
  return (
    <th className={['px-2 py-2', align === 'right' ? 'text-right' : 'text-left'].join(' ')}>
      {disabled ? (
        <span>{label}</span>
      ) : (
        <button
          onClick={() => onClick(col)}
          className={[
            'inline-flex items-center gap-1 text-xs font-medium',
            isCurrent ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
        >
          {label}
          {isCurrent ? <span aria-hidden>{dir === 'asc' ? '▲' : '▼'}</span> : null}
        </button>
      )}
    </th>
  );
}
