'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';
import { ClubShield, getMemberYear } from '@/app/_components/club/ClubShield';

const IS_DEV = process.env.NODE_ENV === 'development';

type ClubMe = {
  isMember: boolean;
  plan: string | null;
  status: string | null;
  validUntil: string | null;
  cancelAtPeriodEnd?: boolean;
  qrToken?: string | null;
  qrPayload?: string | null;
  // Configuración del club (devuelta por /club/me)
  inscripcionesAbiertas?: boolean;
  precioAnualCents?: number;
  precioMensualCents?: number;
};

type ClubValidacion = {
  id: number;
  scannedAt: string;
  resultado?: 'OK' | 'CADUCADO' | 'YA_USADO' | 'INVALIDO' | string | null;
  puebloId?: number | null;
  puebloNombre?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
  } | null;
  recursoId?: number | null;
  recursoNombre?: string | null;
  recurso?: {
    id: number;
    nombre: string;
  } | null;
  adultosUsados?: number | null;
  menoresUsados?: number | null;
  descuentoPorcentaje?: number | null;
};

type ClubValidacionesResponse = {
  items?: ClubValidacion[];
  total?: number;
};

type RecursoDisponible = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  codigoQr: string;
  puebloId?: number | null;
  puebloNombre?: string | null;
  activo?: boolean;
};

type QrIdentidad = {
  qrPayload: string;
  expiresAt: string;
};

