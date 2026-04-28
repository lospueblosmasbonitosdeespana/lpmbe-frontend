'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

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
  html: string;
  bypassOptIn?: boolean;
  thumb: string;
};

const PLANTILLAS: Plantilla[] = [
  {
    id: 'sorteo',
    nombre: 'Anuncio de sorteo',
    descripcion: 'Comunica un nuevo sorteo a socios activos.',
    thumb: '🎁',
    asunto: '🎁 Nuevo sorteo solo para socios del Club',
    html:
      '<h2>¡Tenemos un nuevo sorteo!</h2><p>Hola,</p><p>Como socio del <strong>Club de Amigos de los Pueblos más Bonitos de España</strong>, tienes acceso exclusivo a un nuevo sorteo.</p><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club/sorteos">Ver sorteo y apuntarme →</a></p><p>¡Mucha suerte!<br/>El equipo de LPMBE</p>',
  },
  {
    id: 'caducan',
    nombre: 'Tu suscripción caduca pronto',
    descripcion: 'Aviso transaccional a socios cuya membresía termina pronto.',
    thumb: '⏳',
    asunto: 'Tu Club de Amigos está a punto de finalizar',
    html:
      '<h2>Renueva tu Club de Amigos</h2><p>Hola,</p><p>Te avisamos de que tu pertenencia al <strong>Club de Amigos</strong> caduca pronto. Renueva en un clic desde tu panel:</p><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club">Renovar mi membresía →</a></p><p>Gracias por seguir descubriendo España con nosotros.</p>',
    bypassOptIn: true,
  },
  {
    id: 'lanzamiento',
    nombre: 'Bienvenida al Lanzamiento',
    descripcion: 'Mensaje de bienvenida tras alta gratuita en periodo de lanzamiento.',
    thumb: '🚀',
    asunto: '¡Bienvenido al Club! Estos meses son nuestra invitación',
    html:
      '<h2>¡Bienvenido al Club de Amigos!</h2><p>Hola,</p><p>Has activado tu membresía en la oferta de lanzamiento. Disfruta de descuentos en RRTT, hoteles, restaurantes, casas rurales y comercios de los pueblos.</p><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club/negocios">Ver negocios con beneficios →</a></p><p>El equipo de LPMBE</p>',
  },
  {
    id: 'novedades',
    nombre: 'Novedades del mes',
    descripcion: 'Resumen mensual de pueblos, RRTT y rutas nuevas.',
    thumb: '📰',
    asunto: 'Novedades del Club este mes',
    html:
      '<h2>Novedades del Club</h2><p>Hola,</p><p>Estas son algunas novedades del mes para socios:</p><ul><li>📍 Nuevos pueblos en la red</li><li>🍽️ Restaurantes con descuento Club</li><li>🎨 Talleres y experiencias para socios</li></ul><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club">Entrar al panel del Club →</a></p>',
  },
  {
    id: 'reactivar',
    nombre: 'Te echamos de menos (winback)',
    descripcion: 'Recupera socios que dejaron caducar la membresía.',
    thumb: '💌',
    asunto: 'Te echamos de menos en el Club',
    html:
      '<h2>Vuelve al Club de Amigos</h2><p>Hola,</p><p>Hace tiempo que no te vemos por el <strong>Club de Amigos</strong>. Tu sitio sigue aquí, con descuentos en pueblos, sorteos exclusivos y novedades cada mes.</p><p><a href="https://lospueblosmasbonitosdeespana.org/mi-cuenta/club">Reactivar mi membresía →</a></p><p>Te esperamos.</p>',
  },
];

