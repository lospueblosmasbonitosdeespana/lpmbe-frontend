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
type NewsletterBlockType = 'heading' | 'text' | 'image' | 'button' | 'divider';
type NewsletterBlock = {
  id: string;
  type: NewsletterBlockType;
  content?: string;
  url?: string;
  label?: string;
  align?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  textColor?: string;
  paddingY?: number;
  borderRadius?: number;
};
type NewsletterTemplate = {
  id: number;
  kind: 'NEWSLETTER' | 'PRESS';
  name: string;
  subject: string;
  contentHtml: string;
  blocksJson: unknown;
  updatedAt?: string;
};

function newBlockId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createBlock(type: NewsletterBlockType, patch: Partial<NewsletterBlock> = {}): NewsletterBlock {
  return {
    id: newBlockId(),
    type,
    content:
      type === 'heading'
        ? 'Nuevo titular'
        : type === 'text'
          ? 'Nuevo párrafo de contenido'
          : type === 'button'
            ? 'Llamada a la acción'
            : '',
    label: type === 'button' ? 'Leer más' : '',
    url: type === 'image' ? 'https://...' : type === 'button' ? 'https://...' : '',
    align: 'left',
    backgroundColor: '#ffffff',
    textColor: '#111111',
    paddingY: 10,
    borderRadius: 8,
    ...patch,
  };
}

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeNewsletterBlocks(value: unknown): NewsletterBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const b = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const typeRaw = String(b.type || '').trim().toLowerCase();
      const type: NewsletterBlockType =
        typeRaw === 'heading' || typeRaw === 'text' || typeRaw === 'image' || typeRaw === 'button' || typeRaw === 'divider'
          ? (typeRaw as NewsletterBlockType)
          : 'text';
      const alignRaw = String(b.align || 'left');
      const align: 'left' | 'center' | 'right' =
        alignRaw === 'center' ? 'center' : alignRaw === 'right' ? 'right' : 'left';
      const paddingY = Number.isFinite(Number(b.paddingY)) ? Number(b.paddingY) : 10;
      const borderRadius = Number.isFinite(Number(b.borderRadius))
        ? Number(b.borderRadius)
        : 8;
      return {
        id: String(b.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        type,
        content: String(b.content || ''),
        url: String(b.url || ''),
        label: String(b.label || ''),
        align,
        backgroundColor: String(b.backgroundColor || '#ffffff'),
        textColor: String(b.textColor || '#111111'),
        paddingY: Math.max(0, Math.min(40, paddingY)),
        borderRadius: Math.max(0, Math.min(30, borderRadius)),
      };
    })
    .filter((b) => b.id);
}

