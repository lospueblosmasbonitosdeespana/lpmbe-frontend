'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const ImageEditorModal = dynamic(() => import('./ImageEditorModal'), { ssr: false });
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType =
  | 'heading' | 'text' | 'image' | 'button' | 'iconButton'
  | 'columns2' | 'columns3' | 'gallery' | 'figure' | 'imgText'
  | 'socialLinks' | 'countdown' | 'divider';

export interface ContentBlock {
  id: string;
  type: BlockType;
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
  // Image editor fields
  imgWidth?: number;
  imgHeight?: number;
  imgLinkUrl?: string;
  imgBorderRadius?: number;
  imgPaddingV?: number;
  imgPaddingH?: number;
}

interface BuilderTemplate {
  id: number;
  kind: 'NEWSLETTER' | 'PRESS';
  name: string;
  subject: string;
  contentHtml: string;
  blocksJson: unknown;
  isDefault?: boolean;
  puebloId?: number | null;
  metadata?: {
    category?: string;
    description?: string;
    thumbnailUrl?: string;
    theme?: string;
    themeLabel?: string;
  };
  updatedAt?: string;
}

interface ContentBlockBuilderProps {
  /** HTML inicial para cargar en el constructor */
  initialHtml?: string;
  /** Bloques iniciales */
  initialBlocks?: ContentBlock[];
  /** Se llama cuando el HTML cambia (al sincronizar) */
  onChange?: (html: string) => void;
  /** Clave para persistir borrador en localStorage */
  draftKey?: string;
  /** Si es false, oculta la librería de logos de marca (asociación). Por defecto true. */
  showBrandLogos?: boolean;
  /** ID del pueblo para mostrar y gestionar logos propios del ayuntamiento */
  puebloId?: number;
  /** Nombre del pueblo (para mostrar en la sección de logos) */
  puebloNombre?: string;
  /**
   * Cuando true, los bloques con fondo blanco (#ffffff) se renderizan sin background
   * para integrarse con el fondo de la página web. Usar false para emails/newsletter
   * donde el fondo blanco explícito es necesario. Por defecto: false.
   */
  webMode?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escHtml(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createBlock(type: BlockType, patch: Partial<ContentBlock> = {}): ContentBlock {
  return {
    id: newId(),
    type,
    content:
      type === 'heading' ? 'Nuevo titular'
      : type === 'text' ? 'Nuevo párrafo de contenido'
      : type === 'button' ? 'Llamada a la acción'
      : type === 'figure' || type === 'imgText' ? 'Texto al lado de la imagen'
      : '',
    label: type === 'button' ? 'Leer más' : type === 'iconButton' ? 'Icono' : '',
    url: ['image', 'figure', 'imgText', 'button'].includes(type) ? 'https://...' : '',
    iconUrl: type === 'iconButton' ? 'https://...' : '',
    caption: type === 'figure' ? 'Pie de imagen' : '',
    colLeft: ['columns2', 'columns3'].includes(type) ? 'Columna izquierda' : '',
    colRight: ['columns2', 'columns3'].includes(type) ? 'Columna derecha' : '',
    colCenter: type === 'columns3' ? 'Columna central' : '',
    imageUrls: type === 'gallery' ? [] : undefined,
    socialFacebook: type === 'socialLinks' ? 'https://www.facebook.com/lospueblosmasbonitos/' : '',
    socialTwitter: type === 'socialLinks' ? 'https://x.com/lospueblosmbe' : '',
    socialInstagram: type === 'socialLinks' ? 'https://www.instagram.com/lospueblosmbe/' : '',
    socialLinkedin: '',
    socialYoutube: type === 'socialLinks' ? 'https://www.youtube.com/@lospueblosmasbonitos' : '',
    countdownDate: type === 'countdown' ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) : '',
    countdownLabel: type === 'countdown' ? 'No te lo pierdas' : '',
    align: ['socialLinks', 'gallery', 'countdown'].includes(type) ? 'center' : 'left',
    backgroundColor: type === 'countdown' ? '#1a1a2e' : '#ffffff',
    textColor: type === 'countdown' ? '#ffffff' : '#111111',
    paddingY: 10,
    borderRadius: 8,
    ...patch,
  };
}

function normalizeBlocks(value: unknown): ContentBlock[] {
  if (!value) return [];
  try {
    const arr = Array.isArray(value) ? value : JSON.parse(String(value));
    if (!Array.isArray(arr)) return [];
    return arr.map((b) => {
      const src = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>;
      const alignRaw = String(src.align || 'left');
      const align = (alignRaw === 'center' || alignRaw === 'right' ? alignRaw : 'left') as 'left' | 'center' | 'right';
      return {
        id: String(src.id || newId()),
        type: String(src.type || 'text') as BlockType,
        content: String(src.content || ''),
        url: String(src.url || ''),
        iconUrl: String(src.iconUrl || ''),
        label: String(src.label || ''),
        colLeft: String(src.colLeft || ''),
        colRight: String(src.colRight || ''),
        colCenter: String(src.colCenter || ''),
        caption: String(src.caption || ''),
        imageUrls: Array.isArray(src.imageUrls) ? (src.imageUrls as string[]) : [],
        socialFacebook: String(src.socialFacebook || ''),
        socialTwitter: String(src.socialTwitter || ''),
        socialInstagram: String(src.socialInstagram || ''),
        socialLinkedin: String(src.socialLinkedin || ''),
        socialYoutube: String(src.socialYoutube || ''),
        countdownDate: String(src.countdownDate || ''),
        countdownLabel: String(src.countdownLabel || ''),
        align,
        backgroundColor: String(src.backgroundColor || '#ffffff'),
        textColor: String(src.textColor || '#111111'),
        paddingY: Number(src.paddingY ?? 10),
        borderRadius: Number(src.borderRadius ?? 8),
      };
    });
  } catch {
    return [];
  }
}

function renderBlocksToHtml(blocks: ContentBlock[], webMode = false): string {
  if (!blocks.length) return '';
  const parts: string[] = [];
  for (const b of blocks) {
    // En webMode, '#ffffff' se trata como "sin fondo" para que los bloques se integren
    // con el fondo de la página web. Solo se aplica background si es un color distinto.
    // En modo email/newsletter (webMode=false), siempre se aplica el background.
    const bg = webMode
      ? (b.backgroundColor && b.backgroundColor !== '#ffffff' ? b.backgroundColor : '')
      : (b.backgroundColor || '#ffffff');
    const tc = b.textColor || '#111111';
    const py = b.paddingY ?? 10;
    const br = b.borderRadius ?? 8;
    const align = b.align || 'left';
    const wrapStyle = `${bg ? `background:${bg};` : ''}color:${tc};padding:${py}px 16px;border-radius:${br}px;`;

    if (b.type === 'heading') {
      parts.push(`<div style="${wrapStyle}text-align:${align};"><h2 style="margin:0;font-size:24px;font-weight:700;">${b.content || ''}</h2></div>`);
    } else if (b.type === 'text') {
      parts.push(`<div style="${wrapStyle}text-align:${align};">${b.content || ''}</div>`);
    } else if (b.type === 'image') {
      if (b.url && b.url !== 'https://...') {
        const imgStyle = [
          b.imgWidth ? `width:${b.imgWidth}px` : 'max-width:100%',
          b.imgHeight ? `height:${b.imgHeight}px` : 'height:auto',
          'display:inline-block',
          b.imgBorderRadius ? `border-radius:${b.imgBorderRadius}px` : '',
          b.imgPaddingV || b.imgPaddingH ? `padding:${b.imgPaddingV || 0}px ${b.imgPaddingH || 0}px` : '',
        ].filter(Boolean).join(';');
        const imgTag = `<img src="${escHtml(b.url)}" alt="${escHtml(b.content || '')}" style="${imgStyle}" />`;
        const wrapped = b.imgLinkUrl ? `<a href="${escHtml(b.imgLinkUrl)}" target="_blank" style="display:inline-block;">${imgTag}</a>` : imgTag;
        parts.push(`<div style="${wrapStyle}text-align:${align};">${wrapped}</div>`);
      }
    } else if (b.type === 'button') {
      parts.push(`<div style="${wrapStyle}text-align:${align};"><a href="${escHtml(b.url || '#')}" style="display:inline-block;padding:12px 28px;background:#c0392b;color:#fff;border-radius:${br}px;text-decoration:none;font-weight:600;">${escHtml(b.label || b.content || 'Leer más')}</a></div>`);
    } else if (b.type === 'iconButton') {
      const iconHtml = b.iconUrl && b.iconUrl !== 'https://...'
        ? `<img src="${escHtml(b.iconUrl)}" alt="${escHtml(b.label || '')}" style="width:48px;height:48px;object-fit:contain;display:block;margin:0 auto;" />`
        : `<div style="width:48px;height:48px;background:#c0392b;border-radius:8px;margin:0 auto;"></div>`;
      parts.push(`<div style="${wrapStyle}text-align:center;"><a href="${escHtml(b.url || '#')}" style="display:inline-block;padding:12px;background:${bg};border:2px solid #c0392b;border-radius:${br}px;text-decoration:none;">${iconHtml}<span style="display:block;margin-top:6px;font-size:12px;color:${tc};">${escHtml(b.label || 'Icono')}</span></a></div>`);
    } else if (b.type === 'divider') {
      parts.push(`<div style="padding:8px 0;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></div>`);
    } else if (b.type === 'columns2') {
      parts.push(`<div style="${wrapStyle}"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="50%" style="padding:8px;vertical-align:top;">${b.colLeft || ''}</td><td width="50%" style="padding:8px;vertical-align:top;">${b.colRight || ''}</td></tr></table></div>`);
    } else if (b.type === 'columns3') {
      parts.push(`<div style="${wrapStyle}"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="33%" style="padding:8px;vertical-align:top;">${b.colLeft || ''}</td><td width="33%" style="padding:8px;vertical-align:top;">${b.colCenter || ''}</td><td width="34%" style="padding:8px;vertical-align:top;">${b.colRight || ''}</td></tr></table></div>`);
    } else if (b.type === 'gallery') {
      const imgs = (b.imageUrls || []).filter((u) => u && u !== 'https://...');
      if (imgs.length) {
        // Renderizar en cuadrícula de 2 columnas (máx 4 imágenes, 2 filas × 2 cols)
        const rows: string[] = [];
        for (let i = 0; i < imgs.length; i += 2) {
          const pair = imgs.slice(i, i + 2);
          const cells = pair.map((u) => `<td width="50%" style="padding:4px;"><img src="${escHtml(u)}" style="width:100%;height:160px;object-fit:cover;display:block;border-radius:6px;" /></td>`).join('');
          // Si la fila tiene solo 1 imagen, añadir celda vacía para mantener el layout
          const rowCells = pair.length === 1 ? cells + '<td width="50%" style="padding:4px;"></td>' : cells;
          rows.push(`<tr>${rowCells}</tr>`);
        }
        parts.push(`<div style="${wrapStyle}"><table width="100%" cellpadding="0" cellspacing="0">${rows.join('')}</table></div>`);
      } else {
        // Sin imágenes: marcador visible en el gestor (no renderiza nada en público si no hay src)
        parts.push(`<div style="${wrapStyle}border:2px dashed #e5e7eb;text-align:center;color:#9ca3af;font-size:13px;">📷 Galería (sin imágenes subidas aún)</div>`);
      }
    } else if (b.type === 'figure') {
      if (b.url && b.url !== 'https://...') {
        parts.push(`<figure style="${wrapStyle}text-align:${align};margin:0;"><img src="${escHtml(b.url)}" alt="${escHtml(b.caption || '')}" style="max-width:100%;height:auto;" /><figcaption style="margin-top:6px;font-size:13px;color:#666;">${escHtml(b.caption || '')}</figcaption></figure>`);
      }
    } else if (b.type === 'imgText') {
      if (b.url && b.url !== 'https://...') {
        parts.push(`<div style="${wrapStyle}"><table width="100%" cellpadding="0" cellspacing="0"><tr><td width="40%" style="padding:8px;vertical-align:top;"><img src="${escHtml(b.url)}" style="width:100%;height:auto;display:block;" /></td><td width="60%" style="padding:8px;vertical-align:top;">${b.content || ''}</td></tr></table></div>`);
      } else {
        parts.push(`<div style="${wrapStyle}">${b.content || ''}</div>`);
      }
    } else if (b.type === 'socialLinks') {
      const iconSize = 40;
      const links: string[] = [];
      // Facebook
      if (b.socialFacebook) links.push(
        `<a href="${escHtml(b.socialFacebook)}" style="display:inline-block;margin:0 6px;text-decoration:none;" title="Facebook">` +
        `<table cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="background:#1877F2;border-radius:50%;width:${iconSize}px;height:${iconSize}px;text-align:center;vertical-align:middle;">` +
        `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/facebook.svg" width="20" height="20" style="filter:invert(1);display:block;margin:10px auto;" alt="Facebook" />` +
        `</td></tr></table></a>`
      );
      // X / Twitter
      if (b.socialTwitter) links.push(
        `<a href="${escHtml(b.socialTwitter)}" style="display:inline-block;margin:0 6px;text-decoration:none;" title="X">` +
        `<table cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="background:#000000;border-radius:50%;width:${iconSize}px;height:${iconSize}px;text-align:center;vertical-align:middle;">` +
        `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/x.svg" width="20" height="20" style="filter:invert(1);display:block;margin:10px auto;" alt="X" />` +
        `</td></tr></table></a>`
      );
      // Instagram
      if (b.socialInstagram) links.push(
        `<a href="${escHtml(b.socialInstagram)}" style="display:inline-block;margin:0 6px;text-decoration:none;" title="Instagram">` +
        `<table cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);border-radius:50%;width:${iconSize}px;height:${iconSize}px;text-align:center;vertical-align:middle;">` +
        `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/instagram.svg" width="20" height="20" style="filter:invert(1);display:block;margin:10px auto;" alt="Instagram" />` +
        `</td></tr></table></a>`
      );
      // LinkedIn
      if (b.socialLinkedin) links.push(
        `<a href="${escHtml(b.socialLinkedin)}" style="display:inline-block;margin:0 6px;text-decoration:none;" title="LinkedIn">` +
        `<table cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="background:#0077B5;border-radius:50%;width:${iconSize}px;height:${iconSize}px;text-align:center;vertical-align:middle;">` +
        `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linkedin.svg" width="20" height="20" style="filter:invert(1);display:block;margin:10px auto;" alt="LinkedIn" />` +
        `</td></tr></table></a>`
      );
      // YouTube
      if (b.socialYoutube) links.push(
        `<a href="${escHtml(b.socialYoutube)}" style="display:inline-block;margin:0 6px;text-decoration:none;" title="YouTube">` +
        `<table cellpadding="0" cellspacing="0" style="display:inline-table;"><tr><td style="background:#FF0000;border-radius:50%;width:${iconSize}px;height:${iconSize}px;text-align:center;vertical-align:middle;">` +
        `<img src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/youtube.svg" width="20" height="20" style="filter:invert(1);display:block;margin:10px auto;" alt="YouTube" />` +
        `</td></tr></table></a>`
      );
      if (links.length) {
        parts.push(`<div style="${wrapStyle}text-align:center;">${links.join('')}</div>`);
      }
    } else if (b.type === 'countdown') {
      const targetDate = b.countdownDate ? new Date(b.countdownDate) : new Date(Date.now() + 7 * 86400000);
      const now = new Date();
      const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
      const days = Math.floor(diffMs / 86400000);
      const hours = Math.floor((diffMs % 86400000) / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      const cell = (n: number, lbl: string) =>
        `<td style="padding:0 8px;text-align:center;"><span style="display:block;font-size:36px;font-weight:700;color:${tc};">${String(n).padStart(2, '0')}</span><span style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${tc};opacity:0.7;">${lbl}</span></td>`;
      parts.push(`<div style="${wrapStyle}text-align:center;">${b.countdownLabel ? `<p style="margin:0 0 12px;font-size:16px;font-weight:600;color:${tc};">${escHtml(b.countdownLabel)}</p>` : ''}<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>${cell(days,'Días')}${cell(hours,'Horas')}${cell(mins,'Min')}${cell(secs,'Seg')}</tr></table><p style="margin:12px 0 0;font-size:12px;color:${tc};opacity:0.6;">${targetDate.toLocaleString('es-ES')}</p></div>`);
    }
  }
  return parts.join('\n');
}

// ─── Theme helpers ────────────────────────────────────────────────────────────

function getThemeKey(t: BuilderTemplate): string {
  const m = t.metadata;
  if (m?.theme) return m.theme;
  if (m?.category === 'prensa') return 'prensa';
  if (m?.category === 'articulo') return 'articulo';
  if (m?.category === 'newsletter') return 'newsletter';
  return 'otros';
}

function getThemeLabel(t: BuilderTemplate): string | undefined {
  const m = t.metadata;
  if (m?.themeLabel) return m.themeLabel;
  const map: Record<string, string> = {
    prensa: 'Notas de prensa', articulo: 'Artículos', newsletter: 'Newsletter',
    evento: 'Eventos', cartel_pueblo: 'Carteles', tema_gastronomia: 'Gastronomía',
    tema_naturaleza: 'Naturaleza', tema_cultura: 'Cultura', tema_familia: 'En familia',
    tema_petfriendly: 'Pet friendly', otros: 'Otros',
  };
  return map[getThemeKey(t)];
}

const THEME_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'prensa', label: 'Prensa' },
  { value: 'articulo', label: 'Artículos' },
  { value: 'evento', label: 'Eventos' },
  { value: 'cartel_pueblo', label: 'Carteles' },
  { value: 'tema_gastronomia', label: 'Gastronomía' },
  { value: 'tema_naturaleza', label: 'Naturaleza' },
  { value: 'tema_cultura', label: 'Cultura' },
  { value: 'tema_familia', label: 'En familia' },
  { value: 'tema_petfriendly', label: 'Pet friendly' },
];

