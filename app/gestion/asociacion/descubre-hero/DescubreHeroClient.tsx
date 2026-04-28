'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, Loader2, RotateCcw } from 'lucide-react';

type Collection = {
  slug: string;
  title: string;
  imageUrl: string | null;
};

type Settings = {
  descubreH1: string | null;
  descubreSub: string | null;
  descubreSeoTitle: string | null;
  descubreSeoDescription: string | null;
  descubreIntroHtml: string | null;
  descubreBgColeccionSlug: string | null;
};

/**
 * Defaults: deben coincidir EXACTAMENTE con `DESCUBRE_DEFAULTS` en
 * `backend/src/descubre/descubre.service.ts`, que es el texto real que
 * /descubre devuelve cuando la BD no tiene nada guardado.
 *
 * Cuando un campo está null en la BD, la web pública usa este texto
 * (interpolando `{N}` por el total de pueblos y `{M}` por el total de
 * colecciones activas). Lo precargamos en el formulario para que el admin
 * vea siempre lo que el visitante está leyendo en /descubre.
 */
const DEFAULTS: Settings = {
  descubreH1: 'Pueblos con encanto de España por temáticas',
  descubreSub:
    '{N} pueblos certificados agrupados en {M} colecciones temáticas: castillos, costa, alta montaña, amurallados, pequeños, de piedra, en familia y mucho más. Rankings actualizados por valoraciones reales.',
  descubreSeoTitle:
    'Pueblos con encanto de España: castillos, mar, montaña | Colecciones temáticas',
  descubreSeoDescription:
    'Encuentra los pueblos más bonitos de España por temáticas: castillos, costa, alta montaña, amurallados, pequeños, de piedra, en familia. Rankings actualizados por valoraciones reales y filtros por servicios.',
  descubreIntroHtml: `<p>Los <strong>Pueblos más Bonitos de España</strong> son una asociación que certifica los pueblos con más encanto del país tras un riguroso proceso de evaluación. En esta página encontrarás <strong>colecciones temáticas</strong> que agrupan los pueblos según los criterios que más interesan a quien planifica una escapada: <em>pueblos medievales y amurallados</em>, <em>pueblos junto al mar y la costa</em>, <em>pueblos de alta montaña y nieve</em>, <em>pueblos de piedra</em>, <em>pueblos pequeños</em>, <em>pueblos para ir en familia</em> y muchos más.</p>
<p>Cada colección presenta los pueblos ordenados por <strong>valoraciones reales de los visitantes</strong>, no por publicidad ni por opinión editorial. Las puntuaciones se actualizan en tiempo real y los rankings reflejan el sentir de la gente que ha estado allí.</p>
<p>Además de las colecciones por temática, ofrecemos rankings por <strong>comunidad autónoma</strong> (Castilla y León, Cataluña, Andalucía, Aragón, Asturias, Cantabria, País Vasco, Galicia, Comunidad Valenciana, Castilla-La Mancha, Extremadura, Murcia, La Rioja, Navarra, Madrid, Baleares, Canarias) y filtros por servicios disponibles: pueblos con <em>parking gratuito</em>, con <em>oficina de turismo</em>, con <em>actividades para niños</em>, <em>petfriendly</em>, con <em>rutas señalizadas</em>, etc.</p>
<p>Si estás planificando un fin de semana, una escapada rural o un viaje cultural, estas colecciones te ayudarán a descubrir <strong>los pueblos con más encanto de España</strong> según el tipo de experiencia que buscas. Todos los pueblos que aparecen están <strong>certificados oficialmente</strong> por la asociación.</p>`,
  descubreBgColeccionSlug: null,
};

