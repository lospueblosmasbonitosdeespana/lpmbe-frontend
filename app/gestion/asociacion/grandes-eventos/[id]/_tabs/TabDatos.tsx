'use client';

import { useState, useEffect } from 'react';
import type { EventoEditDetail } from '../GranEventoEditor';
import { adminFetch } from './_helpers';
import FileUploader from './_FileUploader';

type Form = {
  nombre: string;
  slug: string;
  publicado: boolean;
  fechaInicio: string;
  fechaFin: string;
  logoUrl: string;
  pdfUrl: string;
  contactoNombre: string;
  contactoTelefono: string;
  heroKicker_es: string;
  heroTitulo_es: string;
  heroSubtitulo_es: string;
  heroIntro_es: string;
  heroFederacion_es: string;
  contactoTitulo_es: string;
  contactoTexto_es: string;
  logisticaAirportTitulo_es: string;
  logisticaAirportTexto_es: string;
  logisticaHotelTitulo_es: string;
  logisticaHotelTexto_es: string;
  logisticaIdiomasTitulo_es: string;
  logisticaIdiomasTexto_es: string;
  villagesIntro_es: string;
  mapIntro_es: string;
};

function toLocalDate(iso: string | null): string {
  if (!iso) return '';
  return iso.substring(0, 10);
}

