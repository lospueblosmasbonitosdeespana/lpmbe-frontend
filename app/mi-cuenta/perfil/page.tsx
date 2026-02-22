'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
  // Campos que devuelve /usuarios/me del backend
  club?: {
    isMember?: boolean;
    activo?: boolean;       // legacy, puede no venir
    plan?: string | null;
    status?: string | null;
    validUntil?: string | null;
    validoHasta?: string | null; // legacy, puede no venir
  } | null;
};

type ClubMe = {
  isMember: boolean;
  plan: string | null;
  status: string | null;
  validUntil: string | null;
  qrToken?: string | null;
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

function getClubEsMiembro(club?: Usuario['club'] | null, clubMe?: ClubMe | null): boolean {
  if (clubMe) return clubMe.isMember;
  if (!club) return false;
  // El backend devuelve isMember (nuevo) o activo (legacy)
  if (typeof club.isMember === 'boolean') return club.isMember;
  if (club.activo) return true;
  // Comprobar validUntil / validoHasta
  const fecha = club.validUntil ?? club.validoHasta;
  if (fecha) return new Date(fecha) > new Date();
  return false;
}

function getClubValidUntil(club?: Usuario['club'] | null, clubMe?: ClubMe | null): string | null {
  if (clubMe?.validUntil) return clubMe.validUntil;
  return club?.validUntil ?? club?.validoHasta ?? null;
}

function getClubPlan(club?: Usuario['club'] | null, clubMe?: ClubMe | null): string | null {
  if (clubMe?.plan) return clubMe.plan;
  return club?.plan ?? null;
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
  const t = useTranslations('myProfile');
  const tAccount = useTranslations('myAccount');
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
  const [clubMe, setClubMe] = useState<ClubMe | null>(null);
  const [cancelandoRenovacion, setCancelandoRenovacion] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  async function loadUsuario() {
    try {
      const [meRes, clubRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/club/me', { cache: 'no-store' }),
      ]);

      if (meRes.status === 401) {
        router.push('/entrar');
        return;
      }
      if (!meRes.ok) {
        throw new Error(t('loadUserError'));
      }
      const data = await meRes.json();
      setUsuario(data);
      setFormNombre(data.nombre ?? '');
      setFormApellidos(data.apellidos ?? '');
      setFormTelefono(data.telefono ?? '');

      // Cargar estado del Club desde /club/me (fuente canónica)
      if (clubRes.ok) {
        const clubData = await clubRes.json().catch(() => null);
        if (clubData) setClubMe(clubData);
      }
    } catch (e: any) {
      setError(e?.message ?? t('unknownError'));
    }
  }

  async function handleCancelarRenovacion() {
    if (!confirm('¿Seguro que quieres cancelar la renovación automática? La membresía seguirá activa hasta la fecha de expiración.')) return;
    setCancelandoRenovacion(true);
    setCancelError(null);
    setCancelSuccess(null);
    try {
      const res = await fetch('/api/club/suscripcion/cancelar', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 501) {
        setCancelError('La cancelación de renovación estará disponible cuando se activen los pagos automáticos.');
        return;
      }
      if (!res.ok) {
        setCancelError(data?.error ?? data?.message ?? 'Error al cancelar la renovación.');
        return;
      }
      setCancelSuccess('Renovación automática cancelada. Tu membresía seguirá activa hasta la fecha de expiración.');
      await loadUsuario();
    } catch {
      setCancelError('Error al conectar con el servidor.');
    } finally {
      setCancelandoRenovacion(false);
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
      alert(t('fileMustBeImage'));
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
        const errorText = await res.text().catch(() => t('uploadError'));
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
      alert(`Error: ${e?.message ?? t('unknownError')}`);
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
        alert(t('functionPending'));
        return;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => t('deleteAvatarError'));
        alert(`Error: ${errorText}`);
        return;
      }

      // Recargar datos del usuario
      await loadUsuario();
      setAvatarPreview(null);
      // Cache-buster para forzar recarga de la imagen
      setAvatarVersion((v) => v + 1);
    } catch (e: any) {
      alert(`Error: ${e?.message ?? t('unknownError')}`);
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
        const errorText = await res.text().catch(() => t('saveDataError'));
        setEditError(errorText);
        return;
      }

      setEditSuccess(t('dataUpdated'));
      setIsEditing(false);
      await loadUsuario();
    } catch (e: any) {
      setEditError(e?.message ?? t('unknownError'));
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
      setPasswordError(t('passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('passwordTooShort'));
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
        const errorText = await res.text().catch(() => t('changePasswordError'));
        setPasswordError(errorText);
        return;
      }

      setPasswordSuccess(t('passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setPasswordError(e?.message ?? t('unknownError'));
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
            <p className="text-muted-foreground">{tAccount('loading')}</p>
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
            <p className="text-destructive">{error ?? tAccount('errorLoadingUser')}</p>
            <Link href="/mi-cuenta" className="mt-4 inline-block text-sm text-primary hover:underline">
              {tAccount('backToAccount')}
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
          <Headline as="h1">{t('title')}</Headline>
          <Link href="/mi-cuenta" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {tAccount('back')}
          </Link>
        </div>

        <div className="space-y-6">
          {/* Estado de Membresía — Club de Amigos */}
          {(() => {
            const esMiembro = getClubEsMiembro(usuario.club, clubMe);
            const validUntil = getClubValidUntil(usuario.club, clubMe);
            const plan = getClubPlan(usuario.club, clubMe);
            const status = clubMe?.status ?? (esMiembro ? 'ACTIVA' : null);

            return (
              <div className={cardClass}>
                <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                  <Title size="lg">{t('clubTitle')}</Title>
                  <Link
                    href="/mi-cuenta/club"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Ver detalle →
                  </Link>
                </div>

                {esMiembro ? (
                  <>
                    {/* Badge activo */}
                    <div className="mb-5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        ACTIVO
                      </span>
                      {plan && (
                        <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          Plan {plan}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      {status && (
                        <div>
                          <Caption>Estado</Caption>
                          <p className="font-medium">{status}</p>
                        </div>
                      )}
                      <div>
                        <Caption>{t('validUntil')}</Caption>
                        <p className="font-medium">
                          {validUntil ? formatFechaCorta(validUntil) : '—'}
                        </p>
                      </div>
                      {plan && (
                        <div>
                          <Caption>{t('plan')}</Caption>
                          <p className="font-medium">{plan}</p>
                        </div>
                      )}
                    </div>

                    {/* Cancelar renovación — preparado para Stripe */}
                    <div className="mt-5 rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium text-foreground mb-1">Renovación automática</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Tu membresía se renueva automáticamente.
                        Si la cancelas, seguirá activa hasta el{' '}
                        <strong>{validUntil ? formatFechaCorta(validUntil) : '—'}</strong>.
                      </p>
                      {cancelSuccess ? (
                        <p className="text-sm text-green-700 font-medium">{cancelSuccess}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCancelarRenovacion}
                          disabled={cancelandoRenovacion}
                          className="rounded-lg border border-destructive/40 bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                        >
                          {cancelandoRenovacion ? 'Cancelando…' : 'Cancelar renovación automática'}
                        </button>
                      )}
                      {cancelError && (
                        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">{cancelError}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                        NO ACTIVO
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Únete al Club de Amigos para acceder a descuentos exclusivos en recursos turísticos de los pueblos.
                    </p>
                    <Link
                      href="/mi-cuenta/club"
                      className="inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                    >
                      Ver Club de Amigos
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Avatar */}
          <div className={cardClass}>
            <Title size="lg" className="mb-4">{t('profilePhoto')}</Title>
            <div className="flex flex-wrap items-center gap-6">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={t('avatar')}
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
                    {uploadingAvatar ? t('uploading') : t('changePhoto')}
                  </span>
                </label>
                {usuario.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={uploadingAvatar || deletingAvatar}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                  >
                    {deletingAvatar ? t('deleting') : t('deletePhoto')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="mb-4 flex items-center justify-between">
              <Title size="lg">{t('personalData')}</Title>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {t('editData')}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('name')}</label>
                  <input
                  type="text"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  disabled={saving}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('surname')}</label>
                  <input
                    type="text"
                    value={formApellidos}
                    onChange={(e) => setFormApellidos(e.target.value)}
                    disabled={saving}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('phone')}</label>
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
                    {saving ? t('saving') : t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {t('cancel')}
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
                  <Caption>{t('name')}</Caption>
                  <p className="font-medium">{usuario.nombre ?? t('noName')}</p>
                </div>
                {usuario.apellidos && (
                  <div>
                    <Caption>{t('surname')}</Caption>
                    <p className="font-medium">{usuario.apellidos}</p>
                  </div>
                )}
                {usuario.telefono && (
                  <div>
                    <Caption>{t('phone')}</Caption>
                    <p className="font-medium">{usuario.telefono}</p>
                  </div>
                )}
                <div>
                  <Caption>{t('email')}</Caption>
                  <p className="font-medium">{usuario.email}</p>
                </div>
                {usuario.rol && (
                  <div>
                    <Caption>{t('role')}</Caption>
                    <p className="font-medium">{usuario.rol}</p>
                  </div>
                )}
                {fechaAlta && (
                  <div>
                    <Caption>{t('registrationDate')}</Caption>
                    <p className="font-medium">{formatFecha(fechaAlta)}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={cardClass}>
            <Title size="lg" className="mb-4">{t('security')}</Title>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t('currentPassword')}</label>
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
                    {showCurrentPassword ? t('hide') : '👁 ' + t('show')}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">{t('newPassword')}</label>
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
                    {showNewPassword ? t('hide') : '👁 ' + t('show')}
                  </button>
                </div>
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-xs text-destructive">{t('minChars')}</p>
                )}
                {newPassword.length >= 8 && (
                  <p className="text-xs text-muted-foreground">{t('minCharsLong')}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">{t('repeatPassword')}</label>
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
                    {showConfirmPassword ? t('hide') : '👁 ' + t('show')}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
                className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {savingPassword ? t('saving') : t('save')}
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
              {logoutLoading ? t('loggingOut') : t('logout')}
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
