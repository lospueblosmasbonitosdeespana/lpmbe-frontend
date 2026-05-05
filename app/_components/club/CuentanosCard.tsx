'use client';

import { useMemo, useState, type ComponentType } from 'react';
import {
  UtensilsCrossed,
  Mountain,
  Castle,
  Users as UsersIcon,
  HeartHandshake,
  Camera,
  Wine,
  Palette,
  PartyPopper,
  Sparkles,
  PartyPopper as Confetti,
  CircleCheckBig,
  PenLine,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Title, Caption } from '@/app/components/ui/typography';

const PROVINCIAS_ESP = [
  'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón',
  'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara',
  'Guipúzcoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'La Rioja', 'Las Palmas',
  'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra',
  'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
  'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
];

type LucideIconType = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;

const INTERESES_DISPONIBLES: Array<{ key: string; tKey: string; Icon: LucideIconType }> = [
  { key: 'GASTRONOMIA', tKey: 'interestGASTRONOMIA', Icon: UtensilsCrossed },
  { key: 'NATURALEZA', tKey: 'interestNATURALEZA', Icon: Mountain },
  { key: 'PATRIMONIO', tKey: 'interestPATRIMONIO', Icon: Castle },
  { key: 'FAMILIA', tKey: 'interestFAMILIA', Icon: UsersIcon },
  { key: 'PAREJA', tKey: 'interestPAREJA', Icon: HeartHandshake },
  { key: 'FOTOGRAFIA', tKey: 'interestFOTOGRAFIA', Icon: Camera },
  { key: 'ENOTURISMO', tKey: 'interestENOTURISMO', Icon: Wine },
  { key: 'ARTESANIA', tKey: 'interestARTESANIA', Icon: Palette },
  { key: 'FIESTAS', tKey: 'interestFIESTAS', Icon: PartyPopper },
  { key: 'BIENESTAR', tKey: 'interestBIENESTAR', Icon: Sparkles },
];

export type CuentanosInitial = {
  provincia: string | null;
  fechaNacimiento: string | null;
  intereses: string[];
  aceptaMarketing: boolean;
};

type Props = {
  initial: CuentanosInitial;
  onSaved?: (next: CuentanosInitial) => void;
  cardClassName?: string;
};

export function CuentanosCard({ initial, onSaved, cardClassName }: Props) {
  const t = useTranslations('club');
  const [provincia, setProvincia] = useState(initial.provincia ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(initial.fechaNacimiento ?? '');
  const [intereses, setIntereses] = useState<string[]>(initial.intereses ?? []);
  const [aceptaMarketing, setAceptaMarketing] = useState(!!initial.aceptaMarketing);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = useMemo(() => {
    return Boolean(initial.provincia && initial.fechaNacimiento && (initial.intereses?.length ?? 0) > 0);
  }, [initial]);

  const [collapsed, setCollapsed] = useState(isComplete);
  const isCompleteNow = useMemo(
    () => Boolean(provincia && fechaNacimiento && intereses.length > 0),
    [provincia, fechaNacimiento, intereses.length],
  );

  const toggleInteres = (key: string) =>
    setIntereses((prev) => (prev.includes(key) ? prev.filter((i) => i !== key) : [...prev, key]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/club/suscripcion/datos-socio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provincia: provincia || null,
          fechaNacimiento: fechaNacimiento || null,
          intereses,
          aceptaMarketing,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message ?? t('profileErrorSave'));
      }
      setDone(true);
      onSaved?.({ provincia: provincia || null, fechaNacimiento: fechaNacimiento || null, intereses, aceptaMarketing });
      setCollapsed(true);
      setTimeout(() => setDone(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const baseClass =
    cardClassName ?? 'rounded-2xl border border-border bg-card p-6 shadow-sm';

  if (collapsed && isCompleteNow) {
    return (
      <div className={baseClass}>
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                <CircleCheckBig size={14} aria-hidden />
                {t('profileComplete')}
              </div>
              <Title size="lg" className="mb-2">{t('profileTitle')}</Title>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs text-gray-700">
                  <strong>{t('profileProvinceLabel')}:</strong> {provincia}
                </span>
                <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs text-gray-700">
                  <strong>{t('profileBirthdayLabel')}:</strong> {fechaNacimiento}
                </span>
                <span className="rounded-full border border-border bg-white px-2.5 py-1 text-xs text-gray-700">
                  <strong>{t('profileInterestsLabel')}:</strong> {intereses.length}
                </span>
                {aceptaMarketing && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-100/60 px-2.5 py-1 text-xs font-medium text-emerald-800">
                    {t('profileReceivesNews')}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
            >
              <PenLine size={13} aria-hidden />
              {t('profileEdit')}
            </button>
          </div>
          <Caption className="mt-2 block">
            {t('profileEditHint')}
          </Caption>
        </div>
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <Title size="lg" className="mb-2">{t('profileFormTitle')}</Title>
      <Caption className="mb-5 block">
        {t('profileFormDesc')}
      </Caption>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-800">{t('profileProvinceLabel')}</span>
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{t('profileProvinceSelect')}</option>
              {PROVINCIAS_ESP.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-800">{t('profileBirthdateLabel')}</span>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              max={new Date().toISOString().slice(0, 10)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              {t('profileBirthdateHint')}
            </span>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-800">{t('profileInterestsLegend')}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {INTERESES_DISPONIBLES.map((it) => {
              const active = intereses.includes(it.key);
              const Icon = it.Icon;
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => toggleInteres(it.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-white text-gray-700 hover:bg-muted/40'
                  }`}
                >
                  <Icon size={16} aria-hidden />
                  <span>{t(it.tKey as Parameters<typeof t>[0])}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-start gap-3 rounded-lg bg-muted/30 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={aceptaMarketing}
            onChange={(e) => setAceptaMarketing(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            {t.rich('profileMarketingLabel', {
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t('profileSaving') : t('profileSave')}
          </button>
          {isComplete && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-sm text-muted-foreground hover:underline"
            >
              {t('profileCancel')}
            </button>
          )}
          {done && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Confetti size={16} aria-hidden /> {t('profileSaved')}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