export default function TabDatos({ evento, reload }: { evento: EventoEditDetail; reload: () => Promise<void> }) {
  const [form, setForm] = useState<Form>(() => ({
    nombre: evento.nombre,
    slug: evento.slug,
    publicado: evento.publicado,
    fechaInicio: toLocalDate(evento.fechaInicio),
    fechaFin: toLocalDate(evento.fechaFin),
    logoUrl: evento.logoUrl ?? '',
    pdfUrl: evento.pdfUrl ?? '',
    contactoNombre: evento.contactoNombre ?? '',
    contactoTelefono: evento.contactoTelefono ?? '',
    heroKicker_es: evento.heroKicker_es ?? '',
    heroTitulo_es: evento.heroTitulo_es ?? '',
    heroSubtitulo_es: evento.heroSubtitulo_es ?? '',
    heroIntro_es: evento.heroIntro_es ?? '',
    heroFederacion_es: evento.heroFederacion_es ?? '',
    contactoTitulo_es: evento.contactoTitulo_es ?? '',
    contactoTexto_es: evento.contactoTexto_es ?? '',
    logisticaAirportTitulo_es: evento.logisticaAirportTitulo_es ?? '',
    logisticaAirportTexto_es: evento.logisticaAirportTexto_es ?? '',
    logisticaHotelTitulo_es: evento.logisticaHotelTitulo_es ?? '',
    logisticaHotelTexto_es: evento.logisticaHotelTexto_es ?? '',
    logisticaIdiomasTitulo_es: evento.logisticaIdiomasTitulo_es ?? '',
    logisticaIdiomasTexto_es: evento.logisticaIdiomasTexto_es ?? '',
    villagesIntro_es: evento.villagesIntro_es ?? '',
    mapIntro_es: evento.mapIntro_es ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      nombre: evento.nombre,
      slug: evento.slug,
      publicado: evento.publicado,
      fechaInicio: toLocalDate(evento.fechaInicio),
      fechaFin: toLocalDate(evento.fechaFin),
      logoUrl: evento.logoUrl ?? '',
      pdfUrl: evento.pdfUrl ?? '',
      contactoNombre: evento.contactoNombre ?? '',
      contactoTelefono: evento.contactoTelefono ?? '',
      heroKicker_es: evento.heroKicker_es ?? '',
      heroTitulo_es: evento.heroTitulo_es ?? '',
      heroSubtitulo_es: evento.heroSubtitulo_es ?? '',
      heroIntro_es: evento.heroIntro_es ?? '',
      heroFederacion_es: evento.heroFederacion_es ?? '',
      contactoTitulo_es: evento.contactoTitulo_es ?? '',
      contactoTexto_es: evento.contactoTexto_es ?? '',
      logisticaAirportTitulo_es: evento.logisticaAirportTitulo_es ?? '',
      logisticaAirportTexto_es: evento.logisticaAirportTexto_es ?? '',
      logisticaHotelTitulo_es: evento.logisticaHotelTitulo_es ?? '',
      logisticaHotelTexto_es: evento.logisticaHotelTexto_es ?? '',
      logisticaIdiomasTitulo_es: evento.logisticaIdiomasTitulo_es ?? '',
      logisticaIdiomasTexto_es: evento.logisticaIdiomasTexto_es ?? '',
      villagesIntro_es: evento.villagesIntro_es ?? '',
      mapIntro_es: evento.mapIntro_es ?? '',
    });
  }, [evento]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const payload: Record<string, unknown> = { ...form };
      payload.fechaInicio = form.fechaInicio || null;
      payload.fechaFin = form.fechaFin || null;
      delete payload.logoUrl;
      delete payload.pdfUrl;
      await adminFetch(`/${evento.id}`, { method: 'PATCH', json: payload });
      await reload();
      setMsg('Guardado. Las traducciones a 7 idiomas se generaron automáticamente.');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Section title="Identidad y publicación">
        <FieldGrid>
          <Field label="Nombre interno (no se muestra al público si hay título)">
            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={input}
              required
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className={input}
              required
            />
          </Field>
          <Field label="Publicado">
            <label className="inline-flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.publicado}
                onChange={(e) => setForm({ ...form, publicado: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              Visible en la URL pública
            </label>
          </Field>
          <Field label="Fecha inicio">
            <input
              type="date"
              value={form.fechaInicio}
              onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Fecha fin">
            <input
              type="date"
              value={form.fechaFin}
              onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              className={input}
            />
          </Field>
        </FieldGrid>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FileUploader
            label="Logo del evento"
            hint="Imagen PNG, JPG, WebP o SVG (máx. 10 MB). Se sube a R2."
            value={form.logoUrl || null}
            uploadUrl={`/api/admin/grandes-eventos/${evento.id}/logo/upload`}
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            preview="image"
            onUploaded={async (url) => {
              setForm({ ...form, logoUrl: url });
              await reload();
            }}
            onClear={async () => {
              setForm({ ...form, logoUrl: '' });
              await adminFetch(`/${evento.id}`, { method: 'PATCH', json: { logoUrl: null } });
              await reload();
            }}
          />
          <FileUploader
            label="PDF del programa"
            hint="Archivo PDF (máx. 12 MB). Se sube a R2 y aparece en el botón Descargar."
            value={form.pdfUrl || null}
            uploadUrl={`/api/admin/grandes-eventos/${evento.id}/pdf/upload`}
            accept="application/pdf"
            preview="pdf"
            onUploaded={async (url) => {
              setForm({ ...form, pdfUrl: url });
              await reload();
            }}
            onClear={async () => {
              setForm({ ...form, pdfUrl: '' });
              await adminFetch(`/${evento.id}`, { method: 'PATCH', json: { pdfUrl: null } });
              await reload();
            }}
          />
        </div>
      </Section>

      <Section title="Hero (portada de la página)" hint="Todos estos textos se traducen automáticamente al guardar.">
        <FieldGrid>
          <Field label="Kicker (línea pequeña encima del título)">
            <input value={form.heroKicker_es} onChange={(e) => setForm({ ...form, heroKicker_es: e.target.value })} className={input} />
          </Field>
          <Field label="Federación / organizador">
            <input value={form.heroFederacion_es} onChange={(e) => setForm({ ...form, heroFederacion_es: e.target.value })} className={input} />
          </Field>
          <Field label="Título principal" full>
            <input value={form.heroTitulo_es} onChange={(e) => setForm({ ...form, heroTitulo_es: e.target.value })} className={input} />
          </Field>
          <Field label="Subtítulo (lugar y fechas)" full>
            <input value={form.heroSubtitulo_es} onChange={(e) => setForm({ ...form, heroSubtitulo_es: e.target.value })} className={input} />
          </Field>
          <Field label="Texto introductorio (1–2 párrafos)" full>
            <textarea
              value={form.heroIntro_es}
              onChange={(e) => setForm({ ...form, heroIntro_es: e.target.value })}
              rows={3}
              className={input}
            />
          </Field>
        </FieldGrid>
      </Section>

      <Section title="Sección Pueblos y Mapa">
        <FieldGrid>
          <Field label="Introducción a la sección de pueblos" full>
            <textarea
              value={form.villagesIntro_es}
              onChange={(e) => setForm({ ...form, villagesIntro_es: e.target.value })}
              rows={2}
              className={input}
            />
          </Field>
          <Field label="Introducción al mapa" full>
            <textarea
              value={form.mapIntro_es}
              onChange={(e) => setForm({ ...form, mapIntro_es: e.target.value })}
              rows={2}
              className={input}
            />
          </Field>
        </FieldGrid>
      </Section>

      <Section title="Logística (4 tarjetas de información práctica)">
        <FieldGrid>
          <Field label="Aeropuerto · título">
            <input value={form.logisticaAirportTitulo_es} onChange={(e) => setForm({ ...form, logisticaAirportTitulo_es: e.target.value })} className={input} />
          </Field>
          <Field label="Aeropuerto · texto">
            <textarea value={form.logisticaAirportTexto_es} onChange={(e) => setForm({ ...form, logisticaAirportTexto_es: e.target.value })} rows={2} className={input} />
          </Field>
          <Field label="Hotel · título">
            <input value={form.logisticaHotelTitulo_es} onChange={(e) => setForm({ ...form, logisticaHotelTitulo_es: e.target.value })} className={input} />
          </Field>
          <Field label="Hotel · texto">
            <textarea value={form.logisticaHotelTexto_es} onChange={(e) => setForm({ ...form, logisticaHotelTexto_es: e.target.value })} rows={2} className={input} />
          </Field>
          <Field label="Idiomas · título">
            <input value={form.logisticaIdiomasTitulo_es} onChange={(e) => setForm({ ...form, logisticaIdiomasTitulo_es: e.target.value })} className={input} />
          </Field>
          <Field label="Idiomas · texto">
            <textarea value={form.logisticaIdiomasTexto_es} onChange={(e) => setForm({ ...form, logisticaIdiomasTexto_es: e.target.value })} rows={2} className={input} />
          </Field>
        </FieldGrid>
      </Section>

      <Section title="Contacto urgente">
        <FieldGrid>
          <Field label="Título de la tarjeta">
            <input value={form.contactoTitulo_es} onChange={(e) => setForm({ ...form, contactoTitulo_es: e.target.value })} className={input} />
          </Field>
          <Field label="Texto / descripción">
            <input value={form.contactoTexto_es} onChange={(e) => setForm({ ...form, contactoTexto_es: e.target.value })} className={input} />
          </Field>
          <Field label="Nombre">
            <input value={form.contactoNombre} onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })} className={input} />
          </Field>
          <Field label="Teléfono (con prefijo internacional)">
            <input value={form.contactoTelefono} onChange={(e) => setForm({ ...form, contactoTelefono: e.target.value })} className={input} placeholder="+34 633 000 000" />
          </Field>
        </FieldGrid>
      </Section>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white/90 p-3 shadow-md backdrop-blur">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-amber-800 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        {msg ? <span className="text-sm text-emerald-700">{msg}</span> : null}
        {err ? <span className="text-sm text-red-600">{err}</span> : null}
      </div>
    </form>
  );
}

const input =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200';

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? 'sm:col-span-2' : ''}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">{label}</span>
      {children}
    </label>
  );
}
