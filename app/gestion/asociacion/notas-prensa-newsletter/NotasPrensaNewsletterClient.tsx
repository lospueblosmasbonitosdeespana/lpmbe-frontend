'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';

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
type NewsletterBlockType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'iconButton'
  | 'columns2'
  | 'columns3'
  | 'gallery'
  | 'figure'
  | 'imgText'
  | 'socialLinks'
  | 'countdown'
  | 'divider';
type NewsletterBlock = {
  id: string;
  type: NewsletterBlockType;
  content?: string;
  url?: string;
  iconUrl?: string;
  label?: string;
  colLeft?: string;
  colRight?: string;
  colCenter?: string;
  caption?: string;
  imageUrls?: string[];
  socialFacebook?: string;
  socialTwitter?: string;
  socialInstagram?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
  countdownDate?: string;
  countdownLabel?: string;
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
  isDefault?: boolean;
  metadata?: {
    category?: string;
    description?: string;
    thumbnailUrl?: string;
    /** Clave para filtrar en la galería (prensa, articulo, evento, cartel_pueblo, tema_gastronomia, …) */
    theme?: string;
    themeLabel?: string;
  };
  updatedAt?: string;
};

type NewsletterDraftPayload = {
  version: number;
  savedAt: string;
  mode: Mode;
  campaignForm?: Partial<{
    kind: 'PRESS' | 'NEWSLETTER';
    subject: string;
    html: string;
    includeNational: boolean;
    ccaa: string;
    provincia: string;
    puebloSlug: string;
    source: string;
  }>;
  pressSendMode?: PressSendMode;
  editorMode?: 'visual' | 'html';
  newsletterComposerMode?: 'editor' | 'builder';
  selectedCcaas?: string[];
  selectedProvincias?: string[];
  pressPdfUrl?: string;
  pressPhotoUrls?: string[];
  insertedPhotoUrls?: string[];
  webGallerySelection?: string[];
  webContentKind?: 'NOTICIA' | 'ARTICULO';
  newsletterBlocks?: unknown;
  templateName?: string;
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
            : type === 'figure'
              ? ''
              : type === 'imgText'
                ? 'Texto al lado de la imagen'
                : '',
    label: type === 'button' ? 'Leer más' : type === 'iconButton' ? 'Icono' : '',
    url:
      type === 'image' || type === 'figure' || type === 'imgText'
        ? 'https://...'
        : type === 'button'
          ? 'https://...'
          : '',
    iconUrl: type === 'iconButton' ? 'https://...' : '',
    caption: type === 'figure' ? 'Pie de imagen' : '',
    colLeft: type === 'columns2' || type === 'columns3' ? 'Columna izquierda' : '',
    colRight: type === 'columns2' || type === 'columns3' ? 'Columna derecha' : '',
    colCenter: type === 'columns3' ? 'Columna central' : '',
    imageUrls: type === 'gallery' ? [] : undefined,
    socialFacebook: type === 'socialLinks' ? 'https://facebook.com/lospueblosmasbonitosdeespana' : '',
    socialTwitter: type === 'socialLinks' ? 'https://twitter.com/pueblosbonitos' : '',
    socialInstagram: type === 'socialLinks' ? 'https://instagram.com/lospueblosmasbonitosdeespana' : '',
    socialLinkedin: type === 'socialLinks' ? '' : '',
    socialYoutube: type === 'socialLinks' ? '' : '',
    countdownDate: type === 'countdown' ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) : '',
    countdownLabel: type === 'countdown' ? 'No te lo pierdas' : '',
    align: type === 'socialLinks' || type === 'gallery' || type === 'countdown' ? 'center' : 'left',
    backgroundColor: type === 'countdown' ? '#1a1a2e' : '#ffffff',
    textColor: type === 'countdown' ? '#ffffff' : '#111111',
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

/** Clave de temática para filtros (plantillas antiguas sin `theme` se infieren de `category`). */
function getTemplateThemeKey(t: NewsletterTemplate): string {
  const m = t.metadata;
  if (m?.theme) return m.theme;
  if (m?.category === 'prensa') return 'prensa';
  if (m?.category === 'articulo') return 'articulo';
  if (m?.category === 'newsletter') return 'newsletter';
  return 'otros';
}

function getTemplateThemeLabel(t: NewsletterTemplate): string | undefined {
  const m = t.metadata;
  if (m?.themeLabel) return m.themeLabel;
  const k = getTemplateThemeKey(t);
  const map: Record<string, string> = {
    prensa: 'Notas de prensa',
    articulo: 'Artículos',
    newsletter: 'Newsletter general',
    evento: 'Eventos',
    cartel_pueblo: 'Carteles pueblos',
    tema_gastronomia: 'Gastronomía',
    tema_naturaleza: 'Naturaleza',
    tema_cultura: 'Cultura',
    tema_familia: 'En familia',
    tema_petfriendly: 'Pet friendly',
    otros: 'Otros',
  };
  return map[k];
}

const TEMPLATE_THEME_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todas las temáticas' },
  { value: 'newsletter', label: 'Newsletter general' },
  { value: 'prensa', label: 'Notas de prensa' },
  { value: 'articulo', label: 'Artículos' },
  { value: 'evento', label: 'Eventos' },
  { value: 'cartel_pueblo', label: 'Carteles pueblos' },
  { value: 'tema_gastronomia', label: 'Pág. Gastronomía' },
  { value: 'tema_naturaleza', label: 'Pág. Naturaleza' },
  { value: 'tema_cultura', label: 'Pág. Cultura' },
  { value: 'tema_familia', label: 'Pág. En familia' },
  { value: 'tema_petfriendly', label: 'Pág. Pet friendly' },
];

