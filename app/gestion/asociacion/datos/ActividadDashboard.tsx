'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

type KPIs = {
  totalUsuarios: number;
  usuarios24h: number;
  usuarios7d: number;
  usuarios30d: number;
  totalValoraciones: number;
  totalVisitas: number;
  totalPuntos: number;
  totalPueblos: number;
  roles: Record<string, number>;
};

type UsuarioReciente = {
  id: number;
  email: string;
  nombre: string | null;
  rol: string;
  createdAt: string;
};

type ValoracionReciente = {
  id: number;
  pueblo: string;
  rating: number;
  email: string;
  nombre: string | null;
  createdAt: string;
};

type VisitaReciente = {
  id: number;
  pueblo: string;
  email: string;
  nombre: string | null;
  origen: string;
  fecha: string;
};

type DatoGrafica = { dia: string; total: number };

type UserRow = {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  rol: string;
  activo: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  totalVisitas: number;
};

type UsersResponse = {
  items: UserRow[];
  total: number;
};

const ROLES = ['', 'ADMIN', 'EDITOR', 'ALCALDE', 'COLABORADOR', 'CLIENTE', 'USUARIO'] as const;

type DashboardData = {
  kpis: KPIs;
  actividadReciente: {
    usuarios: UsuarioReciente[];
    valoraciones: ValoracionReciente[];
    visitas: VisitaReciente[];
  };
  graficas: {
    registrosPorDia: DatoGrafica[];
    visitasPorDia: DatoGrafica[];
    valoracionesPorDia: DatoGrafica[];
  };
};

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

