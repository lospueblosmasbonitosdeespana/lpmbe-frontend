'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Alcalde = {
  id: number;
  email: string;
  nombre: string | null;
  rol: string;
  activo: boolean;
};

type Institucional = {
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
  metadata: Record<string, any>;
};

type PuebloGroup = {
  puebloSlug: string;
  puebloName: string;
  provincia: string;
  comunidad: string;
  region: string | null;
  alcaldes: Alcalde[];
  institucionales: Institucional[];
};

const REGION_LABELS: Record<string, string> = {
  NORTE: 'Norte',
  SUR: 'Sur',
  ESTE: 'Este',
  CENTRO: 'Centro',
};

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
  OTRO: 'Otro',
  COLABORADOR: 'Colaborador (web)',
};

export default function UsuariosPorPuebloClient() {
  const [groups, setGroups] = useState<PuebloGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [onlyWithInst, setOnlyWithInst] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        '/api/admin/newsletter/institutional-contacts/by-pueblo',
        { cache: 'no-store' },
      );
      const data = await res.json().catch(() => []);
      if (!res.ok)
        throw new Error((data as any)?.message || 'No se pudo cargar');
      setGroups(Array.isArray(data) ? (data as PuebloGroup[]) : []);
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (regionFilter && g.region !== regionFilter) return false;
      if (onlyWithInst && g.institucionales.length === 0) return false;
      if (q) {
        const hay =
          g.puebloName?.toLowerCase().includes(q) ||
          g.provincia?.toLowerCase().includes(q) ||
          g.alcaldes.some(
            (a) =>
              a.email.toLowerCase().includes(q) ||
              (a.nombre || '').toLowerCase().includes(q),
          ) ||
          g.institucionales.some(
            (i) =>
              i.email.toLowerCase().includes(q) ||
              (i.name || '').toLowerCase().includes(q),
          );
        if (!hay) return false;
      }
      return true;
    });
  }, [groups, search, regionFilter, onlyWithInst]);

  const totals = useMemo(() => {
    let alcaldes = 0;
    let inst = 0;
    let inst_sus = 0;
    let inst_uns = 0;
    for (const g of groups) {
      alcaldes += g.alcaldes.length;
      inst += g.institucionales.length;
      for (const i of g.institucionales) {
        if (i.status === 'subscribed') inst_sus++;
        else if (i.status === 'unsubscribed') inst_uns++;
      }
    }
    return { alcaldes, inst, inst_sus, inst_uns, pueblos: groups.length };
  }, [groups]);

  async function deleteInstitutional(id: number, puebloSlug: string) {
    if (!window.confirm('¿Eliminar este contacto institucional?')) return;
    try {
      const res = await fetch(
        `/api/admin/newsletter/institutional-contacts/${id}`,
        { method: 'DELETE' },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar');
      setMessage('Contacto institucional eliminado.');
      setGroups((prev) =>
        prev.map((g) =>
          g.puebloSlug === puebloSlug
            ? {
                ...g,
                institucionales: g.institucionales.filter((i) => i.id !== id),
              }
            : g,
        ),
      );
    } catch (e: any) {
      setError(e?.message || 'Error al eliminar');
    }
  }

  async function setInstitutionalStatus(
    id: number,
    puebloSlug: string,
    status: 'subscribed' | 'unsubscribed',
  ) {
    try {
      const res = await fetch(
        `/api/admin/newsletter/institutional-contacts/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo actualizar');
      setGroups((prev) =>
        prev.map((g) =>
          g.puebloSlug === puebloSlug
            ? {
                ...g,
                institucionales: g.institucionales.map((i) =>
                  i.id === id ? { ...i, status } : i,
                ),
              }
            : g,
        ),
      );
    } catch (e: any) {
      setError(e?.message || 'Error al actualizar');
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Usuarios e institucionales por pueblo</h1>
        <p className="mt-2 text-muted-foreground">
          Vista consolidada: alcaldes y colaboradores con acceso a la web y
          contactos institucionales (alcaldes, concejales, técnicos de turismo…) de
          cada pueblo. Solo visible para administradores.
        </p>
      </div>

      {message ? (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="mb-6 grid gap-3 md:grid-cols-5">
        <Kpi label="Pueblos" value={String(totals.pueblos)} />
        <Kpi label="Alcaldes (User)" value={String(totals.alcaldes)} tone="blue" />
        <Kpi label="Institucionales" value={String(totals.inst)} />
        <Kpi
          label="Inst. suscritos"
          value={String(totals.inst_sus)}
          tone="green"
        />
        <Kpi
          label="Inst. bajas / ex"
          value={String(totals.inst_uns)}
          tone="amber"
        />
      </section>

      <section className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            Buscar
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="pueblo, email, nombre…"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            Región
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              <option value="NORTE">Norte</option>
              <option value="CENTRO">Centro</option>
              <option value="SUR">Sur</option>
              <option value="ESTE">Este</option>
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyWithInst}
              onChange={(e) => setOnlyWithInst(e.target.checked)}
            />
            Solo pueblos con institucionales importados
          </label>
        </div>
      </section>

      {loading ? (
        <div className="animate-pulse rounded-lg bg-muted p-8">Cargando…</div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Sin resultados para los filtros actuales.
            </div>
          ) : (
            filtered.map((g) => (
              <article
                key={g.puebloSlug || g.puebloName}
                className="rounded-xl border border-border bg-white p-4 shadow-sm"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h2 className="text-lg font-semibold">{g.puebloName}</h2>
                    <p className="text-xs text-muted-foreground">
                      {g.provincia} · {g.comunidad}
                      {g.region ? ` · ${REGION_LABELS[g.region] || g.region}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{g.alcaldes.length} usuarios web</span>
                    <span>·</span>
                    <span>{g.institucionales.length} institucionales</span>
                    {g.puebloSlug ? (
                      <Link
                        href={`/gestion/pueblos/${g.puebloSlug}`}
                        className="ml-2 rounded border border-border px-2 py-0.5 font-medium hover:border-primary/40"
                      >
                        Abrir pueblo
                      </Link>
                    ) : null}
                  </div>
                </header>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                      Usuarios web (rol ALCALDE / COLABORADOR)
                    </h3>
                    {g.alcaldes.length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sin usuarios con acceso a la web.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {g.alcaldes.map((a) => (
                          <li
                            key={a.id}
                            className="rounded-lg border border-blue-100 bg-blue-50/40 p-2 text-xs"
                          >
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded-full border border-blue-300 bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-900">
                                {ROLE_LABELS[a.rol] || a.rol}
                              </span>
                              {!a.activo ? (
                                <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                                  Inactivo
                                </span>
                              ) : null}
                              <span className="font-medium">{a.email}</span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-2 text-muted-foreground">
                              <span>{a.nombre || '—'}</span>
                              <Link
                                href={`/gestion/asociacion/datos/usuarios/${a.id}`}
                                className="text-blue-700 hover:underline"
                              >
                                Editar usuario
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Contactos institucionales (solo emails)
                    </h3>
                    {g.institucionales.length === 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sin contactos institucionales importados.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {g.institucionales.map((i) => {
                          const isEx = !!i.metadata?.isExRole;
                          return (
                            <li
                              key={i.id}
                              className="rounded-lg border border-amber-100 bg-amber-50/30 p-2 text-xs"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                                  {ROLE_LABELS[i.role || ''] || i.role || '—'}
                                </span>
                                {isEx ? (
                                  <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                                    EX
                                  </span>
                                ) : null}
                                {i.status !== 'subscribed' ? (
                                  <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                                    {i.status === 'unsubscribed'
                                      ? 'Baja'
                                      : 'Rebote'}
                                  </span>
                                ) : null}
                                <span className="font-medium">{i.email}</span>
                              </div>
                              <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
                                <span>{i.name || '—'}</span>
                                <div className="flex gap-2">
                                  {i.status === 'subscribed' ? (
                                    <button
                                      onClick={() =>
                                        setInstitutionalStatus(
                                          i.id,
                                          g.puebloSlug,
                                          'unsubscribed',
                                        )
                                      }
                                      className="text-amber-700 hover:underline"
                                    >
                                      Dar de baja
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setInstitutionalStatus(
                                          i.id,
                                          g.puebloSlug,
                                          'subscribed',
                                        )
                                      }
                                      className="text-green-700 hover:underline"
                                    >
                                      Reactivar
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      deleteInstitutional(i.id, g.puebloSlug)
                                    }
                                    className="text-red-700 hover:underline"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </main>
  );
}

function Kpi({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: string;
  tone?: 'green' | 'amber' | 'red' | 'gray' | 'blue';
}) {
  const tones: Record<string, string> = {
    green: 'border-green-200 bg-green-50',
    amber: 'border-amber-200 bg-amber-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-border bg-card',
    blue: 'border-blue-200 bg-blue-50',
  };
  return (
    <div className={['rounded-xl border p-4', tones[tone]].join(' ')}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
