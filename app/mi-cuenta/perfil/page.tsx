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
  cancelAtPeriodEnd?: boolean;
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
  const [showSuscripcion, setShowSuscripcion] = useState(false);
  const [confirmCancelar, setConfirmCancelar] = useState(false);
  const [cancelandoRenovacion, setCancelandoRenovacion] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelado, setCancelado] = useState(false);
  const [reactivando, setReactivando] = useState(false);
  const [reactivarError, setReactivarError] = useState<string | null>(null);

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
        if (clubData) {
          setClubMe(clubData);
          // Sincronizar estado de cancelación con lo que dice el backend
          if (clubData.cancelAtPeriodEnd === true) {
            setCancelado(true);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message ?? t('unknownError'));
    }
  }

  async function handleCancelarRenovacion() {
    setCancelandoRenovacion(true);
    setCancelError(null);
    try {
      const res = await fetch('/api/club/suscripcion/cancelar', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(data?.error ?? data?.message ?? 'Error al cancelar la renovación.');
        return;
      }
      setCancelado(true);
      setConfirmCancelar(false);
      await loadUsuario();
    } catch {
      setCancelError('Error al conectar con el servidor.');
    } finally {
      setCancelandoRenovacion(false);
    }
  }

  async function handleReactivar() {
    setReactivando(true);
    setReactivarError(null);
    try {
      const res = await fetch('/api/club/suscripcion/reactivar', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReactivarError(data?.error ?? data?.message ?? 'Error al reactivar la suscripción.');
        return;
      }
      setCancelado(false);
      await loadUsuario();
    } catch {
      setReactivarError('Error al conectar con el servidor.');
    } finally {
      setReactivando(false);
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

          {/* ── Foto de perfil ── */}
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
                  <span className="inline-block cursor-pointer rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
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

          {/* ── Datos personales ── */}
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
              <div className="space-y-4 max-w-sm">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t('name')}</label>
                  <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} disabled={saving}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t('surname')}</label>
                  <input type="text" value={formApellidos} onChange={(e) => setFormApellidos(e.target.value)} disabled={saving}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t('phone')}</label>
                  <input type="text" value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} disabled={saving}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleSaveEdit} disabled={saving}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50">
                    {saving ? t('saving') : t('save')}
                  </button>
                  <button type="button" onClick={handleCancelEdit} disabled={saving}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">
                    {t('cancel')}
                  </button>
                </div>
                {editError && <p className="text-sm text-destructive">{editError}</p>}
                {editSuccess && <p className="text-sm text-green-600">{editSuccess}</p>}
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

          {/* ── Seguridad — cambio de contraseña ── */}
          <div className={cardClass}>
            <Title size="lg" className="mb-5">{t('security')}</Title>
            <div className="max-w-sm space-y-4">
              {/* Campo contraseña con botón ojo inline */}
              {(
                [
                  { id: 'current', label: t('currentPassword'), value: currentPassword, show: showCurrentPassword,
                    onChange: (v: string) => { setCurrentPassword(v); handlePasswordInputChange(); },
                    onToggle: () => setShowCurrentPassword(p => !p) },
                  { id: 'new', label: t('newPassword'), value: newPassword, show: showNewPassword,
                    onChange: (v: string) => { setNewPassword(v); handlePasswordInputChange(); },
                    onToggle: () => setShowNewPassword(p => !p) },
                  { id: 'confirm', label: t('repeatPassword'), value: confirmPassword, show: showConfirmPassword,
                    onChange: (v: string) => { setConfirmPassword(v); handlePasswordInputChange(); },
                    onToggle: () => setShowConfirmPassword(p => !p) },
                ] as const
              ).map(({ id, label, value, show, onChange, onToggle }) => (
                <div key={id} className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      disabled={savingPassword}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={onToggle}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {show ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {id === 'new' && value.length > 0 && value.length < 8 && (
                    <p className="text-xs text-destructive">{t('minChars')}</p>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword.length < 8}
                className="mt-1 rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {savingPassword ? t('saving') : t('save')}
              </button>

              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
            </div>
          </div>

          {/* ── Club de Amigos ── (al final, antes de cerrar sesión) */}
          {(() => {
            const esMiembro = getClubEsMiembro(usuario.club, clubMe);
            const validUntil = getClubValidUntil(usuario.club, clubMe);
            const plan = getClubPlan(usuario.club, clubMe);

            return (
              <div className={cardClass}>
                {/* Cabecera siempre visible */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Title size="lg">{t('clubTitle')}</Title>
                    {esMiembro ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        ACTIVO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        NO ACTIVO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/mi-cuenta/club" className="text-sm text-primary hover:underline font-medium">
                      Ver detalle →
                    </Link>
                    {esMiembro && (
                      <button
                        type="button"
                        onClick={() => { setShowSuscripcion(p => !p); setConfirmCancelar(false); }}
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      >
                        Estado de la suscripción
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel de suscripción (se muestra al pulsar el botón) */}
                {esMiembro && showSuscripcion && (
                  <div className="mt-5 rounded-xl border border-border bg-muted/30 p-5 space-y-4">
                    {/* Datos */}
                    <div className="grid gap-4 sm:grid-cols-3 text-sm">
                      {plan && (
                        <div>
                          <Caption>Plan</Caption>
                          <p className="font-semibold mt-0.5">{plan}</p>
                        </div>
                      )}
                      <div>
                        <Caption>Válido hasta</Caption>
                        <p className="font-semibold mt-0.5">{validUntil ? formatFecha(validUntil) : '—'}</p>
                      </div>
                      {!cancelado && (
                        <div>
                          <Caption>Próxima renovación</Caption>
                          <p className="font-semibold mt-0.5">{validUntil ? formatFecha(validUntil) : '—'}</p>
                        </div>
                      )}
                    </div>

                    {cancelado ? (
                      /* Estado: renovación cancelada */
                      <div className="space-y-3">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-sm font-medium text-amber-800">Renovación automática cancelada</p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            Tu membresía seguirá activa hasta el <strong>{validUntil ? formatFecha(validUntil) : '—'}</strong>.
                            Se ha enviado un email de confirmación.
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">¿Has cambiado de opinión? Puedes volver a suscribirte en cualquier momento.</p>
                          <button
                            type="button"
                            onClick={handleReactivar}
                            disabled={reactivando}
                            className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                          >
                            {reactivando ? 'Procesando…' : 'Volver a suscribirse'}
                          </button>
                          {reactivarError && (
                            <p className="mt-2 text-xs text-amber-700 rounded bg-amber-50 border border-amber-200 px-3 py-2">{reactivarError}</p>
                          )}
                        </div>
                      </div>
                    ) : confirmCancelar ? (
                      /* Paso de confirmación */
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">¿Cancelar la renovación automática?</p>
                        <p className="text-xs text-muted-foreground">
                          Tu membresía <strong>no se cancelará ahora</strong>. Seguirás teniendo acceso hasta el{' '}
                          <strong>{validUntil ? formatFecha(validUntil) : '—'}</strong>. Después no se renovará ni se cobrará nada.
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleCancelarRenovacion}
                            disabled={cancelandoRenovacion}
                            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                          >
                            {cancelandoRenovacion ? 'Cancelando…' : 'Sí, cancelar renovación'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setConfirmCancelar(false); setCancelError(null); }}
                            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                          >
                            No, mantener suscripción
                          </button>
                        </div>
                        {cancelError && (
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">{cancelError}</p>
                        )}
                      </div>
                    ) : (
                      /* Estado normal: mostrar botón cancelar */
                      <div>
                        <p className="text-xs text-muted-foreground mb-3">
                          Tu membresía se renueva automáticamente. Puedes cancelar la renovación en cualquier momento; seguirás teniendo acceso hasta la fecha de expiración.
                        </p>
                        <button
                          type="button"
                          onClick={() => setConfirmCancelar(true)}
                          className="rounded-lg border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                        >
                          Cancelar renovación automática
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Si no es miembro */}
                {!esMiembro && (
                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                      Únete al Club de Amigos para acceder a descuentos exclusivos en recursos turísticos.
                    </p>
                    <Link href="/mi-cuenta/club" className="inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
                      Ver Club de Amigos
                    </Link>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Cerrar sesión ── */}
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