function RolBadge({ rol }: { rol: string }) {
  const colors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    EDITOR: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    ALCALDE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    COLABORADOR: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CLIENTE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    USUARIO: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[rol] ?? colors.USUARIO}`}>
      {rol}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-500">
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatChartDay(dia: string) {
  const parts = dia.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function MergedChart({
  registros,
  visitas,
  valoraciones,
}: {
  registros: DatoGrafica[];
  visitas: DatoGrafica[];
  valoraciones: DatoGrafica[];
}) {
  const allDays = new Set([
    ...registros.map((r) => r.dia),
    ...visitas.map((r) => r.dia),
    ...valoraciones.map((r) => r.dia),
  ]);
  const regMap = new Map(registros.map((r) => [r.dia, r.total]));
  const visMap = new Map(visitas.map((r) => [r.dia, r.total]));
  const valMap = new Map(valoraciones.map((r) => [r.dia, r.total]));

  const data = Array.from(allDays)
    .sort()
    .map((dia) => ({
      dia: formatChartDay(dia),
      Registros: regMap.get(dia) ?? 0,
      Visitas: visMap.get(dia) ?? 0,
      Valoraciones: valMap.get(dia) ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gReg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gVis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="dia" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            fontSize: 13,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Area
          type="monotone"
          dataKey="Registros"
          stroke="#6366f1"
          fill="url(#gReg)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Visitas"
          stroke="#10b981"
          fill="url(#gVis)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Valoraciones"
          stroke="#f59e0b"
          fill="url(#gVal)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function ActividadDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'usuarios' | 'valoraciones' | 'visitas'>('usuarios');

  // Users table state
  const [users, setUsers] = useState<UsersResponse | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRolFilter, setUserRolFilter] = useState('');
  const [userPage, setUserPage] = useState(0);
  const PAGE_SIZE = 20;

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newApellidos, setNewApellidos] = useState('');
  const [newRol, setNewRol] = useState('USUARIO');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  // Delete user
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/datos/actividad?days=30', {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Error cargando datos');
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(userPage * PAGE_SIZE),
      });
      if (userSearch.trim()) params.set('q', userSearch.trim());
      if (userRolFilter) params.set('rol', userRolFilter);
      const res = await fetch(`/api/admin/datos/usuarios?${params}`, { cache: 'no-store' });
      if (res.ok) setUsers(await res.json());
    } catch {
      // silently fail
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRolFilter, userPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setUserPage(0);
  }, [userSearch, userRolFilter]);

  const handleCreateUser = async () => {
    if (!newEmail.trim()) return;
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch('/api/admin/datos/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim(),
          nombre: newNombre.trim() || undefined,
          apellidos: newApellidos.trim() || undefined,
          rol: newRol,
          password: newPassword.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.message || 'Error al crear usuario');
      }
      const result = await res.json().catch(() => ({}));
      const emailSent = result?.emailEnviado;
      setCreateMsg(emailSent
        ? 'Usuario creado. Se ha enviado un email para que establezca su contraseña.'
        : 'Usuario creado correctamente.');
      setNewEmail('');
      setNewNombre('');
      setNewApellidos('');
      setNewRol('USUARIO');
      setNewPassword('');
      fetchUsers();
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateMsg(null);
      }, 1500);
    } catch (e: any) {
      setCreateMsg(`Error: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`¿Seguro que quieres desactivar al usuario ${email}? Se marcará como inactivo.`)) return;
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || d.message || 'Error al eliminar');
      } else {
        fetchUsers();
      }
    } catch {
      alert('Error de red al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando datos de actividad…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error ?? 'Error desconocido'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 rounded-md border border-red-300 px-4 py-1.5 text-sm text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { kpis, actividadReciente, graficas } = data;

  return (
    <div className="space-y-8">
      {/* ─── KPIs ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Resumen general</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Usuarios totales"
            value={kpis.totalUsuarios}
            sub={`+${kpis.usuarios24h} hoy · +${kpis.usuarios7d} esta semana · +${kpis.usuarios30d} este mes`}
          />
          <KpiCard
            label="Visitas a pueblos"
            value={kpis.totalVisitas}
          />
          <KpiCard
            label="Valoraciones"
            value={kpis.totalValoraciones}
          />
          <KpiCard
            label="Puntos gamificación"
            value={kpis.totalPuntos}
            sub={`${kpis.totalPueblos} pueblos en la red`}
          />
        </div>

        {/* Roles breakdown */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Object.entries(kpis.roles)
            .sort(([, a], [, b]) => b - a)
            .map(([rol, count]) => (
              <div
                key={rol}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <RolBadge rol={rol} />
                <span className="font-medium text-foreground">{count.toLocaleString('es-ES')}</span>
              </div>
            ))}
        </div>
      </section>

      {/* ─── Gráfica evolución ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Evolución últimos 30 días</h2>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <MergedChart
            registros={graficas.registrosPorDia}
            visitas={graficas.visitasPorDia}
            valoraciones={graficas.valoracionesPorDia}
          />
        </div>
      </section>

      {/* ─── Actividad reciente ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Actividad reciente (últimos 7 días)</h2>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
          {[
            { key: 'usuarios' as const, label: `Usuarios (${actividadReciente.usuarios.length})` },
            { key: 'valoraciones' as const, label: `Valoraciones (${actividadReciente.valoraciones.length})` },
            { key: 'visitas' as const, label: `Visitas (${actividadReciente.visitas.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {tab === 'usuarios' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {actividadReciente.usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Sin registros esta semana
                    </td>
                  </tr>
                ) : (
                  actividadReciente.usuarios.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-foreground">{u.nombre ?? '—'}</td>
                      <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === 'valoraciones' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {actividadReciente.valoraciones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Sin valoraciones esta semana
                    </td>
                  </tr>
                ) : (
                  actividadReciente.valoraciones.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{v.pueblo}</td>
                      <td className="px-4 py-3"><Stars rating={v.rating} /></td>
                      <td className="px-4 py-3 text-foreground">{v.nombre ?? v.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(v.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === 'visitas' && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origen</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {actividadReciente.visitas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      Sin visitas esta semana
                    </td>
                  </tr>
                ) : (
                  actividadReciente.visitas.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{v.pueblo}</td>
                      <td className="px-4 py-3 text-foreground">{v.nombre ?? v.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            v.origen === 'GPS'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {v.origen}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(v.fecha)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── Gestión de usuarios ─── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Gestión de usuarios</h2>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Buscar por email o nombre…"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <select
            value={userRolFilter}
            onChange={(e) => setUserRolFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todos los roles</option>
            {ROLES.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors whitespace-nowrap"
          >
            + Crear usuario
          </button>
        </div>

        {/* Create user modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-semibold text-foreground">Crear nuevo usuario</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="usuario@email.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Nombre</label>
                    <input
                      type="text"
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Apellidos</label>
                    <input
                      type="text"
                      value={newApellidos}
                      onChange={(e) => setNewApellidos(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Rol</label>
                    <select
                      value={newRol}
                      onChange={(e) => setNewRol(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {ROLES.filter(Boolean).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted-foreground">Contraseña</label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Dejar vacío → email"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Si se deja vacío, se envía email al usuario para que la establezca.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleCreateUser}
                  disabled={creating || !newEmail.trim()}
                  className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? 'Creando…' : 'Crear'}
                </button>
                <button
                  onClick={() => { setShowCreateModal(false); setCreateMsg(null); }}
                  className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                {createMsg && (
                  <span className={`text-sm ${createMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {createMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {usersLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              Cargando…
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Visitas</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registro</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Último login</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {!users || users.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Sin resultados
                    </td>
                  </tr>
                ) : (
                  users.items.map((u) => (
                    <tr
                      key={u.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 ${!u.activo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-foreground">
                        {[u.nombre, u.apellidos].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3"><RolBadge rol={u.rol} /></td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{u.totalVisitas}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => router.push(`/gestion/asociacion/datos/usuarios/${u.id}`)}
                            className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Ver / Editar
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={deletingId === u.id}
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                          >
                            {deletingId === u.id ? '…' : 'Eliminar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {users && users.total > PAGE_SIZE && (
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {userPage * PAGE_SIZE + 1}–{Math.min((userPage + 1) * PAGE_SIZE, users.total)} de{' '}
              {users.total.toLocaleString('es-ES')}
            </span>
            <div className="flex gap-2">
              <button
                disabled={userPage === 0}
                onClick={() => setUserPage((p) => p - 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
              >
                ← Anterior
              </button>
              <button
                disabled={(userPage + 1) * PAGE_SIZE >= users.total}
                onClick={() => setUserPage((p) => p + 1)}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
