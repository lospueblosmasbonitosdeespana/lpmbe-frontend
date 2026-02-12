'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';

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

    // Comprimir + subir al servidor
    setUploadingAvatar(true);
    try {
      const { compressImage } = await import("@/src/lib/compressImage");
      const compressed = await compressImage(file, { maxBytes: 4 * 1024 * 1024 });

      if (compressed.size < 300 * 1024) {
        console.warn("[Avatar] Imagen de baja calidad:", Math.round(compressed.size / 1024), "KB");
      }

      const formData = new FormData();
      formData.append('file', compressed);

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
      <Section spacing="lg" background="default">
        <Container>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </Container>
      </Section>
    );
  }

  if (error || !usuario) {
    return (
      <Section spacing="lg" background="default">
        <Container>
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
            <p className="text-destructive">{error ?? 'No se pudieron cargar los datos del usuario'}</p>
            <Link href="/mi-cuenta" className="mt-4 inline-block text-sm text-primary hover:underline">
              ← Volver a Mi Cuenta
            </Link>
          </div>
        </Container>
      </Section>
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

  const cardClass = 'rounded-xl border border-border bg-card p-6 shadow-sm';

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <Headline as="h1">Mi Perfil</Headline>
          <Link href="/mi-cuenta" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            ← Volver
          </Link>
        </div>

        <div className="space-y-6">
          {/* Club de Amigos */}
          <div className={cardClass}>
            <Title size="lg" className="mb-4">Club de Amigos</Title>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Caption>Estado</Caption>
                <p className="font-medium">{getClubEstado(usuario.club)}</p>
              </div>
              <div>
                <Caption>Plan</Caption>
                <p className="font-medium">{usuario.club?.plan ?? '—'}</p>
              </div>
              <div>
                <Caption>Válido hasta</Caption>
                <p className="font-medium">
                  {usuario.club?.validoHasta ? formatFechaCorta(usuario.club.validoHasta) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className={cardClass}>
            <Title size="lg" className="mb-4">Foto de perfil</Title>
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full border-2 border-border object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-muted font-semibold text-muted-foreground text-xl">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploadingAvatar || deletingAvatar}
                    className="hidden"
                  />
                  <span className="inline-block cursor-pointer rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50">
                    {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}
                  </span>
                </label>
                {usuario.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar || deletingAvatar}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    {deletingAvatar ? 'Eliminando…' : 'Eliminar foto'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="mb-4 flex items-center justify-between">
              <Title size="lg">Datos personales</Title>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Editar datos
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Nombre</label>
                  <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Apellidos</label>
                  <input
                    type="text"
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Teléfono</label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>

                {editError && (
                  <p className="text-sm text-destructive">{editError}</p>
                )}

                {editSuccess && (
                  <p className="text-sm text-green-600">{editSuccess}</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Caption>Nombre</Caption>
                  <p className="font-medium">{usuario.nombre ?? '(Sin nombre)'}</p>
                </div>
                {usuario.apellidos && (
                  <div>
                    <Caption>Apellidos</Caption>
                    <p className="font-medium">{usuario.apellidos}</p>
                  </div>
                )}
                {usuario.telefono && (
                  <div>
                    <Caption>Teléfono</Caption>
                    <p className="font-medium">{usuario.telefono}</p>
                  </div>
                )}
                <div>
                  <Caption>Email</Caption>
                  <p className="font-medium">{usuario.email}</p>
                </div>
                {usuario.rol && (
                  <div>
                    <Caption>Rol</Caption>
                    <p className="font-medium">{usuario.rol}</p>
                  </div>
                )}
                {fechaAlta && (
                  <div>
                    <Caption>Fecha de alta</Caption>
                    <p className="font-medium">{formatFecha(fechaAlta)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={cardClass}>
            <Title size="lg" className="mb-4">Seguridad</Title>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Contraseña actual</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      handlePasswordInputChange();
                    }}
                    disabled={savingPassword}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {showCurrentPassword ? 'Ocultar' : '👁 Mostrar'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Nueva contraseña</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      handlePasswordInputChange();
                    }}
                    disabled={savingPassword}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {showNewPassword ? 'Ocultar' : '👁 Mostrar'}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-xs text-destructive">mínimo 8</p>
                )}
                {newPassword.length >= 8 && (
                  <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Repetir nueva contraseña</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      handlePasswordInputChange();
                    }}
                    disabled={savingPassword}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {showConfirmPassword ? 'Ocultar' : '👁 Mostrar'}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {savingPassword ? 'Guardando…' : 'Guardar'}
              </button>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              {passwordSuccess && (
                <p className="text-sm text-green-600">{passwordSuccess}</p>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive hover:border-destructive hover:text-destructive-foreground disabled:opacity-50"
            >
              {logoutLoading ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
