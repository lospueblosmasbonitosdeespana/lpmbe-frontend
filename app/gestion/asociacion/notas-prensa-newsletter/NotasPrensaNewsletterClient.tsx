'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';

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

type Overview = {
  usersTotal: number;
  newsletterSubscribersTotal: number;
  pressContactsTotal: number;
  campaignsTotal: number;
};

type Mode = 'newsletter' | 'press';
type PressSendMode = 'editor' | 'pdf';
type GeoPueblo = { slug: string; provincia: string; comunidad: string };

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES');
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function normalizeForSearch(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function NotasPrensaNewsletterClient({ mode }: { mode: Mode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
  const [pressSendMode, setPressSendMode] = useState<PressSendMode>('editor');
  const [pressPhotoFiles, setPressPhotoFiles] = useState<File[]>([]);
  const [pressPhotoUrls, setPressPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [pressPdfFile, setPressPdfFile] = useState<File | null>(null);
  const [pressPdfUrl, setPressPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [webContentKind, setWebContentKind] = useState<'NOTICIA' | 'ARTICULO'>('NOTICIA');
  const [publishingWeb, setPublishingWeb] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [geoPueblos, setGeoPueblos] = useState<GeoPueblo[]>([]);
  const [geoCcaas, setGeoCcaas] = useState<string[]>([]);
  const [geoProvincias, setGeoProvincias] = useState<string[]>([]);
  const [ccaaInput, setCcaaInput] = useState('');
  const [provinciaInput, setProvinciaInput] = useState('');
  const [selectedCcaas, setSelectedCcaas] = useState<string[]>([]);
  const [selectedProvincias, setSelectedProvincias] = useState<string[]>([]);
  const [insertedPhotoUrls, setInsertedPhotoUrls] = useState<string[]>([]);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Placeholder.configure({
        placeholder: 'Escribe aquí la nota de prensa...',
      }),
    ],
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

  function toggleLinkOnEditor() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace', previousUrl || 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }

  async function loadData() {
    try {
      const [overviewRes, campaignsRes] = await Promise.all([
        fetch('/api/admin/newsletter/overview', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/campaigns?limit=25', { cache: 'no-store' }),
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
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/pueblos', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json().catch(() => []);
        if (!Array.isArray(data)) return;

        const pueblos: GeoPueblo[] = data
          .map((item: unknown) => {
            const p = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
            return {
              slug: String(p.slug || '').trim(),
              provincia: String(p.provincia || '').trim(),
              comunidad: String(p.comunidad || '').trim(),
            };
          })
          .filter((p) => p.slug);

        const ccaas = Array.from(
          new Set(pueblos.map((p) => p.comunidad).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b, 'es'));
        const provincias = Array.from(
          new Set(pueblos.map((p) => p.provincia).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b, 'es'));

        if (!cancelled) {
          setGeoPueblos(pueblos);
          setGeoCcaas(ccaas);
          setGeoProvincias(provincias);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
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
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error guardando contacto'));
    } finally {
      setLoading(false);
    }
  }

  function addCcaa(valueRaw: string) {
    const value = valueRaw.trim();
    if (!value) return;
    setSelectedCcaas((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setCcaaInput('');
  }

  function addProvincia(valueRaw: string) {
    const value = valueRaw.trim();
    if (!value) return;
    setSelectedProvincias((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setProvinciaInput('');
  }

  function resolvePuebloSlug(valueRaw: string): string {
    const value = valueRaw.trim();
    if (!value) return '';
    const exactSlug = geoPueblos.find((p) => p.slug.toLowerCase() === value.toLowerCase());
    if (exactSlug) return exactSlug.slug;

    const normalized = normalizeForSearch(value);
    const byName = geoPueblos.find(
      (p) => normalizeForSearch(p.slug) === normalized || normalizeForSearch(`${p.slug} ${p.provincia} ${p.comunidad}`) === normalized,
    );
    return byName?.slug || value;
  }

  function buildPressFilters() {
    return {
      includeNational: campaignForm.includeNational,
      ccaas: selectedCcaas,
      provincias: selectedProvincias,
      puebloSlug: resolvePuebloSlug(campaignForm.puebloSlug),
    };
  }

  async function runSendCampaign() {
    if (!campaignForm.subject.trim()) {
      throw new Error('El asunto es obligatorio');
    }

    let finalHtml = '';
    let photoUrlsForSend = [...pressPhotoUrls];

    if (mode === 'press' && pressSendMode === 'pdf') {
      let pdfUrl = pressPdfUrl.trim();
      let pdfFilename = '';
      if (!pdfUrl && pressPdfFile) {
        pdfUrl = await uploadPressPdf();
      }
      if (pressPdfFile?.name) {
        pdfFilename = pressPdfFile.name;
      }
      if (!pdfFilename && pdfUrl) {
        const fromUrl = pdfUrl.split('/').pop() || '';
        pdfFilename = fromUrl.split('?')[0] || '';
      }
      if (!pdfUrl) {
        throw new Error('Debes subir un PDF para el envío');
      }
      finalHtml = buildPdfEmailHtml(campaignForm.subject.trim(), pdfUrl);
      const safeFilename = pdfFilename || `nota-prensa-${Date.now()}.pdf`;
      const attachmentUrls = [
        {
          url: pdfUrl,
          filename: safeFilename.toLowerCase().endsWith('.pdf')
            ? safeFilename
            : `${safeFilename}.pdf`,
          contentType: 'application/pdf',
        },
      ];

      const filters = mode === 'press' ? buildPressFilters() : { source: campaignForm.source };

      const res = await fetch('/api/admin/newsletter/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: mode === 'press' ? 'PRESS' : 'NEWSLETTER',
          subject: campaignForm.subject,
          html: finalHtml,
          filters,
          attachmentUrls,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error enviando campaña');
      setMessage(
        `Campaña enviada. Destinatarios: ${data.totalRecipients}. Enviados: ${data.sentCount}. Fallidos: ${data.failedCount}.`,
      );
      setPressPhotoFiles([]);
      setPressPhotoUrls([]);
      setPressPdfFile(null);
      setPressPdfUrl('');
      await loadData();
      return;
    } else {
      finalHtml = campaignForm.html.trim();
      if (mode === 'press' && editorMode === 'visual' && editor) {
        finalHtml = editor.getHTML().trim();
      }
      if (!finalHtml) {
        throw new Error('El contenido es obligatorio');
      }
      if (mode === 'press' && pressPhotoFiles.length > 0 && pressPhotoUrls.length === 0) {
        photoUrlsForSend = await uploadPressPhotos();
      }
      if (mode === 'press' && photoUrlsForSend.length > 0) {
        const pendingPhotoUrls = photoUrlsForSend.filter((u) => !insertedPhotoUrls.includes(u));
        if (pendingPhotoUrls.length > 0) {
          finalHtml = appendPressPhotos(finalHtml, pendingPhotoUrls);
        }
      }
    }

    const filters = mode === 'press' ? buildPressFilters() : { source: campaignForm.source };

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
    setPressPdfFile(null);
    setPressPdfUrl('');
    await loadData();
  }

  async function handleSendCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await runSendCampaign();
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error enviando campaña'));
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

  function insertPhotoIntoContent(url: string) {
    const cleanUrl = String(url || '').trim();
    if (!cleanUrl) return;

    if (editorMode === 'visual' && editor) {
      editor.chain().focus().setImage({ src: cleanUrl, alt: 'Imagen nota de prensa' }).run();
      setInsertedPhotoUrls((prev) => (prev.includes(cleanUrl) ? prev : [...prev, cleanUrl]));
      return;
    }

    const textarea = htmlTextareaRef.current;
    const snippet = `<p><img src="${cleanUrl}" alt="Imagen nota de prensa" style="max-width:100%;height:auto;border-radius:8px;" /></p>`;
    if (!textarea) {
      setCampaignForm((s) => ({ ...s, html: `${s.html}\n${snippet}`.trim() }));
      setInsertedPhotoUrls((prev) => (prev.includes(cleanUrl) ? prev : [...prev, cleanUrl]));
      return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = campaignForm.html.slice(0, start);
    const after = campaignForm.html.slice(end);
    const next = `${before}${snippet}${after}`;
    setCampaignForm((s) => ({ ...s, html: next }));
    setInsertedPhotoUrls((prev) => (prev.includes(cleanUrl) ? prev : [...prev, cleanUrl]));
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
      setInsertedPhotoUrls([]);
      return urls;
    } finally {
      setUploadingPhotos(false);
    }
  }

  async function handlePhotosButtonClick() {
    if (pressPhotoFiles.length === 0) {
      photosInputRef.current?.click();
      return;
    }
    setError(null);
    try {
      await uploadPressPhotos();
      setMessage('Fotos subidas y optimizadas correctamente.');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error subiendo fotos'));
    }
  }

  async function uploadPressPdf() {
    if (!pressPdfFile) return '';
    if (!/\.pdf$/i.test(pressPdfFile.name) && pressPdfFile.type !== 'application/pdf') {
      throw new Error('El archivo debe ser PDF');
    }

    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('file', pressPdfFile);
      fd.append('folder', 'newsletter/press-pdf');
      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || data?.message || 'Error subiendo PDF');
      }
      const url = String(data.url);
      setPressPdfUrl(url);
      return url;
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handlePdfButtonClick() {
    if (!pressPdfFile) {
      pdfInputRef.current?.click();
      return;
    }
    setError(null);
    try {
      await uploadPressPdf();
      setMessage('PDF subido correctamente.');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error subiendo PDF'));
    }
  }

  function handleRemovePdf() {
    setPressPdfFile(null);
    setPressPdfUrl('');
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
    setMessage('PDF eliminado del envío.');
    setError(null);
  }

  function buildPdfEmailHtml(subject: string, pdfUrl: string) {
    const safeSubject = subject.replace(/[<>"']/g, '');
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
        <h2 style="margin:0 0 12px 0;">${safeSubject}</h2>
        <p style="margin:0 0 18px 0;">Adjuntamos la nota de prensa en formato PDF.</p>
        <p>
          <a href="${pdfUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">
            Ver nota de prensa (PDF)
          </a>
        </p>
      </div>
    `.trim();
  }

  async function handlePublishWeb() {
    setError(null);
    setMessage(null);
    setPublishingWeb(true);
    try {
      let finalHtml = campaignForm.html.trim();
      if (editorMode === 'visual' && editor) {
        finalHtml = editor.getHTML().trim();
      }
      if (!campaignForm.subject.trim() || !finalHtml) {
        throw new Error('Asunto y contenido son obligatorios para subir a la web');
      }

      let uploadedPhotoUrls = [...pressPhotoUrls];
      if (pressPhotoFiles.length > 0 && pressPhotoUrls.length === 0) {
        uploadedPhotoUrls = await uploadPressPhotos();
      }
      if (uploadedPhotoUrls.length > 0) {
        const pendingPhotoUrls = uploadedPhotoUrls.filter((u) => !insertedPhotoUrls.includes(u));
        if (pendingPhotoUrls.length > 0) {
          finalHtml = appendPressPhotos(finalHtml, pendingPhotoUrls);
        }
      }

      const res = await fetch('/api/admin/newsletter/publish-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignForm.subject.trim(),
          html: finalHtml,
          kind: webContentKind,
          puebloSlug: campaignForm.puebloSlug.trim() || undefined,
          coverUrl: uploadedPhotoUrls[0] || undefined,
          galleryUrls: uploadedPhotoUrls.slice(1, 4),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error publicando en web');

      const target = webContentKind === 'NOTICIA' ? 'noticia' : 'artículo';
      if (data?.publishedToPueblo) {
        setMessage(`Publicado en web como ${target}: asociación + pueblo.`);
      } else {
        setMessage(`Publicado en web como ${target}: asociación.`);
      }
      return true;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error publicando en web'));
      return false;
    } finally {
      setPublishingWeb(false);
    }
  }

  async function handlePublishAndSend() {
    setError(null);
    setMessage(null);
    setLoading(true);
    const published = await handlePublishWeb();
    if (!published) {
      setLoading(false);
      return;
    }
    try {
      await runSendCampaign();
      setMessage('Publicado en web y campaña enviada correctamente.');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Se publicó en web, pero falló el envío de campaña'));
    } finally {
      setLoading(false);
    }
  }

  function buildPreviewHtml() {
    let html = campaignForm.html.trim();
    if (editorMode === 'visual' && editor) {
      html = editor.getHTML().trim();
    }
    if (pressPhotoUrls.length > 0) {
      const pendingPhotoUrls = pressPhotoUrls.filter((u) => !insertedPhotoUrls.includes(u));
      if (pendingPhotoUrls.length > 0) {
        html = appendPressPhotos(html, pendingPhotoUrls);
      }
    }
    return html;
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
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Modo de envío</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPressSendMode('editor')}
                  className={`rounded-xl border px-6 py-3 text-base font-semibold shadow-sm transition ${
                    pressSendMode === 'editor'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  1) Crear en editor
                </button>
                <button
                  type="button"
                  onClick={() => setPressSendMode('pdf')}
                  className={`rounded-xl border px-6 py-3 text-base font-semibold shadow-sm transition ${
                    pressSendMode === 'pdf'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted'
                  }`}
                >
                  2) Enviar desde PDF
                </button>
              </div>
            </div>
          ) : null}

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
                CCAA (añade con +)
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={ccaaInput}
                    list="ccaa-suggestions"
                    onChange={(e) => setCcaaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCcaa(ccaaInput);
                      }
                    }}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                    placeholder="Empieza a escribir CCAA..."
                  />
                  <button
                    type="button"
                    onClick={() => addCcaa(ccaaInput)}
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                  >
                    +
                  </button>
                </div>
                <datalist id="ccaa-suggestions">
                  {geoCcaas.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                {selectedCcaas.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCcaas.map((ccaa) => (
                      <span key={ccaa} className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1 text-xs">
                        {ccaa}
                        <button
                          type="button"
                          onClick={() => setSelectedCcaas((prev) => prev.filter((x) => x !== ccaa))}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Quitar ${ccaa}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </label>
              <label className="text-sm">
                Provincia (añade con +)
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={provinciaInput}
                    list="provincia-suggestions"
                    onChange={(e) => setProvinciaInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addProvincia(provinciaInput);
                      }
                    }}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                    placeholder="Empieza a escribir provincia..."
                  />
                  <button
                    type="button"
                    onClick={() => addProvincia(provinciaInput)}
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold"
                  >
                    +
                  </button>
                </div>
                <datalist id="provincia-suggestions">
                  {geoProvincias.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                {selectedProvincias.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedProvincias.map((provincia) => (
                      <span key={provincia} className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1 text-xs">
                        {provincia}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProvincias((prev) => prev.filter((x) => x !== provincia))
                          }
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Quitar ${provincia}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </label>
              <label className="text-sm md:col-span-3">
                Pueblo (slug)
                <input
                  value={campaignForm.puebloSlug}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, puebloSlug: e.target.value }))}
                  onBlur={() =>
                    setCampaignForm((s) => ({
                      ...s,
                      puebloSlug: resolvePuebloSlug(s.puebloSlug),
                    }))
                  }
                  list="pueblo-slug-suggestions"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="Empieza a escribir slug del pueblo..."
                />
                <datalist id="pueblo-slug-suggestions">
                  {geoPueblos.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.slug} · {p.provincia} · {p.comunidad}
                    </option>
                  ))}
                </datalist>
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

          {(mode !== 'press' || pressSendMode === 'editor') ? (
            <>
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
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('bold') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Negrita
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('italic') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Cursiva
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('strike') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Tachado
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().setParagraph().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('paragraph') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Párrafo
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('heading', { level: 2 })
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background'
                        }`}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('heading', { level: 3 })
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background'
                        }`}
                      >
                        H3
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Lista
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Numerada
                      </button>
                      <button
                        type="button"
                        onClick={toggleLinkOnEditor}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('link') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Enlace
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive('blockquote') ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                      >
                        Cita
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                        className="rounded border bg-background px-2 py-1 text-xs font-semibold"
                      >
                        Línea
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().undo().run()}
                        className="rounded border bg-background px-2 py-1 text-xs font-semibold"
                      >
                        Deshacer
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().redo().run()}
                        className="rounded border bg-background px-2 py-1 text-xs font-semibold"
                      >
                        Rehacer
                      </button>
                    </div>
                    <EditorContent editor={editor} />
                  </div>
                ) : (
                  <textarea
                    ref={htmlTextareaRef}
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
                      ref={photosInputRef}
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
                      onClick={handlePhotosButtonClick}
                      disabled={uploadingPhotos || loading}
                      className="rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {uploadingPhotos ? 'Subiendo fotos...' : pressPhotoFiles.length > 0 ? 'Subir fotos' : 'Seleccionar fotos'}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {pressPhotoFiles.length} seleccionadas · {pressPhotoUrls.length} subidas
                    </span>
                  </div>
                  {pressPhotoUrls.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      {pressPhotoUrls.map((url) => (
                        <div key={url} className="space-y-1">
                          <img src={url} alt="Foto nota de prensa" className="h-24 w-full rounded border object-cover" />
                          <button
                            type="button"
                            onClick={() => insertPhotoIntoContent(url)}
                            className="w-full rounded border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
                          >
                            Insertar en contenido
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {mode === 'press' && pressSendMode === 'pdf' ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <label className="block text-sm">
                Subir PDF de la nota
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    setPressPdfFile(e.target.files?.[0] || null);
                    setPressPdfUrl('');
                  }}
                  className="mt-1 block text-sm"
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePdfButtonClick}
                  disabled={uploadingPdf || loading}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  {uploadingPdf ? 'Subiendo PDF...' : pressPdfFile ? 'Subir PDF' : 'Seleccionar PDF'}
                </button>
                {pressPdfFile || pressPdfUrl ? (
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    disabled={uploadingPdf || loading}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                  >
                    Quitar PDF
                  </button>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {pressPdfFile ? `Seleccionado: ${pressPdfFile.name}` : pressPdfUrl ? 'PDF listo para enviar' : 'Aún no subido'}
                </span>
              </div>
              {pressPdfUrl ? (
                <a
                  href={pressPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-sm text-blue-700 underline"
                >
                  Ver PDF subido
                </a>
              ) : null}
            </div>
          ) : null}

          {mode === 'press' && pressSendMode === 'editor' ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Publicación en web (opcional)</p>
                <button
                  type="button"
                  onClick={() => setShowWebPreview((v) => !v)}
                  className="rounded-md border border-border px-3 py-1 text-xs"
                >
                  {showWebPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
                </button>
              </div>

              <label className="text-sm">
                Guardar como
                <select
                  value={webContentKind}
                  onChange={(e) => setWebContentKind(e.target.value as 'NOTICIA' | 'ARTICULO')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm md:w-80"
                >
                  <option value="NOTICIA">Noticia de la asociación</option>
                  <option value="ARTICULO">Artículo de la asociación</option>
                </select>
              </label>

              <p className="text-xs text-muted-foreground">
                Si indicas un `slug` de pueblo, se publicará también en ese pueblo sin quitarlo de asociación.
              </p>

              {showWebPreview ? (
                <div className="rounded-md border border-border bg-background p-3">
                  <h3 className="mb-2 text-base font-semibold">{campaignForm.subject || 'Vista previa sin título'}</h3>
                  <div
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: buildPreviewHtml() || '<p>Sin contenido</p>' }}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePublishWeb}
                  disabled={publishingWeb || loading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {publishingWeb ? 'Subiendo a la web…' : 'Subir a la web'}
                </button>
                <button
                  type="button"
                  onClick={handlePublishAndSend}
                  disabled={publishingWeb || loading}
                  className="rounded-lg bg-primary/90 px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {loading ? 'Subiendo y enviando…' : 'Subir a la web y enviar campaña'}
                </button>
              </div>
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

    </div>
  );
}
