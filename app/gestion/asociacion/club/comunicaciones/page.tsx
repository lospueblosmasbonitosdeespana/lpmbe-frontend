'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  'GASTRONOMIA', 'NATURALEZA', 'PATRIMONIO', 'FAMILIA', 'PAREJA',
  'FOTOGRAFIA', 'ENOTURISMO', 'ARTESANIA', 'FIESTAS', 'BIENESTAR',
];

const TIPOS = ['ANUAL', 'MENSUAL', 'LANZAMIENTO'];

type Filter = {
  clubStatus?: 'ACTIVE' | 'NONE';
  tiposSuscripcion?: string[];
  caducanEnDias?: number;
  cancelanAlExpirar?: boolean;
  aceptaMarketing?: boolean;
  provincia?: string;
  intereses?: string[];
  edadMinima?: number;
  edadMaxima?: number;
};

const PLANTILLAS: Array<{ id: string; nombre: string; asunto: string; html: string; bypassOptIn?: boolean }> = [
  {
    id: 'sorteo',
    nombre: 'Anuncio de sorteo',
    asunto: '🎁 Nuevo sorteo solo para socios del Club',
    html:
      '<p>¡Hola!</p><p>Tenemos un nuevo sorteo exclusivo para socios del <strong>Club de Amigos</strong>.</p><p>Entra en la app o en tu panel del Club para apuntarte:</p><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club/sorteos">Ver sorteo</a></p><p>¡Mucha suerte!<br>El equipo de Los Pueblos más Bonitos de España</p>',
  },
  {
    id: 'caducan',
    nombre: 'Tu suscripción caduca pronto',
    asunto: 'Tu Club de Amigos está a punto de finalizar',
    html:
      '<p>Hola,</p><p>Te avisamos de que tu pertenencia al <strong>Club de Amigos</strong> caduca pronto.</p><p>Renovar es muy sencillo desde tu panel:</p><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club">Renovar mi membresía</a></p><p>Gracias por seguir descubriendo España con nosotros.</p>',
    bypassOptIn: true,
  },
  {
    id: 'lanzamiento',
    nombre: 'Bienvenida al Lanzamiento',
    asunto: '¡Bienvenido al Club! Estos meses son nuestra invitación',
    html:
      '<p>¡Hola y bienvenido al Club de Amigos!</p><p>Has activado tu membresía en la oferta de lanzamiento. Disfruta de descuentos en RRTT, hoteles, restaurantes y comercios participantes.</p><p>Empieza por aquí: <a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club/negocios">Ver negocios con beneficios</a></p>',
  },
];

