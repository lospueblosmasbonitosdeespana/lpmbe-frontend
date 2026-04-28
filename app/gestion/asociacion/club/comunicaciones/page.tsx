'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { ContentBlock } from '@/app/_components/content-builder/ContentBlockBuilder';

const ContentBlockBuilder = dynamic(
  () => import('@/app/_components/content-builder/ContentBlockBuilder'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border bg-white p-12 text-center text-sm text-muted-foreground">
        Cargando constructor visual…
      </div>
    ),
  },
);

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

type Plantilla = {
  id: string;
  nombre: string;
  descripcion: string;
  asunto: string;
  blocks: ContentBlock[];
  bypassOptIn?: boolean;
  thumb: string;
};

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function block(type: ContentBlock['type'], patch: Partial<ContentBlock> = {}): ContentBlock {
  return {
    id: id(),
    type,
    align: 'left',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    paddingY: 12,
    borderRadius: 8,
    ...patch,
  };
}

const PLANTILLAS: Plantilla[] = [
  {
    id: 'sorteo',
    nombre: 'Anuncio de sorteo',
    descripcion: 'Comunica un nuevo sorteo a socios activos.',
    thumb: '🎁',
    asunto: '🎁 Nuevo sorteo solo para socios del Club',
    blocks: [
      block('heading', { content: '¡Tenemos un nuevo sorteo!', align: 'center' }),
      block('text', { content: 'Como socio del <strong>Club de Amigos de los Pueblos más Bonitos de España</strong>, tienes acceso exclusivo a este sorteo.' }),
      block('button', { label: 'Ver sorteo y apuntarme', url: 'https://lospueblosmasbonitosdeespana.org/mi-cuenta/club/sorteos', align: 'center', backgroundColor: '#9c5b3f', textColor: '#ffffff' }),
      block('text', { content: '¡Mucha suerte!<br/>El equipo de LPMBE', align: 'center' }),
    ],
  },
  {
    id: 'caducan',
    nombre: 'Tu suscripción caduca pronto',
    descripcion: 'Aviso transaccional a socios cuya membresía termina pronto.',
    thumb: '⏳',
    asunto: 'Tu Club de Amigos está a punto de finalizar',
    bypassOptIn: true,
    blocks: [
      block('heading', { content: 'Renueva tu Club de Amigos' }),
      block('text', { content: 'Te avisamos de que tu pertenencia al <strong>Club de Amigos</strong> caduca pronto. Renueva en un clic desde tu panel.' }),
      block('button', { label: 'Renovar mi membresía', url: 'https://lospueblosmasbonitosdeespana.org/mi-cuenta/club', align: 'center', backgroundColor: '#9c5b3f', textColor: '#ffffff' }),
      block('text', { content: 'Gracias por seguir descubriendo España con nosotros.' }),
    ],
  },
  {
    id: 'lanzamiento',
    nombre: 'Bienvenida al Lanzamiento',
    descripcion: 'Mensaje de bienvenida tras alta gratuita en periodo de lanzamiento.',
    thumb: '🚀',
    asunto: '¡Bienvenido al Club! Estos meses son nuestra invitación',
    blocks: [
      block('heading', { content: '¡Bienvenido al Club de Amigos!', align: 'center' }),
      block('text', { content: 'Has activado tu membresía en la oferta de lanzamiento. Disfruta de descuentos en RRTT, hoteles, restaurantes, casas rurales y comercios de los pueblos.' }),
      block('button', { label: 'Ver negocios con beneficios', url: 'https://lospueblosmasbonitosdeespana.org/mi-cuenta/club/negocios', align: 'center', backgroundColor: '#9c5b3f', textColor: '#ffffff' }),
      block('socialLinks', {
        align: 'center',
        socialFacebook: 'https://www.facebook.com/lospueblosmasbonitos/',
        socialInstagram: 'https://www.instagram.com/lospueblosmbe/',
        socialYoutube: 'https://www.youtube.com/@lospueblosmasbonitos',
      }),
    ],
  },
  {
    id: 'novedades',
    nombre: 'Novedades del mes',
    descripcion: 'Resumen mensual de pueblos, RRTT y rutas nuevas.',
    thumb: '📰',
    asunto: 'Novedades del Club este mes',
    blocks: [
      block('heading', { content: 'Novedades del Club' }),
      block('text', { content: '<p>Hola,</p><p>Estas son algunas novedades del mes para socios:</p><ul><li>📍 Nuevos pueblos en la red</li><li>🍽️ Restaurantes con descuento Club</li><li>🎨 Talleres y experiencias para socios</li></ul>' }),
      block('divider'),
      block('button', { label: 'Entrar al panel del Club', url: 'https://lospueblosmasbonitosdeespana.org/mi-cuenta/club', align: 'center', backgroundColor: '#9c5b3f', textColor: '#ffffff' }),
    ],
  },
  {
    id: 'reactivar',
    nombre: 'Te echamos de menos (winback)',
    descripcion: 'Recupera socios que dejaron caducar la membresía.',
    thumb: '💌',
    asunto: 'Te echamos de menos en el Club',
    blocks: [
      block('heading', { content: 'Vuelve al Club de Amigos', align: 'center' }),
      block('text', { content: 'Hace tiempo que no te vemos por el <strong>Club de Amigos</strong>. Tu sitio sigue aquí, con descuentos en pueblos, sorteos exclusivos y novedades cada mes.' }),
      block('button', { label: 'Reactivar mi membresía', url: 'https://lospueblosmasbonitosdeespana.org/mi-cuenta/club', align: 'center', backgroundColor: '#9c5b3f', textColor: '#ffffff' }),
      block('text', { content: 'Te esperamos.', align: 'center' }),
    ],
  },
];

