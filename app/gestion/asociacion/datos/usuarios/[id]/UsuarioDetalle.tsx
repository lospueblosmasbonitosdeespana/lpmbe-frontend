'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = ['ADMIN', 'EDITOR', 'ALCALDE', 'COLABORADOR', 'CLIENTE', 'USUARIO'] as const;

type PuebloOption = {
  id: number;
  nombre: string;
  provincia: string | null;
  comunidad: string | null;
};

type PuebloVisitado = {
  puebloId: number;
  nombre: string;
  slug: string;
  provincia: string | null;
  comunidad: string | null;
  fecha: string;
  origen: string;
  valoracion: number | null;
};

type UserDetail = {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  telefono: string | null;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
  clubStatus: string | null;
  clubPlan: string | null;
  clubValidUntil: string | null;
  esCliente: boolean;
  clienteDesde: string | null;
  ultimoPedidoAt: string | null;
  totalVisitas: number;
  totalPedidos: number;
  pueblosVisitados: {
    total: number;
    pueblos: PuebloVisitado[];
  };
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border last:border-0">
      <span className="w-40 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export default function UsuarioDetalle({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [updatingOrigen, setUpdatingOrigen] = useState<string | null>(null);

  // Add pueblo visitado
  const [allPueblos, setAllPueblos] = useState<PuebloOption[]>([]);
  const [searchPueblo, setSearchPueblo] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [addingPueblo, setAddingPueblo] = useState(false);
  const [addMsg, setAddMsg] = useState<{ text: string; type: 'ok' | 'warn' | 'error' } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Editable fields
  const [editNombre, setEditNombre] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editRol, setEditRol] = useState('');
  const [editActivo, setEditActivo] = useState(true);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Usuario no encontrado');
      const data: UserDetail = await res.json();
      setUser(data);
      setEditNombre(data.nombre ?? '');
      setEditApellidos(data.apellidos ?? '');
      setEditEmail(data.email);
      setEditTelefono(data.telefono ?? '');
      setEditRol(data.rol);
      setEditActivo(data.activo);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetch('/api/pueblos?limit=500', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.pueblos ?? data?.data ?? [];
        setAllPueblos(
          list.map((p: any) => ({
            id: p.id,
            nombre: p.nombre ?? p.name,
            provincia: p.provincia ?? null,
            comunidad: p.comunidad ?? null,
          }))
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visitedPuebloIds = useMemo(
    () => new Set(user?.pueblosVisitados?.pueblos?.map((p) => p.puebloId) ?? []),
    [user],
  );

  const filteredPueblos = useMemo(() => {
    if (!searchPueblo.trim()) return [];
    const q = searchPueblo.trim().toLowerCase();
    return allPueblos
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.provincia?.toLowerCase().includes(q) ||
          p.comunidad?.toLowerCase().includes(q),
      )
      .slice(0, 15);
  }, [searchPueblo, allPueblos]);

  const handleAddPueblo = async (pueblo: PuebloOption) => {
    setShowDropdown(false);
    setSearchPueblo('');

    if (visitedPuebloIds.has(pueblo.id)) {
      setAddMsg({ text: `${pueblo.nombre} ya está en la lista de pueblos visitados`, type: 'warn' });
      setTimeout(() => setAddMsg(null), 4000);
      return;
    }

    const confirmed = confirm(
      `¿Estás seguro de que quieres añadir "${pueblo.nombre}" (${pueblo.provincia ?? ''}) como pueblo visitado para este usuario?`
    );
    if (!confirmed) return;

    setAddingPueblo(true);
    setAddMsg(null);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}/visitas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId: pueblo.id, origen: 'GPS' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddMsg({ text: data.error || data.message || 'Error al añadir', type: 'error' });
        return;
      }
      if (data.alreadyExisted) {
        setAddMsg({ text: `${pueblo.nombre} ya estaba registrado como visitado`, type: 'warn' });
      } else {
        setAddMsg({ text: `${pueblo.nombre} añadido correctamente`, type: 'ok' });
      }
      await fetchUser();
    } catch {
      setAddMsg({ text: 'Error de red al añadir pueblo', type: 'error' });
    } finally {
      setAddingPueblo(false);
      setTimeout(() => setAddMsg(null), 4000);
    }
  };

  const handleDeleteVisita = async (puebloId: number, nombre: string) => {
    const confirmed = confirm(
      `¿Estás seguro de que quieres eliminar "${nombre}" de los pueblos visitados de este usuario?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}/visitas/${puebloId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || d.message || 'Error al eliminar visita');
        return;
      }
      await fetchUser();
    } catch {
      alert('Error de red al eliminar visita');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Seguro que quieres desactivar al usuario ${user?.email}? Se marcará como inactivo.`)) return;
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || d.message || 'Error al eliminar');
        return;
      }
      router.push('/gestion/asociacion/datos?tab=usuarios');
    } catch {
      alert('Error de red al eliminar');
    }
  };

  const handleChangeOrigen = async (puebloId: number, nuevoOrigen: 'GPS' | 'MANUAL') => {
    const key = `${puebloId}`;
    setUpdatingOrigen(key);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}/visitas/${puebloId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origen: nuevoOrigen }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || d.message || 'Error al actualizar origen');
        return;
      }
      await fetchUser();
    } catch {
      alert('Error de red al actualizar origen');
    } finally {
      setUpdatingOrigen(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editNombre || null,
          apellidos: editApellidos || null,
          email: editEmail,
          telefono: editTelefono || null,
          rol: editRol,
          activo: editActivo,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Error al guardar');
      }
      setSaveMsg('Guardado correctamente');
      await fetchUser();
    } catch (e: any) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando usuario…
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error ?? 'Error desconocido'}</p>
        <button
          onClick={() => router.back()}
          className="mt-3 rounded-md border border-red-300 px-4 py-1.5 text-sm text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User info + edit form */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info panel */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Información</h2>
          <InfoRow label="ID" value={user.id} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Nombre" value={[user.nombre, user.apellidos].filter(Boolean).join(' ') || '—'} />
          <InfoRow label="Teléfono" value={user.telefono ?? '—'} />
          <InfoRow
            label="Rol"
            value={
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                user.rol === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                user.rol === 'EDITOR' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                user.rol === 'ALCALDE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                {user.rol}
              </span>
            }
          />
          <InfoRow label="Activo" value={user.activo ? 'Sí' : 'No'} />
          <InfoRow label="Email verificado" value={user.emailVerificado ? 'Sí' : 'No'} />
          <InfoRow label="Registrado" value={formatDate(user.createdAt)} />
          <InfoRow label="Último login" value={formatDate(user.lastLoginAt)} />
          <InfoRow label="Pueblos visitados" value={user.totalVisitas} />
          <InfoRow label="Pedidos" value={user.totalPedidos} />
          {user.clubStatus && (
            <>
              <InfoRow label="Club status" value={user.clubStatus} />
              <InfoRow label="Club plan" value={user.clubPlan ?? '—'} />
              <InfoRow label="Club válido hasta" value={formatDate(user.clubValidUntil)} />
            </>
          )}
          {user.esCliente && (
            <>
              <InfoRow label="Cliente desde" value={formatDate(user.clienteDesde)} />
              <InfoRow label="Último pedido" value={formatDate(user.ultimoPedidoAt)} />
            </>
          )}
        </div>

        {/* Edit panel */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Editar usuario</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Nombre</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Apellidos</label>
                <input
                  type="text"
                  value={editApellidos}
                  onChange={(e) => setEditApellidos(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Teléfono</label>
              <input
                type="text"
                value={editTelefono}
                onChange={(e) => setEditTelefono(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Rol</label>
                <select
                  value={editRol}
                  onChange={(e) => setEditRol(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Estado</label>
                <select
                  value={editActivo ? 'true' : 'false'}
                  onChange={(e) => setEditActivo(e.target.value === 'true')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Eliminar usuario
              </button>
              {saveMsg && (
                <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pueblos visitados */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Pueblos visitados ({user.pueblosVisitados?.total ?? 0})
        </h2>

        {/* Añadir pueblo visitado */}
        <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Añadir pueblo visitado</h3>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              placeholder="Buscar pueblo por nombre, provincia o comunidad…"
              value={searchPueblo}
              onChange={(e) => {
                setSearchPueblo(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => searchPueblo.trim() && setShowDropdown(true)}
              disabled={addingPueblo}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            {showDropdown && filteredPueblos.length > 0 && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
                {filteredPueblos.map((p) => {
                  const alreadyVisited = visitedPuebloIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleAddPueblo(p)}
                      disabled={alreadyVisited}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                        alreadyVisited
                          ? 'cursor-not-allowed bg-muted/50 text-muted-foreground'
                          : 'hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div>
                        <span className="font-medium">{p.nombre}</span>
                        {p.provincia && (
                          <span className="ml-1 text-muted-foreground">
                            ({p.provincia}{p.comunidad ? `, ${p.comunidad}` : ''})
                          </span>
                        )}
                      </div>
                      {alreadyVisited && (
                        <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Ya visitado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {showDropdown && searchPueblo.trim().length > 0 && filteredPueblos.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground shadow-lg">
                No se encontraron pueblos con &quot;{searchPueblo}&quot;
              </div>
            )}
          </div>
          {addMsg && (
            <p className={`mt-2 text-sm font-medium ${
              addMsg.type === 'ok' ? 'text-green-600 dark:text-green-400' :
              addMsg.type === 'warn' ? 'text-amber-600 dark:text-amber-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {addMsg.text}
            </p>
          )}
          {addingPueblo && (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
              </svg>
              Añadiendo…
            </p>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provincia</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comunidad</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origen</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valoración</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {!user.pueblosVisitados?.pueblos?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Este usuario no ha visitado ningún pueblo
                  </td>
                </tr>
              ) : (
                user.pueblosVisitados.pueblos.map((p) => (
                  <tr key={p.puebloId} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.provincia ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.comunidad ?? '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={p.origen}
                        onChange={(e) => handleChangeOrigen(p.puebloId, e.target.value as 'GPS' | 'MANUAL')}
                        disabled={updatingOrigen === String(p.puebloId)}
                        className="rounded border border-border bg-background px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                        title="Cambiar origen (GPS / Manual)"
                      >
                        <option value="GPS">GPS</option>
                        <option value="MANUAL">Manual</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.fecha)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.valoracion != null ? `${p.valoracion} ★` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteVisita(p.puebloId, p.nombre)}
                        className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar pueblo visitado"
                      >
                        Eliminar
                      </button>
                    </td>
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
