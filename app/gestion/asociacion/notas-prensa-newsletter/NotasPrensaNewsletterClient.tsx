'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DraftsAndScheduler, {
  type DraftRow as SharedDraftRow,
  type DraftSnapshot as SharedDraftSnapshot,
} from './_components/DraftsAndScheduler';
import dynamic from 'next/dynamic';
import ImageEditorModal from '@/app/_components/content-builder/ImageEditorModal';
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
import { HtmlAttributePreserver, DivBlock } from '@/app/_components/editor/tiptap-html-preserve';

const ContentBlockBuilder = dynamic(
  () => import('@/app/_components/content-builder/ContentBlockBuilder'),
  { ssr: false, loading: () => <div className="py-8 text-center text-sm text-muted-foreground">Cargando constructor...</div> },
);

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
  deliveredCount: number;
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
  | 'buttonRow'
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
  imageWidth?: string;
  colLeftImg?: string;
  colRightImg?: string;
  colCenterImg?: string;
  btn2Label?: string;
  btn2Url?: string;
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
    includeInternational: boolean;
    ccaa: string;
    provincia: string;
    puebloSlug: string;
    source: string;
  }>;
  pressSendMode?: PressSendMode;
  editorMode?: 'visual' | 'html';
  newsletterComposerMode?: 'editor' | 'builder';
  pressComposerMode?: 'editor' | 'builder';
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

type SavedNewsletterDraft = {
  id: number; // id de la fila `campaigns` en el backend (compartido entre admins)
  name: string;
  subject: string;
  savedAt: string; // updatedAt del backend
  payload: NewsletterDraftPayload | null;
  status?: string;
  scheduledAt?: string | null;
  createdByUserId?: number | null;
  updatedByUserId?: number | null;
};

function newBlockId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Infiere el content-type real de una imagen a partir de su nombre.
 * Antes mandábamos siempre `image/jpeg` y combinado con la sanitización
 * agresiva del backend hacía que llegasen archivos como `.pn` o se
 * renombrara erróneamente la extensión.
 */
function inferImageContentType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase().split('?')[0];
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'jpeg':
    case 'jpg':
    default:
      return 'image/jpeg';
  }
}