export default function ComunicacionesPage() {
  const [filter, setFilter] = useState<Filter>({ clubStatus: 'ACTIVE', aceptaMarketing: true });
  const [preview, setPreview] = useState<{ total: number; sample: any[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [asunto, setAsunto] = useState('');
  const [html, setHtml] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [builderResetKey, setBuilderResetKey] = useState(0);

  const [bypassOptIn, setBypassOptIn] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState<Plantilla | null>(null);

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

  function applyPlantilla(p: Plantilla) {
    setAsunto(p.asunto);
    setBlocks(p.blocks.map((b) => ({ ...b, id: id() })));
    setBuilderResetKey((k) => k + 1);
    setBypassOptIn(!!p.bypassOptIn);
    setShowGallery(false);
    setGalleryPreview(null);
  }

  async function handleEnviarPrueba() {
    if (!asunto.trim() || !html.trim()) {
      alert('Asunto y contenido son obligatorios. Añade al menos un bloque.');
      return;
    }
    setSendingTest(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/club/admin/comunicaciones/enviar-prueba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asunto, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? 'Error al enviar prueba');
      setResult(`Prueba enviada a ${data.to}. Revisa tu bandeja.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSendingTest(false);
    }
  }

  async function handleEnviar() {
    if (!preview) {
      alert('Calcula la audiencia antes de enviar');
      return;
    }
    if (preview.total === 0) {
      alert('No hay destinatarios con este filtro.');
      return;
    }
    if (!asunto.trim() || !html.trim()) {
      alert('Asunto y contenido son obligatorios.');
      return;
    }
    if (!confirm(`¿Confirmar envío a ${preview.total} destinatarios reales?`)) return;
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

  const previewWrapped = useMemo(() => buildPreviewHtml(asunto, html), [asunto, html]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/gestion/asociacion/club" className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900">
        ← Volver al Club
      </Link>
      <h1 className="mb-2 text-3xl font-bold">Comunicaciones del Club</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Envía emails segmentados a socios o usuarios. Edita con el constructor visual de bloques
        (igual que la Newsletter), previsualiza, manda una prueba a tu propio email y solo
        entonces envía a la audiencia. Por seguridad, solo se permite enviar a usuarios con
        consentimiento de marketing salvo que actives <em>bypass opt-in</em> (uso transaccional,
        p. ej. avisos de fin de membresía o ganadores de sorteo).
      </p>

      {/* ── 1. Filtros ───────────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">1. Filtra la audiencia</h2>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
            Segmenta
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Estado del Club"
            help="«Solo socios activos» = miembros del Club ahora mismo. «Solo NO socios» = usuarios registrados que NO son miembros (nunca lo fueron, dieron de baja o expiró su membresía sin renovar)."
          >
            <select
              value={filter.clubStatus ?? ''}
              onChange={(e) => set('clubStatus', (e.target.value as any) || undefined)}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm"
            >
              <option value="">Todos los usuarios registrados</option>
              <option value="ACTIVE">Solo socios activos</option>
              <option value="NONE">Solo NO socios (registrados sin Club o caducados)</option>
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
        </div>

        <Field label="Tipos de suscripción">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => {
              const active = (filter.tiposSuscripcion ?? []).includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArr('tiposSuscripcion', t)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-border bg-white'}`}
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
                  className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-border bg-white'}`}
                >
                  {i}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="rounded-lg bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {previewLoading ? 'Calculando…' : 'Calcular audiencia'}
          </button>

          {preview && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm">
              <strong>{preview.total}</strong> destinatarios coinciden.{' '}
              {preview.sample.length > 0 && (
                <details className="inline-block">
                  <summary className="cursor-pointer text-xs text-blue-800">Ver muestra</summary>
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
      </section>

      {/* ── 2. Compositor ───────────────────────────────────── */}
      <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">2. Redacta el mensaje</h2>
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Galería de plantillas
          </button>
        </div>

        <Field label="Asunto">
          <input
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Asunto del email…"
            className="w-full rounded-lg border border-input px-3 py-2 text-sm"
          />
        </Field>

        <div className="mt-2 rounded-xl border border-dashed border-border bg-gray-50/50 p-1">
          <ContentBlockBuilder
            key={builderResetKey}
            initialBlocks={blocks}
            onChange={setHtml}
            onBlocksChange={setBlocks}
            draftKey="lpmbe-club-comunicaciones-builder"
            showBrandLogos
            uploadFileNameBase={asunto || 'club-newsletter'}
          />
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={bypassOptIn}
            onChange={(e) => setBypassOptIn(e.target.checked)}
            className="mt-1"
          />
          <span>
            <strong>Bypass opt-in</strong> (solo para comunicaciones transaccionales como avisos
            de fin de membresía o notificación a ganadores de sorteo).
          </span>
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEnviarPrueba}
            disabled={sendingTest}
            className="flex-1 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {sendingTest ? 'Enviando prueba…' : '✉️ Enviar prueba a mí'}
          </button>
          <button
            type="button"
            onClick={handleEnviar}
            disabled={sending || !preview || preview.total === 0}
            className="flex-1 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-rose-700 hover:to-rose-800 disabled:opacity-50"
          >
            {sending ? 'Enviando…' : `🚀 Enviar a ${preview?.total ?? '?'}`}
          </button>
        </div>

        {result && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{result}</p>}
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      {/* ── 3. Vista previa ──────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">3. Vista previa del email</h2>
          <span className="text-xs text-muted-foreground">Renderizado tal y como llegará al socio</span>
        </div>
        <iframe
          title="preview"
          className="h-[600px] w-full rounded-lg border border-border bg-white"
          srcDoc={previewWrapped}
        />
      </section>

      {/* ── Galería de plantillas modal ──────────────────────── */}
      {showGallery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setShowGallery(false); setGalleryPreview(null); }}>
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Galería de plantillas</h3>
              <button type="button" onClick={() => { setShowGallery(false); setGalleryPreview(null); }} className="rounded-lg border border-border px-3 py-1.5 text-xs">Cerrar</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PLANTILLAS.map((p) => (
                <article key={p.id} className="flex flex-col rounded-xl border border-border bg-white p-4">
                  <div className="mb-2 text-3xl">{p.thumb}</div>
                  <h4 className="text-sm font-bold">{p.nombre}</h4>
                  <p className="mt-1 flex-1 text-xs text-muted-foreground">{p.descripcion}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGalleryPreview(p)}
                      className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs hover:bg-gray-50"
                    >
                      Ver previa
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPlantilla(p)}
                      className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Usar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {galleryPreview && (
              <div className="mt-6 rounded-xl border border-border bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-bold">Previa: {galleryPreview.nombre}</h4>
                  <button type="button" onClick={() => applyPlantilla(galleryPreview)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Usar esta plantilla</button>
                </div>
                <PlantillaPreview plantilla={galleryPreview} />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-sm font-medium text-gray-800">{label}</span>
      {children}
      {help ? <span className="mt-1 block text-xs text-muted-foreground">{help}</span> : null}
    </label>
  );
}

/**
 * Renderizado simple de los bloques de una plantilla para preview en la
 * galería. Para el envío real, el HTML que se envía al backend lo produce
 * `ContentBlockBuilder` (vía la prop `onChange` → `setHtml`).
 */
function PlantillaPreview({ plantilla }: { plantilla: Plantilla }) {
  const inner = plantilla.blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `<h2 style="text-align:${b.align ?? 'left'};color:${b.textColor};margin:0 0 12px 0">${b.content ?? ''}</h2>`;
        case 'text':
          return `<div style="text-align:${b.align ?? 'left'};color:${b.textColor};margin-bottom:12px">${b.content ?? ''}</div>`;
        case 'button':
          return `<div style="text-align:${b.align ?? 'left'};margin:16px 0"><a href="${b.url ?? '#'}" style="display:inline-block;padding:12px 24px;border-radius:8px;background:${b.backgroundColor};color:${b.textColor};text-decoration:none;font-weight:600">${b.label ?? 'Botón'}</a></div>`;
        case 'divider':
          return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>`;
        case 'socialLinks':
          return `<div style="text-align:center;margin:16px 0;color:#6b7280;font-size:13px">Síguenos en redes</div>`;
        default:
          return '';
      }
    })
    .join('');
  return (
    <iframe
      title="plantilla-preview"
      className="h-[420px] w-full rounded-lg border border-border bg-white"
      srcDoc={buildPreviewHtml(plantilla.asunto, inner)}
    />
  );
}

function buildPreviewHtml(asunto: string, body: string) {
  const subject = (asunto || '(sin asunto)').replace(/</g, '&lt;');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;background:#f3f4f6;}
    .frame{max-width:640px;margin:0 auto;background:#ffffff;}
    .header{background:#9c5b3f;color:white;padding:18px 24px;}
    .header h1{margin:0;font-size:18px;font-weight:700;}
    .body{padding:24px;line-height:1.6;font-size:15px;}
    .body h2{font-size:22px;margin-top:0;}
    .body img{max-width:100%;height:auto;border-radius:8px;}
    .body a{color:#9c5b3f;}
    .footer{padding:18px 24px;background:#fafafa;color:#6b7280;font-size:12px;text-align:center;border-top:1px solid #e5e7eb;}
  </style></head><body><div class="frame">
    <div class="header"><h1>${subject}</h1></div>
    <div class="body">${body}</div>
    <div class="footer">Club de Amigos · Los Pueblos más Bonitos de España<br/>
    Si no quieres recibir más comunicaciones, escribe a <a href="mailto:info@lospueblosmasbonitosdeespana.org">info@lospueblosmasbonitosdeespana.org</a></div>
  </div></body></html>`;
}
