'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Landmark,
  Hotel,
  Trophy,
  BookmarkCheck,
  History,
  PartyPopper,
  Check,
  Hourglass,
  ChevronRight,
  Mountain,
} from 'lucide-react';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';
import { ClubShield, getMemberYear } from '@/app/_components/club/ClubShield';
import { CuentanosCard } from '@/app/_components/club/CuentanosCard';

const IS_DEV = process.env.NODE_ENV === 'development';

type ClubMe = {
  isMember: boolean;
  plan: string | null;
  status: string | null;
  validUntil: string | null;
  cancelAtPeriodEnd?: boolean;
  qrToken?: string | null;
  qrPayload?: string | null;
  numeroSocio?: number | null;
  datosSocio?: {
    provincia: string | null;
    fechaNacimiento: string | null;
    intereses: string[];
    aceptaMarketing: boolean;
    idiomaPreferido: string | null;
  };
  inscripcionesAbiertas?: boolean;
  precioAnualCents?: number;
  precioMensualCents?: number;
  oferta?: {
    descuento: number;
    tipo: string;
    expiraEn: string | null;
    texto: string | null;
  } | null;
  lanzamiento?: {
    activo: boolean;
    mesesGratis: number;
    finAt: string | null;
    texto: string | null;
    cupo: number | null;
    cupoUsado: number;
    cupoRestante: number | null;
  } | null;
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
  codigoCorto?: string | null;
  codigoCortoFormateado?: string | null;
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

function formatCodigoCorto(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = String(raw)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  if (cleaned.length !== 6) return null;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
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
      const codigoCorto = data?.codigoCorto ?? data?.shortCode ?? null;
      const codigoCortoFormateado =
        data?.codigoCortoFormateado ??
        data?.shortCodeFormatted ??
        formatCodigoCorto(codigoCorto);
      setQrIdentidad({
        qrPayload: data.qrPayload,
        expiresAt: data.expiresAt,
        codigoCorto,
        codigoCortoFormateado,
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
                  {clubMe.numeroSocio != null && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Socio nº {String(clubMe.numeroSocio).padStart(5, '0')}
                    </span>
                  )}
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
                clubMe.lanzamiento?.activo ? (
                  <LanzamientoCard
                    lanzamiento={clubMe.lanzamiento}
                    activando={activandoMembresia}
                    onActivar={() => handleActivarMembresia('ANUAL')}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Banner de oferta */}
                    {clubMe.oferta && clubMe.oferta.descuento > 0 && (
                      <OfertaBanner oferta={clubMe.oferta} />
                    )}
                    {/* Tarjetas de precio */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <PrecioCard
                        titulo={t('planAnualTitulo')}
                        precioCents={clubMe.precioAnualCents ?? 0}
                        periodo={t('planAnualPeriodo')}
                        subtitulo={t('planAnualSubtitulo')}
                        oferta={clubMe.oferta}
                        tipoOferta="ANUAL"
                        ahorrasLabel={t('ahorras', { amount: '0' })}
                        destacado
                      />
                      <PrecioCard
                        titulo={t('planMensualTitulo')}
                        precioCents={clubMe.precioMensualCents ?? 0}
                        periodo={t('planMensualPeriodo')}
                        subtitulo={t('planMensualSubtitulo')}
                        oferta={clubMe.oferta}
                        tipoOferta="MENSUAL"
                        ahorrasLabel={t('ahorras', { amount: '0' })}
                      />
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
                )
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
                  <p className="mb-1 flex items-center gap-2 font-medium text-gray-700">
                    <Hourglass size={16} aria-hidden />
                    {t('comingSoonTitle')}
                  </p>
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

                  {(qrIdentidad.codigoCortoFormateado || qrIdentidad.codigoCorto) && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Código corto para validador
                      </p>
                      <p className="mt-1 font-mono text-lg font-semibold tracking-widest text-foreground">
                        {qrIdentidad.codigoCortoFormateado ??
                          formatCodigoCorto(qrIdentidad.codigoCorto)}
                      </p>
                    </div>
                  )}

                  {tiempoRestanteIdentidad !== null && (
                    <p className="mt-2 text-center text-sm text-muted-foreground">
                      {t('expiresIn')} <strong className="text-foreground">{formatTiempoRestante(tiempoRestanteIdentidad)}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cuéntanos un poco más (datos de socio) */}
          {clubMe?.isMember && (
            <CuentanosCard
              initial={{
                provincia: clubMe?.datosSocio?.provincia ?? null,
                fechaNacimiento: clubMe?.datosSocio?.fechaNacimiento ?? null,
                intereses: clubMe?.datosSocio?.intereses ?? [],
                aceptaMarketing: !!clubMe?.datosSocio?.aceptaMarketing,
              }}
              cardClassName={cardClass}
              onSaved={(next) =>
                setClubMe((prev) =>
                  prev
                    ? {
                        ...prev,
                        datosSocio: {
                          ...prev.datosSocio,
                          provincia: next.provincia,
                          fechaNacimiento: next.fechaNacimiento,
                          intereses: next.intereses,
                          aceptaMarketing: next.aceptaMarketing,
                          idiomaPreferido: prev.datosSocio?.idiomaPreferido ?? null,
                        },
                      }
                    : prev,
                )
              }
            />
          )}

          {/* Accesos rápidos */}
          <div className={cardClass}>
            <Title size="lg" className="mb-4">{t('access')}</Title>
            <div className="grid gap-3 sm:grid-cols-2">
              <AccesoCard
                href="/mi-cuenta/club/recursos"
                icon={<Landmark size={22} aria-hidden />}
                title="Recursos Turísticos"
                subtitle="Museos, castillos, bodegas, jardines…"
                badge={recursosDisponibles.length > 0 ? `${recursosDisponibles.length}` : null}
                tone="amber"
              />
              <AccesoCard
                href="/mi-cuenta/club/recursos-rurales"
                icon={<Mountain size={22} aria-hidden />}
                title="Recursos Rurales / Naturales"
                subtitle="Cascadas, miradores, parajes · validados por GPS"
                tone="emerald"
              />
              <AccesoCard
                href="/mi-cuenta/club/negocios"
                icon={<Hotel size={22} aria-hidden />}
                title="Hoteles, casas rurales, comercios, actividades…"
                subtitle="Descuentos y regalos exclusivos"
                tone="rose"
              />
              <AccesoCard
                href="/mi-cuenta/club/sorteos"
                icon={<Trophy size={22} aria-hidden />}
                title="Sorteos del Club"
                subtitle="Concursos exclusivos para socios"
                tone="violet"
              />
              <AccesoCard
                href="/mi-cuenta/club/visitados"
                icon={<BookmarkCheck size={22} aria-hidden />}
                title={t('visitedResources')}
                subtitle="Tu colección de visitas"
                badge={
                  validaciones.filter((v) => v.resultado === 'OK').length > 0
                    ? `${validaciones.filter((v) => v.resultado === 'OK').length}`
                    : null
                }
                tone="emerald"
              />
              <AccesoCard
                href="/mi-cuenta/club/validaciones"
                icon={<History size={22} aria-hidden />}
                title={t('validationHistory')}
                subtitle="Todos los escaneos del Club"
                badge={validaciones.length > 0 ? `${validaciones.length}` : null}
                tone="sky"
                className="sm:col-span-2"
              />
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

// ─── Componentes ──────────────────────────────────────────────────────────

type AccesoTone = 'amber' | 'rose' | 'violet' | 'emerald' | 'sky';

const ACCESO_TONES: Record<
  AccesoTone,
  { ring: string; bg: string; iconBg: string; iconText: string; badge: string }
> = {
  amber: {
    ring: 'hover:border-amber-300',
    bg: 'from-amber-50/70 to-white',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
  },
  rose: {
    ring: 'hover:border-rose-300',
    bg: 'from-rose-50/70 to-white',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800',
  },
  violet: {
    ring: 'hover:border-violet-300',
    bg: 'from-violet-50/70 to-white',
    iconBg: 'bg-violet-100',
    iconText: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-800',
  },
  emerald: {
    ring: 'hover:border-emerald-300',
    bg: 'from-emerald-50/70 to-white',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  sky: {
    ring: 'hover:border-sky-300',
    bg: 'from-sky-50/70 to-white',
    iconBg: 'bg-sky-100',
    iconText: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-800',
  },
};

function AccesoCard({
  href,
  icon,
  title,
  subtitle,
  badge,
  tone,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string | null;
  tone: AccesoTone;
  className?: string;
}) {
  const t = ACCESO_TONES[tone];
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${t.bg} px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${t.ring} ${className ?? ''}`}
    >
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.iconBg} ${t.iconText}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-900 sm:text-[15px]">
            {title}
          </span>
          {badge && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.badge}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight
        size={18}
        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

type Lanzamiento = {
  activo: boolean;
  mesesGratis: number;
  finAt: string | null;
  texto: string | null;
  cupo: number | null;
  cupoUsado: number;
  cupoRestante: number | null;
};

function LanzamientoCard({
  lanzamiento,
  activando,
  onActivar,
}: {
  lanzamiento: Lanzamiento;
  activando: boolean;
  onActivar: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!lanzamiento.finAt) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [lanzamiento.finAt]);

  const fin = lanzamiento.finAt ? new Date(lanzamiento.finAt).getTime() : null;
  const restante = fin ? Math.max(0, fin - now) : null;

  function fmtCountdown(ms: number) {
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <PartyPopper size={14} aria-hidden /> Lanzamiento
          </div>
          <h3 className="text-2xl font-bold text-amber-900">
            {lanzamiento.mesesGratis} {lanzamiento.mesesGratis === 1 ? 'mes' : 'meses'} gratis
          </h3>
          {lanzamiento.texto && (
            <p className="mt-1 text-sm text-amber-800">{lanzamiento.texto}</p>
          )}
        </div>
        {restante !== null && restante > 0 && (
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-medium uppercase tracking-wider text-amber-700">
              Termina en
            </div>
            <div className="text-xl font-bold tabular-nums text-amber-900">
              {fmtCountdown(restante)}
            </div>
          </div>
        )}
      </div>

      <ul className="mt-4 space-y-2 text-sm text-amber-900">
        <li className="flex items-start gap-2">
          <Check size={16} className="mt-0.5 text-amber-700" aria-hidden />
          <span>Acceso completo a recursos turísticos del Club en los pueblos certificados</span>
        </li>
        <li className="flex items-start gap-2">
          <Check size={16} className="mt-0.5 text-amber-700" aria-hidden />
          <span>Descuentos y regalos en hoteles, casas rurales, restaurantes, comercios y experiencias</span>
        </li>
        <li className="flex items-start gap-2">
          <Check size={16} className="mt-0.5 text-amber-700" aria-hidden />
          <span>Tarjeta digital con QR de identidad y número de socio LPMBE</span>
        </li>
      </ul>

      <button
        type="button"
        onClick={onActivar}
        disabled={activando}
        className="mt-5 w-full rounded-xl bg-amber-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
      >
        {activando ? 'Activando...' : 'Activar mi membresía gratis'}
      </button>

      <p className="mt-3 text-center text-[11px] text-amber-700">
        Sin tarjeta. Sin renovación automática. Cuando termine podrás continuar al precio normal.
        {lanzamiento.cupoRestante != null && lanzamiento.cupoRestante < 1000 && (
          <> · Quedan {lanzamiento.cupoRestante} plazas disponibles.</>
        )}
      </p>
    </div>
  );
}

type Oferta = { descuento: number; tipo: string; expiraEn: string | null; texto: string | null };

function OfertaBanner({ oferta }: { oferta: Oferta }) {
  const t = useTranslations('club');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!oferta.expiraEn) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [oferta.expiraEn]);

  const expira = oferta.expiraEn ? new Date(oferta.expiraEn).getTime() : null;
  const restante = expira ? Math.max(0, expira - now) : null;

  function fmtCountdown(ms: number) {
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  return (
    <div className="rounded-lg border-2 border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold text-white">
              -{oferta.descuento}%
            </span>
            <span className="text-sm font-semibold text-green-800">
              {oferta.texto ?? t('ofertaEspecial')}
            </span>
          </div>
          <p className="text-xs text-green-700">
            {oferta.tipo === 'ANUAL' && t('descuentoPlanAnual')}
            {oferta.tipo === 'MENSUAL' && t('descuentoPlanMensual')}
            {oferta.tipo === 'AMBOS' && t('descuentoTodosPlanes')}
          </p>
        </div>
        {restante !== null && restante > 0 && (
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-green-600 font-medium">{t('terminaEn')}</div>
            <div className="text-lg font-bold text-green-800 tabular-nums">{fmtCountdown(restante)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function PrecioCard({
  titulo,
  precioCents,
  periodo,
  subtitulo,
  oferta,
  tipoOferta,
  ahorrasLabel,
  destacado,
}: {
  titulo: string;
  precioCents: number;
  periodo: string;
  subtitulo: string;
  oferta?: Oferta | null;
  tipoOferta: 'ANUAL' | 'MENSUAL';
  ahorrasLabel: string;
  destacado?: boolean;
}) {
  const tieneDescuento =
    oferta &&
    oferta.descuento > 0 &&
    (oferta.tipo === 'AMBOS' || oferta.tipo === tipoOferta);

  const precioFinal = tieneDescuento
    ? Math.round(precioCents * (1 - oferta!.descuento / 100))
    : precioCents;

  const fmtPrice = (cents: number) =>
    (cents / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 });

  return (
    <div className={`rounded-lg border p-4 ${destacado ? 'border-primary/30 bg-white' : 'border-border bg-white'}`}>
      <div className="text-sm font-semibold text-gray-700 mb-1">{titulo}</div>
      <div className="flex items-baseline gap-2">
        {tieneDescuento ? (
          <>
            <span className="text-lg text-gray-400 line-through">{fmtPrice(precioCents)} €</span>
            <span className="text-2xl font-bold text-green-700">{fmtPrice(precioFinal)} €</span>
          </>
        ) : (
          <span className={`text-2xl font-bold ${destacado ? 'text-primary' : 'text-gray-700'}`}>
            {fmtPrice(precioFinal)} €
          </span>
        )}
        <span className="text-sm font-normal text-gray-500">{periodo}</span>
      </div>
      {tieneDescuento && (
        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
          {ahorrasLabel.replace('0', fmtPrice(precioCents - precioFinal))}
        </span>
      )}
      <p className="mt-1 text-xs text-gray-400">{subtitulo}</p>
    </div>
  );
}
