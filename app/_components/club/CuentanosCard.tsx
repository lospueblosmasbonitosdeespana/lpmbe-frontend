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
} from 'lucide-react';
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

const INTERESES_DISPONIBLES: Array<{ key: string; label: string; Icon: LucideIconType }> = [
  { key: 'GASTRONOMIA', label: 'Gastronomía', Icon: UtensilsCrossed },
  { key: 'NATURALEZA', label: 'Naturaleza y senderismo', Icon: Mountain },
  { key: 'PATRIMONIO', label: 'Patrimonio e historia', Icon: Castle },
  { key: 'FAMILIA', label: 'Viajar en familia', Icon: UsersIcon },
  { key: 'PAREJA', label: 'Escapadas en pareja', Icon: HeartHandshake },
  { key: 'FOTOGRAFIA', label: 'Fotografía', Icon: Camera },
  { key: 'ENOTURISMO', label: 'Enoturismo', Icon: Wine },
  { key: 'ARTESANIA', label: 'Artesanía y compras', Icon: Palette },
  { key: 'FIESTAS', label: 'Fiestas y tradiciones', Icon: PartyPopper },
  { key: 'BIENESTAR', label: 'Bienestar y desconexión', Icon: Sparkles },
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
        throw new Error(j?.message ?? 'Error al guardar');
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
        <div className="flex items-center justify-between gap-4">
          <div>
            <Title size="lg" className="mb-1">Tus datos de socio</Title>
            <Caption>
              Provincia: <strong>{provincia}</strong> · Cumple:{' '}
              <strong>{fechaNacimiento}</strong> · Intereses:{' '}
              <strong>{intereses.length}</strong>
              {aceptaMarketing && ' · Recibes novedades por email'}
            </Caption>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium hover:bg-muted/40"
          >
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={baseClass}>
      <Title size="lg" className="mb-2">Cuéntanos un poco más</Title>
      <Caption className="mb-5 block">
        Esto nos ayuda a personalizar la experiencia y que sólo te llegue contenido relevante.
        Puedes cambiarlo cuando quieras.
      </Caption>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-800">Provincia</span>
            <select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Selecciona…</option>
              {PROVINCIAS_ESP.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-800">Fecha de nacimiento</span>
            <input
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              max={new Date().toISOString().slice(0, 10)}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Solo se usa para felicitarte y para sorteos por edad.
            </span>
          </label>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-800">Tus intereses</legend>
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
                  <span>{it.label}</span>
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
            Quiero recibir <strong>ofertas y novedades</strong> de Los Pueblos más Bonitos de España
            (puedes darte de baja en cualquier momento).
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar mis datos'}
          </button>
          {isComplete && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="text-sm text-muted-foreground hover:underline"
            >
              Cancelar
            </button>
          )}
          {done && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700">
              <Confetti size={16} aria-hidden /> ¡Guardado!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
