'use client';

import { useEffect, useMemo, useState } from 'react';

type NewsletterStats = {
  total: number;
  hoy: number;
  semana: number;
  mes: number;
};

type LinkedUser = {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  rol: string;
  activo: boolean;
  createdAt: string;
  lastLoginAt: string | null;
} | null;

type NewsletterItem = {
  id: number;
  email: string;
  origen: string;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
  linkedUser: LinkedUser;
};

type NewsletterResponse = {
  total: number;
  items: NewsletterItem[];
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function NewsletterDashboard() {
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [data, setData] = useState<NewsletterResponse>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<'total' | 'hoy' | 'semana' | 'mes'>('total');
  const [search, setSearch] = useState('');
  const [origen, setOrigen] = useState('');
  const [rol, setRol] = useState('');
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, listRes] = await Promise.all([
          fetch('/api/admin/newsletter/stats', { cache: 'no-store' }),
          fetch(
            `/api/admin/newsletter?periodo=${periodo}&limit=50000&offset=0&search=${encodeURIComponent(
              search.trim(),
            )}`,
            { cache: 'no-store' },
          ),
        ]);

        if (!statsRes.ok) throw new Error('No se pudieron cargar las estadísticas de newsletter');
        if (!listRes.ok) throw new Error('No se pudo cargar el listado de suscriptores');

        const statsJson = await statsRes.json();
        const listJson = await listRes.json();
        setStats(statsJson);
        setData(listJson);
      } catch (e: any) {
        setError(e?.message ?? 'Error inesperado');
      } finally {
        setLoading(false);
      }
    })();
  }, [periodo, search]);

  const origenes = useMemo(
    () =>
      Array.from(
        new Set(data.items.map((i) => (i.origen || '').trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [data.items],
  );

  const filtered = useMemo(
    () =>
      data.items.filter((i) => {
        if (origen && i.origen !== origen) return false;
        if (rol && i.linkedUser?.rol !== rol) return false;
        return true;
      }),
    [data.items, origen, rol],
  );

  const exportFullCsv = () => {
    const rows: string[][] = [
      [
        'email',
        'fecha_alta_newsletter',
        'origen_newsletter',
        'newsletter_id',
        'user_id_vinculado',
        'rol_usuario',
        'nombre_usuario',
        'apellidos_usuario',
        'usuario_activo',
        'fecha_alta_usuario',
        'ultimo_login_usuario',
      ],
      ...filtered.map((i) => [
        i.email,
        i.createdAt,
        i.origen || '',
        String(i.id),
        i.linkedUser?.id ? String(i.linkedUser.id) : '',
        i.linkedUser?.rol ?? '',
        i.linkedUser?.nombre ?? '',
        i.linkedUser?.apellidos ?? '',
        i.linkedUser ? (i.linkedUser.activo ? 'true' : 'false') : '',
        i.linkedUser?.createdAt ?? '',
        i.linkedUser?.lastLoginAt ?? '',
      ]),
    ];
    downloadCsv(`newsletter-completa-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const exportMdirectorCsv = () => {
    const rows: string[][] = [
      ['email'],
      ...filtered.map((i) => [i.email]),
    ];
    downloadCsv(`newsletter-mdirector-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const exportMdirectorAdvancedCsv = () => {
    const rows: string[][] = [
      ['email', 'nombre', 'apellidos', 'rol', 'origen', 'fecha_alta_newsletter'],
      ...filtered.map((i) => [
        i.email,
        i.linkedUser?.nombre ?? '',
        i.linkedUser?.apellidos ?? '',
        i.linkedUser?.rol ?? '',
        i.origen || '',
        i.createdAt,
      ]),
    ];
    downloadCsv(
      `newsletter-mdirector-avanzado-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
    );
  };

  const copyEmailsForMdirector = async () => {
    try {
      const emails = filtered
        .map((i) => (i.email || '').trim().toLowerCase())
        .filter(Boolean);
      const uniqueEmails = Array.from(new Set(emails));
      if (uniqueEmails.length === 0) {
        setCopyMsg('No hay emails para copiar.');
        return;
      }

      const payload = uniqueEmails.join(';');
      await navigator.clipboard.writeText(payload);
      setCopyMsg(`${uniqueEmails.length} emails copiados al portapapeles.`);
      setTimeout(() => setCopyMsg(null), 2500);
    } catch {
      setCopyMsg('No se pudo copiar al portapapeles.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando newsletter…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error ?? 'Error desconocido'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Newsletter</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total suscriptores" value={stats.total} />
          <KpiCard label="Altas hoy" value={stats.hoy} />
          <KpiCard label="Altas semana" value={stats.semana} />
          <KpiCard label="Altas mes" value={stats.mes} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value as 'total' | 'hoy' | 'semana' | 'mes')}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="total">Período: Total</option>
            <option value="hoy">Período: Hoy</option>
            <option value="semana">Período: Semana</option>
            <option value="mes">Período: Mes</option>
          </select>

          <input
            type="text"
            placeholder="Buscar email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />

          <select
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">Todos los orígenes</option>
            {origenes.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          >
            <option value="">Todos los roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ALCALDE">ALCALDE</option>
            <option value="COLABORADOR">COLABORADOR</option>
            <option value="CLIENTE">CLIENTE</option>
            <option value="USUARIO">USUARIO</option>
          </select>

          <button
            onClick={exportMdirectorCsv}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Descargar CSV MDirector
          </button>
          <button
            onClick={copyEmailsForMdirector}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Copiar emails MDirector (;)
          </button>
          <button
            onClick={exportMdirectorAdvancedCsv}
            className="rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary"
          >
            Descargar CSV MDirector (avanzado)
          </button>
          <button
            onClick={exportFullCsv}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Descargar CSV completo
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Registros visibles: {filtered.length.toLocaleString('es-ES')} de {data.total.toLocaleString('es-ES')}
        </p>
        {copyMsg && (
          <p className="text-sm text-muted-foreground">{copyMsg}</p>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alta newsletter</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol usuario</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alta usuario</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Último login</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                filtered.map((i) => (
                  <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-foreground">{i.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.createdAt)}</td>
                    <td className="px-4 py-3 text-foreground">{i.origen || '—'}</td>
                    <td className="px-4 py-3 text-foreground">{i.linkedUser?.rol ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">
                      {i.linkedUser
                        ? `${[i.linkedUser.nombre, i.linkedUser.apellidos].filter(Boolean).join(' ') || i.linkedUser.email}${i.linkedUser.activo ? '' : ' (inactivo)'}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.linkedUser?.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(i.linkedUser?.lastLoginAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
