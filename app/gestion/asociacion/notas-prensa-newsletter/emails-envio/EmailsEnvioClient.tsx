'use client';

import { useEffect, useState } from 'react';

type Settings = {
  emailFromNewsletter?: string | null;
  emailFromPress?: string | null;
  emailFromAyuntamientos?: string | null;
  emailFromClub?: string | null;
  emailFromTransactional?: string | null;
  emailContactoBaja?: string | null;
};

type FieldKey = keyof Settings;

type FieldDef = {
  key: FieldKey;
  title: string;
  description: string;
  envFallback: string;
  defaultExample: string;
  badge: string;
  color: 'violet' | 'amber' | 'teal' | 'rose' | 'slate' | 'sky';
};

const FIELDS: FieldDef[] = [
  {
    key: 'emailFromNewsletter',
    title: 'Newsletter pública',
    description: 'Campañas masivas a suscriptores de la newsletter (ediciones mensuales, novedades…).',
    envFallback: 'EMAIL_FROM_NEWSLETTER',
    defaultExample: 'info@lospueblosmasbonitosdeespana.org',
    badge: 'Mensual',
    color: 'violet',
  },
  {
    key: 'emailFromPress',
    title: 'Notas de prensa',
    description: 'Envíos a medios y periodistas.',
    envFallback: 'EMAIL_FROM_PRESS',
    defaultExample: 'prensa@lospueblosmasbonitosdeespana.org',
    badge: 'Medios',
    color: 'amber',
  },
  {
    key: 'emailFromAyuntamientos',
    title: 'Ayuntamientos',
    description: 'Comunicaciones internas a alcaldes, concejales y oficinas de turismo.',
    envFallback: 'EMAIL_FROM_AYUNTAMIENTOS',
    defaultExample: 'ayuntamientos@lospueblosmasbonitosdeespana.org',
    badge: 'Interno',
    color: 'teal',
  },
  {
    key: 'emailFromClub',
    title: 'El Club',
    description: 'Comunicaciones a socios. Si lo dejas vacío, hereda del de la Newsletter pública.',
    envFallback: 'EMAIL_FROM_NEWSLETTER (heredado)',
    defaultExample: 'info@lospueblosmasbonitosdeespana.org',
    badge: 'Socios',
    color: 'rose',
  },
  {
    key: 'emailFromTransactional',
    title: 'Transaccionales del sistema',
    description:
      'Notificaciones automáticas: recuperación de contraseña, confirmaciones, avisos del Club, sorteos…',
    envFallback: 'EMAIL_FROM',
    defaultExample: 'noreply@lospueblosmasbonitosdeespana.org',
    badge: 'Sistema',
    color: 'slate',
  },
  {
    key: 'emailContactoBaja',
    title: 'Email de baja en footers',
    description:
      'Aparece en el pie de los emails del Club ("escribe a..."). Si lo dejas vacío se usa info@.',
    envFallback: 'info@lospueblosmasbonitosdeespana.org',
    defaultExample: 'info@lospueblosmasbonitosdeespana.org',
    badge: 'Footer',
    color: 'sky',
  },
];

const COLOR_CLASSES: Record<FieldDef['color'], { ring: string; text: string; bg: string; ring2: string; dot: string }> = {
  violet: { ring: 'ring-violet-200', text: 'text-violet-700', bg: 'bg-violet-100', ring2: 'dark:ring-violet-800', dot: 'bg-violet-500' },
  amber: { ring: 'ring-amber-200', text: 'text-amber-700', bg: 'bg-amber-100', ring2: 'dark:ring-amber-800', dot: 'bg-amber-500' },
  teal: { ring: 'ring-teal-200', text: 'text-teal-700', bg: 'bg-teal-100', ring2: 'dark:ring-teal-800', dot: 'bg-teal-500' },
  rose: { ring: 'ring-rose-200', text: 'text-rose-700', bg: 'bg-rose-100', ring2: 'dark:ring-rose-800', dot: 'bg-rose-500' },
  slate: { ring: 'ring-slate-200', text: 'text-slate-700', bg: 'bg-slate-100', ring2: 'dark:ring-slate-700', dot: 'bg-slate-500' },
  sky: { ring: 'ring-sky-200', text: 'text-sky-700', bg: 'bg-sky-100', ring2: 'dark:ring-sky-800', dot: 'bg-sky-500' },
};

