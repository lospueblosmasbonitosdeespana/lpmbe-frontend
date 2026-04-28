'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROVINCIAS = [
  '', 'A Coruña', 'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón',
  'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca', 'Girona', 'Granada', 'Guadalajara',
  'Guipúzcoa', 'Huelva', 'Huesca', 'Illes Balears', 'Jaén', 'La Rioja', 'Las Palmas',
  'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra',
  'Ourense', 'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
  'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
];

const INTERESES = [
  { key: 'GASTRONOMIA', label: 'Gastronomía' },
  { key: 'NATURALEZA', label: 'Naturaleza' },
  { key: 'PATRIMONIO', label: 'Patrimonio' },
  { key: 'FAMILIA', label: 'Familia' },
  { key: 'PAREJA', label: 'Pareja' },
  { key: 'FOTOGRAFIA', label: 'Fotografía' },
  { key: 'ENOTURISMO', label: 'Enoturismo' },
  { key: 'ARTESANIA', label: 'Artesanía' },
  { key: 'FIESTAS', label: 'Fiestas' },
  { key: 'BIENESTAR', label: 'Bienestar' },
];

const TIPOS_SUSCRIPCION = ['ANUAL', 'MENSUAL', 'LANZAMIENTO'];

export type SorteoFormValue = {
  id?: number;
  titulo: string;
  slug?: string;
  descripcion: string;
  premio: string;
  imagenUrl?: string | null;
  basesLegales: string;
  organizador: string;
  provinciaFiltro?: string | null;
  interesesFiltro: string[];
  edadMinima?: number | null;
  tiposSuscripcion: string[];
  validacionesMinimas: number;
  inicioAt: string;
  finAt: string;
  numGanadores: number;
  estado: 'BORRADOR' | 'PUBLICADO' | 'CERRADO' | 'RESUELTO';
};

export function SorteoForm({
  initial,
  mode,
}: {
  initial: SorteoFormValue;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [v, setV] = useState<SorteoFormValue>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof SorteoFormValue>(k: K, val: SorteoFormValue[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  function toggle(arr: string[], key: string): string[] {
    return arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body = { ...v };
      if (!body.inicioAt || !body.finAt) {
        throw new Error('Las fechas de inicio y fin son obligatorias');
      }
      if (mode === 'create') {
        const res = await fetch('/api/club/admin/sorteos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? 'Error al crear');
        router.push(`/gestion/asociacion/club/sorteos/${data.id}`);
      } else {
        const res = await fetch(`/api/club/admin/sorteos/${v.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? 'Error al guardar');
        router.refresh();
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset className="space-y-4 rounded-xl border border-border bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-gray-700">Datos básicos</legend>
        <Field label="Título *">
          <input
            required
            value={v.titulo}
            onChange={(e) => set('titulo', e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Slug (opcional, se genera del título)">
          <input
            value={v.slug ?? ''}
            onChange={(e) => set('slug', e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Descripción *">
          <textarea
            required
            rows={4}
            value={v.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Premio *">
          <input
            required
            value={v.premio}
            onChange={(e) => set('premio', e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Ej. Estancia 2 noches en hotel rural para 2 personas"
          />
        </Field>
        <Field label="Imagen (URL)">
          <input
            value={v.imagenUrl ?? ''}
            onChange={(e) => set('imagenUrl', e.target.value || null)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Organizador">
          <input
            value={v.organizador}
            onChange={(e) => set('organizador', e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-gray-700">Fechas y ganadores</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Inicio *">
            <input
              type="datetime-local"
              required
              value={v.inicioAt}
              onChange={(e) => set('inicioAt', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Fin *">
            <input
              type="datetime-local"
              required
              value={v.finAt}
              onChange={(e) => set('finAt', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Nº ganadores">
            <input
              type="number"
              min={1}
              value={v.numGanadores}
              onChange={(e) => set('numGanadores', parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-gray-700">Segmentación (opcional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Solo provincia">
            <select
              value={v.provinciaFiltro ?? ''}
              onChange={(e) => set('provinciaFiltro', e.target.value || null)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p || 'Todas las provincias'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Edad mínima (años)">
            <input
              type="number"
              min={0}
              max={120}
              value={v.edadMinima ?? ''}
              onChange={(e) => set('edadMinima', e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Validaciones mínimas">
            <input
              type="number"
              min={0}
              value={v.validacionesMinimas}
              onChange={(e) => set('validacionesMinimas', parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-800">Solo intereses</span>
          <div className="flex flex-wrap gap-2">
            {INTERESES.map((it) => {
              const active = v.interesesFiltro.includes(it.key);
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => set('interesesFiltro', toggle(v.interesesFiltro, it.key))}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white'
                  }`}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-800">Solo planes</span>
          <div className="flex flex-wrap gap-2">
            {TIPOS_SUSCRIPCION.map((t) => {
              const active = v.tiposSuscripcion.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tiposSuscripcion', toggle(v.tiposSuscripcion, t))}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-gray-700">Bases legales *</legend>
        <textarea
          required
          rows={8}
          value={v.basesLegales}
          onChange={(e) => set('basesLegales', e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm"
          placeholder="Texto completo de las bases legales (se mostrará tal cual al socio)…"
        />
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-border bg-white p-6">
        <legend className="px-2 text-sm font-semibold text-gray-700">Estado</legend>
        <select
          value={v.estado}
          onChange={(e) => set('estado', e.target.value as SorteoFormValue['estado'])}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="BORRADOR">Borrador (no visible para socios)</option>
          <option value="PUBLICADO">Publicado (abierto a inscripciones)</option>
          <option value="CERRADO">Cerrado (sin nuevas inscripciones)</option>
        </select>
      </fieldset>

      {err && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : mode === 'create' ? 'Crear sorteo' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-800">{label}</span>
      {children}
    </label>
  );
}
