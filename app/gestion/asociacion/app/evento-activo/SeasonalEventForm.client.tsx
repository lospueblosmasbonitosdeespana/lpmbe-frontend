"use client";

import { useEffect, useState } from 'react';

type SeasonalEvent = 'SEMANA_SANTA' | 'NOCHE_ROMANTICA' | 'NAVIDAD';

const OPTIONS: Array<{ id: SeasonalEvent; label: string; help: string }> = [
  {
    id: 'SEMANA_SANTA',
    label: 'Semana Santa',
    help: 'Muestra el botón de Semana Santa en la Home de la app.',
  },
  {
    id: 'NOCHE_ROMANTICA',
    label: 'Noche Romántica',
    help: 'Recupera el botón de Noche Romántica para campañas de junio.',
  },
  {
    id: 'NAVIDAD',
    label: 'Navidad',
    help: 'Activa el botón de Navidad (ruta preparada en app).',
  },
];

export default function SeasonalEventForm() {
  const [value, setValue] = useState<SeasonalEvent>('SEMANA_SANTA');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/home-seasonal-event', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (
          data?.appSeasonalEvent === 'SEMANA_SANTA' ||
          data?.appSeasonalEvent === 'NOCHE_ROMANTICA' ||
          data?.appSeasonalEvent === 'NAVIDAD'
        ) {
          setValue(data.appSeasonalEvent);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'No se pudo cargar la configuración actual.';
        setErr(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSave = async () => {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch('/api/admin/home-seasonal-event', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appSeasonalEvent: value }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setMsg('Guardado. La app aplicará este evento activo al refrescar la Home.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar.';
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Cargando…</div>;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold">Selector de evento activo</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Este valor controla el botón estacional de la Home de la app.
      </p>

      <div className="mt-4 space-y-2">
        {OPTIONS.map((opt) => (
          <label key={opt.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30">
            <input
              type="radio"
              name="seasonal-event"
              value={opt.id}
              checked={value === opt.id}
              onChange={() => setValue(opt.id)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium">{opt.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{opt.help}</span>
            </span>
          </label>
        ))}
      </div>

      {msg && <p className="mt-4 text-sm text-green-700">{msg}</p>}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      <div className="mt-5">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </section>
  );
}