function normalizeNewsletterBlocks(value: unknown): NewsletterBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const b = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const typeRaw = String(b.type || '').trim().toLowerCase();
      const typeMap: Record<string, NewsletterBlockType> = {
        heading: 'heading',
        text: 'text',
        image: 'image',
        button: 'button',
        iconbutton: 'iconButton',
        icon_button: 'iconButton',
        'icon-button': 'iconButton',
        columns2: 'columns2',
        '2columns': 'columns2',
        'two-columns': 'columns2',
        columns3: 'columns3',
        '3columns': 'columns3',
        'three-columns': 'columns3',
        gallery: 'gallery',
        galeria: 'gallery',
        figure: 'figure',
        figura: 'figure',
        imgtext: 'imgText',
        img_text: 'imgText',
        'img-text': 'imgText',
        imgtexto: 'imgText',
        sociallinks: 'socialLinks',
        social_links: 'socialLinks',
        'social-links': 'socialLinks',
        social: 'socialLinks',
        countdown: 'countdown',
        timer: 'countdown',
        temporizador: 'countdown',
        divider: 'divider',
      };
      const type: NewsletterBlockType = typeMap[typeRaw] ?? 'text';
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
        iconUrl: String(b.iconUrl || ''),
        label: String(b.label || ''),
        colLeft: String(b.colLeft || ''),
        colRight: String(b.colRight || ''),
        colCenter: String(b.colCenter || ''),
        caption: String(b.caption || ''),
        imageUrls: Array.isArray(b.imageUrls)
          ? (b.imageUrls as unknown[]).map((u) => String(u))
          : undefined,
        socialFacebook: String(b.socialFacebook || ''),
        socialTwitter: String(b.socialTwitter || ''),
        socialInstagram: String(b.socialInstagram || ''),
        socialLinkedin: String(b.socialLinkedin || ''),
        socialYoutube: String(b.socialYoutube || ''),
        countdownDate: String(b.countdownDate || ''),
        countdownLabel: String(b.countdownLabel || ''),
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
        const raw = block.content || 'Título';
        const isHtml = raw.includes('<');
        return `<div style="${boxStyle}"><div style="margin:0;font-size:26px;line-height:1.25;text-align:${align};color:${textColor};">${isHtml ? raw : escapeHtml(raw)}</div></div>`;
      }
      if (block.type === 'text') {
        const raw = block.content || '';
        const isHtml = raw.includes('<');
        return `<div style="${boxStyle}"><div style="margin:0;font-size:16px;line-height:1.6;text-align:${align};color:${textColor};">${isHtml ? raw : escapeHtml(raw).replace(/\n/g, '<br/>')}</div></div>`;
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
      if (block.type === 'iconButton') {
        const url = String(block.url || '').trim();
        const iconUrl = String(block.iconUrl || '').trim();
        const label = String(block.label || 'Icono').trim();
        if (!url || !iconUrl) return '';
        return `<div style="${boxStyle}"><p style="margin:0;text-align:${align};"><a href="${escapeHtml(
          url,
        )}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(
          label,
        )}" style="display:inline-flex;align-items:center;justify-content:center;width:62px;height:62px;background:#173f2b;border-radius:12px;text-decoration:none;"><img src="${escapeHtml(
          iconUrl,
        )}" alt="${escapeHtml(label)}" style="width:30px;height:30px;object-fit:contain;" /></a></p></div>`;
      }
      if (block.type === 'columns2') {
        const left = escapeHtml(block.colLeft || '').replace(/\n/g, '<br/>');
        const right = escapeHtml(block.colRight || '').replace(/\n/g, '<br/>');
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><td width="50%" valign="top" style="padding:0 8px 0 0;font-size:15px;line-height:1.6;color:${textColor};">${left}</td><td width="50%" valign="top" style="padding:0 0 0 8px;font-size:15px;line-height:1.6;color:${textColor};">${right}</td></tr></table></div>`;
      }
      if (block.type === 'columns3') {
        const left = escapeHtml(block.colLeft || '').replace(/\n/g, '<br/>');
        const center = escapeHtml(block.colCenter || '').replace(/\n/g, '<br/>');
        const right = escapeHtml(block.colRight || '').replace(/\n/g, '<br/>');
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><td width="33%" valign="top" style="padding:0 6px 0 0;font-size:15px;line-height:1.6;color:${textColor};">${left}</td><td width="34%" valign="top" style="padding:0 6px;font-size:15px;line-height:1.6;color:${textColor};">${center}</td><td width="33%" valign="top" style="padding:0 0 0 6px;font-size:15px;line-height:1.6;color:${textColor};">${right}</td></tr></table></div>`;
      }
      if (block.type === 'gallery') {
        const urls = (block.imageUrls || []).filter((u) => u.trim());
        if (!urls.length) return `<div style="${boxStyle}"><p style="color:#999;text-align:center;">Galería sin imágenes</p></div>`;
        const imgs = urls
          .map(
            (u) =>
              `<td style="padding:4px;"><img src="${escapeHtml(u)}" alt="" style="width:100%;height:auto;border-radius:6px;display:block;" /></td>`,
          )
          .join('');
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr>${imgs}</tr></table></div>`;
      }
      if (block.type === 'figure') {
        const url = String(block.url || '').trim();
        const cap = String(block.caption || '').trim();
        if (!url) return '';
        return `<div style="${boxStyle}"><figure style="margin:0;text-align:${align};"><img src="${escapeHtml(url)}" alt="${escapeHtml(cap)}" style="max-width:100%;height:auto;border-radius:10px;" />${cap ? `<figcaption style="margin-top:6px;font-size:13px;color:#666;text-align:center;">${escapeHtml(cap)}</figcaption>` : ''}</figure></div>`;
      }
      if (block.type === 'imgText') {
        const url = String(block.url || '').trim();
        const raw = block.content || '';
        const isHtml = raw.includes('<');
        const text = isHtml ? raw : escapeHtml(raw).replace(/\n/g, '<br/>');
        if (!url) return `<div style="${boxStyle}"><div style="margin:0;font-size:16px;line-height:1.6;color:${textColor};">${text}</div></div>`;
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><td width="40%" valign="top" style="padding:0 12px 0 0;"><img src="${escapeHtml(url)}" alt="" style="width:100%;height:auto;border-radius:8px;display:block;" /></td><td width="60%" valign="top" style="font-size:15px;line-height:1.6;color:${textColor};">${text}</td></tr></table></div>`;
      }
      if (block.type === 'socialLinks') {
        const links: { url: string; label: string; color: string }[] = [];
        if (block.socialFacebook) links.push({ url: block.socialFacebook, label: 'Facebook', color: '#1877F2' });
        if (block.socialTwitter) links.push({ url: block.socialTwitter, label: 'X / Twitter', color: '#000' });
        if (block.socialInstagram) links.push({ url: block.socialInstagram, label: 'Instagram', color: '#E4405F' });
        if (block.socialLinkedin) links.push({ url: block.socialLinkedin, label: 'LinkedIn', color: '#0A66C2' });
        if (block.socialYoutube) links.push({ url: block.socialYoutube, label: 'YouTube', color: '#FF0000' });
        if (!links.length) return '';
        const items = links
          .map(
            (l) =>
              `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:0 6px;padding:8px 14px;background:${l.color};color:#fff;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">${escapeHtml(l.label)}</a>`,
          )
          .join('');
        return `<div style="${boxStyle}"><p style="margin:0;text-align:${align};">${items}</p></div>`;
      }
      if (block.type === 'countdown') {
        const target = block.countdownDate ? new Date(block.countdownDate) : new Date();
        const now = new Date();
        const diff = Math.max(0, target.getTime() - now.getTime());
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const cellStyle = 'display:inline-block;width:80px;text-align:center;margin:0 6px;';
        const numStyle = 'font-size:42px;font-weight:800;line-height:1.1;letter-spacing:1px;';
        const lblStyle = 'font-size:11px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.8;margin-top:4px;';
        const lbl = block.countdownLabel ? `<p style="margin:0 0 14px 0;font-size:16px;font-weight:600;text-align:center;">${escapeHtml(block.countdownLabel)}</p>` : '';
        return `<div style="${boxStyle}background:#1a1a2e;color:#fff;padding:28px 14px;border-radius:${borderRadius}px;text-align:center;">${lbl}<div style="display:inline-block;"><span style="${cellStyle}"><span style="${numStyle}">${pad(days)}</span><br/><span style="${lblStyle}">Días</span></span><span style="font-size:36px;font-weight:300;opacity:0.5;vertical-align:top;line-height:1.2;">:</span><span style="${cellStyle}"><span style="${numStyle}">${pad(hours)}</span><br/><span style="${lblStyle}">Horas</span></span><span style="font-size:36px;font-weight:300;opacity:0.5;vertical-align:top;line-height:1.2;">:</span><span style="${cellStyle}"><span style="${numStyle}">${pad(minutes)}</span><br/><span style="${lblStyle}">Minutos</span></span><span style="font-size:36px;font-weight:300;opacity:0.5;vertical-align:top;line-height:1.2;">:</span><span style="${cellStyle}"><span style="${numStyle}">${pad(seconds)}</span><br/><span style="${lblStyle}">Segundos</span></span></div></div>`;
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

function BlockRichEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const blockEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || 'Escribe aquí...' }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class:
          'min-h-[120px] rounded-b-md border border-t-0 border-border bg-background px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!blockEditor) return;
    if (blockEditor.getHTML() !== content && content !== undefined) {
      blockEditor.commands.setContent(content || '<p></p>', { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!blockEditor) return null;

  const btnCls = (active: boolean) =>
    `px-1.5 py-1 rounded text-xs font-semibold transition ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`;

  function promptLink() {
    if (!blockEditor) return;
    const prev = blockEditor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace', prev || 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (!trimmed) {
      blockEditor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    blockEditor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }

  function promptColor() {
    if (!blockEditor) return;
    const color = window.prompt('Color de texto (hex)', '#000000');
    if (!color) return;
    blockEditor.chain().focus().setColor(color.trim()).run();
  }

  function promptHighlight() {
    if (!blockEditor) return;
    const color = window.prompt('Color de resaltado (hex)', '#ffe066');
    if (!color) return;
    blockEditor.chain().focus().toggleHighlight({ color: color.trim() }).run();
  }

  return (
    <div className="md:col-span-2">
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-border bg-muted/50 px-1.5 py-1">
        <button type="button" onClick={() => blockEditor.chain().focus().toggleBold().run()} className={btnCls(blockEditor.isActive('bold'))} title="Negrita">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleItalic().run()} className={btnCls(blockEditor.isActive('italic'))} title="Cursiva">
          <em>I</em>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleUnderline().run()} className={btnCls(blockEditor.isActive('underline'))} title="Subrayado">
          <span className="underline">U</span>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleStrike().run()} className={btnCls(blockEditor.isActive('strike'))} title="Tachado">
          <span className="line-through">S</span>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => blockEditor.chain().focus().toggleSubscript().run()} className={btnCls(blockEditor.isActive('subscript'))} title="Subíndice">
          x<sub>2</sub>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleSuperscript().run()} className={btnCls(blockEditor.isActive('superscript'))} title="Superíndice">
          x<sup>2</sup>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => blockEditor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnCls(blockEditor.isActive('heading', { level: 1 }))} title="Título 1">
          H1
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(blockEditor.isActive('heading', { level: 2 }))} title="Título 2">
          H2
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(blockEditor.isActive('heading', { level: 3 }))} title="Título 3">
          H3
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => blockEditor.chain().focus().toggleBulletList().run()} className={btnCls(blockEditor.isActive('bulletList'))} title="Lista">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><circle cx="3" cy="5" r="1.5" /><rect x="7" y="4" width="11" height="2" rx="1" /><circle cx="3" cy="10" r="1.5" /><rect x="7" y="9" width="11" height="2" rx="1" /><circle cx="3" cy="15" r="1.5" /><rect x="7" y="14" width="11" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().toggleOrderedList().run()} className={btnCls(blockEditor.isActive('orderedList'))} title="Lista numerada">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><text x="1" y="7" fontSize="6" fontWeight="bold">1</text><rect x="7" y="4" width="11" height="2" rx="1" /><text x="1" y="12" fontSize="6" fontWeight="bold">2</text><rect x="7" y="9" width="11" height="2" rx="1" /><text x="1" y="17" fontSize="6" fontWeight="bold">3</text><rect x="7" y="14" width="11" height="2" rx="1" /></svg>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => blockEditor.chain().focus().setTextAlign('left').run()} className={btnCls(blockEditor.isActive({ textAlign: 'left' }))} title="Alinear izquierda">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="2" y="9" width="10" height="2" rx="1" /><rect x="2" y="14" width="14" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().setTextAlign('center').run()} className={btnCls(blockEditor.isActive({ textAlign: 'center' }))} title="Centrar">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="5" y="9" width="10" height="2" rx="1" /><rect x="3" y="14" width="14" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().setTextAlign('right').run()} className={btnCls(blockEditor.isActive({ textAlign: 'right' }))} title="Alinear derecha">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="8" y="9" width="10" height="2" rx="1" /><rect x="4" y="14" width="14" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().setTextAlign('justify').run()} className={btnCls(blockEditor.isActive({ textAlign: 'justify' }))} title="Justificar">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="2" y="9" width="16" height="2" rx="1" /><rect x="2" y="14" width="16" height="2" rx="1" /></svg>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={promptLink} className={btnCls(blockEditor.isActive('link'))} title="Enlace">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M8.5 11.5a3.5 3.5 0 004.95 0l2.12-2.12a3.5 3.5 0 00-4.95-4.95L9.5 5.55" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M11.5 8.5a3.5 3.5 0 00-4.95 0l-2.12 2.12a3.5 3.5 0 004.95 4.95l1.12-1.12" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </button>
        <button type="button" onClick={promptColor} className={btnCls(false)} title="Color de texto">
          <span className="flex flex-col items-center leading-none"><span className="text-[11px] font-bold">A</span><span className="mt-px h-1 w-3 rounded-sm bg-red-500" /></span>
        </button>
        <button type="button" onClick={promptHighlight} className={btnCls(blockEditor.isActive('highlight'))} title="Resaltar">
          <span className="flex flex-col items-center leading-none"><span className="rounded bg-yellow-200 px-0.5 text-[11px] font-bold">A</span></span>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => blockEditor.chain().focus().undo().run()} className={btnCls(false)} title="Deshacer">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M5 8l-3-3 3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 5h10a5 5 0 010 10H8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().redo().run()} className={btnCls(false)} title="Rehacer">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M15 8l3-3-3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M18 5H8a5 5 0 000 10h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
        <button type="button" onClick={() => blockEditor.chain().focus().clearNodes().unsetAllMarks().run()} className={btnCls(false)} title="Limpiar formato">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><text x="7" y="12" fontSize="8" fontWeight="bold" fill="currentColor">T</text></svg>
        </button>
      </div>
      <EditorContent editor={blockEditor} />
    </div>
  );
}