const EMAIL_REGEX = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const NAME_EMAIL_REGEX = /^[^<>]{1,80}<\s*[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+\s*>$/;

function isValidFromValue(raw: string): boolean {
  const value = raw.trim();
  if (!value) return true;
  return EMAIL_REGEX.test(value) || NAME_EMAIL_REGEX.test(value);
}

export default function EmailsEnvioClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [values, setValues] = useState<Settings>({});
  const [original, setOriginal] = useState<Settings>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
        if (!res.ok) throw new Error(`Error al cargar (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        const initial: Settings = {
          emailFromNewsletter: data?.emailFromNewsletter ?? '',
          emailFromPress: data?.emailFromPress ?? '',
          emailFromAyuntamientos: data?.emailFromAyuntamientos ?? '',
          emailFromClub: data?.emailFromClub ?? '',
          emailFromTransactional: data?.emailFromTransactional ?? '',
          emailContactoBaja: data?.emailContactoBaja ?? '',
        };
        setValues(initial);
        setOriginal(initial);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = FIELDS.some((f) => (values[f.key] || '') !== (original[f.key] || ''));

  function handleChange(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSuccess(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      for (const f of FIELDS) {
        const v = (values[f.key] || '').trim();
        if (v && !isValidFromValue(v)) {
          throw new Error(`"${f.title}" no es válido. Usa "email@dominio" o "Nombre <email@dominio>".`);
        }
      }
      const payload: Record<string, string | null> = {};
      for (const f of FIELDS) {
        payload[f.key] = ((values[f.key] || '').trim() || null) as string | null;
      }
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al guardar (${res.status}): ${text.slice(0, 300)}`);
      }
      const data = await res.json();
      const next: Settings = {
        emailFromNewsletter: data?.emailFromNewsletter ?? '',
        emailFromPress: data?.emailFromPress ?? '',
        emailFromAyuntamientos: data?.emailFromAyuntamientos ?? '',
        emailFromClub: data?.emailFromClub ?? '',
        emailFromTransactional: data?.emailFromTransactional ?? '',
        emailContactoBaja: data?.emailContactoBaja ?? '',
      };
      setValues(next);
      setOriginal(next);
      setSuccess('Direcciones guardadas. Los próximos envíos usarán estos remitentes.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setValues(original);
    setError(null);
    setSuccess(null);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando configuración…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-muted/30 p-5 text-sm leading-relaxed text-muted-foreground sm:p-6">
        <h2 className="mb-2 text-base font-semibold text-foreground">Cómo funciona</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Si dejas un campo vacío se usa la variable de entorno como fallback.</li>
          <li>
            Acepta dos formatos: <code className="rounded bg-card px-1 py-0.5">email@dominio</code> o{' '}
            <code className="rounded bg-card px-1 py-0.5">Nombre Visible &lt;email@dominio&gt;</code>.
          </li>
          <li>El dominio del remitente debe estar verificado en Resend (<code>resend.com/domains</code>).</li>
          <li>El cambio aplica inmediatamente al siguiente envío. No es necesario reiniciar el backend.</li>
        </ul>
      </section>

      <section className="space-y-4">
        {FIELDS.map((f) => {
          const c = COLOR_CLASSES[f.color];
          const value = values[f.key] || '';
          const trimmed = value.trim();
          const valid = isValidFromValue(trimmed);
          return (
            <div
              key={f.key}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                    <span
                      className={`rounded-full ${c.bg} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${c.text} ring-1 ${c.ring} ${c.ring2}`}
                    >
                      {f.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground" htmlFor={f.key}>
                  Remitente
                </label>
                <input
                  id={f.key}
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  placeholder={f.defaultExample}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className={`mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono shadow-inner focus:outline-none focus:ring-2 ${
                    !valid ? 'border-rose-500 focus:ring-rose-500' : 'border-border focus:ring-primary'
                  }`}
                />
                <p className="mt-1.5 text-[12px] text-muted-foreground">
                  Por defecto: <code className="rounded bg-muted px-1 py-0.5">{f.envFallback}</code>{' '}
                  → <code className="rounded bg-muted px-1 py-0.5">{f.defaultExample}</code>
                </p>
                {!valid && trimmed && (
                  <p className="mt-1 text-[12px] font-medium text-rose-600">
                    Formato no válido. Usa "email@dominio" o "Nombre &lt;email@dominio&gt;".
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {success}
        </div>
      )}

      <div className="sticky bottom-4 flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-md backdrop-blur">
        <span className="text-xs text-muted-foreground">
          {dirty ? 'Hay cambios sin guardar.' : 'Sin cambios pendientes.'}
        </span>
        <button
          type="button"
          onClick={handleReset}
          disabled={!dirty || saving}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Descartar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex items-center rounded-lg bg-gradient-to-r from-slate-700 to-slate-900 px-5 py-2 text-sm font-semibold text-white shadow transition-all hover:from-slate-800 hover:to-slate-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
