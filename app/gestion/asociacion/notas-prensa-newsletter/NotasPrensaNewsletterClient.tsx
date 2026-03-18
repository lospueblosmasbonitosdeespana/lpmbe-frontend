'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

type Campaign = {
  id: number;
  kind: 'NEWSLETTER' | 'PRESS';
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  sentAt?: string | null;
  createdAt: string;
};

type PressContact = {
  id: number;
  email: string;
  name?: string | null;
  mediaOutlet?: string | null;
  scope: string;
  ccaa: string;
  provincia: string;
  puebloSlug: string;
};

type Overview = {
  usersTotal: number;
  newsletterSubscribersTotal: number;
  pressContactsTotal: number;
  campaignsTotal: number;
};

type Mode = 'newsletter' | 'press';

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES');
}

export default function NotasPrensaNewsletterClient({ mode }: { mode: Mode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pressContacts, setPressContacts] = useState<PressContact[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    kind: (mode === 'newsletter' ? 'NEWSLETTER' : 'PRESS') as 'PRESS' | 'NEWSLETTER',
    subject: '',
    html: '',
    includeNational: true,
    ccaa: '',
    provincia: '',
    puebloSlug: '',
    source: '',
  });
  const [pressForm, setPressForm] = useState({
    email: '',
    name: '',
    mediaOutlet: '',
    scope: 'NACIONAL',
    ccaa: '',
    provincia: '',
    puebloSlug: '',
  });
  const [pressFormExpanded, setPressFormExpanded] = useState(false);
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [pressPhotoFiles, setPressPhotoFiles] = useState<File[]>([]);
  const [pressPhotoUrls, setPressPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: campaignForm.html || '<p></p>',
    onUpdate: ({ editor }) => {
      setCampaignForm((s) => ({ ...s, html: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[200px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  async function loadData() {
    try {
      const [overviewRes, campaignsRes, contactsRes] = await Promise.all([
        fetch('/api/admin/newsletter/overview', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/campaigns?limit=25', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/press-contacts?limit=20', { cache: 'no-store' }),
      ]);
      if (overviewRes.ok) {
        const o = await overviewRes.json();
        setOverview({
          usersTotal: Number(o?.usersTotal || 0),
          newsletterSubscribersTotal: Number(o?.newsletterSubscribersTotal || 0),
          pressContactsTotal: Number(o?.pressContactsTotal || 0),
          campaignsTotal: Number(o?.campaignsTotal || 0),
        });
      }
      if (campaignsRes.ok) {
        const c = await campaignsRes.json();
        setCampaigns(Array.isArray(c) ? c : []);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setPressContacts(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (campaignForm.html && campaignForm.html !== current) {
      editor.commands.setContent(campaignForm.html, { emitUpdate: false });
    }
  }, [campaignForm.html, editor]);

  async function handleAddPressContact(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!pressForm.email.trim() || !pressForm.mediaOutlet.trim()) {
        throw new Error('Email y medio son obligatorios');
      }
      const res = await fetch('/api/admin/newsletter/press-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pressForm.email.trim(),
          name: pressForm.name.trim() || undefined,
          mediaOutlet: pressForm.mediaOutlet.trim(),
          scope: pressForm.scope,
          ccaa: pressForm.ccaa.trim(),
          provincia: pressForm.provincia.trim(),
          puebloSlug: pressForm.puebloSlug.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error creando contacto de prensa');
      setMessage('Contacto de prensa guardado correctamente.');
      setPressForm({
        email: '',
        name: '',
        mediaOutlet: '',
        scope: 'NACIONAL',
        ccaa: '',
        provincia: '',
        puebloSlug: '',
      });
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Error guardando contacto');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      let finalHtml = campaignForm.html.trim();
      if (mode === 'press' && editorMode === 'visual' && editor) {
        finalHtml = editor.getHTML().trim();
      }

      if (!campaignForm.subject.trim() || !finalHtml) {
        throw new Error('Asunto y contenido son obligatorios');
      }

      let photoUrlsForSend = [...pressPhotoUrls];
      if (mode === 'press' && pressPhotoFiles.length > 0 && pressPhotoUrls.length === 0) {
        photoUrlsForSend = await uploadPressPhotos();
      }
      if (mode === 'press' && photoUrlsForSend.length > 0) {
        finalHtml = appendPressPhotos(finalHtml, photoUrlsForSend);
      }

      const filters =
        mode === 'press'
          ? {
              includeNational: campaignForm.includeNational,
              ccaas: campaignForm.ccaa
                .split(/[,;\n]/g)
                .map((v) => v.trim())
                .filter(Boolean),
              provincias: campaignForm.provincia
                .split(/[,;\n]/g)
                .map((v) => v.trim())
                .filter(Boolean),
              puebloSlug: campaignForm.puebloSlug,
            }
          : { source: campaignForm.source };

      const res = await fetch('/api/admin/newsletter/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: mode === 'press' ? 'PRESS' : 'NEWSLETTER',
          subject: campaignForm.subject,
          html: finalHtml,
          filters,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error enviando campaña');
      setMessage(
        `Campaña enviada. Destinatarios: ${data.totalRecipients}. Enviados: ${data.sentCount}. Fallidos: ${data.failedCount}.`,
      );
      setPressPhotoFiles([]);
      setPressPhotoUrls([]);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Error enviando campaña');
    } finally {
      setLoading(false);
    }
  }

  function appendPressPhotos(html: string, urls: string[]) {
    const gallery = urls
      .map(
        (url, i) =>
          `<p style="margin:0 0 10px 0;"><img src="${url}" alt="Imagen nota de prensa ${i + 1}" style="max-width:100%;height:auto;border-radius:8px;" /></p>`,
      )
      .join('');
    return `${html}
      <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />
      <h3 style="margin:0 0 12px 0;">Imágenes de la nota de prensa</h3>
      ${gallery}
    `;
  }

  async function uploadPressPhotos() {
    if (pressPhotoFiles.length === 0) return [];
    if (pressPhotoFiles.length > 10) {
      throw new Error('Puedes subir un máximo de 10 fotos por nota de prensa');
    }

    setUploadingPhotos(true);
    try {
      const urls: string[] = [];
      for (const file of pressPhotoFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'newsletter/press');
        const res = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) {
          throw new Error(data?.error || data?.message || 'Error subiendo una de las fotos');
        }
        urls.push(String(data.url));
      }
      setPressPhotoUrls(urls);
      return urls;
    } finally {
      setUploadingPhotos(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Usuarios web</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.usersTotal ?? '—'}</p>
        </article>
        {mode === 'newsletter' ? (
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Suscriptores newsletter</p>
            <p className="mt-2 text-2xl font-semibold">{overview?.newsletterSubscribersTotal ?? '—'}</p>
          </article>
        ) : (
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Contactos de prensa</p>
            <p className="mt-2 text-2xl font-semibold">{overview?.pressContactsTotal ?? '—'}</p>
          </article>
        )}
        <article className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Campañas registradas</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.campaignsTotal ?? '—'}</p>
        </article>
      </section>

      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {mode === 'press' ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Añadir contacto de prensa a la base de datos</h2>
            <button
              type="button"
              onClick={() => setPressFormExpanded((v) => !v)}
              className="rounded-md border border-border px-3 py-1 text-sm font-medium hover:bg-muted"
            >
              {pressFormExpanded ? '▼ Ocultar formulario' : '▶ Mostrar formulario'}
            </button>
          </div>

          {pressFormExpanded ? (
            <form onSubmit={handleAddPressContact} className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                Medio
                <input
                  value={pressForm.mediaOutlet}
                  onChange={(e) => setPressForm((s) => ({ ...s, mediaOutlet: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Nombre del medio"
                />
              </label>
              <label className="text-sm">
                Email
                <input
                  type="email"
                  value={pressForm.email}
                  onChange={(e) => setPressForm((s) => ({ ...s, email: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="contacto@medio.com"
                />
              </label>
              <label className="text-sm">
                Nombre (opcional)
                <input
                  value={pressForm.name}
                  onChange={(e) => setPressForm((s) => ({ ...s, name: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Ámbito
                <select
                  value={pressForm.scope}
                  onChange={(e) => setPressForm((s) => ({ ...s, scope: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="NACIONAL">Nacional</option>
                  <option value="CCAA">CCAA</option>
                  <option value="PROVINCIA">Provincia</option>
                  <option value="LOCAL">Local</option>
                </select>
              </label>
              <label className="text-sm">
                CCAA (opcional)
                <input
                  value={pressForm.ccaa}
                  onChange={(e) => setPressForm((s) => ({ ...s, ccaa: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Provincia (opcional)
                <input
                  value={pressForm.provincia}
                  onChange={(e) => setPressForm((s) => ({ ...s, provincia: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Guardando…' : 'Guardar contacto'}
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{mode === 'press' ? '2) Enviar nota de prensa' : '1) Enviar newsletter'}</h2>
        <form onSubmit={handleSendCampaign} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Asunto
              <input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm((s) => ({ ...s, subject: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>

          {mode === 'press' ? (
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-1 block">Ámbitos</span>
                <label className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={campaignForm.includeNational}
                    onChange={(e) =>
                      setCampaignForm((s) => ({
                        ...s,
                        includeNational: e.target.checked,
                      }))
                    }
                  />
                  Incluir medios nacionales
                </label>
              </label>
              <label className="text-sm">
                CCAA (una o varias)
                <input
                  value={campaignForm.ccaa}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, ccaa: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Extremadura, Andalucía..."
                />
              </label>
              <label className="text-sm">
                Provincia (una o varias)
                <input
                  value={campaignForm.provincia}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, provincia: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Cáceres, Badajoz..."
                />
              </label>
              <label className="text-sm md:col-span-3">
                Pueblo (slug)
                <input
                  value={campaignForm.puebloSlug}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, puebloSlug: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : (
            <label className="text-sm">
              Origen newsletter (opcional)
              <input
                value={campaignForm.source}
                onChange={(e) => setCampaignForm((s) => ({ ...s, source: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="legacy_web_users_import, tienda, web..."
              />
            </label>
          )}

          <label className="block text-sm">
            Contenido
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className={`rounded-md border px-3 py-1 text-xs ${editorMode === 'visual' ? 'bg-muted font-semibold' : ''}`}
              >
                Editor visual
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('html')}
                className={`rounded-md border px-3 py-1 text-xs ${editorMode === 'html' ? 'bg-muted font-semibold' : ''}`}
              >
                HTML
              </button>
            </div>
            {editorMode === 'visual' ? (
              <div className="mt-2">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <textarea
                rows={8}
                value={campaignForm.html}
                onChange={(e) => setCampaignForm((s) => ({ ...s, html: e.target.value }))}
                className="mt-2 w-full rounded-md border border-border px-3 py-2 font-mono text-sm"
                placeholder="<h1>Nota de prensa</h1><p>Contenido...</p>"
              />
            )}
          </label>

          {mode === 'press' ? (
            <div className="space-y-3">
              <label className="block text-sm">
                Fotos para la nota (máximo 10)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    setPressPhotoFiles(Array.from(e.target.files || []).slice(0, 10))
                  }
                  className="mt-1 block text-sm"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    try {
                      if (pressPhotoFiles.length === 0) {
                        throw new Error('Selecciona al menos una foto');
                      }
                      await uploadPressPhotos();
                      setMessage('Fotos subidas y optimizadas correctamente.');
                    } catch (e: any) {
                      setError(e?.message || 'Error subiendo fotos');
                    }
                  }}
                  disabled={uploadingPhotos || loading}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {uploadingPhotos ? 'Subiendo fotos...' : 'Subir fotos'}
                </button>
                <span className="text-xs text-muted-foreground">
                  {pressPhotoFiles.length} seleccionadas · {pressPhotoUrls.length} subidas
                </span>
              </div>
              {pressPhotoUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                  {pressPhotoUrls.map((url) => (
                    <img key={url} src={url} alt="Foto nota de prensa" className="h-24 w-full rounded border object-cover" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar campaña'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Últimas campañas</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left">Fecha</th>
                <th className="px-2 py-2 text-left">Tipo</th>
                <th className="px-2 py-2 text-left">Asunto</th>
                <th className="px-2 py-2 text-left">Estado</th>
                <th className="px-2 py-2 text-right">Dest.</th>
                <th className="px-2 py-2 text-right">OK</th>
                <th className="px-2 py-2 text-right">Fallos</th>
                <th className="px-2 py-2 text-right">Aperturas</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={8}>
                    Sin campañas todavía.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-2 py-2">{fmtDate(c.sentAt || c.createdAt)}</td>
                    <td className="px-2 py-2">{c.kind}</td>
                    <td className="px-2 py-2">{c.subject}</td>
                    <td className="px-2 py-2">{c.status}</td>
                    <td className="px-2 py-2 text-right">{c.totalRecipients}</td>
                    <td className="px-2 py-2 text-right">{c.sentCount}</td>
                    <td className="px-2 py-2 text-right">{c.failedCount}</td>
                    <td className="px-2 py-2 text-right">{c.openedCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {mode === 'press' ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Muestra de contactos de prensa</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left">Email</th>
                <th className="px-2 py-2 text-left">Medio</th>
                <th className="px-2 py-2 text-left">Scope</th>
                <th className="px-2 py-2 text-left">CCAA</th>
                <th className="px-2 py-2 text-left">Provincia</th>
              </tr>
            </thead>
            <tbody>
              {pressContacts.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={5}>
                    Sin contactos cargados.
                  </td>
                </tr>
              ) : (
                pressContacts.map((c) => (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-2 py-2">{c.email}</td>
                    <td className="px-2 py-2">{c.mediaOutlet || '—'}</td>
                    <td className="px-2 py-2">{c.scope}</td>
                    <td className="px-2 py-2">{c.ccaa || '—'}</td>
                    <td className="px-2 py-2">{c.provincia || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </section>
      ) : null}
    </div>
  );
}