function renderPaletteIcon(type: NewsletterBlockType) {
  if (type === 'heading') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="3" y="5" width="18" height="3" rx="1.5" fill="currentColor" />
        <rect x="3" y="10.5" width="12" height="2.5" rx="1.25" fill="currentColor" opacity="0.85" />
        <rect x="3" y="15.5" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.65" />
      </svg>
    );
  }
  if (type === 'text') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="3" y="6" width="18" height="2.2" rx="1.1" fill="currentColor" />
        <rect x="3" y="10.2" width="18" height="2.2" rx="1.1" fill="currentColor" opacity="0.85" />
        <rect x="3" y="14.4" width="16" height="2.2" rx="1.1" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }
  if (type === 'image') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="9" cy="9" r="1.7" fill="currentColor" />
        <path d="M5.5 18l4.8-5 3.3 3.2 2.5-2.4 2.4 4.2z" fill="currentColor" opacity="0.85" />
      </svg>
    );
  }
  if (type === 'button') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="4" y="7" width="16" height="10" rx="3" fill="currentColor" />
        <rect x="8" y="11" width="8" height="2" rx="1" fill="#fff" />
      </svg>
    );
  }
  if (type === 'iconButton') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
        <circle cx="12" cy="12" r="3" fill="#fff" />
      </svg>
    );
  }
  if (type === 'columns2') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <rect x="5.2" y="7.2" width="5.8" height="9.6" rx="1.2" fill="currentColor" opacity="0.9" />
        <rect x="13" y="7.2" width="5.8" height="9.6" rx="1.2" fill="currentColor" opacity="0.65" />
      </svg>
    );
  }
  if (type === 'columns3') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <rect x="4.8" y="7.2" width="3.8" height="9.6" rx="1" fill="currentColor" opacity="0.9" />
        <rect x="10.1" y="7.2" width="3.8" height="9.6" rx="1" fill="currentColor" opacity="0.75" />
        <rect x="15.4" y="7.2" width="3.8" height="9.6" rx="1" fill="currentColor" opacity="0.6" />
      </svg>
    );
  }
  if (type === 'gallery') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="2" y="5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="13.5" y="5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.7" />
        <rect x="2" y="13.5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.6" />
        <rect x="13.5" y="13.5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.45" />
      </svg>
    );
  }
  if (type === 'figure') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <circle cx="9" cy="8" r="1.5" fill="currentColor" />
        <path d="M5.5 15l4.2-4.3 3 2.8 2.3-2.1 2.5 3.6z" fill="currentColor" opacity="0.8" />
        <rect x="5" y="19" width="14" height="2" rx="1" fill="currentColor" opacity="0.5" />
      </svg>
    );
  }
  if (type === 'imgText') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="2" y="5" width="9" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="6.5" cy="10" r="1.2" fill="currentColor" />
        <path d="M3.5 16l2.5-3 2 1.8 1.5-1.3 1.5 2.5z" fill="currentColor" opacity="0.7" />
        <rect x="13.5" y="6" width="8.5" height="2" rx="1" fill="currentColor" opacity="0.9" />
        <rect x="13.5" y="10" width="8.5" height="1.6" rx="0.8" fill="currentColor" opacity="0.7" />
        <rect x="13.5" y="13.2" width="7" height="1.6" rx="0.8" fill="currentColor" opacity="0.55" />
        <rect x="13.5" y="16.4" width="6" height="1.6" rx="0.8" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }
  if (type === 'socialLinks') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="2" y="8" width="6" height="8" rx="2" fill="#1877F2" />
        <rect x="9" y="8" width="6" height="8" rx="2" fill="#E4405F" />
        <rect x="16" y="8" width="6" height="8" rx="2" fill="#000" />
      </svg>
    );
  }
  if (type === 'countdown') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <circle cx="12" cy="13" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        <rect x="10" y="2" width="4" height="2.5" rx="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
      <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
  );
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
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [templateGalleryTab, setTemplateGalleryTab] = useState<'all' | 'predefined' | 'mine'>('all');
  const [templateThemeFilter, setTemplateThemeFilter] = useState('');
  const [templatePreviewHtml, setTemplatePreviewHtml] = useState<string | null>(null);
  const [newsletterBlocks, setNewsletterBlocks] = useState<NewsletterBlock[]>([]);
  const [selectedNewsletterBlockId, setSelectedNewsletterBlockId] = useState<string | null>(null);
  const [reorderPickSourceId, setReorderPickSourceId] = useState<string | null>(null);
  const [draggingPaletteType, setDraggingPaletteType] = useState<NewsletterBlockType | null>(null);
  const [uploadingNewsletterImage, setUploadingNewsletterImage] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [brandLogos, setBrandLogos] = useState<{ id: number; nombre: string; url: string; etiqueta?: string }[]>([]);
  const [showLogosPanel, setShowLogosPanel] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const newsletterImageInputRef = useRef<HTMLInputElement | null>(null);
  const newsletterIconInputRef = useRef<HTMLInputElement | null>(null);
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

  function getDraftStorageKey() {
    return `lpmbe-newsletter-draft-${mode}`;
  }

  function buildDraftPayload() {
    const htmlFromComposer =
      mode === 'newsletter' && newsletterComposerMode === 'builder'
        ? renderNewsletterBlocksToHtml(newsletterBlocks).trim()
        : mode === 'press' && pressSendMode === 'editor' && editorMode === 'visual' && editor
          ? editor.getHTML().trim()
          : campaignForm.html.trim();

    return {
      version: 1,
      savedAt: new Date().toISOString(),
      mode,
      campaignForm: {
        ...campaignForm,
        html: htmlFromComposer || campaignForm.html || '',
      },
      pressSendMode,
      editorMode,
      newsletterComposerMode,
      selectedCcaas,
      selectedProvincias,
      pressPdfUrl,
      pressPhotoUrls,
      insertedPhotoUrls,
      webGallerySelection,
      webContentKind,
      newsletterBlocks,
      templateName,
    };
  }

  function applyDraftPayload(payload: NewsletterDraftPayload) {
    if (!payload || typeof payload !== 'object') return;
    if (payload.campaignForm && typeof payload.campaignForm === 'object') {
      setCampaignForm((prev) => ({
        ...prev,
        ...payload.campaignForm,
        kind: mode === 'newsletter' ? 'NEWSLETTER' : 'PRESS',
      }));
    }
    if (payload.pressSendMode === 'editor' || payload.pressSendMode === 'pdf') {
      setPressSendMode(payload.pressSendMode);
    }
    if (payload.editorMode === 'visual' || payload.editorMode === 'html') {
      setEditorMode(payload.editorMode);
    }
    if (payload.newsletterComposerMode === 'editor' || payload.newsletterComposerMode === 'builder') {
      setNewsletterComposerMode(payload.newsletterComposerMode);
    }
    if (Array.isArray(payload.selectedCcaas)) setSelectedCcaas(payload.selectedCcaas.map(String));
    if (Array.isArray(payload.selectedProvincias)) {
      setSelectedProvincias(payload.selectedProvincias.map(String));
    }
    if (typeof payload.pressPdfUrl === 'string') setPressPdfUrl(payload.pressPdfUrl);
    if (Array.isArray(payload.pressPhotoUrls)) setPressPhotoUrls(payload.pressPhotoUrls.map(String));
    if (Array.isArray(payload.insertedPhotoUrls)) setInsertedPhotoUrls(payload.insertedPhotoUrls.map(String));
    if (Array.isArray(payload.webGallerySelection)) {
      setWebGallerySelection(payload.webGallerySelection.map(String));
    }
    if (payload.webContentKind === 'NOTICIA' || payload.webContentKind === 'ARTICULO') {
      setWebContentKind(payload.webContentKind);
    }
    if (Array.isArray(payload.newsletterBlocks)) {
      const blocks = normalizeNewsletterBlocks(payload.newsletterBlocks);
      setNewsletterBlocks(blocks);
      if (blocks.length > 0) {
        setSelectedNewsletterBlockId(blocks[0].id);
      }
    }
    if (typeof payload.templateName === 'string') setTemplateName(payload.templateName);
    if (typeof payload.savedAt === 'string') setDraftSavedAt(payload.savedAt);
  }

  function saveDraftToLocal() {
    if (typeof window === 'undefined') return;
    const key = getDraftStorageKey();
    const payload = buildDraftPayload();
    localStorage.setItem(key, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
    setHasStoredDraft(true);
    setMessage(`Borrador guardado (${new Date(payload.savedAt).toLocaleTimeString('es-ES')}).`);
  }

  function printCurrentContent() {
    const html =
      mode === 'newsletter' && newsletterComposerMode === 'builder'
        ? renderNewsletterBlocksToHtml(newsletterBlocks)
        : mode === 'press' && pressSendMode === 'editor' && editorMode === 'visual' && editor
          ? editor.getHTML()
          : campaignForm.html;

    if (!html?.trim()) {
      alert('No hay contenido para imprimir. Añade bloques o escribe contenido primero.');
      return;
    }

    const titulo = campaignForm.subject || (mode === 'newsletter' ? 'Newsletter' : 'Nota de prensa');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title>
<style>
  body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 32px; color: #333; }
  img { max-width: 100%; height: auto; }
  h1,h2,h3 { margin: 1em 0 0.5em; }
  p { line-height: 1.6; margin: 0.5em 0 1em; }
  table { width: 100%; border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style></head><body>${html}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }

  function loadDraftFromLocal(showMessage = false) {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(getDraftStorageKey());
    if (!raw) return false;
    try {
      const payload = JSON.parse(raw) as NewsletterDraftPayload;
      applyDraftPayload(payload);
      setHasStoredDraft(true);
      if (showMessage) {
        setMessage('Borrador cargado correctamente.');
      }
      return true;
    } catch {
      return false;
    }
  }

  async function loadData() {
    try {
      const requests: Promise<Response>[] = [
        fetch('/api/admin/newsletter/overview', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/campaigns?limit=25', { cache: 'no-store' }),
      ];
      if (mode === 'newsletter') {
        requests.push(fetch('/api/admin/newsletter/templates?limit=200', { cache: 'no-store' }));
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
              const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>;
              return {
                id: Number(row.id || 0),
                kind: String(row.kind || 'NEWSLETTER').toUpperCase() === 'PRESS' ? 'PRESS' : 'NEWSLETTER',
                name: String(row.name || ''),
                subject: String(row.subject || ''),
                contentHtml: String(row.contentHtml || ''),
                blocksJson: row.blocksJson,
                isDefault: Boolean(row.isDefault),
                metadata: {
                  category: String(meta.category || ''),
                  description: String(meta.description || ''),
                  thumbnailUrl: String(meta.thumbnailUrl || meta.thumbnail_url || ''),
                  theme: meta.theme ? String(meta.theme) : undefined,
                  themeLabel: meta.themeLabel ? String(meta.themeLabel) : undefined,
                },
                updatedAt: String(row.updatedAt || ''),
              };
            })
          : [];
        setNewsletterTemplates(normalized.filter((t) => t.id > 0));
      }
      // Cargar biblioteca de logos
      try {
        const logosRes = await fetch('/api/admin/logos', { cache: 'no-store' });
        if (logosRes.ok) {
          const logosData = await logosRes.json().catch(() => []);
          if (Array.isArray(logosData)) {
            setBrandLogos(
              logosData.map((l: Record<string, unknown>) => ({
                id: Number(l.id || 0),
                nombre: String(l.nombre || l.name || ''),
                url: String(l.url || ''),
                etiqueta: l.etiqueta ? String(l.etiqueta) : undefined,
              })).filter((l) => l.url),
            );
          }
        }
      } catch {
        // logos opcionales, ignorar error
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasDraft = Boolean(localStorage.getItem(getDraftStorageKey()));
    setHasStoredDraft(hasDraft);
    if (!hasDraft) return;
    const isCurrentFormEmpty =
      !campaignForm.subject.trim() &&
      !campaignForm.html.trim() &&
      !campaignForm.puebloSlug.trim();
    if (isCurrentFormEmpty) {
      loadDraftFromLocal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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

  async function uploadNewsletterImageForBlock(
    file: File,
    blockId: string,
    targetField: 'url' | 'iconUrl' | 'gallery' = 'url',
  ) {
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
      if (targetField === 'gallery') {
        setNewsletterBlocks((prev) =>
          prev.map((b) =>
            b.id === blockId
              ? { ...b, imageUrls: [...(b.imageUrls || []), String(data.url)] }
              : b,
          ),
        );
      } else {
        updateNewsletterBlock(blockId, { [targetField]: String(data.url) } as Partial<NewsletterBlock>);
      }
      setMessage(
        targetField === 'iconUrl'
          ? 'Icono subido correctamente.'
          : targetField === 'gallery'
            ? 'Imagen añadida a la galería.'
            : 'Imagen subida correctamente al bloque.',
      );
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

  async function uploadAndSaveLogo(file: File) {
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'brand/logos');
      const uploadRes = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploadData?.url) throw new Error(uploadData?.error || 'Error subiendo logo');
      const url = String(uploadData.url);
      const nombre = file.name.replace(/\.[^.]+$/, '');
      const saveRes = await fetch('/api/admin/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, url, etiqueta: 'newsletter' }),
      });
      if (!saveRes.ok) throw new Error('Error guardando logo en biblioteca');
      const saved = await saveRes.json().catch(() => ({}));
      setBrandLogos((prev) => [
        ...prev,
        { id: Number(saved.id || Date.now()), nombre, url, etiqueta: 'newsletter' },
      ]);
      setMessage(`Logo "${nombre}" añadido a la biblioteca.`);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error subiendo logo'));
    } finally {
      setUploadingLogo(false);
      if (logoUploadInputRef.current) logoUploadInputRef.current.value = '';
    }
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

              <div className="space-y-4 rounded-lg border border-border p-4">
                {/* Selector de modo: Constructor vs HTML */}
                <div className="flex flex-wrap items-stretch gap-3">
                  <button
                    type="button"
                    onClick={() => setNewsletterComposerMode('builder')}
                    className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      newsletterComposerMode === 'builder'
                        ? 'border-primary bg-primary text-primary-foreground shadow-md'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/20">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
                        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
                        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
                        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
                      </svg>
                    </span>
                    <span>
                      <span className="block text-sm font-bold leading-tight">Constructor visual</span>
                      <span className={`block text-xs leading-tight ${newsletterComposerMode === 'builder' ? 'opacity-80' : 'text-muted-foreground'}`}>Arrastra bloques estilo MDirector</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewsletterComposerMode('editor');
                      setShowTemplateGallery(false);
                    }}
                    className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      newsletterComposerMode === 'editor'
                        ? 'border-primary bg-primary text-primary-foreground shadow-md'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-muted/40'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/20">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="16 18 22 12 16 6"/>
                        <polyline points="8 6 2 12 8 18"/>
                      </svg>
                    </span>
                    <span>
                      <span className="block text-sm font-bold leading-tight">HTML / Editor clásico</span>
                      <span className={`block text-xs leading-tight ${newsletterComposerMode === 'editor' ? 'opacity-80' : 'text-muted-foreground'}`}>Editor de texto enriquecido o HTML directo</span>
                    </span>
                  </button>
                </div>

                {newsletterComposerMode === 'builder' && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTemplateGallery((v) => !v)}
                    className="rounded-md border border-primary bg-primary/5 px-4 py-2 text-sm font-semibold text-primary"
                  >
                    {showTemplateGallery ? 'Cerrar galería' : 'Galería de plantillas'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(null);
                      setTemplateName('');
                      setNewsletterBlocks([]);
                      setCampaignForm((s) => ({ ...s, html: '' }));
                      setShowTemplateGallery(false);
                    }}
                    className="rounded-md border border-border px-4 py-2 text-sm"
                  >
                    Nueva en blanco
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-48 rounded-md border border-border px-3 py-2 text-sm"
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
                      className="whitespace-nowrap rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {templateSaving ? 'Guardando...' : selectedTemplateId ? 'Actualizar' : 'Guardar como plantilla'}
                    </button>
                    {selectedTemplateId ? (
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
                        disabled={templateSaving}
                        className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={printCurrentContent}
                    className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    title="Imprimir o exportar como PDF"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9V2h12v7"/>
                      <rect x="6" y="13" width="12" height="9"/>
                      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    </svg>
                    Imprimir / PDF
                  </button>
                </div>
                )}

                {showTemplateGallery && (
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h3 className="text-sm font-bold uppercase text-muted-foreground">Plantillas</h3>
                      <div className="flex rounded-md border border-border text-xs">
                        {(['all', 'predefined', 'mine'] as const).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setTemplateGalleryTab(tab)}
                            className={`px-3 py-1.5 font-medium transition ${templateGalleryTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                          >
                            {tab === 'all' ? 'Todas' : tab === 'predefined' ? 'Predefinidas' : 'Mis plantillas'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">Temática</p>
                      <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                        {TEMPLATE_THEME_FILTER_OPTIONS.map((opt) => (
                          <button
                            key={opt.value || 'all-themes'}
                            type="button"
                            onClick={() => setTemplateThemeFilter(opt.value)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                              templateThemeFilter === opt.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background hover:bg-muted'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {newsletterTemplates
                        .filter((t) => {
                          if (templateGalleryTab === 'predefined') return t.isDefault;
                          if (templateGalleryTab === 'mine') return !t.isDefault;
                          return true;
                        })
                        .filter((t) => {
                          if (!templateThemeFilter) return true;
                          return getTemplateThemeKey(t) === templateThemeFilter;
                        })
                        .map((t) => (
                          <div
                            key={t.id}
                            className="group overflow-hidden rounded-lg border border-border bg-background transition hover:border-primary/50 hover:shadow-md"
                          >
                            <div className="relative h-36 overflow-hidden bg-muted/40">
                              {t.contentHtml ? (
                                <iframe
                                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,sans-serif;transform:scale(0.3);transform-origin:top left;width:333%;overflow:hidden;}</style></head><body>${t.contentHtml}</body></html>`}
                                  className="pointer-events-none h-[480px] w-full border-0"
                                  title={t.name}
                                  sandbox=""
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                  Sin vista previa
                                </div>
                              )}
                              {t.isDefault && (
                                <span className="absolute right-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                  Predefinida
                                </span>
                              )}
                              {getTemplateThemeLabel(t) ? (
                                <span className="absolute left-1 top-1 max-w-[85%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  {getTemplateThemeLabel(t)}
                                </span>
                              ) : null}
                            </div>
                            <div className="p-3">
                              <p className="truncate text-sm font-semibold">{t.name}</p>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {t.metadata?.description || t.subject || 'Sin descripción'}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    applyNewsletterTemplate(t);
                                    setShowTemplateGallery(false);
                                  }}
                                  className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground"
                                >
                                  Usar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTemplatePreviewHtml(
                                      t.contentHtml || renderNewsletterBlocksToHtml(normalizeNewsletterBlocks(t.blocksJson)),
                                    )
                                  }
                                  className="rounded-md border border-border px-2 py-1.5 text-xs font-medium"
                                >
                                  Vista previa
                                </button>
                                {!t.isDefault && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (!window.confirm(`¿Eliminar "${t.name}"?`)) return;
                                      try {
                                        await fetch(`/api/admin/newsletter/templates/${t.id}`, { method: 'DELETE' });
                                        setNewsletterTemplates((prev) => prev.filter((x) => x.id !== t.id));
                                        if (selectedTemplateId === t.id) setSelectedTemplateId(null);
                                        setMessage('Plantilla eliminada.');
                                      } catch {
                                        setError('Error eliminando plantilla');
                                      }
                                    }}
                                    className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600"
                                  >
                                    Borrar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      {newsletterTemplates.filter((t) => {
                        if (templateGalleryTab === 'predefined') return t.isDefault;
                        if (templateGalleryTab === 'mine') return !t.isDefault;
                        return true;
                      }).filter((t) => {
                        if (!templateThemeFilter) return true;
                        return getTemplateThemeKey(t) === templateThemeFilter;
                      }).length === 0 && (
                        <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                          No hay plantillas en esta categoría.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {templatePreviewHtml && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setTemplatePreviewHtml(null)}
                  >
                    <div
                      className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setTemplatePreviewHtml(null)}
                        className="absolute right-3 top-3 rounded-full border px-2 py-1 text-xs font-bold"
                      >
                        Cerrar
                      </button>
                      <p className="mb-3 text-sm font-bold uppercase text-muted-foreground">Vista previa</p>
                      <div dangerouslySetInnerHTML={{ __html: templatePreviewHtml }} />
                    </div>
                  </div>
                )}

                {newsletterComposerMode === 'builder' ? (
                  <div className="space-y-3 rounded-md border border-dashed border-border p-3">
                    <div className="grid gap-3 xl:grid-cols-[260px_1fr]">
                      <aside className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Plantillas</p>
                          <div className="mt-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => setShowTemplateGallery(true)}
                              className="w-full rounded-md border border-primary/40 bg-primary/5 px-2 py-2 text-center text-xs font-semibold text-primary"
                            >
                              Abrir galería
                            </button>
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
                          <div className="mt-2 grid grid-cols-2 gap-2">
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
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('heading')}
                              Titular
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
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('text')}
                              Texto
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
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('image')}
                              Imagen
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
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('button')}
                              Botón
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('iconButton');
                                e.dataTransfer.setData('text/newsletter-block-type', 'iconButton');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('iconButton')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('iconButton')}
                              Botón icono
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('columns2');
                                e.dataTransfer.setData('text/newsletter-block-type', 'columns2');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('columns2')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('columns2')}
                              2 columnas
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('gallery');
                                e.dataTransfer.setData('text/newsletter-block-type', 'gallery');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('gallery')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('gallery')}
                              Galería
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('figure');
                                e.dataTransfer.setData('text/newsletter-block-type', 'figure');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('figure')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('figure')}
                              Figura
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('imgText');
                                e.dataTransfer.setData('text/newsletter-block-type', 'imgText');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('imgText')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('imgText')}
                              Img+Texto
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('socialLinks');
                                e.dataTransfer.setData('text/newsletter-block-type', 'socialLinks');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('socialLinks')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('socialLinks')}
                              Social Links
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('columns3');
                                e.dataTransfer.setData('text/newsletter-block-type', 'columns3');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('columns3')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('columns3')}
                              3 columnas
                            </button>
                            <button
                              type="button"
                              draggable
                              onDragStart={(e) => {
                                setDraggingPaletteType('countdown');
                                e.dataTransfer.setData('text/newsletter-block-type', 'countdown');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('countdown')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('countdown')}
                              Temporizador
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
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('divider')}
                              Separador
                            </button>
                          </div>
                        </div>

                        {/* Panel de logos de la biblioteca */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowLogosPanel((v) => !v)}
                            className="flex w-full items-center justify-between rounded-md border border-dashed border-primary/40 bg-primary/5 px-2 py-2 text-xs font-semibold text-primary"
                          >
                            <span className="flex items-center gap-1.5">
                              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 12h8M12 8v8"/>
                              </svg>
                              Logos ({brandLogos.length})
                            </span>
                            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${showLogosPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>

                          {showLogosPanel && (
                            <div className="mt-2 space-y-2">
                              {brandLogos.length === 0 ? (
                                <p className="py-3 text-center text-[11px] text-muted-foreground">No hay logos en la biblioteca</p>
                              ) : (
                                <div className="grid grid-cols-2 gap-1.5">
                                  {brandLogos.map((logo) => (
                                    <div
                                      key={logo.id}
                                      draggable
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('text/newsletter-logo-url', logo.url);
                                        e.dataTransfer.setData('text/newsletter-logo-name', logo.nombre);
                                        e.dataTransfer.effectAllowed = 'copy';
                                      }}
                                      className="group relative flex cursor-grab flex-col items-center gap-1 rounded-md border bg-white p-1.5 transition hover:border-primary/60 hover:shadow-sm active:cursor-grabbing"
                                      title={`Arrastra "${logo.nombre}" al lienzo`}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={logo.url}
                                        alt={logo.nombre}
                                        className="h-10 w-full object-contain"
                                        loading="lazy"
                                      />
                                      <span className="line-clamp-1 w-full text-center text-[10px] text-muted-foreground">{logo.nombre}</span>
                                      <button
                                        type="button"
                                        title="Añadir al lienzo"
                                        onClick={() => {
                                          const b = createBlock('image', { url: logo.url, content: logo.nombre, align: 'center' });
                                          setNewsletterBlocks((prev) => [...prev, b]);
                                          setSelectedNewsletterBlockId(b.id);
                                        }}
                                        className="absolute right-0.5 top-0.5 hidden rounded bg-primary px-1 py-0.5 text-[10px] font-bold text-white group-hover:flex"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="pt-1">
                                <input
                                  ref={logoUploadInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) await uploadAndSaveLogo(file);
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={uploadingLogo}
                                  onClick={() => logoUploadInputRef.current?.click()}
                                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50"
                                >
                                  {uploadingLogo ? (
                                    'Subiendo...'
                                  ) : (
                                    <>
                                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                      </svg>
                                      Subir logo nuevo
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
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
                            e.preventDefault();
                            // Drop de logo desde la biblioteca
                            const logoUrl = e.dataTransfer.getData('text/newsletter-logo-url');
                            const logoName = e.dataTransfer.getData('text/newsletter-logo-name');
                            if (logoUrl) {
                              const b = createBlock('image', { url: logoUrl, content: logoName || 'Logo', align: 'center' });
                              setNewsletterBlocks((prev) => [...prev, b]);
                              setSelectedNewsletterBlockId(b.id);
                              return;
                            }
                            // Drop de bloque de la paleta
                            if (!draggingPaletteType) return;
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
                                        : block.type === 'iconButton'
                                          ? `Icono cuadrado: ${block.label || 'sin etiqueta'} -> ${block.url || 'sin URL'}`
                                          : block.type === 'columns2'
                                            ? `2 col: ${(block.colLeft || '').slice(0, 20)} | ${(block.colRight || '').slice(0, 20)}`
                                            : block.type === 'columns3'
                                              ? `3 col: ${(block.colLeft || '').slice(0, 15)} | ${(block.colCenter || '').slice(0, 15)} | ${(block.colRight || '').slice(0, 15)}`
                                              : block.type === 'gallery'
                                                ? `Galería: ${(block.imageUrls || []).length} imagen(es)`
                                                : block.type === 'figure'
                                                  ? `Figura: ${block.caption || 'sin pie'} · ${block.url || 'sin img'}`
                                                  : block.type === 'imgText'
                                                    ? `Img+Texto: ${(block.content || '').slice(0, 30)}`
                                                    : block.type === 'socialLinks'
                                                      ? `Social: ${[block.socialFacebook && 'FB', block.socialTwitter && 'X', block.socialInstagram && 'IG', block.socialLinkedin && 'LI', block.socialYoutube && 'YT'].filter(Boolean).join(', ') || 'ninguno'}`
                                                      : block.type === 'countdown'
                                                        ? `Temporizador: ${block.countdownDate || 'sin fecha'} · ${block.countdownLabel || ''}`
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

                              {selectedNewsletterBlock.type === 'image' && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  Texto alt
                                  <input
                                    value={selectedNewsletterBlock.content || ''}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({
                                        content: e.target.value,
                                      })
                                    }
                                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    placeholder="Texto alternativo de la imagen"
                                  />
                                </label>
                              )}

                              {(selectedNewsletterBlock.type === 'heading' ||
                                selectedNewsletterBlock.type === 'text' ||
                                selectedNewsletterBlock.type === 'imgText') && (
                                <div className="md:col-span-2">
                                  <p className="mb-1 text-xs text-muted-foreground">
                                    {selectedNewsletterBlock.type === 'heading'
                                      ? 'Contenido del titular'
                                      : selectedNewsletterBlock.type === 'imgText'
                                        ? 'Texto junto a la imagen'
                                        : 'Contenido del bloque'}
                                  </p>
                                  <BlockRichEditor
                                    content={selectedNewsletterBlock.content || ''}
                                    onChange={(html) =>
                                      updateSelectedNewsletterBlock({ content: html })
                                    }
                                    placeholder={
                                      selectedNewsletterBlock.type === 'heading'
                                        ? 'Escribe el titular...'
                                        : 'Escribe el contenido...'
                                    }
                                  />
                                </div>
                              )}

                              {selectedNewsletterBlock.type === 'columns2' && (
                                <>
                                  <label className="text-xs text-muted-foreground md:col-span-2">
                                    Columna izquierda
                                    <textarea
                                      rows={4}
                                      value={selectedNewsletterBlock.colLeft || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({
                                          colLeft: e.target.value,
                                        })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground md:col-span-2">
                                    Columna derecha
                                    <textarea
                                      rows={4}
                                      value={selectedNewsletterBlock.colRight || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({
                                          colRight: e.target.value,
                                        })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    />
                                  </label>
                                </>
                              )}

                              {selectedNewsletterBlock.type === 'columns3' && (
                                <>
                                  <label className="text-xs text-muted-foreground md:col-span-2">
                                    Columna izquierda
                                    <textarea
                                      rows={3}
                                      value={selectedNewsletterBlock.colLeft || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ colLeft: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground md:col-span-2">
                                    Columna central
                                    <textarea
                                      rows={3}
                                      value={selectedNewsletterBlock.colCenter || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ colCenter: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground md:col-span-2">
                                    Columna derecha
                                    <textarea
                                      rows={3}
                                      value={selectedNewsletterBlock.colRight || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ colRight: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    />
                                  </label>
                                </>
                              )}

                              {selectedNewsletterBlock.type === 'figure' && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  Pie de imagen
                                  <input
                                    value={selectedNewsletterBlock.caption || ''}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({ caption: e.target.value })
                                    }
                                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    placeholder="Descripción bajo la imagen"
                                  />
                                </label>
                              )}

                              {selectedNewsletterBlock.type === 'gallery' && (
                                <div className="space-y-2 md:col-span-2">
                                  <p className="text-xs text-muted-foreground">
                                    URLs de imágenes de la galería (una por línea)
                                  </p>
                                  <textarea
                                    rows={5}
                                    value={(selectedNewsletterBlock.imageUrls || []).join('\n')}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({
                                        imageUrls: e.target.value
                                          .split('\n')
                                          .map((l) => l.trim())
                                          .filter(Boolean),
                                      })
                                    }
                                    className="w-full rounded-md border border-border px-2 py-1 text-sm"
                                    placeholder={'https://imagen1.jpg\nhttps://imagen2.jpg'}
                                  />
                                  <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3">
                                    <p className="text-sm font-semibold text-foreground">
                                      Subir imagen a la galería
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => newsletterImageInputRef.current?.click()}
                                      disabled={uploadingNewsletterImage}
                                      className="mt-2 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                    >
                                      {uploadingNewsletterImage
                                        ? 'Subiendo...'
                                        : 'Subir imagen desde ordenador'}
                                    </button>
                                    <input
                                      ref={newsletterImageInputRef}
                                      type="file"
                                      accept="image/*"
                                      disabled={uploadingNewsletterImage}
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file || !selectedNewsletterBlock) return;
                                        await uploadNewsletterImageForBlock(
                                          file,
                                          selectedNewsletterBlock.id,
                                          'gallery',
                                        );
                                        e.currentTarget.value = '';
                                      }}
                                      className="sr-only"
                                    />
                                  </div>
                                </div>
                              )}

                              {selectedNewsletterBlock.type === 'socialLinks' && (
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-xs text-muted-foreground">
                                    Facebook
                                    <input
                                      value={selectedNewsletterBlock.socialFacebook || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ socialFacebook: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                      placeholder="https://facebook.com/..."
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground">
                                    X / Twitter
                                    <input
                                      value={selectedNewsletterBlock.socialTwitter || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ socialTwitter: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                      placeholder="https://twitter.com/..."
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground">
                                    Instagram
                                    <input
                                      value={selectedNewsletterBlock.socialInstagram || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ socialInstagram: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                      placeholder="https://instagram.com/..."
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground">
                                    LinkedIn
                                    <input
                                      value={selectedNewsletterBlock.socialLinkedin || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ socialLinkedin: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                      placeholder="https://linkedin.com/..."
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground">
                                    YouTube
                                    <input
                                      value={selectedNewsletterBlock.socialYoutube || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ socialYoutube: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                      placeholder="https://youtube.com/..."
                                    />
                                  </label>
                                </div>
                              )}

                              {selectedNewsletterBlock.type === 'countdown' && (
                                <div className="space-y-2 md:col-span-2">
                                  <label className="text-xs text-muted-foreground">
                                    Fecha y hora objetivo
                                    <input
                                      type="datetime-local"
                                      value={selectedNewsletterBlock.countdownDate || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ countdownDate: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    />
                                  </label>
                                  <label className="text-xs text-muted-foreground">
                                    Texto superior (opcional)
                                    <input
                                      value={selectedNewsletterBlock.countdownLabel || ''}
                                      onChange={(e) =>
                                        updateSelectedNewsletterBlock({ countdownLabel: e.target.value })
                                      }
                                      className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                      placeholder="Ej: No te lo pierdas"
                                    />
                                  </label>
                                  <p className="text-[11px] text-muted-foreground">
                                    Al sincronizar HTML se calcula la cuenta atrás respecto al momento actual.
                                  </p>
                                </div>
                              )}

                              {(selectedNewsletterBlock.type === 'image' ||
                                selectedNewsletterBlock.type === 'button' ||
                                selectedNewsletterBlock.type === 'iconButton' ||
                                selectedNewsletterBlock.type === 'figure' ||
                                selectedNewsletterBlock.type === 'imgText') && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  {selectedNewsletterBlock.type === 'figure' || selectedNewsletterBlock.type === 'imgText'
                                    ? 'URL imagen'
                                    : 'URL'}
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

                              {selectedNewsletterBlock.type === 'iconButton' && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  URL icono
                                  <input
                                    value={selectedNewsletterBlock.iconUrl || ''}
                                    onChange={(e) =>
                                      updateSelectedNewsletterBlock({ iconUrl: e.target.value })
                                    }
                                    className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm"
                                    placeholder="https://..."
                                  />
                                </label>
                              )}

                              {(selectedNewsletterBlock.type === 'image' ||
                                selectedNewsletterBlock.type === 'figure' ||
                                selectedNewsletterBlock.type === 'imgText') && (
                                <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3 md:col-span-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {selectedNewsletterBlock.type === 'figure'
                                      ? 'Imagen de la figura'
                                      : selectedNewsletterBlock.type === 'imgText'
                                        ? 'Imagen del bloque Img+Texto'
                                        : 'Imagen del bloque (paso principal)'}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Pulsa el botón grande para subirla desde tu ordenador.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => newsletterImageInputRef.current?.click()}
                                    disabled={uploadingNewsletterImage}
                                    className="mt-3 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                  >
                                    {uploadingNewsletterImage
                                      ? 'Subiendo imagen...'
                                      : 'Subir imagen desde ordenador'}
                                  </button>
                                  <input
                                    ref={newsletterImageInputRef}
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
                                    className="sr-only"
                                  />
                                  <p className="mt-2 text-[11px] text-muted-foreground">
                                    También puedes pegar una URL manual en el campo URL de arriba.
                                  </p>
                                </div>
                              )}

                              {selectedNewsletterBlock.type === 'iconButton' && (
                                <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3 md:col-span-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    Icono del botón cuadrado
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Sube tu icono oficial para usarlo dentro del botón.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => newsletterIconInputRef.current?.click()}
                                    disabled={uploadingNewsletterImage}
                                    className="mt-3 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                  >
                                    {uploadingNewsletterImage ? 'Subiendo icono...' : 'Subir icono desde ordenador'}
                                  </button>
                                  <input
                                    ref={newsletterIconInputRef}
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingNewsletterImage}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      await uploadNewsletterImageForBlock(
                                        file,
                                        selectedNewsletterBlock.id,
                                        'iconUrl',
                                      );
                                      e.currentTarget.value = '';
                                    }}
                                    className="sr-only"
                                  />
                                  <p className="mt-2 text-[11px] text-muted-foreground">
                                    Recomendado: icono PNG/SVG cuadrado.
                                  </p>
                                </div>
                              )}

                              {(selectedNewsletterBlock.type === 'button' ||
                                selectedNewsletterBlock.type === 'iconButton') && (
                                <label className="text-xs text-muted-foreground md:col-span-2">
                                  {selectedNewsletterBlock.type === 'iconButton'
                                    ? 'Etiqueta icono'
                                    : 'Texto del botón'}
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                saveDraftToLocal();
              }}
              disabled={loading}
              className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60"
            >
              Guardar borrador
            </button>
            {hasStoredDraft ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  loadDraftFromLocal(true);
                }}
                disabled={loading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Cargar borrador
              </button>
            ) : null}
            <button
              type="button"
              onClick={printCurrentContent}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              title="Imprimir o exportar como PDF"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7"/>
                <rect x="6" y="13" width="12" height="9"/>
                <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
              </svg>
              Imprimir / PDF
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Enviar campaña'}
            </button>
            {draftSavedAt ? (
              <span className="text-xs text-muted-foreground">
                Borrador guardado: {new Date(draftSavedAt).toLocaleTimeString('es-ES')}
              </span>
            ) : null}
          </div>
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