// ─── Palette icon ─────────────────────────────────────────────────────────────

function PaletteIcon({ type }: { type: BlockType }) {
  if (type === 'heading') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="3" y="5" width="18" height="3" rx="1.5" fill="currentColor" /><rect x="3" y="10.5" width="12" height="2.5" rx="1.25" fill="currentColor" opacity="0.85" /><rect x="3" y="15.5" width="14" height="2.5" rx="1.25" fill="currentColor" opacity="0.65" /></svg>;
  if (type === 'text') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="3" y="6" width="18" height="2.2" rx="1.1" fill="currentColor" /><rect x="3" y="10.2" width="18" height="2.2" rx="1.1" fill="currentColor" opacity="0.85" /><rect x="3" y="14.4" width="16" height="2.2" rx="1.1" fill="currentColor" opacity="0.7" /></svg>;
  if (type === 'image') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" /><circle cx="9" cy="9" r="1.7" fill="currentColor" /><path d="M5.5 18l4.8-5 3.3 3.2 2.5-2.4 2.4 4.2z" fill="currentColor" opacity="0.85" /></svg>;
  if (type === 'button') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="4" y="7" width="16" height="10" rx="3" fill="currentColor" /><rect x="8" y="11" width="8" height="2" rx="1" fill="#fff" /></svg>;
  if (type === 'iconButton') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" /><circle cx="12" cy="12" r="3" fill="#fff" /></svg>;
  if (type === 'columns2') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" /><rect x="5.2" y="7.2" width="5.8" height="9.6" rx="1.2" fill="currentColor" opacity="0.9" /><rect x="13" y="7.2" width="5.8" height="9.6" rx="1.2" fill="currentColor" opacity="0.65" /></svg>;
  if (type === 'columns3') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" /><rect x="4.8" y="7.2" width="3.8" height="9.6" rx="1" fill="currentColor" opacity="0.9" /><rect x="10.1" y="7.2" width="3.8" height="9.6" rx="1" fill="currentColor" opacity="0.75" /><rect x="15.4" y="7.2" width="3.8" height="9.6" rx="1" fill="currentColor" opacity="0.6" /></svg>;
  if (type === 'gallery') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="2" y="5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.9" /><rect x="13.5" y="5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.7" /><rect x="2" y="13.5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.6" /><rect x="13.5" y="13.5" width="8.5" height="6.5" rx="1.5" fill="currentColor" opacity="0.45" /></svg>;
  if (type === 'figure') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="3" y="3" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" /><circle cx="9" cy="8" r="1.5" fill="currentColor" /><path d="M5.5 15l4.2-4.3 3 2.8 2.3-2.1 2.5 3.6z" fill="currentColor" opacity="0.8" /><rect x="5" y="19" width="14" height="2" rx="1" fill="currentColor" opacity="0.5" /></svg>;
  if (type === 'imgText') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><rect x="2" y="5" width="9" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" /><circle cx="6.5" cy="10" r="1.2" fill="currentColor" /><path d="M3.5 16l2.5-3 2 1.8 1.5-1.3 1.5 2.5z" fill="currentColor" opacity="0.7" /><rect x="13.5" y="6" width="8.5" height="2" rx="1" fill="currentColor" opacity="0.9" /><rect x="13.5" y="10" width="8.5" height="1.6" rx="0.8" fill="currentColor" opacity="0.7" /><rect x="13.5" y="13.2" width="7" height="1.6" rx="0.8" fill="currentColor" opacity="0.55" /></svg>;
  if (type === 'socialLinks') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" /><circle cx="7" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="7" r="2" fill="currentColor" /><circle cx="17" cy="12" r="2" fill="currentColor" /><path d="M9 12h3M12 9v3" stroke="currentColor" strokeWidth="1.5" /></svg>;
  if (type === 'countdown') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none" /><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  if (type === 'divider') return <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" /></svg>;
  return null;
}