export default function ComunicacionesPage() {
  const [filter, setFilter] = useState<Filter>({ clubStatus: 'ACTIVE', aceptaMarketing: true });
  const [preview, setPreview] = useState<{ total: number; sample: any[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [html, setHtml] = useState('');
  const [bypassOptIn, setBypassOptIn] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Filter>(k: K, v: Filter[K]) {
    setFilter((p) => ({ ...p, [k]: v }));
  }

  function toggleArr(k: 'tiposSuscripcion' | 'intereses', v: string) {
    setFilter((p) => {
      const cur = p[k] ?? [];
      return { ...p, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/club/admin/comunicaciones/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error al calcular audiencia');
      setPreview(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPreviewLoading(false);
    }
  }

  function applyPlantilla(p: (typeof PLANTILLAS)[number]) {
    setAsunto(p.asunto);
    setHtml(p.html);
    setBypassOptIn(!!p.bypassOptIn);
  }

  async function handleEnviar() {
    if (!preview) {
      alert('Calcula la audiencia antes de enviar');
      return;
    }
    if (!confirm(`¿Confirmar envío a ${preview.total} destinatarios?`)) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/club/admin/comunicaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter, asunto, html, bypassOptIn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error al enviar');
      setResult(`Enviado a ${data.sent} de ${data.total ?? data.sent} destinatarios (${data.batches} lotes)`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/gestion/asociacion/club" className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900">
        ← Volver al Club
      </Link>
      <h1 className="mb-2 text-3xl font-bold">Comunicaciones segmentadas</h1>
      <p className="mb-8 text-muted-foreground">
        Envía emails a segmentos del Club. Calcula la audiencia antes de enviar para asegurar que
        el filtro es correcto. Por seguridad, solo se permite enviar a usuarios con consentimiento
        de marketing salvo que actives <em>bypass opt-in</em> (uso transaccional, p. ej. avisos de
        fin de membresía).
      </p>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* ── Filtros ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">1. Filtra la audiencia</h2>

          <Field label="Estado del Club">
            <select
              value={filter.clubStatus ?? ''}
              onChange={(e) => set('clubStatus', (e.target.value as any) || undefined)}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Solo socios activos</option>
              <option value="NONE">Solo NO socios</option>
            </select>
          </Field>

          <Field label="Provincia">
            <select
              value={filter.provincia ?? ''}
              onChange={(e) => set('provincia', e.target.value || undefined)}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            >
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p || 'Cualquiera'}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tipos de suscripción">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => {
                const active = (filter.tiposSuscripcion ?? []).includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleArr('tiposSuscripcion', t)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Intereses (cualquiera)">
            <div className="flex flex-wrap gap-2">
              {INTERESES.map((i) => {
                const active = (filter.intereses ?? []).includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleArr('intereses', i)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white'
                    }`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Edad mínima">
              <input
                type="number"
                value={filter.edadMinima ?? ''}
                onChange={(e) => set('edadMinima', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Edad máxima">
              <input
                type="number"
                value={filter.edadMaxima ?? ''}
                onChange={(e) => set('edadMaxima', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Caducan en (días)">
              <input
                type="number"
                value={filter.caducanEnDias ?? ''}
                onChange={(e) => set('caducanEnDias', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm"
              />
            </Field>
            <label className="flex flex-col text-sm">
              <span className="mb-1.5 block font-medium text-gray-800">Cancelan al expirar</span>
              <input
                type="checkbox"
                checked={!!filter.cancelanAlExpirar}
                onChange={(e) => set('cancelanAlExpirar', e.target.checked || undefined)}
                className="h-5 w-5"
              />
            </label>
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!filter.aceptaMarketing}
              onChange={(e) => set('aceptaMarketing', e.target.checked || undefined)}
            />
            Solo opt-in marketing (recomendado)
          </label>

          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="mt-4 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {previewLoading ? 'Calculando…' : 'Calcular audiencia'}
          </button>

          {preview && (
            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
              <strong>{preview.total}</strong> destinatarios coinciden con el filtro.
              {preview.sample.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-blue-800">
                    Ver muestra de {preview.sample.length}
                  </summary>
                  <ul className="mt-2 max-h-40 overflow-auto text-xs">
                    {preview.sample.map((s: any) => (
                      <li key={s.id} className="text-gray-700">
                        {s.email} {s.numeroSocio != null ? ` · #${s.numeroSocio}` : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Plantillas + edición ─────────────────────────────── */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">2. Redacta el mensaje</h2>

          <div className="mb-4">
            <span className="mb-2 block text-sm font-medium text-gray-800">Plantillas rápidas</span>
            <div className="flex flex-wrap gap-2">
              {PLANTILLAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPlantilla(p)}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs hover:bg-muted/40"
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          </div>

          <Field label="Asunto">
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            />
          </Field>

          <Field label="HTML">
            <textarea
              rows={10}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-2 font-mono text-xs"
            />
          </Field>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={bypassOptIn}
              onChange={(e) => setBypassOptIn(e.target.checked)}
              className="mt-1"
            />
            <span>
              <strong>Bypass opt-in</strong> (solo para comunicaciones transaccionales como avisos
              de fin de membresía o ganadores de sorteos).
            </span>
          </label>

          <button
            onClick={handleEnviar}
            disabled={sending || !preview || preview.total === 0}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {sending ? 'Enviando…' : `Enviar a ${preview?.total ?? '?'} destinatarios`}
          </button>

          {result && <p className="mt-3 text-sm text-green-700">{result}</p>}
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-sm font-medium text-gray-800">{label}</span>
      {children}
    </label>
  );
}
