'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Usuario = {
  id: number;
  email: string;
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  rol?: string | null;
  createdAt?: string | null;
  fechaAlta?: string | null;
  avatarUrl?: string | null;
  club?: {
    activo?: boolean;
    plan?: string | null;
    validoHasta?: string | null;
  } | null;
};

function formatFecha(fecha?: string | null) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatFechaCorta(fecha?: string | null) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getClubEstado(club?: { activo?: boolean; validoHasta?: string | null } | null): string {
  if (!club) return 'NO ACTIVO';
  if (club.validoHasta) {
    const fechaFin = new Date(club.validoHasta);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaFin < hoy) {
      return 'CADUCADO';
    }
  }
  if (club.activo) {
    return 'ACTIVO';
  }
  return 'NO ACTIVO';
}

function getInitials(nombre?: string | null, email?: string): string {
  if (nombre) {
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return '??';
}

export default function PerfilPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);


  async function loadUsuario() {
    try {
      const r = await fetch('/api/auth/me');
      if (r.status === 401) {
        router.push('/entrar');
        return;
      }
      if (!r.ok) {
        throw new Error('Error al cargar datos del usuario');
      }
      const data = await r.json();
      setUsuario(data);
      // Inicializar formulario con datos actuales
      setFormNombre(data.nombre ?? '');
      setFormApellidos(data.apellidos ?? '');
      setFormTelefono(data.telefono ?? '');
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  }

  useEffect(() => {
    loadUsuario().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones antes de subir
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('El archivo debe ser una imagen');
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir al servidor
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error al subir avatar');
        alert(`Error: ${errorText}`);
        setAvatarPreview(null);
        return;
      }

      // Recargar datos del usuario
      await loadUsuario();
      setAvatarPreview(null);
      // Cache-buster para forzar recarga de la imagen
      setAvatarVersion((v) => v + 1);
    } catch (e: any) {
      alert(`Error: ${e?.message ?? 'Error desconocido'}`);
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleDeleteAvatar() {
    if (!usuario?.avatarUrl) return;

    setDeletingAvatar(true);

    try {
      const res = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
      });

      if (res.status === 404 || res.status === 501) {
        alert('Función pendiente');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error al eliminar avatar');
        alert(`Error: ${errorText}`);
        return;
      }

      // Recargar datos del usuario
      await loadUsuario();
      setAvatarPreview(null);
      // Cache-buster para forzar recarga de la imagen
      setAvatarVersion((v) => v + 1);
    } catch (e: any) {
      alert(`Error: ${e?.message ?? 'Error desconocido'}`);
    } finally {
      setDeletingAvatar(false);
    }
  }

  function handleStartEdit() {
    if (!usuario) return;
    setFormNombre(usuario.nombre ?? '');
    setFormApellidos(usuario.apellidos ?? '');
    setFormTelefono(usuario.telefono ?? '');
    setIsEditing(true);
    setEditError(null);
    setEditSuccess(null);
  }

  function handleCancelEdit() {
    if (!usuario) return;
    setFormNombre(usuario.nombre ?? '');
    setFormApellidos(usuario.apellidos ?? '');
    setFormTelefono(usuario.telefono ?? '');
    setIsEditing(false);
    setEditError(null);
    setEditSuccess(null);
  }

  async function handleSaveEdit() {
    if (!usuario) return;
    setSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formNombre.trim() || null,
          apellidos: formApellidos.trim() || null,
          telefono: formTelefono.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error al guardar datos');
        setEditError(errorText);
        return;
      }

      setEditSuccess('Datos actualizados correctamente');
      setIsEditing(false);
      await loadUsuario();
    } catch (e: any) {
      setEditError(e?.message ?? 'Error desconocido');
    } finally {
      setSaving(false);
    }
  }

  function handlePasswordInputChange() {
    setPasswordError(null);
    setPasswordSuccess(null);
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validaciones frontend
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => 'Error al cambiar contraseña');
        setPasswordError(errorText);
        return;
      }

      setPasswordSuccess('Contraseña actualizada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordError(e?.message ?? 'Error desconocido');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/entrar');
      router.refresh();
    } catch (e) {
      console.error('Error al cerrar sesión:', e);
    } finally {
      setLogoutLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Mi Perfil</h1>
        <div className="p-4 border rounded text-sm text-gray-600">Cargando...</div>
      </section>
    );
  }

  if (error || !usuario) {
    return (
      <section className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Mi Perfil</h1>
        <div className="p-4 border rounded text-sm text-red-600">
          {error ?? 'No se pudieron cargar los datos del usuario'}
        </div>
        <Link href="/mi-cuenta" className="text-sm text-blue-600 hover:underline">
          ← Volver a Mi Cuenta
        </Link>
      </section>
    );
  }

  const fechaAlta = usuario.createdAt ?? usuario.fechaAlta;
  // Cache-buster: si viene del servidor (no preview local), añadir timestamp
  const avatarUrl = avatarPreview
    ? avatarPreview
    : usuario.avatarUrl
      ? `${usuario.avatarUrl}${usuario.avatarUrl.includes('?') ? '&' : '?'}v=${avatarVersion || Date.now()}`
      : null;
  const initials = getInitials(usuario.nombre, usuario.email);

  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mi Perfil</h1>
        <Link href="/mi-cuenta" className="text-sm text-gray-600 hover:underline">
          ← Volver
        </Link>
      </div>

      {/* Club de Amigos */}
      <div className="p-4 border rounded space-y-2">
        <h2 className="font-medium">Club de Amigos</h2>
        <div>
          <span className="text-sm text-gray-600">Estado: </span>
          <span className="font-medium">{getClubEstado(usuario.club)}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Plan: </span>
          <span className="font-medium">{usuario.club?.plan ?? '—'}</span>
        </div>
        <div>
          <span className="text-sm text-gray-600">Válido hasta: </span>
          <span className="font-medium">
            {usuario.club?.validoHasta ? formatFechaCorta(usuario.club.validoHasta) : '—'}
          </span>
        </div>
      </div>

      {/* Avatar */}
      <div className="p-4 border rounded space-y-4">
        <h2 className="font-medium">Foto de perfil</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 border flex items-center justify-center text-gray-600 font-semibold text-lg">
                {initials}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <label className="inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar || deletingAvatar}
                className="hidden"
              />
              <span className="px-4 py-2 text-sm border rounded hover:bg-gray-50 cursor-pointer disabled:opacity-50 inline-block">
                {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}
              </span>
            </label>
            {usuario.avatarUrl && (
              <button
                type="button"
                onClick={handleDeleteAvatar}
                disabled={uploadingAvatar || deletingAvatar}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {deletingAvatar ? 'Eliminando…' : 'Eliminar foto'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border rounded space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Datos personales</h2>
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
            >
              Editar datos
            </button>
          )}
        </div>

        {isEditing ? (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre</label>
              <input
                type="text"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border rounded disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Apellidos</label>
              <input
                type="text"
                value={formApellidos}
                onChange={(e) => setFormApellidos(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border rounded disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Teléfono</label>
              <input
                type="text"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                disabled={saving}
                className="w-full px-3 py-2 border rounded disabled:opacity-50"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>

            {editError && (
              <div className="text-sm text-red-600">{editError}</div>
            )}

            {editSuccess && (
              <div className="text-sm text-green-600">{editSuccess}</div>
            )}
          </>
        ) : (
          <>
            <div>
              <span className="text-sm text-gray-600">Nombre</span>
              <div className="font-medium">{usuario.nombre ?? '(Sin nombre)'}</div>
            </div>

            {usuario.apellidos && (
              <div>
                <span className="text-sm text-gray-600">Apellidos</span>
                <div className="font-medium">{usuario.apellidos}</div>
              </div>
            )}

            {usuario.telefono && (
              <div>
                <span className="text-sm text-gray-600">Teléfono</span>
                <div className="font-medium">{usuario.telefono}</div>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-600">Email</span>
              <div className="font-medium">{usuario.email}</div>
            </div>

            {usuario.rol && (
              <div>
                <span className="text-sm text-gray-600">Rol</span>
                <div className="font-medium">{usuario.rol}</div>
              </div>
            )}

            {fechaAlta && (
              <div>
                <span className="text-sm text-gray-600">Fecha de alta</span>
                <div className="font-medium">{formatFecha(fechaAlta)}</div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border rounded space-y-4">
        <h2 className="font-medium">Seguridad</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña actual</label>
            <div className="flex items-center gap-2">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  handlePasswordInputChange();
                }}
                disabled={savingPassword}
                className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-sm text-gray-600 hover:underline"
              >
                {showCurrentPassword ? 'Ocultar' : '👁 Mostrar'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Nueva contraseña</label>
            <div className="flex items-center gap-2">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  handlePasswordInputChange();
                }}
                disabled={savingPassword}
                className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-sm text-gray-600 hover:underline"
              >
                {showNewPassword ? 'Ocultar' : '👁 Mostrar'}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-600 mt-1">mínimo 8</p>
            )}
            {newPassword.length >= 8 && (
              <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Repetir nueva contraseña</label>
            <div className="flex items-center gap-2">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  handlePasswordInputChange();
                }}
                disabled={savingPassword}
                className="flex-1 px-3 py-2 border rounded disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-sm text-gray-600 hover:underline"
              >
                {showConfirmPassword ? 'Ocultar' : '👁 Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {savingPassword ? 'Guardando…' : 'Guardar'}
          </button>

          {passwordError && (
            <div className="text-sm text-red-600">{passwordError}</div>
          )}

          {passwordSuccess && (
            <div className="text-sm text-green-600">{passwordSuccess}</div>
          )}
        </div>
      </div>

      <div className="p-4 border rounded">
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          {logoutLoading ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </section>
  );
}