// ─── Block Rich Editor ────────────────────────────────────────────────────────

function BlockRichEditor({ content, onChange, placeholder }: { content: string; onChange: (html: string) => void; placeholder?: string }) {
  const ed = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline, TextStyle, Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript, Superscript,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder || 'Escribe aquí...' }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: { attributes: { class: 'min-h-[120px] rounded-b-md border border-t-0 border-border bg-background px-3 py-2 text-sm focus:outline-none prose prose-sm max-w-none' } },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!ed) return;
    if (ed.getHTML() !== content && content !== undefined) {
      ed.commands.setContent(content || '<p></p>', { emitUpdate: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!ed) return null;
  const btn = (active: boolean) => `px-1.5 py-1 rounded text-xs font-semibold transition ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`;

  function promptLink() {
    const prev = ed!.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL del enlace', prev || 'https://');
    if (url === null) return;
    if (!url.trim()) { ed!.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    ed!.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  return (
    <div className="md:col-span-2">
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-md border border-border bg-muted/50 px-1.5 py-1">
        <button type="button" onClick={() => ed.chain().focus().toggleBold().run()} className={btn(ed.isActive('bold'))} title="Negrita"><strong>B</strong></button>
        <button type="button" onClick={() => ed.chain().focus().toggleItalic().run()} className={btn(ed.isActive('italic'))} title="Cursiva"><em>I</em></button>
        <button type="button" onClick={() => ed.chain().focus().toggleUnderline().run()} className={btn(ed.isActive('underline'))} title="Subrayado"><span className="underline">U</span></button>
        <button type="button" onClick={() => ed.chain().focus().toggleStrike().run()} className={btn(ed.isActive('strike'))} title="Tachado"><span className="line-through">S</span></button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => ed.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(ed.isActive('heading', { level: 1 }))}>H1</button>
        <button type="button" onClick={() => ed.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(ed.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={() => ed.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(ed.isActive('heading', { level: 3 }))}>H3</button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => ed.chain().focus().toggleBulletList().run()} className={btn(ed.isActive('bulletList'))} title="Lista">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><circle cx="3" cy="5" r="1.5" /><rect x="7" y="4" width="11" height="2" rx="1" /><circle cx="3" cy="10" r="1.5" /><rect x="7" y="9" width="11" height="2" rx="1" /><circle cx="3" cy="15" r="1.5" /><rect x="7" y="14" width="11" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => ed.chain().focus().toggleOrderedList().run()} className={btn(ed.isActive('orderedList'))} title="Numerada">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><text x="1" y="7" fontSize="6" fontWeight="bold">1</text><rect x="7" y="4" width="11" height="2" rx="1" /><text x="1" y="12" fontSize="6" fontWeight="bold">2</text><rect x="7" y="9" width="11" height="2" rx="1" /></svg>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => ed.chain().focus().setTextAlign('left').run()} className={btn(ed.isActive({ textAlign: 'left' }))} title="Izquierda">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="2" y="9" width="10" height="2" rx="1" /><rect x="2" y="14" width="14" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => ed.chain().focus().setTextAlign('center').run()} className={btn(ed.isActive({ textAlign: 'center' }))} title="Centro">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="5" y="9" width="10" height="2" rx="1" /><rect x="3" y="14" width="14" height="2" rx="1" /></svg>
        </button>
        <button type="button" onClick={() => ed.chain().focus().setTextAlign('right').run()} className={btn(ed.isActive({ textAlign: 'right' }))} title="Derecha">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1" /><rect x="8" y="9" width="10" height="2" rx="1" /><rect x="4" y="14" width="14" height="2" rx="1" /></svg>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={promptLink} className={btn(ed.isActive('link'))} title="Enlace">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M8.5 11.5a3.5 3.5 0 004.95 0l2.12-2.12a3.5 3.5 0 00-4.95-4.95L9.5 5.55" stroke="currentColor" strokeWidth="1.5" fill="none" /><path d="M11.5 8.5a3.5 3.5 0 00-4.95 0l-2.12 2.12a3.5 3.5 0 004.95 4.95l1.12-1.12" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </button>
        <button type="button" onClick={() => { const c = window.prompt('Color (hex)', '#000000'); if (c) ed.chain().focus().setColor(c.trim()).run(); }} className={btn(false)} title="Color">
          <span className="flex flex-col items-center leading-none"><span className="text-[11px] font-bold">A</span><span className="mt-px h-1 w-3 rounded-sm bg-red-500" /></span>
        </button>
        <button type="button" onClick={() => { const c = window.prompt('Resaltado (hex)', '#ffe066'); if (c) ed.chain().focus().toggleHighlight({ color: c.trim() }).run(); }} className={btn(ed.isActive('highlight'))} title="Resaltar">
          <span className="rounded bg-yellow-200 px-0.5 text-[11px] font-bold">A</span>
        </button>
        <span className="mx-0.5 h-4 w-px bg-border" />
        <button type="button" onClick={() => ed.chain().focus().undo().run()} className={btn(false)} title="Deshacer">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M5 8l-3-3 3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 5h10a5 5 0 010 10H8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
        <button type="button" onClick={() => ed.chain().focus().redo().run()} className={btn(false)} title="Rehacer">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M15 8l3-3-3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M18 5H8a5 5 0 000 10h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" /></svg>
        </button>
        <button type="button" onClick={() => ed.chain().focus().clearNodes().unsetAllMarks().run()} className={btn(false)} title="Limpiar">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><text x="7" y="12" fontSize="8" fontWeight="bold" fill="currentColor">T</text></svg>
        </button>
      </div>
      <EditorContent editor={ed} />
    </div>
  );
}