export default function DescubreHeroClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<Settings>(DEFAULTS);
  /**
   * Lo que vino del backend tal cual (con null cuando no se ha guardado nunca).
   * Lo usamos para distinguir entre "valor por defecto del frontend" y
   * "valor explícitamente guardado".
   */
  const [original, setOriginal] = useState<Settings>(DEFAULTS);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [settingsRes, collectionsRes] = await Promise.all([
          fetch('/api/admin/site-settings', { cache: 'no-store' }),
          fetch('/api/public/descubre?lang=es', { cache: 'no-store' }),
        ]);

        if (settingsRes.status === 401) {
          window.location.href = '/entrar';
          return;
        }
        if (!settingsRes.ok) throw new Error(`Error cargando ajustes (${settingsRes.status})`);

        const data = await settingsRes.json();
        if (cancelled) return;

        const fromApi: Settings = {
          descubreH1: data.descubreH1 ?? null,
          descubreSub: data.descubreSub ?? null,
          descubreSeoTitle: data.descubreSeoTitle ?? null,
          descubreSeoDescription: data.descubreSeoDescription ?? null,
          descubreIntroHtml: data.descubreIntroHtml ?? null,
          descubreBgColeccionSlug: data.descubreBgColeccionSlug ?? null,
        };
        setOriginal(fromApi);
        // Precargamos los textos por defecto cuando la BD está vacía,
        // para que el admin vea siempre lo que el visitante está leyendo en /descubre.
        setForm({
          descubreH1: fromApi.descubreH1 ?? DEFAULTS.descubreH1,
          descubreSub: fromApi.descubreSub ?? DEFAULTS.descubreSub,
          descubreSeoTitle: fromApi.descubreSeoTitle ?? DEFAULTS.descubreSeoTitle,
          descubreSeoDescription: fromApi.descubreSeoDescription ?? DEFAULTS.descubreSeoDescription,
          descubreIntroHtml: fromApi.descubreIntroHtml ?? DEFAULTS.descubreIntroHtml,
          descubreBgColeccionSlug: fromApi.descubreBgColeccionSlug,
        });

        if (collectionsRes.ok) {
          const cols = await collectionsRes.json();
          if (Array.isArray(cols)) {
            setCollections(
              cols.map((c: any) => ({
                slug: c.slug,
                title: c.title ?? c.slug,
                imageUrl: c.imageUrl ?? null,
              })),
            );
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error inesperado');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewImageUrl = useMemo(() => {
    if (!form.descubreBgColeccionSlug) {
      return collections.find((c) => c.imageUrl)?.imageUrl ?? null;
    }
    return collections.find((c) => c.slug === form.descubreBgColeccionSlug)?.imageUrl ?? null;
  }, [form.descubreBgColeccionSlug, collections]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  function resetField<K extends keyof Settings>(key: K) {
    update(key, DEFAULTS[key]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descubreH1: form.descubreH1?.trim() || null,
          descubreSub: form.descubreSub?.trim() || null,
          descubreSeoTitle: form.descubreSeoTitle?.trim() || null,
          descubreSeoDescription: form.descubreSeoDescription?.trim() || null,
          descubreIntroHtml: form.descubreIntroHtml?.trim() || null,
          descubreBgColeccionSlug: form.descubreBgColeccionSlug?.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`No se pudo guardar (${res.status})`);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando…
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Link href="/gestion/asociacion" className="hover:text-neutral-800">
            Gestión · Asociación
          </Link>
          <span>·</span>
          <span className="text-neutral-700">Hero y SEO de Descubre</span>
        </div>
        <h1 className="mt-2 font-serif text-3xl font-bold text-neutral-900">Hero y SEO de la página /descubre</h1>
        <p className="mt-2 text-neutral-600">
          Personaliza el copy, SEO, imagen de fondo y bloque introductorio de{' '}
          <Link
            href="/descubre"
            target="_blank"
            className="inline-flex items-center gap-1 text-amber-700 underline hover:text-amber-800"
          >
            /descubre <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          . Al guardar, los textos se traducen automáticamente con DeepL al resto de idiomas. Usa{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{'{N}'}</code> para el número de pueblos
          certificados y <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">{'{M}'}</code> para el número de
          colecciones activas.
        </p>
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>Cómo leer este formulario:</strong> los campos marcados con la etiqueta{' '}
          <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
            por defecto
          </span>{' '}
          no se han guardado nunca: muestran el texto que el visitante está viendo ahora mismo
          en /descubre (proviene del código). Edítalos y pulsa «Guardar y traducir» para
          fijarlos en la base de datos en los 7 idiomas.
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span className="inline-flex items-center gap-2">
            <Check className="h-4 w-4" /> Guardado correctamente. La caché pública se invalida en segundos.
          </span>
        </div>
      ) : null}

      {/* Hero copy */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Hero (texto principal)</h2>
        <p className="mb-4 text-sm text-neutral-500">
          H1 grande y subtítulo bajo el H1. Si dejas un campo vacío se usa el texto por defecto.
        </p>

        <Field
          label="H1"
          help="Aparece como título principal del hero."
          showReset={form.descubreH1 !== DEFAULTS.descubreH1}
          onReset={() => resetField('descubreH1')}
          isDefault={original.descubreH1 === null}
        >
          <input
            type="text"
            value={form.descubreH1 ?? ''}
            onChange={(e) => update('descubreH1', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </Field>

        <Field
          label="Subtítulo"
          help="Línea bajo el H1. Puedes usar {N} (pueblos) y {M} (colecciones)."
          showReset={form.descubreSub !== DEFAULTS.descubreSub}
          onReset={() => resetField('descubreSub')}
          isDefault={original.descubreSub === null}
        >
          <textarea
            rows={3}
            value={form.descubreSub ?? ''}
            onChange={(e) => update('descubreSub', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </Field>
      </section>

      {/* Imagen de fondo */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Imagen de fondo del hero</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Se usa la foto de portada de la colección elegida. Si no eliges ninguna, se usa la primera con imagen.
        </p>

        <div className="mb-4">
          <label htmlFor="bg-coleccion" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Colección que aporta la imagen
          </label>
          <select
            id="bg-coleccion"
            value={form.descubreBgColeccionSlug ?? ''}
            onChange={(e) => update('descubreBgColeccionSlug', e.target.value || null)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            <option value="">— Automática (primera colección con imagen) —</option>
            {collections.map((c) => (
              <option key={c.slug} value={c.slug} disabled={!c.imageUrl}>
                {c.title} {c.imageUrl ? '' : '(sin imagen)'}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Vista previa</p>
          <div className="relative h-44 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
            {previewImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewImageUrl} alt="Fondo del hero" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70" />
                <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
                  <h3 className="font-serif text-2xl font-bold text-white drop-shadow md:text-3xl">
                    {form.descubreH1?.trim() || DEFAULTS.descubreH1}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-white/95 drop-shadow">
                    {(form.descubreSub?.trim() || DEFAULTS.descubreSub || '')
                      .replace(/\{N\}/g, '— ')
                      .replace(/\{M\}/g, '— ')}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-500">Sin imagen</div>
            )}
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">SEO</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Etiquetas <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;title&gt;</code> y{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;meta description&gt;</code>. Recomendado:
          50-60 caracteres para el título y 150-160 para la descripción.
        </p>

        <Field
          label="Title (SEO)"
          help={`Caracteres: ${(form.descubreSeoTitle ?? '').length}`}
          showReset={form.descubreSeoTitle !== DEFAULTS.descubreSeoTitle}
          onReset={() => resetField('descubreSeoTitle')}
          isDefault={original.descubreSeoTitle === null}
        >
          <input
            type="text"
            value={form.descubreSeoTitle ?? ''}
            onChange={(e) => update('descubreSeoTitle', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </Field>

        <Field
          label="Meta description"
          help={`Caracteres: ${(form.descubreSeoDescription ?? '').length}`}
          showReset={form.descubreSeoDescription !== DEFAULTS.descubreSeoDescription}
          onReset={() => resetField('descubreSeoDescription')}
          isDefault={original.descubreSeoDescription === null}
        >
          <textarea
            rows={3}
            value={form.descubreSeoDescription ?? ''}
            onChange={(e) => update('descubreSeoDescription', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </Field>
      </section>

      {/* Bloque introductorio */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-neutral-900">Bloque introductorio (HTML)</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Texto largo que aparece bajo el hero (plegable, para SEO long-tail). Acepta HTML simple:{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;p&gt;</code>,{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;strong&gt;</code>,{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;em&gt;</code>,{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;a&gt;</code>,{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;ul&gt;</code>,{' '}
          <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">&lt;li&gt;</code>.
        </p>

        <Field
          label="Contenido HTML"
          help="Recomendado entre 200 y 400 palabras. Usa palabras clave temáticas (castillos, costa, montaña, etc.)."
          showReset={form.descubreIntroHtml !== DEFAULTS.descubreIntroHtml}
          onReset={() => resetField('descubreIntroHtml')}
          isDefault={original.descubreIntroHtml === null}
        >
          <textarea
            rows={10}
            value={form.descubreIntroHtml ?? ''}
            onChange={(e) => update('descubreIntroHtml', e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </Field>

        {form.descubreIntroHtml ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Vista previa</p>
            <div
              className="descubre-intro-preview rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: form.descubreIntroHtml }}
            />
            <style>{`
              .descubre-intro-preview p { margin: 0 0 0.75em 0; }
              .descubre-intro-preview p:last-child { margin-bottom: 0; }
              .descubre-intro-preview strong { color: #1c1917; font-weight: 600; }
              .descubre-intro-preview em { font-style: italic; color: #44403c; }
              .descubre-intro-preview a { color: #b45309; text-decoration: underline; }
            `}</style>
          </div>
        ) : null}
      </section>

      {/* Botones */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/descubre"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ExternalLink className="h-4 w-4" /> Ver /descubre
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? 'Guardando…' : 'Guardar y traducir'}
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  help,
  showReset,
  onReset,
  isDefault,
  children,
}: {
  label: string;
  help?: string;
  showReset?: boolean;
  onReset?: () => void;
  /**
   * Si true, el valor mostrado proviene del código (la BD no lo tiene
   * guardado), así que el visitante ve este texto pero no está
   * persistido en BD ni traducido a otros idiomas.
   */
  isDefault?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-neutral-700">{label}</label>
          {isDefault ? (
            <span
              className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800"
              title="Este texto no está guardado en la base de datos. Es el texto por defecto del código."
            >
              por defecto
            </span>
          ) : null}
        </div>
        {showReset && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
            title="Restaurar texto por defecto"
          >
            <RotateCcw className="h-3 w-3" /> Restaurar
          </button>
        ) : null}
      </div>
      {children}
      {help ? <p className="mt-1 text-xs text-neutral-500">{help}</p> : null}
    </div>
  );
}