function sanitizeTemplateUrl(raw: string): string {
  const url = String(raw || '').trim();
  if (!url) return '';
  if (url === 'https://...' || url === 'http://...' || /https?:\/\/\.\.\./i.test(url)) return '';
  // Auto-añadir https:// si la URL no tiene protocolo (evita URLs relativas rotas en email)
  if (!/^https?:\/\//i.test(url) && !/^\/\//i.test(url) && !/^mailto:/i.test(url)) {
    return `https://${url}`;
  }
  return url;
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
    label: type === 'button' || type === 'buttonRow' ? 'Leer más' : type === 'iconButton' ? 'Icono' : '',
    url:
      type === 'image' || type === 'figure' || type === 'imgText'
        ? ''
        : type === 'button' || type === 'buttonRow'
          ? ''
          : '',
    btn2Label: type === 'buttonRow' ? 'Conoce más' : '',
    btn2Url: type === 'buttonRow' ? '' : '',
    iconUrl: type === 'iconButton' ? '' : '',
    caption: type === 'figure' ? 'Pie de imagen' : '',
    colLeft: type === 'columns2' || type === 'columns3' ? 'Columna izquierda' : '',
    colRight: type === 'columns2' || type === 'columns3' ? 'Columna derecha' : '',
    colCenter: type === 'columns3' ? 'Columna central' : '',
    imageUrls: type === 'gallery' ? [] : undefined,
    socialFacebook: type === 'socialLinks' ? 'https://www.facebook.com/lospueblosmasbonitos/' : '',
    socialTwitter: type === 'socialLinks' ? 'https://x.com/lospueblosmbe' : '',
    socialInstagram: type === 'socialLinks' ? 'https://www.instagram.com/lospueblosmbe/' : '',
    socialLinkedin: type === 'socialLinks' ? '' : '',
    socialYoutube: type === 'socialLinks' ? 'https://www.youtube.com/@lospueblosmasbonitos' : '',
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

function buildUploadFileNameBase(raw: string, fallback = 'imagen'): string {
  const normalized = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return normalized || fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Email-safe: compacta el HTML de bloque eliminando el `margin-top` del primer
 * tag de bloque y el `margin-bottom` del último. Los `<p>`/`<h1..6>` que mete
 * TipTap traen márgenes por defecto y, dentro de un `<td valign="top">`,
 * desalinean el texto respecto a la imagen (ver bloque Img+Texto).
 */
function compactBlockMargins(html: string): string {
  if (!html) return html;
  const blockTags = '(p|h1|h2|h3|h4|h5|h6|ul|ol|div|blockquote)';

  function applyToFirstTag(input: string): string {
    return input.replace(
      new RegExp(`^(\\s*)<${blockTags}((?:\\s[^>]*)?)>`, 'i'),
      (_m, ws, tag, attrs) => {
        const a = attrs || '';
        const styleMatch = a.match(/\sstyle=("|')([^"']*)\1/i);
        if (styleMatch) {
          const newStyle = `margin-top:0;${styleMatch[2]}`;
          const newAttrs = a.replace(styleMatch[0], ` style="${newStyle}"`);
          return `${ws}<${tag}${newAttrs}>`;
        }
        return `${ws}<${tag}${a} style="margin-top:0">`;
      },
    );
  }

  function applyToLastTag(input: string): string {
    return input.replace(
      new RegExp(`<${blockTags}((?:\\s[^>]*)?)>([\\s\\S]*?)<\\/\\2>(\\s*)$`, 'i'),
      (_m, tag, attrs, inner, tail) => {
        const a = attrs || '';
        const styleMatch = a.match(/\sstyle=("|')([^"']*)\1/i);
        if (styleMatch) {
          const newStyle = `${styleMatch[2]};margin-bottom:0`;
          const newAttrs = a.replace(styleMatch[0], ` style="${newStyle}"`);
          return `<${tag}${newAttrs}>${inner}</${tag}>${tail}`;
        }
        return `<${tag}${a} style="margin-bottom:0">${inner}</${tag}>${tail}`;
      },
    );
  }

  return applyToLastTag(applyToFirstTag(html));
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
        buttonrow: 'buttonRow',
        button_row: 'buttonRow',
        'button-row': 'buttonRow',
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
        url: sanitizeTemplateUrl(String(b.url || '')),
        iconUrl: sanitizeTemplateUrl(String(b.iconUrl || '')),
        label: String(b.label || ''),
        colLeft: String(b.colLeft || ''),
        colRight: String(b.colRight || ''),
        colCenter: String(b.colCenter || ''),
        caption: String(b.caption || ''),
        imageUrls: Array.isArray(b.imageUrls)
          ? (b.imageUrls as unknown[]).map((u) => sanitizeTemplateUrl(String(u)))
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
        colLeftImg: sanitizeTemplateUrl(String(b.colLeftImg || '')),
        colRightImg: sanitizeTemplateUrl(String(b.colRightImg || '')),
        colCenterImg: sanitizeTemplateUrl(String(b.colCenterImg || '')),
        btn2Label: String(b.btn2Label || ''),
        btn2Url: sanitizeTemplateUrl(String(b.btn2Url || '')),
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
        const url = sanitizeTemplateUrl(String(block.url || ''));
        if (!url) return '';
        const imgW = block.imageWidth || '100%';
        // Email-safe: envolver en <table align> para que el centrado funcione en
        // iOS Mail/Gmail móvil (donde `margin:0 auto` en <img> a veces falla).
        const tdAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
        const imgStyle = imgW === '100%'
          ? `max-width:100%;height:auto;border-radius:10px;display:block;`
          : `width:${imgW};max-width:100%;height:auto;border-radius:10px;display:inline-block;`;
        const img = `<img src="${escapeHtml(url)}" alt="${escapeHtml(
          block.content || 'Imagen newsletter',
        )}" style="${imgStyle}" />`;
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td align="${tdAlign}" valign="top" style="text-align:${align};">${img}</td></tr></table></div>`;
      }
      if (block.type === 'button') {
        const url = sanitizeTemplateUrl(String(block.url || ''));
        const label = String(block.label || 'Abrir enlace').trim();
        if (!url) return '';
        return `<div style="${boxStyle}"><p style="margin:0;text-align:${align};"><a href="${escapeHtml(
          url,
        )}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#8B5E3C;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">${escapeHtml(
          label,
        )}</a></p></div>`;
      }
      if (block.type === 'buttonRow') {
        const url1 = sanitizeTemplateUrl(String(block.url || ''));
        const url2 = sanitizeTemplateUrl(String(block.btn2Url || ''));
        const label1 = escapeHtml(String(block.label || 'Botón 1'));
        const label2 = escapeHtml(String(block.btn2Label || 'Botón 2'));
        const btnStyle = `display:inline-block;background:#8B5E3C;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;`;
        const b1 = url1 ? `<a href="${escapeHtml(url1)}" target="_blank" rel="noopener noreferrer" style="${btnStyle}">${label1}</a>` : '';
        const b2 = url2 ? `<a href="${escapeHtml(url2)}" target="_blank" rel="noopener noreferrer" style="${btnStyle}">${label2}</a>` : '';
        if (b1 || b2) {
          return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:${align === 'center' ? '0 auto' : align === 'right' ? '0 0 0 auto' : '0'};"><tr>${b1 ? `<td style="padding:0 8px 0 0;">${b1}</td>` : ''}${b2 ? `<td style="padding:0 0 0 8px;">${b2}</td>` : ''}</tr></table></div>`;
        }
        return '';
      }
      if (block.type === 'iconButton') {
        const url = sanitizeTemplateUrl(String(block.url || ''));
        const iconUrl = sanitizeTemplateUrl(String(block.iconUrl || ''));
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
        const colImgStyle = 'width:100%;height:auto;border-radius:6px;display:block;margin-bottom:8px;';
        const leftImg = block.colLeftImg
          ? `<img src="${escapeHtml(block.colLeftImg)}" alt="Imagen columna izquierda" style="${colImgStyle}" />`
          : '';
        const rightImg = block.colRightImg
          ? `<img src="${escapeHtml(block.colRightImg)}" alt="Imagen columna derecha" style="${colImgStyle}" />`
          : '';
        // Si el texto ya es HTML (viene del editor rico), se respeta tal cual.
        // Si es texto plano legado, se escapa y se convierten saltos de línea.
        const colLeftRaw = block.colLeft || '';
        const colRightRaw = block.colRight || '';
        const left = colLeftRaw.includes('<') ? colLeftRaw : escapeHtml(colLeftRaw).replace(/\n/g, '<br/>');
        const right = colRightRaw.includes('<') ? colRightRaw : escapeHtml(colRightRaw).replace(/\n/g, '<br/>');
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><td width="50%" valign="top" style="padding:0 8px 0 0;font-size:15px;line-height:1.6;color:${textColor};">${leftImg}${left}</td><td width="50%" valign="top" style="padding:0 0 0 8px;font-size:15px;line-height:1.6;color:${textColor};">${rightImg}${right}</td></tr></table></div>`;
      }
      if (block.type === 'columns3') {
        const colImgStyle = 'width:100%;height:auto;border-radius:6px;display:block;margin-bottom:8px;';
        const leftImg = block.colLeftImg
          ? `<img src="${escapeHtml(block.colLeftImg)}" alt="Imagen columna izquierda" style="${colImgStyle}" />`
          : '';
        const centerImg = block.colCenterImg
          ? `<img src="${escapeHtml(block.colCenterImg)}" alt="Imagen columna central" style="${colImgStyle}" />`
          : '';
        const rightImg = block.colRightImg
          ? `<img src="${escapeHtml(block.colRightImg)}" alt="Imagen columna derecha" style="${colImgStyle}" />`
          : '';
        const colLeftRaw = block.colLeft || '';
        const colCenterRaw = block.colCenter || '';
        const colRightRaw = block.colRight || '';
        const left = colLeftRaw.includes('<') ? colLeftRaw : escapeHtml(colLeftRaw).replace(/\n/g, '<br/>');
        const center = colCenterRaw.includes('<') ? colCenterRaw : escapeHtml(colCenterRaw).replace(/\n/g, '<br/>');
        const right = colRightRaw.includes('<') ? colRightRaw : escapeHtml(colRightRaw).replace(/\n/g, '<br/>');
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><td width="33%" valign="top" style="padding:0 6px 0 0;font-size:15px;line-height:1.6;color:${textColor};">${leftImg}${left}</td><td width="34%" valign="top" style="padding:0 6px;font-size:15px;line-height:1.6;color:${textColor};">${centerImg}${center}</td><td width="33%" valign="top" style="padding:0 0 0 6px;font-size:15px;line-height:1.6;color:${textColor};">${rightImg}${right}</td></tr></table></div>`;
      }
      if (block.type === 'gallery') {
        const urls = (block.imageUrls || []).map((u) => sanitizeTemplateUrl(String(u || ''))).filter(Boolean);
        if (!urls.length) return `<div style="${boxStyle}"><p style="color:#999;text-align:center;">Galería sin imágenes</p></div>`;
        const imgs = urls
          .map(
            (u) =>
              `<td style="padding:4px;"><img src="${escapeHtml(u)}" alt="Imagen de galería" style="width:100%;height:auto;border-radius:6px;display:block;" /></td>`,
          )
          .join('');
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr>${imgs}</tr></table></div>`;
      }
      if (block.type === 'figure') {
        const url = sanitizeTemplateUrl(String(block.url || ''));
        const cap = String(block.caption || '').trim();
        if (!url) return '';
        const alt = cap || block.content || 'Imagen destacada';
        return `<div style="${boxStyle}"><figure style="margin:0;text-align:${align};"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" style="max-width:100%;height:auto;border-radius:10px;" />${cap ? `<figcaption style="margin-top:6px;font-size:13px;color:#666;text-align:center;">${escapeHtml(cap)}</figcaption>` : ''}</figure></div>`;
      }
      if (block.type === 'imgText') {
        const url = sanitizeTemplateUrl(String(block.url || ''));
        const raw = block.content || '';
        const isHtml = raw.includes('<');
        // En clientes de email (Gmail web, Apple Mail, Outlook) los `<p>`/`<h*>`
        // que mete TipTap traen `margin-top` por defecto. En la columna del
        // bloque Img+Texto eso baja el texto unos 16px y rompe la alineación
        // con el top de la imagen (la imagen empieza arriba, el texto centrado).
        // Forzamos `margin-top:0` al primer hijo de bloque y `margin-bottom:0`
        // al último para que el texto quede pegado al `valign="top"` del td.
        const compactedRaw = isHtml ? compactBlockMargins(raw) : raw;
        const text = isHtml ? compactedRaw : escapeHtml(compactedRaw).replace(/\n/g, '<br/>');
        if (!url) return `<div style="${boxStyle}"><div style="margin:0;font-size:16px;line-height:1.6;color:${textColor};">${text}</div></div>`;
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;"><tr><td width="40%" valign="top" style="padding:0 12px 0 0;"><img src="${escapeHtml(url)}" alt="Imagen del bloque" style="width:100%;height:auto;border-radius:8px;display:block;" /></td><td width="60%" valign="top" style="font-size:15px;line-height:1.6;color:${textColor};">${text}</td></tr></table></div>`;
      }
      if (block.type === 'socialLinks') {
        const iconSize = 40;
        const iconInner = 20;
        const iconMargin = Math.round((iconSize - iconInner) / 2);
        const tdAlign = align === 'right' ? 'right' : align === 'left' ? 'left' : 'center';
        const makeIconCell = (url: string, bgColor: string, iconSlug: string, label: string) =>
          `<td align="center" valign="middle" style="padding:0 6px;">` +
          `<a href="${escapeHtml(sanitizeTemplateUrl(url))}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;" title="${label}">` +
          `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr>` +
          `<td align="center" valign="middle" style="background:${bgColor};border-radius:50%;width:${iconSize}px;height:${iconSize}px;padding:0;">` +
          `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/${iconSlug}.svg" width="${iconInner}" height="${iconInner}" style="filter:invert(1);display:block;margin:${iconMargin}px auto;" alt="${label}" />` +
          `</td></tr></table></a></td>`;
        const cells: string[] = [];
        if (block.socialFacebook) cells.push(makeIconCell(block.socialFacebook, '#1877F2', 'facebook', 'Facebook'));
        if (block.socialTwitter) cells.push(makeIconCell(block.socialTwitter, '#000000', 'x', 'X'));
        // En emails evitamos gradientes por compatibilidad entre clientes.
        if (block.socialInstagram) cells.push(makeIconCell(block.socialInstagram, '#E1306C', 'instagram', 'Instagram'));
        if (block.socialLinkedin) cells.push(makeIconCell(block.socialLinkedin, '#0077B5', 'linkedin', 'LinkedIn'));
        if (block.socialYoutube) cells.push(makeIconCell(block.socialYoutube, '#FF0000', 'youtube', 'YouTube'));
        if (!cells.length) return '';
        return `<div style="${boxStyle}"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;"><tr><td align="${tdAlign}" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:${tdAlign === 'right' ? '0 0 0 auto' : tdAlign === 'left' ? '0' : '0 auto'};"><tr>${cells.join('')}</tr></table></td></tr></table></div>`;
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
      HtmlAttributePreserver,
      DivBlock,
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
  if (type === 'buttonRow') {
    return (
      <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary" aria-hidden="true">
        <rect x="1" y="8" width="10" height="8" rx="2.5" fill="currentColor" />
        <rect x="3.5" y="11.2" width="5" height="1.6" rx="0.8" fill="#fff" />
        <rect x="13" y="8" width="10" height="8" rx="2.5" fill="currentColor" />
        <rect x="15.5" y="11.2" width="5" height="1.6" rx="0.8" fill="#fff" />
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

export default function NotasPrensaNewsletterClient({
  mode,
  embeddedInShell = false,
}: {
  mode: Mode;
  embeddedInShell?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    kind: (mode === 'newsletter' ? 'NEWSLETTER' : 'PRESS') as 'PRESS' | 'NEWSLETTER',
    subject: '',
    preheader: '',
    html: '',
    includeNational: true,
    includeInternational: false,
    ccaa: '',
    provincia: '',
    puebloSlug: '',
    source: '',
  });
  const uploadFileNameBase = buildUploadFileNameBase(
    campaignForm.subject,
    mode === 'newsletter' ? 'newsletter' : 'nota-prensa',
  );
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
  // Adjuntos adicionales (vídeo, audio, Word, Excel, etc.)
  type PressAttachment = { name: string; url: string; contentType: string; size: number };
  const [pressAttachments, setPressAttachments] = useState<PressAttachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const [webContentKind, setWebContentKind] = useState<'NOTICIA' | 'ARTICULO'>('NOTICIA');
  const [publishingWeb, setPublishingWeb] = useState(false);
  const [syncingCampaignId, setSyncingCampaignId] = useState<number | null>(null);
  const [resendingCampaignId, setResendingCampaignId] = useState<number | null>(null);
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [showSendPreview, setShowSendPreview] = useState(false);
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
  const [pressComposerMode, setPressComposerMode] = useState<'editor' | 'builder'>('builder');
  const [pressBuilderHtml, setPressBuilderHtml] = useState('');
  const [pressBuilderBlocks, setPressBuilderBlocks] = useState<unknown[]>([]);
  const [pressBuilderResetKey, setPressBuilderResetKey] = useState(0);
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
  const [editingImageBlockId, setEditingImageBlockId] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState(false);
  const [nlDrafts, setNlDrafts] = useState<SavedNewsletterDraft[]>([]);
  const [showNlDraftsModal, setShowNlDraftsModal] = useState(false);
  const [newsletterRecipientCount, setNewsletterRecipientCount] = useState<number | null>(null);
  const [loadingNewsletterRecipientCount, setLoadingNewsletterRecipientCount] = useState(false);
  const [brandLogos, setBrandLogos] = useState<{ id: number; nombre: string; url: string; etiqueta?: string }[]>([]);
  const [showLogosPanel, setShowLogosPanel] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showPressLogos, setShowPressLogos] = useState(false);
  const [logoInsertWidth, setLogoInsertWidth] = useState<'100%' | '80%' | '60%' | '40%' | '200px' | '160px' | '120px' | '80px'>('160px');
  const [logoInsertAlign, setLogoInsertAlign] = useState<'left' | 'center' | 'right'>('center');
  const [emailPhotoWidth, setEmailPhotoWidth] = useState<'100%' | '80%' | '60%' | '40%' | '30%' | '20%'>('40%');
  const [emailPhotoAlign, setEmailPhotoAlign] = useState<'left' | 'center' | 'right'>('center');
  const [webPhotoWidth, setWebPhotoWidth] = useState<'100%' | '80%' | '60%'>('100%');
  const logoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const photosInputRef = useRef<HTMLInputElement | null>(null);
  const newsletterImageInputRef = useRef<HTMLInputElement | null>(null);
  const newsletterIconInputRef = useRef<HTMLInputElement | null>(null);
  const newsletterColImgInputRef = useRef<HTMLInputElement | null>(null);
  const [nlColImgUploadField, setNlColImgUploadField] = useState<'colLeftImg' | 'colRightImg' | 'colCenterImg' | null>(null);
  const htmlTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [, setEditorTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      HtmlAttributePreserver,
      DivBlock,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder: 'Escribe aquí la nota de prensa...',
      }),
    ],
    content: campaignForm.html || '<p></p>',
    onUpdate: ({ editor }) => {
      setCampaignForm((s) => ({ ...s, html: editor.getHTML() }));
    },
    onSelectionUpdate: () => {
      // Fuerza re-render para que aparezca/desaparezca la barra contextual
      // de imagen cuando se selecciona/deselecciona una imagen.
      setEditorTick((v) => v + 1);
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
        : mode === 'press' && pressSendMode === 'editor' && pressComposerMode === 'builder'
          ? pressBuilderHtml.trim()
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
      pressComposerMode,
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
    if (payload.pressComposerMode === 'editor' || payload.pressComposerMode === 'builder') {
      setPressComposerMode(payload.pressComposerMode);
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

  /**
   * Borradores compartidos entre admins.
   *
   * Antes había dos sistemas en paralelo: el botón naranja "Guardar borrador"
   * escribía en `localStorage` (sólo el navegador del que pulsaba) y la sección
   * "Borradores y programados" (`DraftsAndScheduler`) escribía en el backend.
   * Resultado: lo que un admin guardaba arriba, otro nunca lo veía.
   *
   * Ahora todo va al endpoint `/api/admin/newsletter/drafts` (tabla `campaigns`),
   * que ya es compartido para todos los ADMIN. El `localStorage` queda como
   * red de seguridad por si la red falla en mitad de un guardado.
   */
  function draftKindForCurrentMode(): 'NEWSLETTER' | 'PRESS' {
    return mode === 'newsletter' ? 'NEWSLETTER' : 'PRESS';
  }

  function rowToSavedDraft(row: any): SavedNewsletterDraft {
    let payload: NewsletterDraftPayload | null = null;
    const blocks = row?.blocksJson;
    if (blocks && typeof blocks === 'object') {
      payload = blocks as NewsletterDraftPayload;
    } else if (typeof blocks === 'string') {
      try { payload = JSON.parse(blocks) as NewsletterDraftPayload; } catch { payload = null; }
    }
    const id = Number(row?.id);
    const subject = String(row?.subject ?? '');
    const internalName = String(row?.internalName ?? '').trim();
    const updatedAt = String(row?.updatedAt ?? row?.createdAt ?? new Date().toISOString());
    const name = internalName || subject || `Borrador #${id}`;
    return {
      id,
      name,
      subject,
      savedAt: updatedAt,
      payload,
      status: row?.status,
      scheduledAt: row?.scheduledAt ?? null,
      createdByUserId: row?.createdByUserId ?? null,
      updatedByUserId: row?.updatedByUserId ?? null,
    };
  }

  const refreshNlDrafts = useCallback(async (): Promise<SavedNewsletterDraft[]> => {
    try {
      const params = new URLSearchParams({
        kind: draftKindForCurrentMode(),
        status: 'ALL_EDITABLE',
        limit: '100',
      });
      const res = await fetch(`/api/admin/newsletter/drafts?${params}`, { cache: 'no-store' });
      const data = await res.json().catch(() => []);
      const rows: any[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
      const list = rows.map(rowToSavedDraft);
      list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setNlDrafts(list);
      return list;
    } catch {
      setNlDrafts([]);
      return [];
    }
    // mode controla el `kind`; los demás helpers están definidos en el componente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function saveNlDraft() {
    const payload = buildDraftPayload();
    const now = new Date();
    const label = campaignForm.subject.trim()
      || `Borrador ${now.toLocaleString('es-ES', { hour12: false })}`;
    // Persistimos también en localStorage como red de seguridad por si falla la red.
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(getDraftStorageKey(), JSON.stringify(payload)); } catch {}
    }
    try {
      const body = {
        kind: draftKindForCurrentMode(),
        internalName: label,
        subject: campaignForm.subject || '',
        contentHtml: campaignForm.html || '',
        blocksJson: payload,
        filters: mode === 'press' ? buildPressFilters() : { source: campaignForm.source },
        tags: [],
        attachmentUrls: [],
      };
      const res = await fetch('/api/admin/newsletter/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as any)?.message || 'No se pudo guardar el borrador en el servidor');
      }
      setDraftSavedAt(now.toISOString());
      setHasStoredDraft(true);
      setMessage(`Borrador "${label}" guardado y compartido con el resto de admins.`);
      void refreshNlDrafts();
    } catch (e: any) {
      setError(`No se pudo guardar el borrador en el servidor (${e?.message || 'red caída'}). Se ha guardado localmente como copia de seguridad.`);
      setDraftSavedAt(now.toISOString());
      setHasStoredDraft(true);
    }
  }

  async function loadNlDraft(id: number) {
    const target = nlDrafts.find((d) => d.id === id);
    if (!target) return;
    if (target.payload && typeof target.payload === 'object') {
      applyDraftPayload(target.payload);
      try { localStorage.setItem(getDraftStorageKey(), JSON.stringify(target.payload)); } catch {}
    } else {
      // Borrador sin payload completo: aplicamos al menos asunto y HTML.
      setCampaignForm((prev) => ({
        ...prev,
        subject: target.subject || prev.subject,
      }));
    }
    setHasStoredDraft(true);
    setMessage(`Borrador "${target.name}" cargado.`);
    setShowNlDraftsModal(false);
  }

  async function deleteNlDraft(id: number) {
    try {
      const res = await fetch(`/api/admin/newsletter/drafts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.message || 'No se pudo eliminar');
      }
      setMessage('Borrador eliminado.');
      void refreshNlDrafts();
    } catch (e: any) {
      setError(`No se pudo eliminar el borrador (${e?.message || 'red caída'}).`);
    }
  }

  function hasUnsavedContent(): boolean {
    return !!(
      campaignForm.subject.trim() ||
      campaignForm.html.trim() ||
      campaignForm.preheader.trim() ||
      pressPhotoUrls.length > 0 ||
      pressPhotoFiles.length > 0 ||
      pressPdfUrl ||
      pressPdfFile ||
      pressAttachments.length > 0 ||
      pressBuilderHtml.trim() ||
      (editor && editor.getHTML().trim() !== '<p></p>' && editor.getHTML().trim() !== '')
    );
  }

  function resetAllFields() {
    if (!confirm('¿Empezar de cero? Se perderá todo lo que hay en el formulario actual.')) return;
    setCampaignForm({
      kind: (mode === 'newsletter' ? 'NEWSLETTER' : 'PRESS') as 'PRESS' | 'NEWSLETTER',
      subject: '',
      preheader: '',
      html: '',
      includeNational: true,
      includeInternational: false,
      ccaa: '',
      provincia: '',
      puebloSlug: '',
      source: '',
    });
    setPressSendMode('editor');
    setPressComposerMode('builder');
    setPressPhotoFiles([]);
    setPressPhotoUrls([]);
    setPressPdfFile(null);
    setPressPdfUrl('');
    setPressAttachments([]);
    setInsertedPhotoUrls([]);
    setWebGallerySelection([]);
    setPressBuilderHtml('');
    setSelectedCcaas([]);
    setSelectedProvincias([]);
    setWebContentKind('NOTICIA');
    setTemplateName('');
    setDraftSavedAt(null);
    setError(null);
    setMessage(null);
    if (editor) editor.commands.clearContent();
    const builderDraftKey = 'lpmbe-press-builder-draft';
    localStorage.removeItem(builderDraftKey);
    localStorage.removeItem(getDraftStorageKey());
    setPressBuilderResetKey((k) => k + 1);
    setHasStoredDraft(false);
    setMessage('Formulario limpio. Puedes empezar de cero.');
  }

  function printCurrentContent() {
    const html =
      mode === 'newsletter' && newsletterComposerMode === 'builder'
        ? renderNewsletterBlocksToHtml(newsletterBlocks)
        : mode === 'press' && pressSendMode === 'editor' && pressComposerMode === 'builder'
          ? pressBuilderHtml
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
    // Borradores compartidos vienen del backend (un admin guarda, todos lo ven).
    void refreshNlDrafts();
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

  const hasContentRef = useRef(false);
  useEffect(() => {
    hasContentRef.current = !!(
      campaignForm.subject.trim() ||
      campaignForm.html.trim() ||
      campaignForm.preheader.trim() ||
      pressPhotoUrls.length > 0 ||
      pressBuilderHtml.trim()
    );
  }, [campaignForm.subject, campaignForm.html, campaignForm.preheader, pressPhotoUrls.length, pressBuilderHtml]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasContentRef.current) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Seguro que quieres salir?';
        return e.returnValue;
      }
    }

    function onLinkClick(e: MouseEvent) {
      if (!hasContentRef.current) return;
      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
      if (anchor.target === '_blank') return;
      const currentPath = window.location.pathname;
      if (href === currentPath) return;

      e.preventDefault();
      e.stopPropagation();
      const leave = window.confirm('Si abandonas la página perderás el contenido actual. ¿Continuar?');
      if (leave) {
        hasContentRef.current = false;
        window.location.href = anchor.href;
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onLinkClick, true);

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onLinkClick, true);
    };
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
    if (mode !== 'newsletter') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoadingNewsletterRecipientCount(true);
        const source = campaignForm.source.trim();
        const qs = source ? `?limit=1&offset=0&source=${encodeURIComponent(source)}` : '?limit=1&offset=0';
        const res = await fetch(`/api/admin/newsletter${qs}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) {
          setNewsletterRecipientCount(Number(data?.total || 0));
        }
      } catch {
        if (!cancelled) setNewsletterRecipientCount(null);
      } finally {
        if (!cancelled) setLoadingNewsletterRecipientCount(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, campaignForm.source]);

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
      includeInternational: campaignForm.includeInternational,
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
    targetField: 'url' | 'iconUrl' | 'gallery' | 'colLeftImg' | 'colRightImg' | 'colCenterImg' = 'url',
  ) {
    if (!file) return;
    setUploadingNewsletterImage(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'newsletter/templates');
      fd.append('fileNameBase', uploadFileNameBase);
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
          url: '',
          content: 'Imagen destacada del boletín',
          align: 'center',
        }),
        createBlock('text', {
          content: 'Incluye aquí un resumen corto con enlaces a noticias, actividades y próximos eventos.',
        }),
        createBlock('button', {
          label: 'Ver todas las novedades',
          url: '',
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
        createBlock('button', { label: 'Más información', url: '', align: 'left' }),
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
          url: '',
          content: 'Imagen principal de campaña',
          align: 'center',
        }),
        createBlock('button', { label: 'Acceder ahora', url: '', align: 'center' }),
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
      finalHtml = injectPreheader(finalHtml, campaignForm.preheader);
      const safeFilename = pdfFilename || `nota-prensa-${Date.now()}.pdf`;
      const attachmentUrls = [
        {
          url: pdfUrl,
          filename: safeFilename.toLowerCase().endsWith('.pdf')
            ? safeFilename
            : `${safeFilename}.pdf`,
          contentType: 'application/pdf',
        },
        // Adjuntos adicionales (vídeo, audio, docs, etc.)
        ...pressAttachments.map((a) => ({ url: a.url, filename: a.name, contentType: a.contentType })),
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
        `Campaña enviada. Destinatarios: ${data.totalRecipients}. Enviados: ${data.sentCount}. Fallidos: ${data.failedCount}. Puedes ajustar el contenido y publicar en la web.`,
      );
      setPressPhotoFiles([]);
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
      if (mode === 'press' && pressSendMode === 'editor' && pressComposerMode === 'builder') {
        finalHtml = pressBuilderHtml.trim();
      } else if (mode === 'press' && editorMode === 'visual' && editor) {
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

    // Inyectar preheader al inicio del HTML si se ha rellenado
    finalHtml = injectPreheader(finalHtml, campaignForm.preheader);

    const filters = mode === 'press' ? buildPressFilters() : { source: campaignForm.source };
    const allAttachments: Array<{ url: string; filename?: string; contentType?: string }> = [];
    if (mode === 'press' && photoUrlsForSend.length > 0) {
      photoUrlsForSend.forEach((url, i) => {
        const fname = url.split('/').pop()?.split('?')[0] || `foto-nota-prensa-${i + 1}.jpg`;
        allAttachments.push({ url, filename: fname, contentType: inferImageContentType(fname) });
      });
    }
    if (mode === 'press' && pressAttachments.length > 0) {
      pressAttachments.forEach((a) => allAttachments.push({ url: a.url, filename: a.name, contentType: a.contentType }));
    }

    const res = await fetch('/api/admin/newsletter/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: mode === 'press' ? 'PRESS' : 'NEWSLETTER',
        subject: campaignForm.subject,
        html: finalHtml,
        filters,
        ...(allAttachments.length > 0 ? { attachmentUrls: allAttachments } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Error enviando campaña');
    setMessage(
      `Campaña enviada. Destinatarios: ${data.totalRecipients}. Enviados: ${data.sentCount}. Fallidos: ${data.failedCount}. Puedes ajustar el contenido y publicar en la web.`,
    );
    setPressPhotoFiles([]);
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

  async function handleTestSend() {
    setSendingTest(true);
    setError(null);
    setMessage(null);
    try {
      if (!campaignForm.subject.trim()) throw new Error('El asunto es obligatorio');

      let finalHtml = '';
      const testTo = [
        'asociacion@lospueblosmasbonitosdeespana.org',
        'info@lospueblosmasbonitosdeespana.org',
      ];
      const kind = mode === 'press' ? 'PRESS' : 'NEWSLETTER';
      let attachmentUrls: Array<{ url: string; filename?: string; contentType?: string }> | undefined;

      if (mode === 'press' && pressSendMode === 'pdf') {
        let pdfUrl = pressPdfUrl.trim();
        if (!pdfUrl && pressPdfFile) pdfUrl = await uploadPressPdf();
        if (!pdfUrl) throw new Error('Debes subir un PDF para el envío');
        const pdfFilename = pressPdfFile?.name || pdfUrl.split('/').pop()?.split('?')[0] || '';
        finalHtml = buildPdfEmailHtml(campaignForm.subject.trim(), pdfUrl);
        finalHtml = injectPreheader(finalHtml, campaignForm.preheader);
        const safeFilename = pdfFilename || `nota-prensa-${Date.now()}.pdf`;
        attachmentUrls = [
          { url: pdfUrl, filename: safeFilename.toLowerCase().endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`, contentType: 'application/pdf' },
          ...pressAttachments.map((a) => ({ url: a.url, filename: a.name, contentType: a.contentType })),
        ];
      } else {
        finalHtml = campaignForm.html.trim();
        if (mode === 'newsletter' && newsletterComposerMode === 'builder') {
          finalHtml = renderNewsletterBlocksToHtml(newsletterBlocks).trim();
        }
        if (mode === 'press' && pressSendMode === 'editor' && pressComposerMode === 'builder') {
          finalHtml = pressBuilderHtml.trim();
        } else if (mode === 'press' && editorMode === 'visual' && editor) {
          finalHtml = editor.getHTML().trim();
        }
        if (!finalHtml) throw new Error('El contenido es obligatorio');
        let photoUrlsForTest = [...pressPhotoUrls];
        if (mode === 'press' && pressPhotoFiles.length > 0 && pressPhotoUrls.length === 0) {
          photoUrlsForTest = await uploadPressPhotos();
        }
        if (mode === 'press' && photoUrlsForTest.length > 0) {
          const pending = photoUrlsForTest.filter((u) => !insertedPhotoUrls.includes(u));
          if (pending.length > 0) finalHtml = appendPressPhotos(finalHtml, pending);
        }
        finalHtml = injectPreheader(finalHtml, campaignForm.preheader);
        const testAttachments: Array<{ url: string; filename?: string; contentType?: string }> = [];
        if (mode === 'press' && photoUrlsForTest.length > 0) {
          photoUrlsForTest.forEach((url, i) => {
            const fname = url.split('/').pop()?.split('?')[0] || `foto-nota-prensa-${i + 1}.jpg`;
            testAttachments.push({ url, filename: fname, contentType: inferImageContentType(fname) });
          });
        }
        if (mode === 'press' && pressAttachments.length > 0) {
          pressAttachments.forEach((a) => testAttachments.push({ url: a.url, filename: a.name, contentType: a.contentType }));
        }
        if (testAttachments.length > 0) attachmentUrls = testAttachments;
      }

      const res = await fetch('/api/admin/newsletter/campaigns/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo, kind, subject: campaignForm.subject, html: finalHtml, ...(attachmentUrls ? { attachmentUrls } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error enviando prueba');
      setMessage(`Envío de prueba realizado a ${testTo.join(', ')}. Revisa la bandeja de entrada.`);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error en envío de prueba'));
    } finally {
      setSendingTest(false);
    }
  }

  function appendPressPhotos(html: string, urls: string[], width?: string) {
    const w = width || emailPhotoWidth || '80%';
    const gallery = urls
      .map(
        (url, i) =>
          `<div style="margin:0 0 14px 0;text-align:center;"><img src="${url}" alt="Imagen nota de prensa ${i + 1}" style="max-width:${w};height:auto;border-radius:8px;" /></div>`,
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
    insertImageAtCursor(cleanUrl, 'Imagen nota de prensa', emailPhotoWidth, emailPhotoAlign, true);
    setInsertedPhotoUrls((prev) => (prev.includes(cleanUrl) ? prev : [...prev, cleanUrl]));
  }

  function insertImageAtCursor(
    url: string,
    alt: string,
    width: string,
    align: 'left' | 'center' | 'right' = 'center',
    rounded = false,
  ) {
    const cleanUrl = String(url || '').trim();
    if (!cleanUrl) return;
    const marginByAlign =
      align === 'center'
        ? 'margin:16px auto;'
        : align === 'right'
        ? 'margin:16px 0 16px auto;'
        : 'margin:16px auto 16px 0;';
    const isPixel = width.endsWith('px');
    const sizeStyle = isPixel
      ? `width:${width};max-width:100%;height:auto;`
      : `width:${width};max-width:${width};height:auto;`;
    const roundedStyle = rounded ? 'border-radius:8px;' : '';
    const imgStyle = `display:block;${sizeStyle}${marginByAlign}${roundedStyle}`;
    const snippet = `<p style="text-align:${align};margin:0;"><img src="${cleanUrl}" alt="${alt}" style="${imgStyle}" align="${align}" /></p>`;

    if (editorMode === 'visual' && editor) {
      editor.chain().focus().insertContent(snippet).run();
      return;
    }

    const textarea = htmlTextareaRef.current;
    if (!textarea) {
      setCampaignForm((s) => ({ ...s, html: `${snippet}\n${s.html}`.trim() }));
      return;
    }
    const start = textarea.selectionStart ?? 0;
    const before = campaignForm.html.slice(0, start);
    const after = campaignForm.html.slice(start);
    setCampaignForm((s) => ({ ...s, html: `${before}${snippet}${after}` }));
  }

  // Reajusta tamaño/alineación de la imagen seleccionada en el editor visual.
  function resizeSelectedImage(width: string, align: 'left' | 'center' | 'right') {
    if (!editor || !editor.isActive('image')) return;
    const marginByAlign =
      align === 'center'
        ? 'margin:16px auto;'
        : align === 'right'
        ? 'margin:16px 0 16px auto;'
        : 'margin:16px auto 16px 0;';
    const isPixel = width.endsWith('px');
    const sizeStyle = isPixel
      ? `width:${width};max-width:100%;height:auto;`
      : `width:${width};max-width:${width};height:auto;`;
    // Conserva border-radius si ya lo tenía (caso fotos).
    const currentStyle = String((editor.getAttributes('image') as { htmlStyle?: string } | null)?.htmlStyle || '');
    const radiusMatch = currentStyle.match(/border-radius\s*:\s*[^;]+;?/i);
    const roundedStyle = radiusMatch ? radiusMatch[0].endsWith(';') ? radiusMatch[0] : `${radiusMatch[0]};` : '';
    const newStyle = `display:block;${sizeStyle}${marginByAlign}${roundedStyle}`;
    editor.chain().focus().updateAttributes('image', { htmlStyle: newStyle }).run();
  }

  function deleteSelectedImage() {
    if (!editor || !editor.isActive('image')) return;
    editor.chain().focus().deleteSelection().run();
  }

  async function uploadPressPhotos() {
    if (pressPhotoFiles.length === 0) return [...pressPhotoUrls];
    if (pressPhotoFiles.length + pressPhotoUrls.length > 10) {
      throw new Error('Puedes subir un máximo de 10 fotos por nota de prensa');
    }
    for (const file of pressPhotoFiles) {
      if (file.size > 12 * 1024 * 1024) {
        throw new Error(
          `La foto "${file.name}" supera el límite de 12 MB para envío por email. Reduce su tamaño antes de subirla.`,
        );
      }
    }

    setUploadingPhotos(true);
    try {
      const newUrls: string[] = [];
      for (const file of pressPhotoFiles) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'newsletter/press');
        fd.append('fileNameBase', uploadFileNameBase);
        const res = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) {
          throw new Error(data?.error || data?.message || 'Error subiendo una de las fotos');
        }
        newUrls.push(String(data.url));
      }
      const allUrls = [...pressPhotoUrls, ...newUrls];
      setPressPhotoUrls(allUrls);
      setPressPhotoFiles([]);
      if (photosInputRef.current) photosInputRef.current.value = '';
      return allUrls;
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
      setMessage('Fotos subidas correctamente. Puedes seleccionar más fotos.');
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error subiendo fotos'));
    }
  }

  async function uploadPressPdf() {
    if (!pressPdfFile) return '';
    if (!/\.pdf$/i.test(pressPdfFile.name) && pressPdfFile.type !== 'application/pdf') {
      throw new Error('El archivo debe ser PDF');
    }
    if (pressPdfFile.size > 12 * 1024 * 1024) {
      throw new Error('El PDF supera el límite máximo de 12MB para envío por email');
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

  async function uploadPressAttachmentFile(file: File): Promise<{ url: string; name: string; contentType: string; size: number }> {
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('El adjunto supera el límite máximo de 12MB para envío por email');
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'newsletter/press-attachments');
    const res = await fetch('/api/admin/uploads/press-attachment', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    if (!res.ok || !data?.url) throw new Error(String(data?.error ?? data?.message ?? 'Error subiendo archivo'));
    return {
      url: String(data.url),
      name: String(data.originalName ?? file.name),
      contentType: String(data.contentType ?? file.type ?? 'application/octet-stream'),
      size: Number(data.size ?? file.size),
    };
  }

  function injectPreheader(html: string, preheader: string): string {
    if (!preheader.trim()) return html;
    const safe = preheader.replace(/[<>"'&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c] ?? c));
    const padding = '&zwnj;&nbsp;'.repeat(20);
    const preheaderHtml = `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f8f8f8;">${safe}${padding}</div>`;
    return preheaderHtml + html;
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

  function stripEmailWrapperForWeb(html: string, galleryUrlsToStrip: string[] = []): string {
    let cleaned = html;
    cleaned = cleaned.replace(/<div[^>]*style="[^"]*display:\s*none[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<hr[^>]*style="[^"]*"[^>]*\/?>/gi, '');
    cleaned = cleaned.replace(/<h3[^>]*>\s*Im[áa]genes de la nota de prensa\s*<\/h3>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>\s*<img[^>]*>\s*<\/div>/gi, '');

    if (galleryUrlsToStrip.length > 0) {
      for (const url of galleryUrlsToStrip) {
        const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(`<div[^>]*>\\s*<img[^>]*src=["']${escaped}["'][^>]*>\\s*</div>`, 'gi'), '');
        cleaned = cleaned.replace(new RegExp(`<p[^>]*>\\s*<img[^>]*src=["']${escaped}["'][^>]*>\\s*</p>`, 'gi'), '');
        cleaned = cleaned.replace(new RegExp(`<img[^>]*src=["']${escaped}["'][^>]*>`, 'gi'), '');
      }
    }

    cleaned = cleaned.replace(/style="[^"]*max-width:\s*\d+%[^"]*"/gi, (match) => {
      return match.replace(/max-width:\s*\d+%/gi, 'max-width:100%');
    });
    cleaned = cleaned.replace(/<img([^>]*)style="([^"]*)"/gi, (full, before, style) => {
      const newStyle = style
        .replace(/max-width:\s*[^;]+;?/gi, '')
        .replace(/border-radius:\s*[^;]+;?/gi, 'border-radius:8px;');
      return `<img${before}style="max-width:100%;height:auto;border-radius:8px;display:block;margin:16px auto;${newStyle}"`;
    });
    cleaned = cleaned.replace(/(<(div|p)>\s*<\/(div|p)>\s*){2,}/gi, '');
    return cleaned.trim();
  }

  async function handlePublishWeb() {
    setError(null);
    setMessage(null);
    setPublishingWeb(true);
    try {
      let finalHtml = campaignForm.html.trim();
      if (mode === 'newsletter' && newsletterComposerMode === 'builder') {
        finalHtml = renderNewsletterBlocksToHtml(newsletterBlocks).trim();
      } else if (pressSendMode === 'editor' && pressComposerMode === 'builder') {
        finalHtml = pressBuilderHtml.trim();
      } else if (editorMode === 'visual' && editor) {
        finalHtml = editor.getHTML().trim();
      }
      if (!campaignForm.subject.trim() || !finalHtml) {
        throw new Error('Asunto y contenido son obligatorios para subir a la web');
      }

      let uploadedPhotoUrls = [...pressPhotoUrls];
      if (pressPhotoFiles.length > 0 && pressPhotoUrls.length === 0) {
        uploadedPhotoUrls = await uploadPressPhotos();
      }

      const allGalleryUrls = [...uploadedPhotoUrls];

      finalHtml = stripEmailWrapperForWeb(finalHtml, allGalleryUrls);
      const firstPhoto = allGalleryUrls[0] || undefined;

      const res = await fetch('/api/admin/newsletter/publish-web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: campaignForm.subject.trim(),
          html: finalHtml,
          kind: webContentKind,
          puebloSlug: campaignForm.puebloSlug.trim() || undefined,
          coverUrl: firstPhoto,
          galleryUrls: allGalleryUrls.length > 0 ? allGalleryUrls : undefined,
          blocksJson: pressComposerMode === 'builder' && pressBuilderBlocks.length > 0
            ? pressBuilderBlocks
            : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error publicando en web');

      const target = webContentKind === 'NOTICIA' ? 'noticia' : 'artículo';
      if (data?.publishedToPueblo) {
        setMessage(`Publicado en web como ${target}: asociación + pueblo. Las fotos se muestran como galería.`);
      } else {
        setMessage(`Publicado en web como ${target}: asociación. Las fotos se muestran como galería.`);
      }
      return true;
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Error publicando en web'));
      return false;
    } finally {
      setPublishingWeb(false);
    }
  }

  function buildWebPreviewHtml() {
    let html = campaignForm.html.trim();
    if (mode === 'newsletter' && newsletterComposerMode === 'builder') {
      html = renderNewsletterBlocksToHtml(newsletterBlocks).trim();
    } else if (editorMode === 'visual' && editor) {
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

  function buildSendPreviewHtml() {
    let finalHtml = '';

    if (mode === 'press' && pressSendMode === 'pdf') {
      const pdfUrl = pressPdfUrl.trim();
      if (!pdfUrl) {
        return '';
      }
      finalHtml = buildPdfEmailHtml(campaignForm.subject.trim(), pdfUrl);
      return injectPreheader(finalHtml, campaignForm.preheader).trim();
    }

    finalHtml = campaignForm.html.trim();
    if (mode === 'newsletter' && newsletterComposerMode === 'builder') {
      finalHtml = renderNewsletterBlocksToHtml(newsletterBlocks).trim();
    } else if (mode === 'press' && pressSendMode === 'editor' && pressComposerMode === 'builder') {
      finalHtml = pressBuilderHtml.trim();
    } else if (mode === 'press' && pressSendMode === 'editor' && editorMode === 'visual' && editor) {
      finalHtml = editor.getHTML().trim();
    }

    if (mode === 'press' && pressPhotoUrls.length > 0) {
      const pendingPhotoUrls = pressPhotoUrls.filter((u) => !insertedPhotoUrls.includes(u));
      if (pendingPhotoUrls.length > 0) {
        finalHtml = appendPressPhotos(finalHtml, pendingPhotoUrls);
      }
    }

    return injectPreheader(finalHtml, campaignForm.preheader).trim();
  }

  const selectedNewsletterBlock =
    newsletterBlocks.find((b) => b.id === selectedNewsletterBlockId) || null;

  // ------- Borradores + Programación (DraftsAndScheduler) -------
  const getSharedSnapshot = useCallback(async (): Promise<SharedDraftSnapshot> => {
    const payload = buildDraftPayload();
    const filters =
      mode === 'press'
        ? buildPressFilters()
        : { source: campaignForm.source };

    const attachmentUrls: Array<{
      url: string;
      filename?: string;
      contentType?: string;
    }> = [];
    let contentHtml = payload.campaignForm?.html || campaignForm.html || '';
    if (mode === 'press') {
      if (pressSendMode === 'pdf') {
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
          throw new Error('Debes subir un PDF para programar el envío');
        }
        contentHtml = injectPreheader(
          buildPdfEmailHtml(campaignForm.subject.trim(), pdfUrl),
          campaignForm.preheader,
        ).trim();
        const safeFilename = pdfFilename || `nota-prensa-${Date.now()}.pdf`;
        attachmentUrls.push({
          url: pdfUrl,
          filename: safeFilename.toLowerCase().endsWith('.pdf')
            ? safeFilename
            : `${safeFilename}.pdf`,
          contentType: 'application/pdf',
        });
      } else if (Array.isArray(pressPhotoUrls) && pressPhotoUrls.length > 0) {
        pressPhotoUrls.forEach((u, i) => {
          const fname = u.split('/').pop()?.split('?')[0] || `foto-${i + 1}.jpg`;
          attachmentUrls.push({
            url: u,
            filename: fname,
            contentType: inferImageContentType(fname),
          });
        });
      }
      if (Array.isArray(pressAttachments) && pressAttachments.length > 0) {
        pressAttachments.forEach((a) =>
          attachmentUrls.push({
            url: a.url,
            filename: a.name,
            contentType: a.contentType,
          }),
        );
      }
    }

    return {
      subject: campaignForm.subject || '',
      contentHtml,
      blocksJson: payload,
      filters,
      attachmentUrls,
    };
  }, [
    buildDraftPayload,
    buildPressFilters,
    mode,
    campaignForm.source,
    campaignForm.subject,
    campaignForm.preheader,
    campaignForm.html,
    pressSendMode,
    pressPdfFile,
    pressPdfUrl,
    pressPhotoUrls,
    pressAttachments,
    uploadPressPdf,
  ]);

  const loadSharedDraft = useCallback(
    (draft: SharedDraftRow) => {
      try {
        const payload = draft.blocksJson as any;
        if (payload && typeof payload === 'object') {
          applyDraftPayload(payload);
        } else {
          setCampaignForm((prev) => ({
            ...prev,
            subject: draft.subject || prev.subject,
            html: draft.contentHtml || prev.html,
          }));
        }
      } catch (e) {
        // fallback: carga mínima
        setCampaignForm((prev) => ({
          ...prev,
          subject: draft.subject || prev.subject,
          html: draft.contentHtml || prev.html,
        }));
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [applyDraftPayload, setCampaignForm],
  );

  return (
    <div className={embeddedInShell ? 'space-y-8' : 'mt-8 space-y-8'}>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="group relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-sky-800/50 dark:from-sky-950/30 dark:to-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-200/60">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0116 0" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">Usuarios web</p>
              <p className="text-2xl font-bold text-foreground">{overview?.usersTotal ?? '—'}</p>
            </div>
          </div>
        </article>

        {mode === 'newsletter' ? (
          <article className="group relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-violet-800/50 dark:from-violet-950/30 dark:to-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">Suscriptores</p>
                <p className="text-2xl font-bold text-foreground">{overview?.newsletterSubscribersTotal ?? '—'}</p>
              </div>
            </div>
          </article>
        ) : (
          <article className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-amber-800/50 dark:from-amber-950/30 dark:to-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M3 11l18-7v16L3 13z" />
                  <path d="M11.6 16.8a3 3 0 11-5.8-1.6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">Contactos prensa</p>
                <p className="text-2xl font-bold text-foreground">{overview?.pressContactsTotal ?? '—'}</p>
              </div>
            </div>
          </article>
        )}

        <article className="group relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-800/50 dark:from-emerald-950/30 dark:to-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-200/60">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M22 12A10 10 0 1112 2" />
                <path d="M22 4L12 14l-3-3" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Campañas</p>
              <p className="text-2xl font-bold text-foreground">{overview?.campaignsTotal ?? '—'}</p>
            </div>
          </div>
        </article>

        {mode === 'press' ? (
          <article className="group relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-amber-800/50 dark:from-amber-950/30 dark:to-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">Modo prensa</p>
                <p className="truncate text-sm font-bold text-foreground">Envío segmentado por medios</p>
              </div>
            </div>
          </article>
        ) : (
          <article className="group relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 via-white to-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-violet-800/50 dark:from-violet-950/30 dark:to-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-200">Modo newsletter</p>
                <p className="truncate text-sm font-bold text-foreground">Envío masivo a suscriptores</p>
              </div>
            </div>
          </article>
        )}
      </section>

      {message ? (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-950/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-200/60">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="pt-0.5 text-sm font-medium text-emerald-800 dark:text-emerald-200">{message}</p>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/60 p-4 shadow-sm dark:border-red-800/60 dark:bg-red-950/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 shadow-sm shadow-red-200/60">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </div>
          <p className="pt-0.5 text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : null}

      {mode === 'press' ? (
        <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white p-5 sm:p-6 shadow-sm shadow-amber-100/40 dark:border-amber-800/50 dark:from-amber-950/30 dark:to-card dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="9" cy="7" r="4" />
                  <path d="M3 21a6 6 0 0112 0" />
                  <path d="M19 8v6M16 11h6" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Añadir contacto de prensa</h2>
                <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">
                  Registra un nuevo medio en la base de datos. Asígnale un ámbito (nacional, CCAA, provincia&hellip;) para poder segmentar los envíos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPressFormExpanded((v) => !v)}
              className="shrink-0 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-800 dark:bg-card dark:text-amber-200 dark:hover:bg-amber-950/40"
            >
              {pressFormExpanded ? '▼ Ocultar' : '▶ Mostrar'}
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

      <section className={`overflow-hidden rounded-2xl border ${mode === 'press' ? 'border-amber-200/80 from-amber-50/40 dark:border-amber-800/50 dark:from-amber-950/30' : 'border-violet-200/80 from-violet-50/40 dark:border-violet-800/50 dark:from-violet-950/30'} bg-gradient-to-b to-white p-5 sm:p-6 shadow-sm dark:to-card`}>
        <div className="mb-4 flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${mode === 'press' ? 'from-amber-500 to-amber-600 shadow-amber-200/60' : 'from-violet-500 to-violet-600 shadow-violet-200/60'} shadow-md`}>
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === 'press' ? 'Enviar nota de prensa' : 'Enviar newsletter'}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {mode === 'press'
                ? 'Compón el email, segmenta los medios y dispara el envío con seguimiento de aperturas.'
                : 'Compón la newsletter con el constructor visual y envíala a tus suscriptores activos.'}
            </p>
          </div>
        </div>
        <form onSubmit={handleSendCampaign} className="mt-2 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Preheader <span className="text-xs text-muted-foreground">(texto de vista previa en el cliente de correo)</span>
              <input
                value={campaignForm.preheader}
                onChange={(e) => setCampaignForm((s) => ({ ...s, preheader: e.target.value }))}
                maxLength={150}
                placeholder="Breve resumen que aparece tras el asunto en la bandeja…"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
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
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {pressSendMode === 'pdf' ? (
                  <p>
                    <strong>Se enviará:</strong> asunto, preheader, email breve automático, PDF principal y adjuntos adicionales.
                    El contenido del editor no se usa en este modo.
                  </p>
                ) : (
                  <p>
                    <strong>Se enviará:</strong> asunto, preheader, contenido creado en editor, fotos insertadas/subidas para la nota y adjuntos adicionales.
                    El PDF principal no se usa en este modo.
                  </p>
                )}
                {pressSendMode === 'editor' && (pressPdfFile || pressPdfUrl) ? (
                  <p className="mt-1">
                    Hay un PDF preparado para “Enviar desde PDF”. No se adjuntará mientras estés en “Crear en editor”.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {mode === 'press' ? (
            <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13"/>
                    <path d="m22 2-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-blue-900">Envío a Medios</h3>
                  <p className="text-xs text-blue-600">Selecciona los destinatarios de la nota de prensa</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-blue-900">
                <span className="mb-1 block">Alcance</span>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-white px-3 py-2.5 text-sm shadow-sm transition hover:border-blue-400">
                    <input
                      type="checkbox"
                      checked={campaignForm.includeNational}
                      onChange={(e) =>
                        setCampaignForm((s) => ({
                          ...s,
                          includeNational: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Medios nacionales</span>
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-200 bg-white px-3 py-2.5 text-sm shadow-sm transition hover:border-blue-400">
                    <input
                      type="checkbox"
                      checked={campaignForm.includeInternational}
                      onChange={(e) =>
                        setCampaignForm((s) => ({
                          ...s,
                          includeInternational: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Medios internacionales</span>
                  </label>
                </div>
              </label>
              <label className="text-sm font-medium text-blue-900">
                Comunidad Autónoma
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
                    className="w-full rounded-lg border-2 border-blue-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-400 focus:outline-none"
                    placeholder="Empieza a escribir CCAA..."
                  />
                  <button
                    type="button"
                    onClick={() => addCcaa(ccaaInput)}
                    className="rounded-lg border-2 border-blue-300 bg-white px-3 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
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
                      <span key={ccaa} className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                        {ccaa}
                        <button
                          type="button"
                          onClick={() => setSelectedCcaas((prev) => prev.filter((x) => x !== ccaa))}
                          className="text-blue-500 hover:text-blue-800"
                          aria-label={`Quitar ${ccaa}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </label>
              <label className="text-sm font-medium text-blue-900">
                Provincia
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
                    className="w-full rounded-lg border-2 border-blue-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-400 focus:outline-none"
                    placeholder="Empieza a escribir provincia..."
                  />
                  <button
                    type="button"
                    onClick={() => addProvincia(provinciaInput)}
                    className="rounded-lg border-2 border-blue-300 bg-white px-3 py-2 text-sm font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
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
                      <span key={provincia} className="inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
                        {provincia}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProvincias((prev) => prev.filter((x) => x !== provincia))
                          }
                          className="text-blue-500 hover:text-blue-800"
                          aria-label={`Quitar ${provincia}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </label>
              <label className="text-sm font-medium text-blue-900 md:col-span-3">
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
                  className="mt-1 w-full rounded-lg border-2 border-blue-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-400 focus:outline-none"
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
                                setDraggingPaletteType('buttonRow');
                                e.dataTransfer.setData('text/newsletter-block-type', 'buttonRow');
                                e.dataTransfer.effectAllowed = 'copy';
                              }}
                              onDragEnd={() => setDraggingPaletteType(null)}
                              onClick={() => addNewsletterBlock('buttonRow')}
                              className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5"
                            >
                              {renderPaletteIcon('buttonRow')}
                              2 Botones
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
                                          const b = createBlock('image', { url: logo.url, content: logo.nombre, align: 'center', imageWidth: '160px' });
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
                              const b = createBlock('image', { url: logoUrl, content: logoName || 'Logo', align: 'center', imageWidth: '160px' });
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
                                        : block.type === 'buttonRow'
                                          ? `[${block.label || 'Btn1'}] [${block.btn2Label || 'Btn2'}]`
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
                                <>
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
                                  <div className="md:col-span-2">
                                    <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Ancho de imagen</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {['80px', '120px', '160px', '200px', '250px', '300px', '50%', '75%', '100%'].map((w) => (
                                        <button
                                          key={w}
                                          type="button"
                                          onClick={() => updateSelectedNewsletterBlock({ imageWidth: w })}
                                          className={`rounded border px-2 py-1 text-[11px] font-medium transition ${(selectedNewsletterBlock.imageWidth || '100%') === w ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-muted'}`}
                                        >
                                          {w}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </>
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

                              {(selectedNewsletterBlock.type === 'columns2' || selectedNewsletterBlock.type === 'columns3') && (
                                <>
                                  {(selectedNewsletterBlock.type === 'columns2'
                                    ? (['colLeftImg', 'colRightImg'] as const)
                                    : (['colLeftImg', 'colCenterImg', 'colRightImg'] as const)
                                  ).map((imgField, idx) => {
                                    const textField = selectedNewsletterBlock.type === 'columns3'
                                      ? (idx === 0 ? 'colLeft' : idx === 1 ? 'colCenter' : 'colRight')
                                      : (idx === 0 ? 'colLeft' : 'colRight');
                                    const labels = selectedNewsletterBlock.type === 'columns3'
                                      ? ['Columna izquierda', 'Columna central', 'Columna derecha']
                                      : ['Columna izquierda', 'Columna derecha'];
                                    const label = labels[idx];
                                    const imgUrl = selectedNewsletterBlock[imgField] || '';
                                    return (
                                      <div key={imgField} className="md:col-span-2 space-y-2 rounded-lg border border-border/60 bg-muted/5 p-3">
                                        <p className="text-xs font-semibold text-foreground">{label}</p>
                                        <div className="rounded-md border border-dashed border-border bg-white p-2">
                                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Imagen (opcional)</p>
                                          {imgUrl ? (
                                            <div className="relative mb-2">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img src={imgUrl} alt="" className="h-28 w-full rounded-md object-cover" />
                                              <button type="button" onClick={() => updateSelectedNewsletterBlock({ [imgField]: '' })} className="absolute right-1 top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow hover:bg-red-700">✕</button>
                                            </div>
                                          ) : (
                                            <div className="mb-2 space-y-1.5">
                                              <button
                                                type="button"
                                                disabled={uploadingNewsletterImage}
                                                onClick={() => { setNlColImgUploadField(imgField); setTimeout(() => newsletterColImgInputRef.current?.click(), 50); }}
                                                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                                              >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 16V8m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                                                {uploadingNewsletterImage && nlColImgUploadField === imgField ? 'Subiendo...' : 'Subir foto'}
                                              </button>
                                              <input
                                                type="text"
                                                placeholder="o pega URL de imagen..."
                                                className="w-full rounded-md border border-border px-2 py-1 text-xs text-muted-foreground placeholder:text-muted-foreground/50"
                                                onBlur={(e) => { const v = e.target.value.trim(); if (v) { updateSelectedNewsletterBlock({ [imgField]: v }); e.target.value = ''; } }}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { updateSelectedNewsletterBlock({ [imgField]: v }); (e.target as HTMLInputElement).value = ''; } } }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Texto</p>
                                          <BlockRichEditor
                                            content={selectedNewsletterBlock[textField] || ''}
                                            onChange={(html) => updateSelectedNewsletterBlock({ [textField]: html })}
                                            placeholder={`${label}...`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                  <input ref={newsletterColImgInputRef} type="file" accept="image/*" disabled={uploadingNewsletterImage} className="sr-only"
                                    onChange={async (e) => {
                                      const f = e.target.files?.[0];
                                      if (!f || !nlColImgUploadField || !selectedNewsletterBlockId) return;
                                      await uploadNewsletterImageForBlock(f, selectedNewsletterBlockId, nlColImgUploadField);
                                      setNlColImgUploadField(null);
                                      e.currentTarget.value = '';
                                    }} />
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
                                  {selectedNewsletterBlock.url && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingImageBlockId(selectedNewsletterBlock.id)}
                                      className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      ✏️ Editar imagen (recortar, redimensionar, alt)
                                    </button>
                                  )}
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

                              {selectedNewsletterBlock.type === 'buttonRow' && (
                                <div className="md:col-span-2 space-y-3">
                                  <div className="flex gap-3">
                                    <div className="flex-1 rounded-lg border border-border/60 bg-muted/5 p-3 space-y-2">
                                      <p className="text-xs font-semibold text-foreground">Botón izquierdo</p>
                                      <label className="block text-xs text-muted-foreground">
                                        Texto
                                        <input value={selectedNewsletterBlock.label || ''} onChange={(e) => updateSelectedNewsletterBlock({ label: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="Leer más" />
                                      </label>
                                      <label className="block text-xs text-muted-foreground">
                                        URL
                                        <input value={selectedNewsletterBlock.url || ''} onChange={(e) => updateSelectedNewsletterBlock({ url: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="https://..." />
                                      </label>
                                    </div>
                                    <div className="flex-1 rounded-lg border border-border/60 bg-muted/5 p-3 space-y-2">
                                      <p className="text-xs font-semibold text-foreground">Botón derecho</p>
                                      <label className="block text-xs text-muted-foreground">
                                        Texto
                                        <input value={selectedNewsletterBlock.btn2Label || ''} onChange={(e) => updateSelectedNewsletterBlock({ btn2Label: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="Conoce más" />
                                      </label>
                                      <label className="block text-xs text-muted-foreground">
                                        URL
                                        <input value={selectedNewsletterBlock.btn2Url || ''} onChange={(e) => updateSelectedNewsletterBlock({ btn2Url: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="https://..." />
                                      </label>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center gap-3 rounded-md border border-dashed border-border bg-white/50 p-2">
                                    <span className="inline-block rounded-md bg-[#8B5E3C] px-4 py-1.5 text-xs font-semibold text-white">{selectedNewsletterBlock.label || 'Botón 1'}</span>
                                    <span className="inline-block rounded-md bg-[#8B5E3C] px-4 py-1.5 text-xs font-semibold text-white">{selectedNewsletterBlock.btn2Label || 'Botón 2'}</span>
                                  </div>
                                </div>
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
              {mode === 'press' && pressSendMode === 'editor' && (pressPdfFile || pressPdfUrl) ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">PDF preparado para el modo “Enviar desde PDF”</p>
                      <p className="text-xs">
                        {pressPdfFile
                          ? `Seleccionado: ${pressPdfFile.name}`
                          : 'PDF subido y listo para usar si cambias al modo PDF.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPressSendMode('pdf')}
                        className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold"
                      >
                        Cambiar a PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePdf}
                        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
                      >
                        Quitar PDF
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              {/* Selector Constructor / Editor clásico para PRENSA */}
              {mode === 'press' && pressSendMode === 'editor' && (
                <div className="flex flex-wrap items-stretch gap-3 rounded-lg border border-border p-3">
                  <button
                    type="button"
                    onClick={() => setPressComposerMode('builder')}
                    className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      pressComposerMode === 'builder'
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
                      <span className={`block text-xs leading-tight ${pressComposerMode === 'builder' ? 'opacity-80' : 'text-muted-foreground'}`}>
                        Arrastra bloques, logos y plantillas
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPressComposerMode('editor')}
                    className={`flex flex-1 items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                      pressComposerMode === 'editor'
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
                      <span className={`block text-xs leading-tight ${pressComposerMode === 'editor' ? 'opacity-80' : 'text-muted-foreground'}`}>
                        Editor de texto enriquecido o HTML directo
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {/* Constructor visual para PRENSA */}
              {mode === 'press' && pressSendMode === 'editor' && pressComposerMode === 'builder' ? (
                <div className="mt-2">
                  <ContentBlockBuilder
                    key={`press-builder-${pressBuilderResetKey}`}
                    draftKey="lpmbe-press-builder-draft"
                    showBrandLogos={true}
                    onChange={(html) => setPressBuilderHtml(html)}
                    onBlocksChange={(blocks) => setPressBuilderBlocks(blocks)}
                    uploadFileNameBase={uploadFileNameBase}
                  />
                </div>
              ) : (
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
                {/* Botón Logos */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPressLogos((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition ${showPressLogos ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-white hover:bg-muted'}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    Insertar logo ({brandLogos.length})
                  </button>
                </div>
                {showPressLogos && (
                  <div className="mt-1 rounded-md border border-border bg-white p-3">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Ancho del logo:</span>
                      {(['80px', '120px', '160px', '200px', '40%', '60%'] as const).map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setLogoInsertWidth(w)}
                          className={`rounded border px-2 py-1 text-[11px] font-medium transition ${logoInsertWidth === w ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-muted'}`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Alineación:</span>
                      {([
                        { value: 'left' as const, label: 'Izquierda' },
                        { value: 'center' as const, label: 'Centro' },
                        { value: 'right' as const, label: 'Derecha' },
                      ]).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setLogoInsertAlign(value)}
                          className={`rounded border px-2 py-1 text-[11px] font-medium transition ${logoInsertAlign === value ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-muted'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">Haz clic en un logo para insertarlo en la posición del cursor</p>
                    {brandLogos.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">No hay logos en la biblioteca. Súbelos desde Gestión &gt; Logos.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                        {brandLogos.map((logo) => (
                          <button
                            key={logo.id}
                            type="button"
                            onClick={() => {
                              insertImageAtCursor(logo.url, logo.nombre || 'Logo', logoInsertWidth, logoInsertAlign);
                              setShowPressLogos(false);
                            }}
                            className="group flex flex-col items-center gap-1 rounded-lg border border-border p-2 hover:border-primary hover:bg-primary/5"
                            title={logo.nombre}
                          >
                            <img src={logo.url} alt={logo.nombre} className="h-10 w-auto object-contain" />
                            <span className="max-w-full truncate text-[10px] text-muted-foreground group-hover:text-primary">{logo.nombre}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                        title="Alinear a la izquierda"
                        aria-label="Alinear a la izquierda"
                      >
                        ⯇
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                        title="Centrar"
                        aria-label="Centrar"
                      >
                        ⯀
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                        title="Alinear a la derecha"
                        aria-label="Alinear a la derecha"
                      >
                        ⯈
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
                        className={`rounded border px-2 py-1 text-xs font-semibold ${
                          editor?.isActive({ textAlign: 'justify' }) ? 'bg-primary text-primary-foreground' : 'bg-background'
                        }`}
                        title="Justificar"
                        aria-label="Justificar"
                      >
                        ☰
                      </button>
                      <span className="mx-1 h-5 w-px bg-border" aria-hidden />
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
                    {editor?.isActive('image') ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2">
                        <span className="text-xs font-semibold text-amber-900">Imagen seleccionada:</span>
                        <span className="text-[11px] font-semibold text-muted-foreground">Tamaño:</span>
                        {(['80px', '120px', '160px', '200px', '40%', '60%', '80%', '100%'] as const).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              const currentAlign = (() => {
                                const s = String((editor?.getAttributes('image') as { htmlStyle?: string } | null)?.htmlStyle || '');
                                if (/margin\s*:\s*[^;]*0\s+auto\b/i.test(s) || /margin\s*:\s*\d+\S*\s+auto\s*;?/i.test(s)) return 'center' as const;
                                if (/margin\s*:\s*[^;]*0\s+0\s+\S+\s+auto/i.test(s)) return 'right' as const;
                                return 'left' as const;
                              })();
                              resizeSelectedImage(w, currentAlign);
                            }}
                            className="rounded border border-border bg-white px-2 py-1 text-[11px] font-medium hover:bg-muted"
                          >
                            {w}
                          </button>
                        ))}
                        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                        <span className="text-[11px] font-semibold text-muted-foreground">Alineación:</span>
                        {([
                          { value: 'left' as const, label: 'Izq' },
                          { value: 'center' as const, label: 'Centro' },
                          { value: 'right' as const, label: 'Dcha' },
                        ]).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              const currentWidth = (() => {
                                const s = String((editor?.getAttributes('image') as { htmlStyle?: string } | null)?.htmlStyle || '');
                                const m = s.match(/width\s*:\s*([^;]+);/i);
                                return m ? m[1].trim() : '160px';
                              })();
                              resizeSelectedImage(currentWidth, value);
                            }}
                            className="rounded border border-border bg-white px-2 py-1 text-[11px] font-medium hover:bg-muted"
                          >
                            {label}
                          </button>
                        ))}
                        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                        <button
                          type="button"
                          onClick={deleteSelectedImage}
                          className="rounded border border-red-300 bg-white px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : null}
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
              )}

              {mode === 'press' && pressSendMode === 'editor' ? (
                <div className="space-y-3 overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50/40 to-white p-4 shadow-sm shadow-sky-100/40 dark:border-sky-800/50 dark:from-sky-950/30 dark:to-card dark:shadow-none">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-200/60">
                      <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M3 9a2 2 0 012-2h2l2-3h6l2 3h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <circle cx="12" cy="13" r="3.5" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-foreground">Fotos para la nota</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Máximo 10 imágenes (JPG, PNG, WEBP). Se enviarán como adjuntos del email.
                      </p>
                    </div>
                    <span className="shrink-0 self-start rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800">
                      {pressPhotoUrls.length}/10
                    </span>
                  </div>
                  <input
                    ref={photosInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setPressPhotoFiles(Array.from(e.target.files || []).slice(0, 10))
                    }
                    className="sr-only"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePhotosButtonClick}
                      disabled={uploadingPhotos || loading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-200/60 transition hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 active:scale-[0.98]"
                    >
                      {uploadingPhotos ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                            <path d="M22 12a10 10 0 01-10 10" />
                          </svg>
                          Subiendo fotos…
                        </>
                      ) : pressPhotoFiles.length > 0 ? (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <path d="M17 8l-5-5-5 5M12 3v12" />
                          </svg>
                          Subir {pressPhotoFiles.length} {pressPhotoFiles.length === 1 ? 'foto' : 'fotos'}
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Seleccionar fotos
                        </>
                      )}
                    </button>
                    <span className="text-xs font-medium text-muted-foreground">
                      {pressPhotoFiles.length} seleccionadas · {pressPhotoUrls.length} subidas
                    </span>
                  </div>
                  {pressPhotoUrls.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2">
                        <span className="text-xs font-semibold text-muted-foreground">Ancho foto en email:</span>
                        {([
                          { value: '20%' as const, label: 'XS' },
                          { value: '30%' as const, label: 'S' },
                          { value: '40%' as const, label: 'M' },
                          { value: '60%' as const, label: 'L' },
                          { value: '80%' as const, label: 'XL' },
                          { value: '100%' as const, label: 'Full' },
                        ]).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEmailPhotoWidth(value)}
                            className={`rounded border px-2 py-1 text-[11px] font-medium transition ${emailPhotoWidth === value ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-muted'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-slate-50 px-3 py-2">
                        <span className="text-xs font-semibold text-muted-foreground">Alineación:</span>
                        {([
                          { value: 'left' as const, label: 'Izquierda' },
                          { value: 'center' as const, label: 'Centro' },
                          { value: 'right' as const, label: 'Derecha' },
                        ]).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setEmailPhotoAlign(value)}
                            className={`rounded border px-2 py-1 text-[11px] font-medium transition ${emailPhotoAlign === value ? 'border-primary bg-primary text-white' : 'border-border bg-white hover:bg-muted'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                        {pressPhotoUrls.map((url) => (
                          <div key={url} className="space-y-1 relative group">
                            <img src={url} alt="Foto nota de prensa" className="h-24 w-full rounded border object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                setPressPhotoUrls((prev) => prev.filter((u) => u !== url));
                                setPressPhotoFiles((prev) => {
                                  const idx = pressPhotoUrls.indexOf(url);
                                  return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
                                });
                                setInsertedPhotoUrls((prev) => prev.filter((u) => u !== url));
                                setWebGallerySelection((prev) => prev.filter((u) => u !== url));
                              }}
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white opacity-0 shadow transition group-hover:opacity-100 hover:bg-red-700"
                              title="Quitar foto"
                            >
                              &times;
                            </button>
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
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}

          {mode === 'press' && pressSendMode === 'pdf' ? (
            <div className="space-y-3 overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/40 to-white p-4 shadow-sm shadow-rose-100/40 dark:border-rose-800/50 dark:from-rose-950/30 dark:to-card dark:shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-200/60">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M8 13h8M8 17h6" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground">Subir PDF de la nota</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    El PDF será el documento principal. Las fotos de prensa van como adjuntos adicionales.
                  </p>
                </div>
              </div>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  setPressPdfFile(e.target.files?.[0] || null);
                  setPressPdfUrl('');
                }}
                className="sr-only"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePdfButtonClick}
                  disabled={uploadingPdf || loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-200/60 transition hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 active:scale-[0.98]"
                >
                  {uploadingPdf ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                        <path d="M22 12a10 10 0 01-10 10" />
                      </svg>
                      Subiendo PDF…
                    </>
                  ) : pressPdfFile ? (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <path d="M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      Subir PDF
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Seleccionar PDF
                    </>
                  )}
                </button>
                {pressPdfFile || pressPdfUrl ? (
                  <button
                    type="button"
                    onClick={handleRemovePdf}
                    disabled={uploadingPdf || loading}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-card dark:hover:bg-red-950/40"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    </svg>
                    Quitar PDF
                  </button>
                ) : null}
                <span className="text-xs font-medium text-muted-foreground">
                  {pressPdfFile ? `Seleccionado: ${pressPdfFile.name}` : pressPdfUrl ? 'PDF listo para enviar' : 'Aún no subido'}
                </span>
              </div>
              {pressPdfUrl ? (
                <a
                  href={pressPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Ver PDF subido
                </a>
              ) : null}
            </div>
          ) : null}

          {/* Adjuntos adicionales — solo en modo prensa */}
          {mode === 'press' ? (
            <div className="space-y-3 overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white p-4 shadow-sm shadow-indigo-100/40 dark:border-indigo-800/50 dark:from-indigo-950/30 dark:to-card dark:shadow-none">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-200/60">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground">Adjuntos adicionales</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Vídeo (MP4, MOV), audio (MP3, WAV), documentos (Word, Excel, PowerPoint), imágenes o ZIP. Máx. 12 MB por archivo.
                  </p>
                </div>
                <span className="shrink-0 self-start rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-800">
                  {pressAttachments.length}/5
                </span>
              </div>

              {/* Lista de adjuntos ya añadidos */}
              {pressAttachments.length > 0 && (
                <ul className="space-y-1.5">
                  {pressAttachments.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm shadow-sm dark:border-indigo-900/60 dark:bg-card">
                      <svg className="h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="flex-1 truncate font-medium text-foreground">{a.name}</span>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-900">
                        {a.size > 1024 * 1024 ? `${(a.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(a.size / 1024)} KB`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPressAttachments((prev) => prev.filter((_, j) => j !== i))}
                        className="shrink-0 rounded-md p-1 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                        aria-label="Eliminar adjunto"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Botón añadir */}
              {pressAttachments.length < 5 && (
                <>
                  <button
                    type="button"
                    disabled={uploadingAttachment}
                    onClick={() => attachInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-card dark:text-indigo-200 dark:hover:bg-indigo-950/40"
                  >
                    {uploadingAttachment ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                          <path d="M22 12a10 10 0 01-10 10" />
                        </svg>
                        Subiendo…
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Añadir adjunto
                      </>
                    )}
                  </button>
                  <input
                    ref={attachInputRef}
                    type="file"
                    className="sr-only"
                    disabled={uploadingAttachment}
                    accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,video/mp4,video/quicktime,video/webm,video/x-msvideo,audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/aac,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,application/zip,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.avi"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setError(null);
                      setUploadingAttachment(true);
                      try {
                        const uploaded = await uploadPressAttachmentFile(file);
                        setPressAttachments((prev) => [...prev, uploaded]);
                      } catch (err: unknown) {
                        setError(err instanceof Error ? err.message : 'Error subiendo adjunto');
                      } finally {
                        setUploadingAttachment(false);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </>
              )}
            </div>
          ) : null}

          <div className="space-y-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/40 to-white p-4 shadow-sm shadow-slate-100/40 dark:border-slate-700/60 dark:from-slate-900/30 dark:to-card dark:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 shadow-md">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Vista previa del envío</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Comprueba cómo verán los destinatarios el correo antes de enviar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendPreview((v) => !v)}
                className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-card dark:text-slate-200 dark:hover:bg-slate-800/40"
              >
                {showSendPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
              </button>
            </div>
            {showSendPreview ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-inner dark:border-slate-700 dark:bg-card">
                <h3 className="mb-1 text-base font-semibold text-foreground">{campaignForm.subject || 'Sin asunto'}</h3>
                {campaignForm.preheader ? (
                  <p className="mb-3 text-xs text-muted-foreground">
                    <span className="font-medium">Preheader:</span> {campaignForm.preheader}
                  </p>
                ) : null}
                {mode === 'press' && pressSendMode === 'pdf' && !pressPdfUrl ? (
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Sube un PDF para ver la vista previa final del envío en modo PDF.
                  </p>
                ) : (
                  <div
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: buildSendPreviewHtml() || '<p>Sin contenido</p>' }}
                  />
                )}
              </div>
            ) : null}
          </div>

          {mode === 'press' && pressSendMode === 'editor' ? (
            <div className="space-y-3 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/40 to-white p-4 shadow-sm shadow-emerald-100/40 dark:border-emerald-800/50 dark:from-emerald-950/30 dark:to-card dark:shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-200/60">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Publicación en web <span className="font-medium text-muted-foreground">(opcional)</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Sube esta nota como noticia o artículo en la web pública además de enviarla por email.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebPreview((v) => !v)}
                  className="shrink-0 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-800 dark:bg-card dark:text-emerald-200 dark:hover:bg-emerald-950/40"
                >
                  {showWebPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
                </button>
              </div>

              <label className="block text-sm font-medium text-foreground">
                Guardar como
                <select
                  value={webContentKind}
                  onChange={(e) => setWebContentKind(e.target.value as 'NOTICIA' | 'ARTICULO')}
                  className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-normal shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200/60 dark:border-emerald-800 dark:bg-card dark:focus:ring-emerald-900/40 md:w-80"
                >
                  <option value="NOTICIA">Noticia de la asociación</option>
                  <option value="ARTICULO">Artículo de la asociación</option>
                </select>
              </label>

              <p className="text-xs text-muted-foreground">
                Si indicas un <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">slug</code> de pueblo, se publicará también en ese pueblo sin quitarlo de asociación.
              </p>

              {pressPhotoUrls.length > 0 ? (
                <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-3">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                    <p className="text-sm font-semibold text-green-800">Galería de fotos para la web</p>
                  </div>
                  <p className="text-xs text-green-700">
                    Todas las fotos se subirán como <strong>galería</strong> con carrusel. La primera foto será la imagen principal (hero).
                  </p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    {pressPhotoUrls.map((url, idx) => (
                      <div
                        key={`web-gal-${url}`}
                        className={`space-y-1 rounded border-2 p-1 text-xs ${
                          idx === 0 ? 'border-amber-400 bg-amber-50' : 'border-green-300 bg-white'
                        }`}
                      >
                        <img src={url} alt={`Foto ${idx + 1}`} className="h-20 w-full rounded object-cover" />
                        <span className={`block text-center text-[11px] font-semibold ${idx === 0 ? 'text-amber-900' : 'text-green-700'}`}>
                          {idx === 0 ? 'Principal (hero)' : `Galería ${idx}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {showWebPreview ? (
                <div className="rounded-md border border-border bg-background p-3">
                  <h3 className="mb-2 text-base font-semibold">{campaignForm.subject || 'Vista previa sin título'}</h3>
                  <div
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: buildWebPreviewHtml() || '<p>Sin contenido</p>' }}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePublishWeb}
                  disabled={publishingWeb || loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-200/60 transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 active:scale-[0.98]"
                >
                  {publishingWeb ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                        <path d="M22 12a10 10 0 01-10 10" />
                      </svg>
                      Subiendo a la web…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <path d="M17 8l-5-5-5 5M12 3v12" />
                      </svg>
                      Subir a la web
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {mode === 'newsletter' ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
              {loadingNewsletterRecipientCount ? (
                'Calculando destinatarios de newsletter...'
              ) : (
                <>
                  Se enviará a <strong>{newsletterRecipientCount ?? 0}</strong>{' '}
                  {campaignForm.source.trim()
                    ? `suscriptores del origen "${campaignForm.source.trim()}".`
                    : 'suscriptores activos.'}
                </>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetAllFields}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
              title="Limpiar todo y empezar de cero"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Nueva nota
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                void saveNlDraft();
              }}
              disabled={loading}
              className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={() => {
                void refreshNlDrafts();
                setShowNlDraftsModal(true);
              }}
              disabled={loading}
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-60"
            >
              Borradores ({nlDrafts.length})
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
              type="button"
              disabled={sendingTest || loading}
              onClick={handleTestSend}
              className="rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
              title="Envía una prueba a asociacion@ e info@lospueblosmasbonitosdeespana.org"
            >
              {sendingTest ? 'Enviando prueba…' : 'Envío prueba'}
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

      <DraftsAndScheduler
        kind={mode === 'press' ? 'PRESS' : 'NEWSLETTER'}
        getSnapshot={getSharedSnapshot}
        onLoadDraft={loadSharedDraft}
        onAfterSend={() => loadData()}
      />

      <section id="ultimas-campanias" className="rounded-xl border border-border bg-card p-5">
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
                <th className="px-2 py-2 text-right">Entregados</th>
                <th className="px-2 py-2 text-right">Rebotados</th>
                <th className="px-2 py-2 text-right">Aperturas</th>
                <th className="px-2 py-2 text-right"></th>
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
                  <tr key={c.id} className="border-b border-border hover:bg-slate-50 transition-colors">
                    <td className="px-2 py-2 text-xs">{fmtDate(c.sentAt || c.createdAt)}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.kind === 'NEWSLETTER' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                      }`}>{c.kind === 'NEWSLETTER' ? 'Newsletter' : 'Prensa'}</span>
                    </td>
                    <td className="px-2 py-2 max-w-xs">
                      <a
                        href={`/gestion/asociacion/notas-prensa-newsletter/${c.kind === 'NEWSLETTER' ? 'newsletter' : 'notas-prensa'}/campanas/${c.id}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {c.subject}
                      </a>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                        c.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-2 py-2 text-right">{c.totalRecipients}</td>
                    <td className="px-2 py-2 text-right">
                      <span className="font-medium text-green-600">{c.deliveredCount || 0}</span>
                      {c.totalRecipients > 0 && (
                        <span className="text-xs text-slate-400 ml-1">
                          ({((c.deliveredCount || 0) / c.totalRecipients * 100).toFixed(0)}%)
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {(c.bouncedCount || 0) > 0 ? (
                        <span className="font-medium text-red-600">{c.bouncedCount}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      {c.openedCount > 0 ? (
                        <span className="font-medium text-green-600">
                          {c.openedCount}
                          <span className="text-xs text-slate-400 ml-1">
                            ({((c.openedCount / c.totalRecipients) * 100).toFixed(1)}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400" title="Activa Open Tracking en Resend para ver aperturas">–</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={syncingCampaignId === c.id}
                          onClick={async () => {
                            setSyncingCampaignId(c.id);
                            setError(null);
                            setMessage(null);
                            try {
                              const res = await fetch(`/api/admin/newsletter/campaigns/${c.id}/sync-metrics`, { method: 'POST' });
                              const data = await res.json().catch(() => ({}));
                              if (!res.ok) throw new Error(data?.message || 'Error sincronizando');
                              setMessage(`Métricas actualizadas: ${data.opened || 0} aperturas, ${data.delivered || 0} entregados, ${data.bounced || 0} rebotados (de ${data.total || 0} consultados)`);
                              await loadData();
                            } catch (e: any) {
                              setError(e?.message || 'Error sincronizando métricas');
                            } finally {
                              setSyncingCampaignId(null);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
                            syncingCampaignId === c.id
                              ? 'border-green-300 bg-green-100 text-green-800 cursor-wait'
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {syncingCampaignId === c.id ? (
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                          ) : (
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-3-6.7" /><path d="M21 3v6h-6" /></svg>
                          )}
                          {syncingCampaignId === c.id ? 'Sincronizando…' : 'Actualizar'}
                        </button>
                        {(() => {
                          const delivered = (c.deliveredCount || 0) + (c.bouncedCount || 0);
                          const gap = (c.totalRecipients || 0) - delivered;
                          if (c.status !== 'SENT' || gap <= 0) return null;
                          return (
                            <button
                              type="button"
                              disabled={resendingCampaignId === c.id}
                              title={`Reenviar a los ${gap} destinatarios que no recibieron el email`}
                              onClick={async () => {
                                if (!window.confirm(`Reenviar el correo a los ${gap} destinatarios que no lo recibieron?\n\nLos que ya lo tienen (${delivered}) NO se verán afectados.`)) return;
                                setResendingCampaignId(c.id);
                                setError(null);
                                setMessage(null);
                                try {
                                  const res = await fetch(`/api/admin/newsletter/campaigns/${c.id}/resend-failed`, { method: 'POST' });
                                  const data = await res.json().catch(() => ({}));
                                  if (!res.ok) throw new Error(data?.message || 'Error reenviando');
                                  setMessage(`Reenvío completado: ${data.resent || 0} enviados, ${data.failed || 0} fallidos (de ${data.attempted || gap} intentos).`);
                                  await loadData();
                                } catch (e: any) {
                                  setError(e?.message || 'Error reenviando fallidos');
                                } finally {
                                  setResendingCampaignId(null);
                                }
                              }}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition ${
                                resendingCampaignId === c.id
                                  ? 'border-orange-300 bg-orange-100 text-orange-800 cursor-wait'
                                  : 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                              }`}
                            >
                              {resendingCampaignId === c.id ? (
                                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                              ) : (
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4v6h6" /><path d="M20 20v-6h-6" /><path d="M4 10a8 8 0 0 1 14-4" /><path d="M20 14a8 8 0 0 1-14 4" /></svg>
                              )}
                              {resendingCampaignId === c.id ? 'Reenviando…' : `Reenviar ${gap}`}
                            </button>
                          );
                        })()}
                        <a
                          href={`/gestion/asociacion/notas-prensa-newsletter/${c.kind === 'NEWSLETTER' ? 'newsletter' : 'notas-prensa'}/campanas/${c.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          Ver métricas &rarr;
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showNlDraftsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNlDraftsModal(false)}>
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowNlDraftsModal(false)} className="absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-bold hover:bg-muted">Cerrar</button>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-base font-bold">
                Borradores compartidos ({mode === 'newsletter' ? 'Newsletter' : 'Notas de prensa'})
              </p>
              <button
                type="button"
                onClick={() => { void refreshNlDrafts(); }}
                className="rounded-md border border-border bg-white px-2.5 py-1 text-xs font-semibold hover:bg-muted"
                title="Refrescar lista"
              >
                Refrescar
              </button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Todos los admins ven los mismos borradores. Lo que guardes aquí estará disponible para el resto del equipo.
            </p>
            {nlDrafts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Aún no hay borradores. Pulsa &quot;Guardar borrador&quot; para crear el primero.
              </p>
            ) : (
              <div className="space-y-2">
                {nlDrafts.map((d) => {
                  const blocks = d.payload && typeof d.payload === 'object' && Array.isArray((d.payload as any).newsletterBlocks)
                    ? (d.payload as any).newsletterBlocks.length as number
                    : null;
                  const stateLabel = d.status === 'SCHEDULED'
                    ? `Programado · ${d.scheduledAt ? new Date(d.scheduledAt).toLocaleString('es-ES', { hour12: false }) : ''}`
                    : d.status === 'FAILED'
                      ? 'Fallido'
                      : 'Borrador';
                  return (
                    <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{d.name}</p>
                        {d.subject && d.subject !== d.name ? (
                          <p className="truncate text-xs text-muted-foreground">Asunto: {d.subject}</p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {stateLabel} · Actualizado {new Date(d.savedAt).toLocaleString('es-ES', { hour12: false })}
                          {blocks != null ? ` · ${blocks} bloques` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => { void loadNlDraft(d.id); }}
                          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm(`¿Eliminar "${d.name}"? Se borra para todos los admins.`)) return;
                            void deleteNlDraft(d.id);
                          }}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {editingImageBlockId && (() => {
        const blk = newsletterBlocks.find((b) => b.id === editingImageBlockId);
        if (!blk || !blk.url) return null;
        return (
          <ImageEditorModal
            imageUrl={blk.url}
            alt={blk.content || ''}
            onClose={() => setEditingImageBlockId(null)}
            onApply={(result) => {
              updateNewsletterBlock(blk.id, {
                url: result.url,
                content: result.alt || blk.content || '',
              });
              setEditingImageBlockId(null);
            }}
            onUploadCropped={async (file) => {
              const fd = new FormData();
              fd.append('file', file);
              fd.append('folder', 'newsletter/templates');
              fd.append('fileNameBase', uploadFileNameBase);
              const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data?.url) throw new Error('Error subiendo imagen recortada');
              return data.url;
            }}
          />
        );
      })()}
    </div>
  );
}