function renderNewsletterBlocksToHtml(blocks: NewsletterBlock[]): string {
  if (!blocks.length) return '';
  const body = blocks
    .map((block) => {
      const align = block.align || 'left';
      const background = String(block.backgroundColor || '#ffffff');
      const textColor = String(block.textColor || '#111111');
      const paddingY = Math.max(0, Math.min(40, Number(block.paddingY || 10)));
      const borderRadius = Math.max(0, Math.min(30, Number(block.borderRadius || 8)));
      const boxStyle = `background:${background};color:${textColor};padding:${paddingY}px 14px;border-radius:${borderRadius}px;margin:0 0 12px 0;`;
      if (block.type === 'heading') {
        return `<div style="${boxStyle}"><h2 style="margin:0;font-size:26px;line-height:1.25;text-align:${align};color:${textColor};">${escapeHtml(
          block.content || 'Título',
        )}</h2></div>`;
      }
      if (block.type === 'text') {
        return `<div style="${boxStyle}"><p style="margin:0;font-size:16px;line-height:1.6;text-align:${align};color:${textColor};">${escapeHtml(
          block.content || '',
        ).replace(/\n/g, '<br/>')}</p></div>`;
      }
      if (block.type === 'image') {
        const url = String(block.url || '').trim();
        if (!url) return '';
        return `<div style="${boxStyle}"><p style="margin:0;text-align:${align};"><img src="${escapeHtml(
          url,
        )}" alt="${escapeHtml(block.content || 'Imagen newsletter')}" style="max-width:100%;height:auto;border-radius:10px;" /></p></div>`;
      }
      if (block.type === 'button') {
        const url = String(block.url || '').trim();
        const label = String(block.label || 'Abrir enlace').trim();
        if (!url) return '';
        return `<div style="${boxStyle}"><p style="margin:0;text-align:${align};"><a href="${escapeHtml(
          url,
        )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#8B5E3C;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">${escapeHtml(
          label,
        )}</a></p></div>`;
      }
      return `<hr style="margin:20px 0;border:none;border-top:1px solid #ddd;" />`;
    })
    .filter(Boolean)
    .join('\n');

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.55;max-width:680px;margin:0 auto;">
      ${body}
    </div>
  `.trim();
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
  const [webGallerySelection, setWebGallerySelection] = useState<string[]>([]);
  const [newsletterComposerMode, setNewsletterComposerMode] = useState<'editor' | 'builder'>('builder');
  const [newsletterTemplates, setNewsletterTemplates] = useState<NewsletterTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSaving, setTemplateSaving] = useState(false);
  const [newsletterBlocks, setNewsletterBlocks] = useState<NewsletterBlock[]>([]);
  const [selectedNewsletterBlockId, setSelectedNewsletterBlockId] = useState<string | null>(null);
  const [reorderPickSourceId, setReorderPickSourceId] = useState<string | null>(null);
  const [draggingPaletteType, setDraggingPaletteType] = useState<NewsletterBlockType | null>(null);
  const [uploadingNewsletterImage, setUploadingNewsletterImage] = useState(false);
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
      const requests: Promise<Response>[] = [
        fetch('/api/admin/newsletter/overview', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/campaigns?limit=25', { cache: 'no-store' }),
      ];
      if (mode === 'newsletter') {
        requests.push(fetch('/api/admin/newsletter/templates?kind=NEWSLETTER&limit=100', { cache: 'no-store' }));
      }
      const [overviewRes, campaignsRes, templatesRes] = await Promise.all(requests);
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
      if (mode === 'newsletter' && templatesRes?.ok) {
        const items = await templatesRes.json().catch(() => []);
        const normalized: NewsletterTemplate[] = Array.isArray(items)
          ? items.map((item) => {
              const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
              return {
                id: Number(row.id || 0),
                kind: String(row.kind || 'NEWSLETTER').toUpperCase() === 'PRESS' ? 'PRESS' : 'NEWSLETTER',
                name: String(row.name || ''),
                subject: String(row.subject || ''),
                contentHtml: String(row.contentHtml || ''),
                blocksJson: row.blocksJson,
                updatedAt: String(row.updatedAt || ''),
              };
            })
          : [];
        setNewsletterTemplates(normalized.filter((t) => t.id > 0));
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

  function addNewsletterBlock(type: NewsletterBlockType) {
    const block = createBlock(type);
    setNewsletterBlocks((prev) => [...prev, block]);
    setSelectedNewsletterBlockId(block.id);
  }

  function updateNewsletterBlock(id: string, patch: Partial<NewsletterBlock>) {
    setNewsletterBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function updateSelectedNewsletterBlock(patch: Partial<NewsletterBlock>) {
    if (!selectedNewsletterBlockId) return;
    updateNewsletterBlock(selectedNewsletterBlockId, patch);
  }

  function moveNewsletterBlock(id: string, direction: -1 | 1) {
    setNewsletterBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
  }

  function removeNewsletterBlock(id: string) {
    setNewsletterBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedNewsletterBlockId === id) {
      setSelectedNewsletterBlockId(null);
    }
  }

  function reorderNewsletterBlocks(draggedId: string, targetId: string) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setNewsletterBlocks((prev) => {
      const fromIdx = prev.findIndex((b) => b.id === draggedId);
      const toIdx = prev.findIndex((b) => b.id === targetId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
  }

  function moveBlockToTarget(targetId: string) {
    const sourceId = reorderPickSourceId;
    if (!sourceId || sourceId === targetId) return;
    reorderNewsletterBlocks(sourceId, targetId);
    setReorderPickSourceId(null);
    setSelectedNewsletterBlockId(sourceId);
  }

  async function uploadNewsletterImageForBlock(file: File, blockId: string) {
    if (!file) return;
    setUploadingNewsletterImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'newsletter/templates');
      const res = await fetch('/api/admin/uploads', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || data?.message || 'Error subiendo imagen');
      }
      updateNewsletterBlock(blockId, { url: String(data.url) });
      setMessage('Imagen subida correctamente al bloque.');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error subiendo imagen'));
    } finally {
      setUploadingNewsletterImage(false);
    }
  }

  function duplicateNewsletterBlock(id: string) {
    setNewsletterBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const source = prev[idx];
      const clone: NewsletterBlock = {
        ...source,
        id: newBlockId(),
      };
      const copy = [...prev];
      copy.splice(idx + 1, 0, clone);
      setSelectedNewsletterBlockId(clone.id);
      return copy;
    });
  }

  function applyNewsletterPreset(preset: 'boletin' | 'nota' | 'promo') {
    let blocks: NewsletterBlock[] = [];
    let suggestedSubject = '';
    if (preset === 'boletin') {
      suggestedSubject = 'Boletín mensual - Novedades de la asociación';
      blocks = [
        createBlock('heading', { content: 'Boletín mensual', align: 'center' }),
        createBlock('text', {
          content: 'Te compartimos las novedades más importantes de la red durante este mes.',
        }),
        createBlock('image', {
          url: 'https://...',
          content: 'Imagen destacada del boletín',
          align: 'center',
        }),
        createBlock('text', {
          content: 'Incluye aquí un resumen corto con enlaces a noticias, actividades y próximos eventos.',
        }),
        createBlock('button', {
          label: 'Ver todas las novedades',
          url: 'https://...',
          align: 'center',
        }),
      ];
    } else if (preset === 'nota') {
      suggestedSubject = 'Nota informativa - Comunicado oficial';
      blocks = [
        createBlock('heading', { content: 'Comunicado oficial', align: 'left' }),
        createBlock('text', {
          content: 'Introduce aquí la información principal del comunicado en un párrafo claro y directo.',
        }),
        createBlock('divider'),
        createBlock('text', {
          content: 'Puedes añadir contexto adicional, declaraciones o próximos pasos.',
        }),
        createBlock('button', { label: 'Más información', url: 'https://...', align: 'left' }),
      ];
    } else {
      suggestedSubject = 'Nueva campaña destacada';
      blocks = [
        createBlock('heading', { content: 'Descubre la nueva campaña', align: 'center' }),
        createBlock('text', {
          content: 'Presenta la propuesta de valor en dos o tres líneas.',
          align: 'center',
        }),
        createBlock('image', {
          url: 'https://...',
          content: 'Imagen principal de campaña',
          align: 'center',
        }),
        createBlock('button', { label: 'Acceder ahora', url: 'https://...', align: 'center' }),
      ];
    }
    setNewsletterBlocks(blocks);
    setSelectedNewsletterBlockId(blocks[0]?.id || null);
    setNewsletterComposerMode('builder');
    setCampaignForm((s) => ({
      ...s,
      subject: s.subject.trim() ? s.subject : suggestedSubject,
      html: renderNewsletterBlocksToHtml(blocks),
    }));
    setMessage('Preset cargado. Puedes editar y guardar como plantilla.');
  }

  function applyNewsletterTemplate(template: NewsletterTemplate) {
    setSelectedTemplateId(template.id);
    setTemplateName(template.name || '');
    setCampaignForm((s) => ({
      ...s,
      subject: template.subject || '',
      html: template.contentHtml || '',
    }));
    const blocks = normalizeNewsletterBlocks(template.blocksJson);
    setNewsletterBlocks(blocks);
    if (blocks.length > 0) {
      setNewsletterComposerMode('builder');
    }
  }

  async function saveTemplateFromComposer() {
    if (mode !== 'newsletter') return;
    const name = templateName.trim();
    if (!name) {
      throw new Error('Pon un nombre a la plantilla');
    }
    const htmlFromBlocks = renderNewsletterBlocksToHtml(newsletterBlocks);
    const payload = {
      kind: 'NEWSLETTER',
      name,
      subject: campaignForm.subject.trim(),
      contentHtml: htmlFromBlocks || campaignForm.html.trim(),
      blocksJson: newsletterBlocks,
      metadata: {
        composerMode: newsletterComposerMode,
      },
    };
    const endpoint = selectedTemplateId
      ? `/api/admin/newsletter/templates/${selectedTemplateId}`
      : '/api/admin/newsletter/templates';
    const method = selectedTemplateId ? 'PUT' : 'POST';
    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error guardando plantilla');
    }
    setMessage(selectedTemplateId ? 'Plantilla actualizada.' : 'Plantilla guardada.');
    if (!selectedTemplateId) {
      setSelectedTemplateId(Number(data?.id || null) || null);
    }
    await loadData();
  }

  async function deleteSelectedTemplate() {
    if (!selectedTemplateId) return;
    const ok = window.confirm('¿Eliminar esta plantilla?');
    if (!ok) return;
    const res = await fetch(`/api/admin/newsletter/templates/${selectedTemplateId}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || 'Error eliminando plantilla');
    }
    setSelectedTemplateId(null);
    setTemplateName('');
    setNewsletterBlocks([]);
    setMessage('Plantilla eliminada.');
    await loadData();
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
      if (mode === 'newsletter' && newsletterComposerMode === 'builder') {
        finalHtml = renderNewsletterBlocksToHtml(newsletterBlocks).trim();
        if (finalHtml) {
          setCampaignForm((s) => ({ ...s, html: finalHtml }));
        }
      }
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
      setWebGallerySelection([]);
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

      const firstPhoto = uploadedPhotoUrls[0];
      const selectedForWeb = webGallerySelection.filter((u) => uploadedPhotoUrls.includes(u));
      const galleryForWeb = selectedForWeb
        .filter((u) => u !== firstPhoto)
        .slice(0, 3);

      const res = await fetch('/api/admin/newsletter/publish-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignForm.subject.trim(),
          html: finalHtml,
          kind: webContentKind,
          puebloSlug: campaignForm.puebloSlug.trim() || undefined,
          coverUrl: firstPhoto || undefined,
          galleryUrls: galleryForWeb.length > 0 ? galleryForWeb : undefined,
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

  const selectedNewsletterBlock =
    newsletterBlocks.find((b) => b.id === selectedNewsletterBlockId) || null;

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
            <div className="space-y-3">
              <label className="text-sm">
                Origen newsletter (opcional)
                <input
                  value={campaignForm.source}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, source: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                  placeholder="legacy_web_users_import, tienda, web..."
                />
              </label>

              <div className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Constructor de newsletter (MVP tipo MDirector)</p>
                  <button
                    type="button"
                    onClick={() => setNewsletterComposerMode('builder')}
                    className={`rounded-md border px-3 py-1 text-xs ${
                      newsletterComposerMode === 'builder' ? 'bg-muted font-semibold' : ''
                    }`}
                  >
                    Constructor
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsletterComposerMode('editor')}
                    className={`rounded-md border px-3 py-1 text-xs ${
                      newsletterComposerMode === 'editor' ? 'bg-muted font-semibold' : ''
                    }`}
                  >
                    HTML/Editor clásico
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
                  <select
                    value={selectedTemplateId ?? ''}
                    onChange={(e) => {
                      const id = Number(e.target.value || 0);
                      if (!id) {
                        setSelectedTemplateId(null);
                        return;
                      }
                      const template = newsletterTemplates.find((t) => t.id === id);
                      if (template) applyNewsletterTemplate(template);
                    }}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">Selecciona plantilla guardada</option>
                    {newsletterTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(null);
                      setTemplateName('');
                      setNewsletterBlocks([]);
                      setCampaignForm((s) => ({ ...s, html: '' }));
                    }}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                  >
                    Nueva
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setMessage(null);
                      setTemplateSaving(true);
                      try {
                        await deleteSelectedTemplate();
                      } catch (e: unknown) {
                        setError(getErrorMessage(e, 'Error eliminando plantilla'));
                      } finally {
                        setTemplateSaving(false);
                      }
                    }}
                    disabled={!selectedTemplateId || templateSaving}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="rounded-md border border-border px-3 py-2 text-sm"
                    placeholder="Nombre de plantilla"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      setError(null);
                      setMessage(null);
                      setTemplateSaving(true);
                      try {
                        await saveTemplateFromComposer();
                      } catch (e: unknown) {
                        setError(getErrorMessage(e, 'Error guardando plantilla'));
                      } finally {
                        setTemplateSaving(false);
                      }
                    }}
                    disabled={templateSaving}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium disabled:opacity-50"
                  >
                    {templateSaving ? 'Guardando...' : selectedTemplateId ? 'Actualizar plantilla' : 'Guardar plantilla'}
                  </button>
                </div>

                {newsletterComposerMode === 'builder' ? (
                  <div className="space-y-3 rounded-md border border-dashed border-border p-3">
                    <div className="grid gap-3 xl:grid-cols-[260px_1fr]">
                      <aside className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Presets</p>
                          <div className="mt-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => applyNewsletterPreset('boletin')}
                              className="w-full rounded-md border bg-background px-2 py-2 text-left text-xs"
                            >
                              Boletín mensual
                            </button>
                            <button
                              type="button"
                              onClick={() => applyNewsletterPreset('nota')}
                              className="w-full rounded-md border bg-background px-2 py-2 text-left text-xs"
                            >
                              Nota informativa
                            </button>
                            <button
                              type="button"
                              onClick={() => applyNewsletterPreset('promo')}
                              className="w-full rounded-md border bg-background px-2 py-2 text-left text-xs"
                            >
                              Promo con CTA
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Bloques</p>
                          <div className="mt-2 grid gap-2">
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('heading');
                                e.dataTransfer.setData('text/newsletter-block-type', 'heading');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('heading')}
                              className="rounded border bg-background px-2 py-1.5 text-xs"
                            >
                              + Titular
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('text');
                                e.dataTransfer.setData('text/newsletter-block-type', 'text');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('text')}
                              className="rounded border bg-background px-2 py-1.5 text-xs"
                            >
                              + Texto
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('image');
                                e.dataTransfer.setData('text/newsletter-block-type', 'image');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('image')}
                              className="rounded border bg-background px-2 py-1.5 text-xs"
                            >
                              + Imagen
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('button');
                                e.dataTransfer.setData('text/newsletter-block-type', 'button');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('button')}
                              className="rounded border bg-background px-2 py-1.5 text-xs"
                            >
                              + Botón
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('divider');
                                e.dataTransfer.setData('text/newsletter-block-type', 'divider');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('divider')}
                              className="rounded border bg-background px-2 py-1.5 text-xs"
                            >
                              + Separador
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCampaignForm((s) => ({
                              ...s,
                              html: renderNewsletterBlocksToHtml(newsletterBlocks),
                            }))
                          }
                          className="w-full rounded border border-primary bg-background px-2 py-2 text-xs font-semibold text-primary"
                        >
                          Sincronizar HTML
                        </button>
                        <p className="text-[11px] text-muted-foreground">
                          Bloques: {newsletterBlocks.length} {selectedNewsletterBlockId ? '· bloque seleccionado' : ''}
                        </p>
                        {reorderPickSourceId ? (
                          <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
                            Modo mover activo: pulsa <strong>Soltar aquí</strong> en el bloque destino.
                          </p>
                        ) : null}
                      </aside>

                      <div className="space-y-3">
                        <div
                          className="rounded-md border border-border bg-background p-3"
                          onDragOver={(e) => {
                            if (!draggingPaletteType) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'copy';
                          }}
                          onDrop={(e) => {
                            if (!draggingPaletteType) return;
                            e.preventDefault();
                            addNewsletterBlock(draggingPaletteType);
                            setDraggingPaletteType(null);
                          }}
                        >
                          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Lienzo de bloques</p>
                          {newsletterBlocks.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Aún no hay bloques. Añade bloques desde la columna izquierda para empezar.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {newsletterBlocks.map((block, idx) => (
                                <div
                                  key={block.id}
                                  data-newsletter-block-id={block.id}
                                  onClick={() => setSelectedNewsletterBlockId(block.id)}
                                  className={`space-y-2 rounded-md border p-2 transition ${
                                    selectedNewsletterBlockId === block.id
                                      ? 'border-primary bg-primary/5'
                                        : 'border-border'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="inline-flex items-center gap-2">
                                      <span
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setReorderPickSourceId((prev) =>
                                            prev === block.id ? null : block.id,
                                          );
                                          setSelectedNewsletterBlockId(block.id);
                                        }}
                                        className="cursor-pointer select-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                      >
                                        {reorderPickSourceId === block.id ? 'Seleccionado' : 'Mover'}
                                      </span>
                                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                                        {idx + 1}. {block.type}
                                      </span>
                                    </div>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        onClick={() => moveNewsletterBlock(block.id, -1)}
                                        className="rounded border px-2 py-1 text-xs"
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveNewsletterBlock(block.id, 1)}
                                        className="rounded border px-2 py-1 text-xs"
                                      >
                                        ↓
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => duplicateNewsletterBlock(block.id)}
                                        className="rounded border px-2 py-1 text-xs"
                                      >
                                        Duplicar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeNewsletterBlock(block.id)}
                                        className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                                      >
                                        Quitar
                                      </button>
                                      {reorderPickSourceId &&
                                      reorderPickSourceId !== block.id ? (
                                        <button
                                          type="button"
                                          onClick={() => moveBlockToTarget(block.id)}
                                          className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900"
                                        >
                                          Soltar aquí
                                        </button>
                                      ) : null}
                                    </div>
                                  </div>

                                  {block.type !== 'divider' ? (
                                    <div className="rounded border border-dashed border-border bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                                      {block.type === 'button'
                                        ? `${block.label || 'Botón'} -> ${block.url || 'sin URL'}`
                                        : block.type === 'image'
                                          ? `Imagen: ${block.url || 'sin URL'}`
                                          : block.content || 'Bloque sin contenido'}
                                    </div>
                                  ) : (
                                    <div className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                      Separador horizontal
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-md border border-border bg-background p-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                            Inspector de bloque
                          </p>
                          {selectedNewsletterBlock ? (
                            <div className="grid gap-2 md:grid-cols-2">
                              <label className="text-xs text-muted-foreground">
                                Tipo
                                <input
                                  value={selectedNewsletterBlock.type}
                                  readOnly
                                  className="mt-1 w-full rounded-md border border-border bg-muted px-2 py-1 text-sm"
                                />
                              </label>

                              <label className="text-xs text-muted-foreground">
                                Alineación
                                <select
                                  value={selectedNewsletterBlock.align || 'left'}
                                  onChange={(e) =>
                                    updateSelectedNewsletterBlock({
                                      align:
                                        (e.target.value as 'left' | 'center' | 'right') || 'left',
                                    })
                                  }
                                  className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                >
                                  <option value="left">Izquierda</option>
                                  <option value="center">Centro</option>
                                  <option value="right">Derecha</option>
                                </select>
                              </label>

                              {(selectedNewsletterBlock.type === 'heading' ||
                                selectedNewsletterBlock.type === 'text' ||
                                selectedNewsletterBlock.type === 'image') && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  {selectedNewsletterBlock.type === 'image'
                                    ? 'Texto alt'
                                    : 'Contenido'}
                                  <textarea
                                    rows={selectedNewsletterBlock.type === 'text' ? 4 : 2}
                                    value={selectedNewsletterBlock.content || ''}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({
                                        content: e.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                  />
                                </label>
                              )}

                              {(selectedNewsletterBlock.type === 'image' ||
                                selectedNewsletterBlock.type === 'button') && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  URL
                                  <input
                                    value={selectedNewsletterBlock.url || ''}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({ url: e.target.value })
                                    }
                                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    placeholder="https://..."
                                  />
                                </label>
                              )}

                              {selectedNewsletterBlock.type === 'image' && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  Subir imagen
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingNewsletterImage}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      await uploadNewsletterImageForBlock(
                                        file,
                                        selectedNewsletterBlock.id,
                                      );
                                      e.currentTarget.value = '';
                                    }}
                                    className="mt-1 block w-full text-sm"
                                  />
                                  <span className="mt-1 block text-[11px] text-muted-foreground">
                                    {uploadingNewsletterImage
                                      ? 'Subiendo imagen...'
                                      : 'Puedes subir archivo desde tu ordenador (sin pegar URL).'}
                                  </span>
                                </label>
                              )}

                              {selectedNewsletterBlock.type === 'button' && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  Texto del botón
                                  <input
                                    value={selectedNewsletterBlock.label || ''}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({
                                        label: e.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                  />
                                </label>
                              )}

                              <label className="text-xs text-muted-foreground">
                                Fondo
                                <input
                                  type="color"
                                  value={selectedNewsletterBlock.backgroundColor || '#ffffff'}
                                  onChange={(e) =>
                                    updateSelectedNewsletterBlock({
                                      backgroundColor: e.target.value,
                                    })
                                  }
                                  className="mt-1 h-9 w-full rounded-md border border-border p-1"
                                />
                              </label>
                              <label className="text-xs text-muted-foreground">
                                Color texto
                                <input
                                  type="color"
                                  value={selectedNewsletterBlock.textColor || '#111111'}
                                  onChange={(e) =>
                                    updateSelectedNewsletterBlock({
                                      textColor: e.target.value,
                                    })
                                  }
                                  className="mt-1 h-9 w-full rounded-md border border-border p-1"
                                />
                              </label>
                              <label className="text-xs text-muted-foreground">
                                Padding vertical
                                <input
                                  type="number"
                                  min={0}
                                  max={40}
                                  value={selectedNewsletterBlock.paddingY ?? 10}
                                  onChange={(e) =>
                                    updateSelectedNewsletterBlock({
                                      paddingY: Math.max(
                                        0,
                                        Math.min(40, Number(e.target.value || 0)),
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                />
                              </label>
                              <label className="text-xs text-muted-foreground">
                                Radio borde
                                <input
                                  type="number"
                                  min={0}
                                  max={30}
                                  value={selectedNewsletterBlock.borderRadius ?? 8}
                                  onChange={(e) =>
                                    updateSelectedNewsletterBlock({
                                      borderRadius: Math.max(
                                        0,
                                        Math.min(30, Number(e.target.value || 0)),
                                      ),
                                    })
                                  }
                                  className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                />
                              </label>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Selecciona un bloque en el lienzo para editar sus propiedades.
                            </p>
                          )}
                        </div>

                        <div className="rounded-md border border-border bg-background p-3">
                          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                            Vista previa newsletter
                          </p>
                          <div
                            className="mx-auto max-w-[700px] rounded-md border border-border bg-white p-4 shadow-sm"
                            dangerouslySetInnerHTML={{
                              __html:
                                renderNewsletterBlocksToHtml(newsletterBlocks) ||
                                '<p>Sin bloques todavía.</p>',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {(mode !== 'press' || pressSendMode === 'editor') &&
          (mode !== 'newsletter' || newsletterComposerMode === 'editor') ? (
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

              {pressPhotoUrls.length > 0 ? (
                <div className="space-y-2 rounded-md border border-border p-3">
                  <p className="text-sm font-medium">Fotos para la web</p>
                  <p className="text-xs text-muted-foreground">
                    La foto 1 será la principal (hero). Opcionalmente puedes seleccionar hasta 3 fotos para galería web.
                  </p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    {pressPhotoUrls.map((url, idx) => {
                      const checked = webGallerySelection.includes(url);
                      const lockedMain = idx === 0;
                      return (
                        <label
                          key={`web-select-${url}`}
                          className={`space-y-1 rounded border p-1 text-xs ${
                            lockedMain ? 'border-amber-300 bg-amber-50' : 'border-border'
                          }`}
                        >
                          <img src={url} alt="Foto para web" className="h-20 w-full rounded object-cover" />
                          {lockedMain ? (
                            <span className="block text-[11px] font-semibold text-amber-900">Principal (hero)</span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setWebGallerySelection((prev) =>
                                      prev.includes(url) ? prev : [...prev, url].slice(0, 3),
                                    );
                                  } else {
                                    setWebGallerySelection((prev) => prev.filter((x) => x !== url));
                                  }
                                }}
                              />
                              Incluir en galería
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}

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