function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatFechaHora(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function ClubPage() {
  const t = useTranslations('club');
  const tAccount = useTranslations('myAccount');
  const [clubMe, setClubMe] = useState<ClubMe | null>(null);
  const [validaciones, setValidaciones] = useState<ClubValidacion[]>([]);
  const [validacionesNoDisponible, setValidacionesNoDisponible] = useState(false);
  const [recursosDisponibles, setRecursosDisponibles] = useState<RecursoDisponible[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [codigoQr, setCodigoQr] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroSuccess, setRegistroSuccess] = useState<string | null>(null);

  // Alta / activar membresía (preparado para cuando CLUB_ALTA_ABIERTO=true)
  const [activandoMembresia, setActivandoMembresia] = useState(false);
  const [activarError, setActivarError] = useState<string | null>(null);

  // QR de identidad (5 min)
  const [qrIdentidad, setQrIdentidad] = useState<QrIdentidad | null>(null);
  const [generandoIdentidad, setGenerandoIdentidad] = useState(false);
  const [qrIdentidadError, setQrIdentidadError] = useState<string | null>(null);
  const [tiempoRestanteIdentidad, setTiempoRestanteIdentidad] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [meRes, validacionesRes, recursosRes] = await Promise.all([
        fetch('/api/club/me', { cache: 'no-store' }),
        fetch('/api/club/validaciones', { cache: 'no-store' }),
        fetch('/api/club/recursos/disponibles', { cache: 'no-store' }),
      ]);

      if (meRes.status === 401 || validacionesRes.status === 401 || recursosRes.status === 401) {
        window.location.href = '/entrar';
        return;
      }

      // Manejar errores 502 (backend no disponible)
      if (meRes.status === 502 || validacionesRes.status === 502 || recursosRes.status === 502) {
        const errorData = await meRes.json().catch(() => validacionesRes.json().catch(() => recursosRes.json().catch(() => null)));
        if (errorData?.error === 'upstream_fetch_failed') {
          setError(t('errorBackendConnection', { upstream: errorData.upstream || 'http://localhost:3000' }));
        } else {
          setError(t('errorBackendUnavailable'));
        }
        return;
      }

      if (!meRes.ok) {
        const errorData = await meRes.json().catch(() => null);
        const errorText = errorData?.error || errorData?.detail || await meRes.text().catch(() => t('errorLoadingClubData'));
        throw new Error(errorText);
      }

      // Validaciones: si falla con 404/501, no es crítico, solo no las mostramos
      let validaciones: ClubValidacion[] = [];
      if (validacionesRes.ok) {
        const validacionesData: ClubValidacionesResponse = await validacionesRes.json().catch(() => ({}));
        validaciones = Array.isArray(validacionesData) 
          ? validacionesData 
          : (Array.isArray(validacionesData.items) ? validacionesData.items : []);
        setValidacionesNoDisponible(false);
      } else if (validacionesRes.status === 404 || validacionesRes.status === 501) {
        // Endpoint aún no disponible en backend
        validaciones = [];
        setValidacionesNoDisponible(true);
      } else {
        setValidacionesNoDisponible(false);
      }

      // Recursos disponibles: si falla, no es crítico, solo no los mostramos
      let recursos: RecursoDisponible[] = [];
      if (recursosRes.ok) {
        const recursosData = await recursosRes.json().catch(() => ({}));
        recursos = Array.isArray(recursosData) ? recursosData : (Array.isArray(recursosData.items) ? recursosData.items : []);
      }

      const meData = await meRes.json();

      setClubMe(meData);
      setValidaciones(validaciones);
      setRecursosDisponibles(recursos);
    } catch (e: any) {
      setError(e?.message ?? t('errorUnknown'));
    } finally {
      setLoading(false);
    }
  }

  // Contador regresivo para QR identidad
  useEffect(() => {
    if (!qrIdentidad?.expiresAt) {
      setTiempoRestanteIdentidad(null);
      return;
    }

    const updateTimer = () => {
      const ahora = new Date().getTime();
      const expira = new Date(qrIdentidad.expiresAt).getTime();
      const restante = Math.max(0, Math.floor((expira - ahora) / 1000));
      setTiempoRestanteIdentidad(restante);

      if (restante <= 0) {
        setQrIdentidad(null);
        setQrIdentidadError(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrIdentidad]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRegistrarVisita() {
    if (!codigoQr.trim()) {
      setRegistroError(t('errorQrEmpty'));
      return;
    }

    setRegistrando(true);
    setRegistroError(null);
    setRegistroSuccess(null);

    try {
      const res = await fetch('/api/club/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codigoQr: codigoQr.trim(),
          origen: 'WEB',
          meta: { source: 'web-demo' },
        }),
      });

      // Manejar error 502 (backend no disponible)
      if (res.status === 502) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData?.error === 'upstream_fetch_failed') {
          setRegistroError(t('errorBackendConnectionShort'));
        } else {
          setRegistroError(t('errorBackendUnavailable'));
        }
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setRegistroError(t('errorNotMember'));
        return;
      }

      if (res.status === 404) {
        setRegistroError(t('errorQrNotFound'));
        return;
      }

      if (!res.ok) {
        const errorText = data.error || data.detail || data.message || t('errorRegisteringVisit');
        setRegistroError(errorText);
        return;
      }

      if (data.duplicated === true) {
        setRegistroSuccess(t('visitAlreadyRegistered'));
      } else {
        setRegistroSuccess(t('visitRegisteredSuccessfully'));
      }

      setCodigoQr('');
      await loadData();
    } catch (e: any) {
      setRegistroError(e?.message ?? t('errorUnknown'));
    } finally {
      setRegistrando(false);
    }
  }

  async function handleGenerarQRIdentidad() {
    setGenerandoIdentidad(true);
    setQrIdentidadError(null);

    try {
      const res = await fetch('/api/club/qr/identidad/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 502) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData?.error === 'upstream_fetch_failed') {
          setQrIdentidadError(t('errorBackendConnectionShort'));
        } else {
          setQrIdentidadError(t('errorBackendUnavailableShort'));
        }
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || errorData?.detail || await res.text().catch(() => t('errorGeneratingQr'));
        setQrIdentidadError(errorText);
        return;
      }

      const data = await res.json();
      setQrIdentidad({
        qrPayload: data.qrPayload,
        expiresAt: data.expiresAt,
      });
    } catch (e: any) {
      setQrIdentidadError(e?.message ?? t('errorUnknown'));
    } finally {
      setGenerandoIdentidad(false);
    }
  }

  function formatTiempoRestante(segundos: number): string {
    if (segundos <= 0) return t('expired2');
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  /** Activar membresía cuando las inscripciones están abiertas. */
  async function handleActivarMembresia(tipo: 'ANUAL' | 'MENSUAL') {
    if (!clubMe?.inscripcionesAbiertas) return;
    setActivandoMembresia(true);
    setActivarError(null);
    try {
      const res = await fetch('/api/club/suscripcion/activar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, importeCents: undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? data?.message ?? t('errorActivating'));
      await loadData();
    } catch (e: any) {
      setActivarError(e?.message ?? t('errorActivatingMembership'));
    } finally {
      setActivandoMembresia(false);
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

  if (error && !clubMe) {
    return (
      <Section spacing="lg" background="default">
        <Container>
          <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6">
            <p className="text-destructive">{error}</p>
            <Link href="/mi-cuenta" className="mt-4 inline-block text-sm text-primary hover:underline">
              {tAccount('backToAccount')}
            </Link>
          </div>
        </Container>
      </Section>
    );
  }

  // Última validación para preview
  const ultimaValidacion = validaciones.length > 0 ? validaciones[0] : null;
  
  // Preview de recursos (máximo 3)
  const recursosPreview = recursosDisponibles.slice(0, 3);

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
          {/* Estado */}
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Escudo del Club (solo miembros) */}
              {clubMe?.isMember && (
                <div className="flex flex-col items-center gap-2 sm:flex-shrink-0">
                  <ClubShield
                    year={getMemberYear(clubMe.validUntil, clubMe.plan)}
                    size={160}
                  />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {t('member')}
                  </span>
                </div>
              )}
              {/* Info de membresía */}
              <div className="flex-1">
                <Title size="lg" className="mb-4">{t('status')}</Title>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <Caption>{t('member')}</Caption>
                    <p className="font-medium">{clubMe?.isMember ? t('active') : t('inactive')}</p>
                  </div>
                  <div>
                    <Caption>{t('plan')}</Caption>
                    <p className="font-medium">{clubMe?.plan ?? '—'}</p>
                  </div>
                  <div>
                    <Caption>{t('statusLabel')}</Caption>
                    <p className="font-medium">{clubMe?.status ?? '—'}</p>
                  </div>
                  <div>
                    <Caption>{t('validUntil')}</Caption>
                    <p className="font-medium">{formatFecha(clubMe?.validUntil)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unirse al Club (solo si NO es miembro) */}
          {!clubMe?.isMember && (
            <div className={`${cardClass} border-primary/20 bg-primary/5`}>
              <Title size="lg" className="mb-2">{t('joinClub')}</Title>
              <Caption className="block mb-4">
                {clubMe?.inscripcionesAbiertas
                  ? t('joinClubDesc')
                  : t('joinClubSoon')}
              </Caption>
              {clubMe?.inscripcionesAbiertas ? (
                <div className="space-y-4">
                  {/* Tarjetas de precio */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-primary/30 bg-white p-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Plan Anual</div>
                      {clubMe.precioAnualCents !== undefined && (
                        <div className="text-2xl font-bold text-primary">
                          {(clubMe.precioAnualCents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          <span className="ml-1 text-sm font-normal text-gray-500">/ año</span>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Descuentos en todos los recursos del club</p>
                    </div>
                    <div className="rounded-lg border border-border bg-white p-4">
                      <div className="text-sm font-semibold text-gray-700 mb-1">Plan Mensual</div>
                      {clubMe.precioMensualCents !== undefined && (
                        <div className="text-2xl font-bold text-gray-700">
                          {(clubMe.precioMensualCents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          <span className="ml-1 text-sm font-normal text-gray-500">/ mes</span>
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Cancela cuando quieras</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleActivarMembresia('ANUAL')}
                      disabled={activandoMembresia}
                      className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      {activandoMembresia ? t('processing') : t('annualPlan')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActivarMembresia('MENSUAL')}
                      disabled={activandoMembresia}
                      className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      {activandoMembresia ? t('processing') : t('monthlyPlan')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
                  <p className="font-medium text-gray-700 mb-1">🔜 Próximamente</p>
                  <p>{t('comingSoon')}</p>
                </div>
              )}
              {activarError && (
                <p className="mt-2 text-sm text-destructive">{activarError}</p>
              )}
            </div>
          )}

          {/* Mi QR de identidad (5 min) */}
          {clubMe?.isMember && (
            <div className={`${cardClass} border-primary/20 bg-primary/5`}>
              <Title size="lg" className="mb-4">{t('qrTitle')}</Title>
              <Caption className="block mb-4">
                {t('qrDesc')}
              </Caption>
              
              {!qrIdentidad && (
                <>
                  <button
                    type="button"
                    onClick={handleGenerarQRIdentidad}
                    disabled={generandoIdentidad}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {generandoIdentidad ? t('generating') : t('generateQr')}
                  </button>

                  {qrIdentidadError && (
                    <p className="mt-2 text-sm text-destructive">{qrIdentidadError}</p>
                  )}
                </>
              )}

              {qrIdentidad && (
                <div className="mt-4 rounded-lg border border-border bg-card p-4">
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrIdentidad.qrPayload)}`}
                      alt={t('qrIdentity')}
                      className="max-w-[300px] w-full h-auto"
                    />
                  </div>
                  
                  <Caption className="mt-3 block text-center">
                    {t('qrShowCode')}
                  </Caption>

                  {tiempoRestanteIdentidad !== null && (
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      {t('expiresIn')} <strong className="text-foreground">{formatTiempoRestante(tiempoRestanteIdentidad)}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Accesos rápidos */}
          <div className={cardClass}>
            <Title size="lg" className="mb-4">{t('access')}</Title>
            <div className="space-y-3">
              <Link
                href="/mi-cuenta/club/recursos"
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
              >
                <span className="font-medium">{t('discountsOnResources')}</span>
                {recursosDisponibles.length > 0 && (
                  <Caption>({recursosDisponibles.length} {t('resources')})</Caption>
                )}
              </Link>
              <Link
                href="/mi-cuenta/club/visitados"
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
              >
                <span className="font-medium">{t('visitedResources')}</span>
                {validaciones.filter(v => v.resultado === 'OK').length > 0 && (
                  <Caption>({validaciones.filter(v => v.resultado === 'OK').length} {t('visits')})</Caption>
                )}
              </Link>
              <Link
                href="/mi-cuenta/club/validaciones"
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
              >
                <span className="font-medium">{t('validationHistory')}</span>
                {validaciones.length > 0 && (
                  <Caption>({validaciones.length} {t('records')})</Caption>
                )}
              </Link>
            </div>
            
            {ultimaValidacion && (
              <div className="mt-4 border-t border-border pt-4">
                <Caption>
                  {t('lastValidation')} {formatFechaHora(ultimaValidacion.scannedAt)} — {ultimaValidacion.puebloNombre || '—'} / {ultimaValidacion.recursoNombre || '—'} — {ultimaValidacion.resultado === 'OK' ? t('ok') : t('notOk')}
                </Caption>
              </div>
            )}
          </div>

          {/* Registrar visita (demo) - SOLO DEV */}
          {IS_DEV && (
            <div className={cardClass}>
              <Title size="lg" className="mb-4">{t('registerVisitDev')}</Title>
              <Caption className="mb-4 block">
                {t('registerVisitNote')}
              </Caption>
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t('qrCode')}</label>
                <input
                  type="text"
                  value={codigoQr}
                  onChange={(e) => setCodigoQr(e.target.value)}
                  disabled={registrando}
                  placeholder={t('enterQrCode')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                />
              </div>
              <button
                type="button"
                onClick={handleRegistrarVisita}
                disabled={registrando || !codigoQr.trim()}
                className="mt-4 rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {registrando ? t('registering') : t('register')}
              </button>
              {registroError && (
                <p className="mt-2 text-sm text-destructive">{registroError}</p>
              )}
              {registroSuccess && (
                <p className="mt-2 text-sm text-green-600">{registroSuccess}</p>
              )}
            </div>
          )}
        </div>
      </Container>
    </Section>
  );
}