export default function ComunicacionesPage() {
  const [filter, setFilter] = useState<Filter>({ clubStatus: 'ACTIVE', aceptaMarketing: true });
  const [preview, setPreview] = useState<{ total: number; sample: any[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [asunto, setAsunto] = useState('');
  const [html, setHtml] = useState('<p></p>');
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [bypassOptIn, setBypassOptIn] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState<Plantilla | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      LinkExt.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Empieza por elegir una plantilla o escribe aquí…' }),
    ],
    content: html || '<p></p>',
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'min-h-[280px] rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none',
      },
    },
    immediatelyRender: false,
  });

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
    setHtml(p.html);
    setBypassOptIn(!!p.bypassOptIn);
    if (editor) editor.commands.setContent(p.html, { emitUpdate: false });
    setShowGallery(false);
    setGalleryPreview(null);
  }

  function toggleEditorMode(next: 'visual' | 'html') {
    if (next === editorMode) return;
    if (next === 'html' && editor) {
      setHtml(editor.getHTML());
    } else if (next === 'visual' && editor) {
      editor.commands.setContent(html || '<p></p>', { emitUpdate: false });
    }
    setEditorMode(next);
  }

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace', prev || 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  async function handleEnviarPrueba() {
    if (!asunto.trim() || !html.trim() || html === '<p></p>') {
      alert('Asunto y contenido son obligatorios.');
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
    if (!asunto.trim() || !html.trim() || html === '<p></p>') {
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

  // Sincroniza editor cuando cargamos plantilla desde HTML
  useEffect(() => {
    if (editor && editorMode === 'visual') {
      const current = editor.getHTML();
      if (current !== html) {
        editor.commands.setContent(html || '<p></p>', { emitUpdate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const previewWrapped = useMemo(() => buildPreviewHtml(asunto, html), [asunto, html]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/gestion/asociacion/club" className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900">
        ← Volver al Club
      </Link>
      <h1 className="mb-2 text-3xl font-bold">Comunicaciones del Club</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Envía emails segmentados a socios o usuarios. Edita en visual o HTML, previsualiza, manda
        una prueba a tu propio email y solo entonces envía a la audiencia. Por seguridad, solo se
        permite enviar a usuarios con consentimiento de marketing salvo que actives <em>bypass
        opt-in</em> (uso transaccional, p. ej. avisos de fin de membresía o ganadores de sorteo).
      </p>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* ── 1. Filtros ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">1. Filtra la audiencia</h2>
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
              Segmenta
            </span>
          </div>

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

        {/* ── 2. Compositor ───────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
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

          {/* Editor toggle */}
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleEditorMode('visual')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${editorMode === 'visual' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-border bg-white text-gray-700'}`}
            >
              ✍️ Visual
            </button>
            <button
              type="button"
              onClick={() => toggleEditorMode('html')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${editorMode === 'html' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-border bg-white text-gray-700'}`}
            >
              {'</>'} HTML
            </button>
          </div>

          {editorMode === 'visual' && editor && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-input bg-gray-50 p-1">
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>H3</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><strong>B</strong></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><em>I</em></ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><u>U</u></ToolbarBtn>
                <span className="mx-1 h-5 w-px bg-gray-300" />
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>• Lista</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>1. Lista</ToolbarBtn>
                <span className="mx-1 h-5 w-px bg-gray-300" />
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬅</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}>⬌</ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}>➡</ToolbarBtn>
                <span className="mx-1 h-5 w-px bg-gray-300" />
                <ToolbarBtn onClick={setLink} active={editor.isActive('link')}>🔗 Link</ToolbarBtn>
                <ToolbarBtn
                  onClick={() => {
                    const url = window.prompt('URL de la imagen', 'https://');
                    if (url) editor.chain().focus().setImage({ src: url }).run();
                  }}
                >
                  🖼️ Imagen
                </ToolbarBtn>
              </div>
              <EditorContent editor={editor} />
            </>
          )}

          {editorMode === 'html' && (
            <textarea
              rows={14}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-2 font-mono text-xs"
              placeholder="<p>Escribe HTML…</p>"
            />
          )}

          <label className="mt-3 flex items-start gap-2 text-sm">
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
        </div>
      </section>

      {/* ── 3. Vista previa ──────────────────────────────────── */}
      <section className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">3. Vista previa del email</h2>
          <span className="text-xs text-muted-foreground">Renderizado tal y como llegará al socio</span>
        </div>
        <iframe
          title="preview"
          className="h-[520px] w-full rounded-lg border border-border bg-white"
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
                <iframe title="plantilla-preview" className="h-[420px] w-full rounded-lg border border-border bg-white" srcDoc={buildPreviewHtml(galleryPreview.asunto, galleryPreview.html)} />
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

function ToolbarBtn({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs font-medium ${active ? 'bg-rose-100 text-rose-700' : 'text-gray-700 hover:bg-gray-200'}`}
    >
      {children}
    </button>
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
    Si no quieres recibir más comunicaciones, escribe a <a href="mailto:hola@lospueblosmasbonitosdeespana.org">hola@lospueblosmasbonitosdeespana.org</a></div>
  </div></body></html>`;
}