// ─── PALETTE BLOCKS LIST ──────────────────────────────────────────────────────

const PALETTE_BLOCKS: { type: BlockType; label: string }[] = [
  { type: 'heading', label: 'Titular' }, { type: 'text', label: 'Texto' },
  { type: 'image', label: 'Imagen' }, { type: 'button', label: 'Botón' },
  { type: 'iconButton', label: 'Icono btn' }, { type: 'columns2', label: '2 Col' },
  { type: 'columns3', label: '3 Col' }, { type: 'gallery', label: 'Galería' },
  { type: 'figure', label: 'Figura' }, { type: 'imgText', label: 'Img+Texto' },
  { type: 'socialLinks', label: 'Social' }, { type: 'countdown', label: 'Contador' },
  { type: 'divider', label: 'Divisor' },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ContentBlockBuilder({ initialHtml, initialBlocks, onChange, draftKey, showBrandLogos = true, puebloId, puebloNombre, webMode = false }: ContentBlockBuilderProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => initialBlocks?.length ? initialBlocks : []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reorderPickSourceId, setReorderPickSourceId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<BlockType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageEditorBlock, setImageEditorBlock] = useState<{ blockId: string; field: 'url' | 'iconUrl' } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Templates
  const [templates, setTemplates] = useState<BuilderTemplate[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'all' | 'predefined' | 'mine'>('all');
  const [themeFilter, setThemeFilter] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [selectedTplId, setSelectedTplId] = useState<number | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplSaving, setTplSaving] = useState(false);

  // Logos de marca (asociación)
  const [logos, setLogos] = useState<{ id: number; nombre: string; url: string }[]>([]);
  const [showLogos, setShowLogos] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Logos del ayuntamiento (pueblo)
  const [puebloLogos, setPuebloLogos] = useState<{ id: number; nombre: string; url: string }[]>([]);
  const [showPuebloLogos, setShowPuebloLogos] = useState(false);
  const [uploadingPuebloLogo, setUploadingPuebloLogo] = useState(false);
  const puebloLogoInputRef = useRef<HTMLInputElement | null>(null);

  // RRSS del pueblo (se carga cuando hay puebloId)
  const [puebloRrss, setPuebloRrss] = useState<{
    rrssInstagram?: string | null;
    rrssFacebook?: string | null;
    rrssTwitter?: string | null;
    rrssYoutube?: string | null;
  } | null>(null);

  // Draft
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  // Slot de galería activo para upload (0-3)
  const [galleryUploadSlot, setGalleryUploadSlot] = useState<number>(0);

  const imgInputRef = useRef<HTMLInputElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const storageKey = draftKey || 'lpmbe-content-builder-draft';
  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  // Load templates and logos on mount
  useEffect(() => {
    (async () => {
      try {
        const fetches: Promise<Response>[] = [
          fetch(`/api/admin/newsletter/templates?limit=200${puebloId ? `&puebloId=${puebloId}` : ''}`, { cache: 'no-store' }),
          fetch('/api/admin/logos', { cache: 'no-store' }),
        ];
        if (puebloId) {
          fetches.push(fetch(`/api/admin/pueblo-logos/pueblo/${puebloId}`, { cache: 'no-store' }));
        }
        const [tplRes, logosRes, puebloLogosRes] = await Promise.all(fetches);
        if (tplRes.ok) {
          const items = await tplRes.json().catch(() => []);
          if (Array.isArray(items)) {
            const normalized: BuilderTemplate[] = items.map((item) => {
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
                puebloId: row.puebloId != null ? Number(row.puebloId) : null,
                metadata: {
                  category: String(meta.category || ''),
                  description: String(meta.description || ''),
                  theme: meta.theme ? String(meta.theme) : undefined,
                  themeLabel: meta.themeLabel ? String(meta.themeLabel) : undefined,
                },
                updatedAt: String(row.updatedAt || ''),
              };
            });
            setTemplates(normalized.filter((t) => t.id > 0));
          }
        }
        if (logosRes.ok) {
          const data = await logosRes.json().catch(() => []);
          if (Array.isArray(data)) {
            setLogos(data.map((l: Record<string, unknown>) => ({
              id: Number(l.id || 0),
              nombre: String(l.nombre || l.name || ''),
              url: String(l.url || ''),
            })).filter((l) => l.url));
          }
        }
        if (puebloLogosRes?.ok) {
          const data = await puebloLogosRes.json().catch(() => []);
          if (Array.isArray(data)) {
            setPuebloLogos(data.map((l: Record<string, unknown>) => ({
              id: Number(l.id || 0),
              nombre: String(l.nombre || ''),
              url: String(l.url || ''),
            })).filter((l) => l.url));
          }
        }
      } catch {
        // non-critical
      }
    })();
  }, [puebloId]);

  // Cargar RRSS del pueblo cuando hay puebloId
  useEffect(() => {
    if (!puebloId) return;
    fetch(`/api/pueblos/${puebloId}/rrss`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setPuebloRrss(data); })
      .catch(() => {});
  }, [puebloId]);

  // Check for stored draft
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setHasDraft(true);
      // En webMode siempre restauramos el borrador si los bloques están vacíos
      // (permite recuperar bloques tras guardar y volver a la página).
      // En modo email/newsletter solo cargamos si tampoco hay initialHtml
      // (para no interferir con plantillas pre-cargadas).
      const shouldLoad = !blocks.length && (webMode || !initialHtml);
      if (shouldLoad) {
        try {
          const payload = JSON.parse(stored) as { blocks?: unknown };
          const loaded = normalizeBlocks(payload.blocks);
          if (loaded.length) {
            setBlocks(loaded);
            setHasDraft(true);
          }
        } catch { /* ignore */ }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from initial HTML / blocks when they change externally
  useEffect(() => {
    if (initialBlocks?.length) setBlocks(initialBlocks);
  }, [initialBlocks]);

  // Sync blocks → parent onChange on every block change + auto-save draft to localStorage
  useEffect(() => {
    if (blocks.length === 0) return; // Don't overwrite parent with empty on initial mount
    const html = renderBlocksToHtml(blocks, webMode);
    onChange?.(html);
    // Auto-save blocks so the builder can restore them when the user returns
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ blocks }));
      } catch { /* cuota o SSR */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks]);

  // ─── Block operations ────────────────────────────────────────────────────────

  function addBlock(type: BlockType) {
    const b = createBlock(type);
    // Auto-fill social links with pueblo's configured RRSS (if available)
    if (type === 'socialLinks' && puebloRrss) {
      b.socialFacebook = puebloRrss.rrssFacebook || '';
      b.socialTwitter = puebloRrss.rrssTwitter || '';
      b.socialInstagram = puebloRrss.rrssInstagram || '';
      b.socialYoutube = puebloRrss.rrssYoutube || '';
    }
    setBlocks((prev) => [...prev, b]);
    setSelectedId(b.id);
  }

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function updateSelected(patch: Partial<ContentBlock>) {
    if (!selectedId) return;
    updateBlock(selectedId, patch);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function duplicateBlock(id: string) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const clone = { ...prev[idx], id: newId() };
      const copy = [...prev];
      copy.splice(idx + 1, 0, clone);
      setSelectedId(clone.id);
      return copy;
    });
  }

  function reorderBlocks(draggedId: string, targetId: string) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === draggedId);
      const to = prev.findIndex((b) => b.id === targetId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
  }

  function moveToTarget(targetId: string) {
    if (!reorderPickSourceId || reorderPickSourceId === targetId) return;
    reorderBlocks(reorderPickSourceId, targetId);
    setReorderPickSourceId(null);
    setSelectedId(reorderPickSourceId);
  }

  // ─── Upload ──────────────────────────────────────────────────────────────────

  async function uploadImageForBlock(file: File, blockId: string, field: 'url' | 'iconUrl' | 'gallery' = 'url'): Promise<string | undefined> {
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'contenidos/builder');
      const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok || !data.url) throw new Error((data.error as string) || 'Error subiendo imagen');
      const url = String(data.url);
      if (field === 'gallery') {
        setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, imageUrls: [...(b.imageUrls || []), url] } : b));
        setMsg('Imagen añadida a la galería.');
      } else {
        updateBlock(blockId, { [field]: url } as Partial<ContentBlock>);
        setMsg('Imagen subida correctamente.');
      }
      return url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error subiendo imagen');
      return undefined;
    } finally {
      setUploading(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'brand/logos');
      const uploadRes = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json().catch(() => ({})) as Record<string, unknown>;
      if (!uploadRes.ok || !uploadData.url) throw new Error((uploadData.error as string) || 'Error subiendo logo');
      const url = String(uploadData.url);
      const nombre = file.name.replace(/\.[^.]+$/, '');
      const saveRes = await fetch('/api/admin/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, url, etiqueta: 'builder' }),
      });
      if (!saveRes.ok) throw new Error('Error guardando logo');
      const saved = await saveRes.json().catch(() => ({})) as Record<string, unknown>;
      setLogos((prev) => [...prev, { id: Number(saved.id || Date.now()), nombre, url }]);
      setMsg(`Logo "${nombre}" añadido.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error subiendo logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  async function uploadPuebloLogo(file: File) {
    if (!puebloId) return;
    setUploadingPuebloLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', `pueblos/${puebloId}/logos`);
      const uploadRes = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
      const uploadData = await uploadRes.json().catch(() => ({})) as Record<string, unknown>;
      if (!uploadRes.ok || !uploadData.url) throw new Error((uploadData.error as string) || 'Error subiendo logo');
      const url = String(uploadData.url);
      const nombre = file.name.replace(/\.[^.]+$/, '');
      const saveRes = await fetch('/api/admin/pueblo-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId, nombre, url }),
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error(String(errData.message || 'Error guardando logo'));
      }
      const saved = await saveRes.json().catch(() => ({})) as Record<string, unknown>;
      setPuebloLogos((prev) => [...prev, { id: Number(saved.id || Date.now()), nombre, url }]);
      setMsg(`Logo "${nombre}" guardado.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error subiendo logo');
    } finally {
      setUploadingPuebloLogo(false);
      if (puebloLogoInputRef.current) puebloLogoInputRef.current.value = '';
    }
  }

  async function deletePuebloLogo(id: number) {
    try {
      await fetch(`/api/admin/pueblo-logos/${id}`, { method: 'DELETE' });
      setPuebloLogos((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setErr('Error eliminando logo');
    }
  }

  function printContent() {
    const html = renderBlocksToHtml(blocks, webMode);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Imprimir contenido</title>
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

  // ─── Draft ───────────────────────────────────────────────────────────────────

  function saveDraft() {
    const payload = { blocks, savedAt: new Date().toISOString() };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    setDraftSavedAt(new Date().toLocaleTimeString('es-ES'));
    setHasDraft(true);
    setMsg('Borrador guardado.');
  }

  function loadDraft() {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const payload = JSON.parse(stored) as { blocks?: unknown };
      const loaded = normalizeBlocks(payload.blocks);
      setBlocks(loaded);
      setSelectedId(null);
      setMsg('Borrador cargado.');
    } catch {
      setErr('Error al cargar borrador.');
    }
  }

  // ─── Sync HTML (emit to parent) ───────────────────────────────────────────────

  function syncHtml() {
    const html = renderBlocksToHtml(blocks, webMode);
    onChange?.(html);
    setMsg('HTML sincronizado.');
  }

  // ─── Templates ───────────────────────────────────────────────────────────────

  function applyTemplate(t: BuilderTemplate) {
    setSelectedTplId(t.id);
    setTplName(t.name || '');
    const loaded = normalizeBlocks(t.blocksJson);
    setBlocks(loaded);
    if (loaded.length) setSelectedId(null);
    setShowGallery(false);
    const html = t.contentHtml || renderBlocksToHtml(loaded, webMode);
    onChange?.(html);
    setMsg(`Plantilla "${t.name}" cargada.`);
  }

  async function saveTemplate() {
    const name = tplName.trim();
    if (!name) { setErr('Pon un nombre a la plantilla'); return; }
    setTplSaving(true);
    try {
      const htmlFromBlocks = renderBlocksToHtml(blocks, webMode);
      const payload: Record<string, unknown> = {
        kind: 'NEWSLETTER',
        name,
        subject: name,
        contentHtml: htmlFromBlocks,
        blocksJson: blocks,
        metadata: {},
      };
      // Si hay puebloId, la plantilla se guarda como privada del pueblo
      if (puebloId) payload.puebloId = puebloId;

      const endpoint = selectedTplId ? `/api/admin/newsletter/templates/${selectedTplId}` : '/api/admin/newsletter/templates';
      const method = selectedTplId ? 'PUT' : 'POST';
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.message as string) || 'Error guardando plantilla');
      setMsg(selectedTplId ? 'Plantilla actualizada.' : 'Plantilla guardada.');
      if (!selectedTplId) setSelectedTplId(Number(data.id || 0) || null);
      // Reload templates
      const tplUrl = `/api/admin/newsletter/templates?limit=200${puebloId ? `&puebloId=${puebloId}` : ''}`;
      const tplRes = await fetch(tplUrl, { cache: 'no-store' });
      if (tplRes.ok) {
        const items = await tplRes.json().catch(() => []);
        if (Array.isArray(items)) {
          const normalized: BuilderTemplate[] = items.map((item) => {
            const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
            const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>;
            return {
              id: Number(row.id || 0), kind: 'NEWSLETTER' as const, name: String(row.name || ''),
              subject: String(row.subject || ''), contentHtml: String(row.contentHtml || ''),
              blocksJson: row.blocksJson, isDefault: Boolean(row.isDefault),
              puebloId: row.puebloId != null ? Number(row.puebloId) : null,
              metadata: { category: String(meta.category || ''), description: String(meta.description || ''), theme: meta.theme ? String(meta.theme) : undefined, themeLabel: meta.themeLabel ? String(meta.themeLabel) : undefined },
              updatedAt: String(row.updatedAt || ''),
            };
          });
          setTemplates(normalized.filter((t) => t.id > 0));
        }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error guardando plantilla');
    } finally {
      setTplSaving(false);
    }
  }

  // ─── Preset ──────────────────────────────────────────────────────────────────

  function applyPreset(preset: 'boletin' | 'nota' | 'promo') {
    let b: ContentBlock[] = [];
    if (preset === 'boletin') {
      b = [
        createBlock('heading', { content: 'Boletín mensual', align: 'center' }),
        createBlock('text', { content: 'Te compartimos las novedades más importantes de este mes.' }),
        createBlock('image', { url: 'https://...', content: 'Imagen destacada', align: 'center' }),
        createBlock('button', { label: 'Ver novedades', url: 'https://...', align: 'center' }),
      ];
    } else if (preset === 'nota') {
      b = [
        createBlock('heading', { content: 'Comunicado oficial', align: 'left' }),
        createBlock('text', { content: 'Introduce aquí la información principal del comunicado.' }),
        createBlock('divider'),
        createBlock('text', { content: 'Contexto adicional o próximos pasos.' }),
        createBlock('button', { label: 'Más información', url: 'https://...', align: 'left' }),
      ];
    } else {
      b = [
        createBlock('heading', { content: 'Descubre la nueva campaña', align: 'center' }),
        createBlock('text', { content: 'Presenta la propuesta de valor.', align: 'center' }),
        createBlock('image', { url: 'https://...', align: 'center' }),
        createBlock('button', { label: 'Acceder ahora', url: 'https://...', align: 'center' }),
      ];
    }
    setBlocks(b);
    setSelectedId(null);
    onChange?.(renderBlocksToHtml(b, webMode));
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 rounded-md border border-dashed border-border p-3">
      {/* Messages */}
      {msg && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{msg}<button type="button" onClick={() => setMsg(null)} className="ml-2 text-green-600 hover:text-green-900">✕</button></p>}
      {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}<button type="button" onClick={() => setErr(null)} className="ml-2 text-red-500 hover:text-red-800">✕</button></p>}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setShowGallery((v) => !v)}
          className="rounded-md border border-primary bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">
          {showGallery ? 'Cerrar galería' : 'Galería de plantillas'}
        </button>
        <button type="button" onClick={() => { setSelectedTplId(null); setTplName(''); setBlocks([]); setShowGallery(false); onChange?.(''); }}
          className="rounded-md border border-border px-4 py-2 text-sm">Nueva en blanco</button>
        <div className="ml-auto flex items-center gap-2">
          <input value={tplName} onChange={(e) => setTplName(e.target.value)}
            className="w-44 rounded-md border border-border px-3 py-2 text-sm" placeholder="Nombre plantilla" />
          <button type="button" onClick={saveTemplate} disabled={tplSaving}
            className="rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {tplSaving ? 'Guardando...' : selectedTplId ? 'Actualizar' : 'Guardar plantilla'}
          </button>
        </div>
        <button type="button" onClick={saveDraft}
          className="rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          Guardar borrador
        </button>
        {hasDraft && (
          <button type="button" onClick={loadDraft}
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
            Cargar borrador
          </button>
        )}
        {draftSavedAt && <span className="text-xs text-muted-foreground">Guardado: {draftSavedAt}</span>}
        <button type="button" onClick={printContent} title="Imprimir / Exportar PDF"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><rect x="6" y="13" width="12" height="9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/></svg>
          Imprimir / PDF
        </button>
      </div>

      {/* Template Gallery */}
      {showGallery && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-bold uppercase text-muted-foreground">Plantillas</h3>
            <div className="flex rounded-md border border-border text-xs">
              {(['all', 'predefined', 'mine'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setGalleryTab(tab)}
                  className={`px-3 py-1.5 font-medium transition ${galleryTab === tab ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                  {tab === 'all' ? 'Todas' : tab === 'predefined' ? 'De la red' : 'Mis plantillas'}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4 flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
            {THEME_FILTERS.map((opt) => (
              <button key={opt.value || 'all'} type="button" onClick={() => setThemeFilter(opt.value)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${themeFilter === opt.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:bg-muted'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {templates
              .filter((t) => {
                if (galleryTab === 'predefined') return !t.puebloId; // Compartidas (de la red / admin)
                if (galleryTab === 'mine') return t.puebloId != null; // Propias del pueblo
                return true; // Todas
              })
              .filter((t) => !themeFilter || getThemeKey(t) === themeFilter)
              .map((t) => (
                <div key={t.id} className="group overflow-hidden rounded-lg border border-border bg-background transition hover:border-primary/50 hover:shadow-md">
                  <div className="relative h-36 overflow-hidden bg-muted/40">
                    {t.contentHtml ? (
                      <iframe srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,sans-serif;transform:scale(0.3);transform-origin:top left;width:333%;overflow:hidden;}</style></head><body>${t.contentHtml}</body></html>`}
                        className="pointer-events-none h-[480px] w-full border-0" title={t.name} sandbox="" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sin vista previa</div>
                    )}
                    {!t.puebloId && t.isDefault && <span className="absolute right-1 top-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">Red LPMBE</span>}
                    {t.puebloId && <span className="absolute right-1 top-1 rounded bg-amber-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">Mi pueblo</span>}
                    {getThemeLabel(t) && <span className="absolute left-1 top-1 max-w-[85%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">{getThemeLabel(t)}</span>}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{t.metadata?.description || t.subject || 'Sin descripción'}</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => applyTemplate(t)} className="flex-1 rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground">Usar</button>
                      <button type="button" onClick={() => setPreviewHtml(t.contentHtml || renderBlocksToHtml(normalizeBlocks(t.blocksJson), webMode))}
                        className="rounded-md border border-border px-2 py-1.5 text-xs font-medium">Vista previa</button>
                      {t.puebloId != null && (
                        <button type="button"
                          onClick={async () => {
                            if (!window.confirm(`¿Eliminar "${t.name}"?`)) return;
                            try {
                              await fetch(`/api/admin/newsletter/templates/${t.id}`, { method: 'DELETE' });
                              setTemplates((prev) => prev.filter((x) => x.id !== t.id));
                              if (selectedTplId === t.id) setSelectedTplId(null);
                              setMsg('Plantilla eliminada.');
                            } catch { setErr('Error eliminando plantilla'); }
                          }}
                          className="rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600">Borrar</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {templates.filter((t) => {
              if (galleryTab === 'predefined') return !t.puebloId;
              if (galleryTab === 'mine') return t.puebloId != null;
              return true;
            }).filter((t) => !themeFilter || getThemeKey(t) === themeFilter).length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                {galleryTab === 'mine' ? 'Aún no has creado plantillas propias. Usa el constructor y guarda tu primera plantilla.' : 'No hay plantillas en esta categoría.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Template preview modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewHtml(null)}>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setPreviewHtml(null)} className="absolute right-3 top-3 rounded-full border px-2 py-1 text-xs font-bold">Cerrar</button>
            <p className="mb-3 text-sm font-bold uppercase text-muted-foreground">Vista previa</p>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>
      )}

      {/* Builder layout: Palette | Canvas + Inspector */}
      <div className="grid gap-3 xl:grid-cols-[260px_1fr]">
        {/* ─── LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
          {/* Presets */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Plantillas rápidas</p>
            <div className="mt-2 space-y-1.5">
              <button type="button" onClick={() => setShowGallery(true)} className="w-full rounded-md border border-primary/40 bg-primary/5 px-2 py-2 text-center text-xs font-semibold text-primary">Abrir galería</button>
              {(['boletin', 'nota', 'promo'] as const).map((p) => (
                <button key={p} type="button" onClick={() => applyPreset(p)} className="w-full rounded-md border bg-background px-2 py-2 text-left text-xs">
                  {p === 'boletin' ? 'Boletín mensual' : p === 'nota' ? 'Nota informativa' : 'Promo con CTA'}
                </button>
              ))}
            </div>
          </div>

          {/* Block palette */}
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Bloques</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PALETTE_BLOCKS.map(({ type, label }) => (
                <button key={type} type="button" draggable
                  onDragStart={(e) => { setDraggingType(type); e.dataTransfer.setData('text/builder-block-type', type); e.dataTransfer.effectAllowed = 'copy'; }}
                  onDragEnd={() => setDraggingType(null)}
                  onClick={() => addBlock(type)}
                  className="flex flex-col items-center justify-center gap-1 rounded-md border bg-background px-2 py-2 text-center text-[11px] font-medium hover:border-primary/60 hover:bg-primary/5">
                  <PaletteIcon type={type} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Logos de marca (solo para asociación) */}
          {showBrandLogos && (
            <div>
              <button type="button" onClick={() => setShowLogos((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border border-border bg-background px-2 py-2 text-xs font-semibold hover:bg-muted/50">
                <span>Logos de marca</span>
                <span>{showLogos ? '▲' : '▼'}</span>
              </button>
              {showLogos && (
                <div className="mt-2 space-y-2">
                  {logos.length === 0 && <p className="text-[11px] text-muted-foreground">No hay logos guardados.</p>}
                  <div className="grid grid-cols-2 gap-1.5">
                    {logos.map((logo) => (
                      <div key={logo.id} className="group relative overflow-hidden rounded border border-border bg-background p-1.5"
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/builder-logo-url', logo.url); e.dataTransfer.setData('text/builder-logo-name', logo.nombre); }}>
                        <img src={logo.url} alt={logo.nombre} className="mx-auto h-10 max-w-full object-contain" />
                        <p className="mt-1 truncate text-center text-[10px] text-muted-foreground">{logo.nombre}</p>
                        <button type="button"
                          onClick={() => { const b = createBlock('image', { url: logo.url, content: logo.nombre, align: 'center' }); setBlocks((p) => [...p, b]); setSelectedId(b.id); onChange?.(renderBlocksToHtml([...blocks, b], webMode)); }}
                          className="absolute right-1 top-1 hidden rounded bg-primary px-1 py-0.5 text-[10px] font-bold text-white group-hover:block">+</button>
                      </div>
                    ))}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => { const file = e.target.files?.[0]; if (file) await uploadLogo(file); }} />
                  <button type="button" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50">
                    {uploadingLogo ? 'Subiendo...' : (
                      <><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Subir logo nuevo</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Logos del ayuntamiento (para páginas de pueblo) */}
          {puebloId && (
            <div>
              <button type="button" onClick={() => setShowPuebloLogos((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100">
                <span>🏛 Logos del ayuntamiento{puebloNombre ? ` (${puebloNombre})` : ''}</span>
                <span>{showPuebloLogos ? '▲' : '▼'}</span>
              </button>
              {showPuebloLogos && (
                <div className="mt-2 space-y-2">
                  <p className="text-[11px] text-muted-foreground">Arrastra o pulsa + para insertar. Máx. 6 logos.</p>
                  {puebloLogos.length === 0 && <p className="text-[11px] text-muted-foreground">No hay logos subidos aún.</p>}
                  <div className="grid grid-cols-2 gap-1.5">
                    {puebloLogos.map((logo) => (
                      <div key={logo.id} className="group relative overflow-hidden rounded border border-blue-200 bg-white p-1.5"
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/builder-logo-url', logo.url); e.dataTransfer.setData('text/builder-logo-name', logo.nombre); }}>
                        <img src={logo.url} alt={logo.nombre} className="mx-auto h-10 max-w-full object-contain" />
                        <p className="mt-1 truncate text-center text-[10px] text-muted-foreground">{logo.nombre}</p>
                        <div className="absolute right-1 top-1 hidden flex-col gap-0.5 group-hover:flex">
                          <button type="button"
                            onClick={() => { const b = createBlock('image', { url: logo.url, content: logo.nombre, align: 'center' }); setBlocks((p) => [...p, b]); setSelectedId(b.id); onChange?.(renderBlocksToHtml([...blocks, b], webMode)); }}
                            className="rounded bg-primary px-1 py-0.5 text-[10px] font-bold text-white">+</button>
                          <button type="button" onClick={() => deletePuebloLogo(logo.id)}
                            className="rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <input ref={puebloLogoInputRef} type="file" accept="image/*" className="hidden"
                    onChange={async (e) => { const file = e.target.files?.[0]; if (file) await uploadPuebloLogo(file); }} />
                  <button type="button" disabled={uploadingPuebloLogo || puebloLogos.length >= 6} onClick={() => puebloLogoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-blue-300 px-2 py-1.5 text-[11px] font-medium text-blue-700 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50">
                    {uploadingPuebloLogo ? 'Subiendo...' : puebloLogos.length >= 6 ? 'Límite alcanzado (6)' : (
                      <><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Subir logo del ayuntamiento</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sync button */}
          <button type="button" onClick={syncHtml}
            className="w-full rounded border border-primary bg-background px-2 py-2 text-xs font-semibold text-primary">
            Sincronizar HTML
          </button>
          <p className="text-[11px] text-muted-foreground">Bloques: {blocks.length}{selectedId ? ' · bloque seleccionado' : ''}</p>
          {reorderPickSourceId && (
            <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-900">
              Modo mover activo: pulsa <strong>Soltar aquí</strong> en el destino.
            </p>
          )}
        </aside>

        {/* ─── RIGHT PANEL: Canvas + Inspector ──────────────────── */}
        <div className="space-y-3">
          {/* Canvas */}
          <div className="rounded-md border border-border bg-background p-3"
            onDragOver={(e) => { if (!draggingType) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(e) => {
              e.preventDefault();
              const logoUrl = e.dataTransfer.getData('text/builder-logo-url');
              const logoName = e.dataTransfer.getData('text/builder-logo-name');
              if (logoUrl) {
                const b = createBlock('image', { url: logoUrl, content: logoName || 'Logo', align: 'center' });
                setBlocks((prev) => [...prev, b]);
                setSelectedId(b.id);
                return;
              }
              if (!draggingType) return;
              addBlock(draggingType);
              setDraggingType(null);
            }}>
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Lienzo de bloques</p>
            {blocks.length === 0 ? (
              <p className="text-xs text-muted-foreground">Añade bloques desde la columna izquierda o arrastra desde la paleta.</p>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, idx) => (
                  <div key={block.id} data-block-id={block.id}
                    onClick={() => setSelectedId(block.id)}
                    className={`space-y-2 rounded-md border p-2 transition cursor-pointer ${selectedId === block.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2">
                        <span onClick={(e) => { e.stopPropagation(); setReorderPickSourceId((prev) => prev === block.id ? null : block.id); setSelectedId(block.id); }}
                          className="cursor-pointer select-none rounded border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {reorderPickSourceId === block.id ? 'Seleccionado' : 'Mover'}
                        </span>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">{idx + 1}. {block.type}</span>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} className="rounded border px-2 py-1 text-xs">↑</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} className="rounded border px-2 py-1 text-xs">↓</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="rounded border px-2 py-1 text-xs">Duplicar</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">Quitar</button>
                        {reorderPickSourceId && reorderPickSourceId !== block.id && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); moveToTarget(block.id); }} className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">Soltar aquí</button>
                        )}
                      </div>
                    </div>
                    <div className="rounded border border-dashed border-border bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                      {block.type === 'divider' ? 'Separador horizontal'
                        : block.type === 'button' ? `${block.label || 'Botón'} → ${block.url || 'sin URL'}`
                        : block.type === 'gallery' ? `Galería: ${(block.imageUrls || []).length} imagen(es)`
                        : block.type === 'countdown' ? `Contador: ${block.countdownDate || 'sin fecha'}`
                        : block.type === 'columns2' ? `2 col: ${(block.colLeft || '').slice(0, 20)} | ${(block.colRight || '').slice(0, 20)}`
                        : block.type === 'columns3' ? `3 col: ${(block.colLeft || '').slice(0, 15)} | ${(block.colCenter || '').slice(0, 15)} | ${(block.colRight || '').slice(0, 15)}`
                        : block.type === 'socialLinks' ? `Social: ${[block.socialFacebook && 'FB', block.socialTwitter && 'X', block.socialInstagram && 'IG'].filter(Boolean).join(', ') || 'sin redes'}`
                        : (block.content || block.url || 'Bloque sin contenido').slice(0, 60)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspector */}
          <div className="rounded-md border border-border bg-background p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Inspector de bloque</p>
            {selectedBlock ? (
              <div className="grid gap-2 md:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  Tipo
                  <input value={selectedBlock.type} readOnly className="mt-1 w-full rounded-md border border-border bg-muted px-2 py-1 text-sm" />
                </label>
                <label className="text-xs text-muted-foreground">
                  Alineación
                  <select value={selectedBlock.align || 'left'} onChange={(e) => updateSelected({ align: (e.target.value as 'left' | 'center' | 'right') })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm">
                    <option value="left">Izquierda</option>
                    <option value="center">Centro</option>
                    <option value="right">Derecha</option>
                  </select>
                </label>

                {/* Rich text for heading / text / imgText */}
                {(selectedBlock.type === 'heading' || selectedBlock.type === 'text' || selectedBlock.type === 'imgText') && (
                  <div className="md:col-span-2">
                    <p className="mb-1 text-xs text-muted-foreground">{selectedBlock.type === 'heading' ? 'Contenido del titular' : 'Contenido del bloque'}</p>
                    <BlockRichEditor content={selectedBlock.content || ''} onChange={(html) => updateSelected({ content: html })} placeholder={selectedBlock.type === 'heading' ? 'Escribe el titular...' : 'Escribe el contenido...'} />
                  </div>
                )}

                {/* Image alt text */}
                {selectedBlock.type === 'image' && (
                  <label className="text-xs text-muted-foreground md:col-span-2">
                    Texto alt
                    <input value={selectedBlock.content || ''} onChange={(e) => updateSelected({ content: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" />
                  </label>
                )}

                {/* URL field */}
                {['image', 'button', 'iconButton', 'figure', 'imgText'].includes(selectedBlock.type) && (
                  <label className="text-xs text-muted-foreground md:col-span-2">
                    URL{selectedBlock.type === 'figure' || selectedBlock.type === 'imgText' ? ' imagen' : ''}
                    <input value={selectedBlock.url || ''} onChange={(e) => updateSelected({ url: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="https://..." />
                  </label>
                )}

                {/* Image upload for image/figure/imgText */}
                {['image', 'figure', 'imgText'].includes(selectedBlock.type) && (
                  <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3 md:col-span-2">
                    <p className="text-sm font-semibold">Subir imagen del bloque</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploading}
                        className="flex-1 rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                      </button>
                      {selectedBlock.url && (
                        <button
                          type="button"
                          onClick={() => setImageEditorBlock({ blockId: selectedBlock.id, field: 'url' })}
                          className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          title="Recortar y editar imagen"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/>
                          </svg>
                          Editar
                        </button>
                      )}
                    </div>
                    <input ref={imgInputRef} type="file" accept="image/*" disabled={uploading} className="sr-only"
                      onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadImageForBlock(f, selectedBlock.id); e.currentTarget.value = ''; }} />
                  </div>
                )}

                {/* iconButton icon URL + upload */}
                {selectedBlock.type === 'iconButton' && (
                  <>
                    <label className="text-xs text-muted-foreground md:col-span-2">
                      URL icono
                      <input value={selectedBlock.iconUrl || ''} onChange={(e) => updateSelected({ iconUrl: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="https://..." />
                    </label>
                    <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3 md:col-span-2">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => iconInputRef.current?.click()} disabled={uploading}
                          className="flex-1 rounded-md border border-primary bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                          {uploading ? 'Subiendo icono...' : 'Subir icono'}
                        </button>
                        {selectedBlock.iconUrl && (
                          <button
                            type="button"
                            onClick={() => setImageEditorBlock({ blockId: selectedBlock.id, field: 'iconUrl' })}
                            className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 2v14a2 2 0 002 2h14"/><path d="M18 22V8a2 2 0 00-2-2H2"/>
                            </svg>
                            Editar
                          </button>
                        )}
                      </div>
                      <input ref={iconInputRef} type="file" accept="image/*" disabled={uploading} className="sr-only"
                        onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; await uploadImageForBlock(f, selectedBlock.id, 'iconUrl'); e.currentTarget.value = ''; }} />
                    </div>
                  </>
                )}

                {/* Button label */}
                {['button', 'iconButton'].includes(selectedBlock.type) && (
                  <label className="text-xs text-muted-foreground md:col-span-2">
                    {selectedBlock.type === 'iconButton' ? 'Etiqueta icono' : 'Texto del botón'}
                    <input value={selectedBlock.label || ''} onChange={(e) => updateSelected({ label: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" />
                  </label>
                )}

                {/* Columns 2 */}
                {selectedBlock.type === 'columns2' && (
                  <>
                    <label className="text-xs text-muted-foreground md:col-span-2">Columna izquierda<textarea rows={4} value={selectedBlock.colLeft || ''} onChange={(e) => updateSelected({ colLeft: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" /></label>
                    <label className="text-xs text-muted-foreground md:col-span-2">Columna derecha<textarea rows={4} value={selectedBlock.colRight || ''} onChange={(e) => updateSelected({ colRight: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" /></label>
                  </>
                )}

                {/* Columns 3 */}
                {selectedBlock.type === 'columns3' && (
                  <>
                    <label className="text-xs text-muted-foreground md:col-span-2">Columna izquierda<textarea rows={3} value={selectedBlock.colLeft || ''} onChange={(e) => updateSelected({ colLeft: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" /></label>
                    <label className="text-xs text-muted-foreground md:col-span-2">Columna central<textarea rows={3} value={selectedBlock.colCenter || ''} onChange={(e) => updateSelected({ colCenter: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" /></label>
                    <label className="text-xs text-muted-foreground md:col-span-2">Columna derecha<textarea rows={3} value={selectedBlock.colRight || ''} onChange={(e) => updateSelected({ colRight: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" /></label>
                  </>
                )}

                {/* Figure caption */}
                {selectedBlock.type === 'figure' && (
                  <label className="text-xs text-muted-foreground md:col-span-2">
                    Pie de imagen
                    <input value={selectedBlock.caption || ''} onChange={(e) => updateSelected({ caption: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="Descripción bajo la imagen" />
                  </label>
                )}

                {/* Gallery */}
                {selectedBlock.type === 'gallery' && (
                  <div className="space-y-3 md:col-span-2">
                    <p className="text-xs font-semibold text-muted-foreground">Imágenes de la galería (hasta 4)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[0, 1, 2, 3].map((slot) => {
                        const url = (selectedBlock.imageUrls || [])[slot] || '';
                        return (
                          <div key={slot} className="relative rounded-md border-2 border-dashed border-border bg-muted/20 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                            {url ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Imagen ${slot + 1}`} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const urls = [...(selectedBlock.imageUrls || [])];
                                    urls[slot] = '';
                                    updateSelected({ imageUrls: urls.filter(Boolean) });
                                  }}
                                  className="absolute right-1 top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
                                >✕</button>
                              </>
                            ) : (
                              <button
                                type="button"
                                disabled={uploading}
                                onClick={() => {
                                  setGalleryUploadSlot(slot);
                                  galleryInputRef.current?.click();
                                }}
                                className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted/40 disabled:opacity-50 transition-colors"
                              >
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M12 16V8m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                                </svg>
                                <span className="text-[10px]">{uploading ? 'Subiendo…' : `Foto ${slot + 1}`}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <input ref={galleryInputRef} type="file" accept="image/*" disabled={uploading} className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        // Subir imagen y colocarla en el slot correspondiente
                        setUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', f);
                          fd.append('folder', 'contenidos/gallery');
                          const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd });
                          const data = await res.json().catch(() => ({})) as Record<string, unknown>;
                          if (!res.ok || !data.url) throw new Error(String(data.error || 'Error subiendo'));
                          const url = String(data.url);
                          setBlocks((prev) => prev.map((b) => {
                            if (b.id !== selectedId) return b;
                            const urls = [...(b.imageUrls || [])];
                            // Insertar en el slot activo
                            while (urls.length <= galleryUploadSlot) urls.push('');
                            urls[galleryUploadSlot] = url;
                            return { ...b, imageUrls: urls.filter(Boolean) };
                          }));
                        } catch (uploadErr) {
                          setErr(uploadErr instanceof Error ? uploadErr.message : 'Error subiendo imagen');
                        } finally {
                          setUploading(false);
                          e.currentTarget.value = '';
                        }
                      }} />
                  </div>
                )}

                {/* Social links */}
                {selectedBlock.type === 'socialLinks' && (
                  <div className="space-y-2 md:col-span-2">
                    {/* Botón para cargar las RRSS del pueblo automáticamente */}
                    {puebloRrss && (
                      <button
                        type="button"
                        onClick={() => updateSelected({
                          socialFacebook: puebloRrss.rrssFacebook || '',
                          socialTwitter: puebloRrss.rrssTwitter || '',
                          socialInstagram: puebloRrss.rrssInstagram || '',
                          socialYoutube: puebloRrss.rrssYoutube || '',
                        })}
                        className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/60 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 12v-1a8 8 0 0116 0v1"/><path d="M18 18a8 8 0 01-12 0"/><path d="M12 21v-3"/>
                        </svg>
                        Cargar redes del pueblo
                      </button>
                    )}
                    {(['socialFacebook', 'socialTwitter', 'socialInstagram', 'socialLinkedin', 'socialYoutube'] as const).map((field) => {
                      const labels: Record<string, string> = { socialFacebook: 'Facebook', socialTwitter: 'X/Twitter', socialInstagram: 'Instagram', socialLinkedin: 'LinkedIn', socialYoutube: 'YouTube' };
                      return (
                        <label key={field} className="text-xs text-muted-foreground">
                          {labels[field]}
                          <input value={selectedBlock[field] || ''} onChange={(e) => updateSelected({ [field]: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="https://..." />
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Countdown */}
                {selectedBlock.type === 'countdown' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs text-muted-foreground">
                      Fecha y hora objetivo
                      <input type="datetime-local" value={selectedBlock.countdownDate || ''} onChange={(e) => updateSelected({ countdownDate: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" />
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Texto superior
                      <input value={selectedBlock.countdownLabel || ''} onChange={(e) => updateSelected({ countdownLabel: e.target.value })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" placeholder="No te lo pierdas" />
                    </label>
                    <p className="text-[11px] text-muted-foreground">Al sincronizar HTML se calcula la cuenta atrás respecto al momento actual.</p>
                  </div>
                )}

                {/* Style controls */}
                <label className="text-xs text-muted-foreground">
                  Fondo
                  <input type="color" value={selectedBlock.backgroundColor || '#ffffff'} onChange={(e) => updateSelected({ backgroundColor: e.target.value })} className="mt-1 h-9 w-full rounded-md border border-border p-1" />
                </label>
                <label className="text-xs text-muted-foreground">
                  Color texto
                  <input type="color" value={selectedBlock.textColor || '#111111'} onChange={(e) => updateSelected({ textColor: e.target.value })} className="mt-1 h-9 w-full rounded-md border border-border p-1" />
                </label>
                <label className="text-xs text-muted-foreground">
                  Padding vertical
                  <input type="number" min={0} max={40} value={selectedBlock.paddingY ?? 10} onChange={(e) => updateSelected({ paddingY: Math.max(0, Math.min(40, Number(e.target.value || 0))) })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" />
                </label>
                <label className="text-xs text-muted-foreground">
                  Radio borde
                  <input type="number" min={0} max={30} value={selectedBlock.borderRadius ?? 8} onChange={(e) => updateSelected({ borderRadius: Math.max(0, Math.min(30, Number(e.target.value || 0))) })} className="mt-1 w-full rounded-md border border-border px-2 py-1 text-sm" />
                </label>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Selecciona un bloque en el lienzo para editar sus propiedades.</p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-md border border-border bg-background p-3">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Vista previa</p>
            <div className="mx-auto max-w-[700px] rounded-md border border-border bg-white p-4 shadow-sm"
              dangerouslySetInnerHTML={{ __html: renderBlocksToHtml(blocks, webMode) || '<p class="text-gray-400 text-center py-4">Sin bloques todavía.</p>' }} />
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {imageEditorBlock && (() => {
        const editBlock = blocks.find((b) => b.id === imageEditorBlock.blockId);
        if (!editBlock) return null;
        const currentUrl = imageEditorBlock.field === 'iconUrl' ? (editBlock.iconUrl || '') : (editBlock.url || '');
        return (
          <ImageEditorModal
            imageUrl={currentUrl}
            alt={editBlock.content || ''}
            linkUrl={editBlock.imgLinkUrl || ''}
            onClose={() => setImageEditorBlock(null)}
            onUploadCropped={async (file) => {
              const url = await uploadImageForBlock(file, editBlock.id, imageEditorBlock.field);
              return url || currentUrl;
            }}
            onApply={(result) => {
              setBlocks((prev) =>
                prev.map((b) =>
                  b.id === imageEditorBlock.blockId
                    ? {
                        ...b,
                        [imageEditorBlock.field]: result.url,
                        content: result.alt !== undefined ? result.alt : b.content,
                        imgWidth: result.width,
                        imgHeight: result.height,
                        imgLinkUrl: result.linkUrl,
                      }
                    : b
                )
              );
              setImageEditorBlock(null);
            }}
          />
        );
      })()}
    </div>
  );
}
