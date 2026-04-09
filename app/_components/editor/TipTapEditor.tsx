'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { useCallback, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { HtmlAttributePreserver, DivBlock } from './tiptap-html-preserve';

const GridPaises = Node.create({
  name: 'gridPaisesInternacional',
  content: 'block+',
  group: 'block',
  parseHTML() { return [{ tag: 'div.grid-paises-internacional' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', { ...HTMLAttributes, class: 'grid-paises-internacional' }, 0]; },
});

const PaisCard = Node.create({
  name: 'paisCard',
  content: 'block+',
  group: 'block',
  parseHTML() { return [{ tag: 'div.pais-card' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', { ...HTMLAttributes, class: 'pais-card' }, 0]; },
});

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
  minHeight?: string;
}

type ImageSize = 'small' | 'medium' | 'large' | 'full';

const IMAGE_SIZES: Record<ImageSize, { label: string; width: string }> = {
  small: { label: 'Pequeña (300px)', width: '300px' },
  medium: { label: 'Mediana (500px)', width: '500px' },
  large: { label: 'Grande (700px)', width: '700px' },
  full: { label: 'Ancho completo', width: '100%' },
};

export default function TipTapEditor({
  content,
  onChange,
  onUploadImage,
  placeholder = 'Escribe algo increíble...',
  minHeight = '400px',
}: TipTapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showImageSizeModal, setShowImageSizeModal] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      HtmlAttributePreserver,
      DivBlock,
      GridPaises,
      PaisCard,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Subscript,
      Superscript,
      Image.configure({ inline: false, HTMLAttributes: { class: 'editor-image' } }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none max-w-none px-6 py-4 text-foreground prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground',
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (_view, event) => {
        if (!onUploadImage || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (file.type.startsWith('image/')) { event.preventDefault(); handleImageUploadWithSize(file); return true; }
        return false;
      },
      handlePaste: (_view, event) => {
        if (!onUploadImage || !event.clipboardData?.files?.length) return false;
        const file = event.clipboardData.files[0];
        if (file.type.startsWith('image/')) { event.preventDefault(); handleImageUploadWithSize(file); return true; }
        return false;
      },
    },
  });

  const insertImageWithSize = useCallback((url: string, size: ImageSize) => {
    if (!editor) return;
    const { width } = IMAGE_SIZES[size];
    const style = `max-width: ${width}; width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0;`;
    editor.chain().focus().setImage({ src: url, alt: 'Imagen' }).run();
    setTimeout(() => {
      const images = editor.view.dom.querySelectorAll('img.editor-image');
      const lastImage = images[images.length - 1] as HTMLImageElement;
      if (lastImage && lastImage.src === url) { lastImage.style.cssText = style; onChange(editor.getHTML()); }
    }, 100);
    setShowImageSizeModal(false);
    setPendingImageUrl(null);
  }, [editor, onChange]);

  const handleImageUploadWithSize = useCallback(async (file: File) => {
    if (!onUploadImage || !editor) return;
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) { setPendingImageUrl(url); setShowImageSizeModal(true); }
    } catch (e) {
      console.error('Error uploading image:', e);
      alert('Error subiendo imagen');
    } finally {
      setIsUploading(false);
    }
  }, [editor, onUploadImage]);

  const triggerImageUpload = useCallback(() => {
    if (!onUploadImage || !editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) await handleImageUploadWithSize(file);
    };
    input.click();
  }, [editor, handleImageUploadWithSize, onUploadImage]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('URL del enlace:', previousUrl);
    if (url === null) return;
    if (url.trim() === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) finalUrl = 'https://' + finalUrl;
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  }, [editor]);

  const promptColor = useCallback(() => {
    if (!editor) return;
    const color = window.prompt('Color de texto (hex, ej: #c0392b)', '#000000');
    if (color) editor.chain().focus().setColor(color.trim()).run();
  }, [editor]);

  const promptHighlight = useCallback(() => {
    if (!editor) return;
    const color = window.prompt('Color de resaltado (hex, ej: #ffe066)', '#ffe066');
    if (color) editor.chain().focus().toggleHighlight({ color: color.trim() }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="animate-pulse rounded-xl border border-border bg-muted p-8 text-center">
        <div className="mx-auto h-4 w-1/3 rounded bg-muted-foreground/20" />
      </div>
    );
  }

  const btn = (active: boolean, extra = '') =>
    `p-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-500' : 'text-foreground/80 hover:bg-muted hover:text-foreground'} ${extra}`;

  return (
    <div className="space-y-2">
      {showImageSizeModal && pendingImageUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold">Elige el tamaño de la imagen</h3>
            <div className="mb-4"><img src={pendingImageUrl} alt="Vista previa" className="w-full h-32 object-cover rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(IMAGE_SIZES) as ImageSize[]).map((size) => (
                <button key={size} type="button" onClick={() => insertImageWithSize(pendingImageUrl, size)}
                  className="rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-blue-400 hover:bg-muted">
                  {IMAGE_SIZES[size].label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { setShowImageSizeModal(false); setPendingImageUrl(null); }}
              className="mt-4 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
          </div>
        </div>
      )}

      {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-muted/90 px-2 py-1.5 shadow-sm backdrop-blur-sm dark:bg-zinc-900/95">

        {/* Formato básico */}
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Negrita"><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Cursiva"><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'))} title="Subrayado"><span className="underline">U</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Tachado"><span className="line-through">S</span></button>
        <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={btn(editor.isActive('subscript'))} title="Subíndice">x<sub>2</sub></button>
        <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={btn(editor.isActive('superscript'))} title="Superíndice">x<sup>2</sup></button>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Títulos */}
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="Título 1">H1</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="Título 2">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="Título 3">H3</button>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Listas */}
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Lista">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><circle cx="3" cy="5" r="1.5"/><rect x="7" y="4" width="11" height="2" rx="1"/><circle cx="3" cy="10" r="1.5"/><rect x="7" y="9" width="11" height="2" rx="1"/><circle cx="3" cy="15" r="1.5"/><rect x="7" y="14" width="11" height="2" rx="1"/></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Lista numerada">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><text x="1" y="7" fontSize="6" fontWeight="bold">1</text><rect x="7" y="4" width="11" height="2" rx="1"/><text x="1" y="12" fontSize="6" fontWeight="bold">2</text><rect x="7" y="9" width="11" height="2" rx="1"/></svg>
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Alineación */}
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btn(editor.isActive({ textAlign: 'left' }))} title="Alinear izquierda">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1"/><rect x="2" y="9" width="10" height="2" rx="1"/><rect x="2" y="14" width="14" height="2" rx="1"/></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btn(editor.isActive({ textAlign: 'center' }))} title="Centrar">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1"/><rect x="5" y="9" width="10" height="2" rx="1"/><rect x="3" y="14" width="14" height="2" rx="1"/></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btn(editor.isActive({ textAlign: 'right' }))} title="Alinear derecha">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1"/><rect x="8" y="9" width="10" height="2" rx="1"/><rect x="4" y="14" width="14" height="2" rx="1"/></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btn(editor.isActive({ textAlign: 'justify' }))} title="Justificar">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="4" width="16" height="2" rx="1"/><rect x="2" y="9" width="16" height="2" rx="1"/><rect x="2" y="14" width="16" height="2" rx="1"/></svg>
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Enlace */}
        <button type="button" onClick={setLink} className={btn(editor.isActive('link'))} title="Enlace">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M8.5 11.5a3.5 3.5 0 004.95 0l2.12-2.12a3.5 3.5 0 00-4.95-4.95L9.5 5.55" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M11.5 8.5a3.5 3.5 0 00-4.95 0l-2.12 2.12a3.5 3.5 0 004.95 4.95l1.12-1.12" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>
        </button>

        {/* Color de texto */}
        <button type="button" onClick={promptColor} className={btn(false)} title="Color de texto">
          <span className="flex flex-col items-center leading-none"><span className="text-[11px] font-bold">A</span><span className="mt-px h-1 w-3 rounded-sm bg-red-500" /></span>
        </button>

        {/* Resaltado */}
        <button type="button" onClick={promptHighlight} className={btn(editor.isActive('highlight'))} title="Resaltar texto">
          <span className="rounded bg-yellow-200 px-0.5 text-[11px] font-bold">A</span>
        </button>

        {/* Imagen */}
        {onUploadImage && (
          <button type="button" onClick={triggerImageUpload} disabled={isUploading}
            className={btn(false, isUploading ? 'opacity-40 cursor-not-allowed' : '')} title="Imagen">
            <svg viewBox="0 0 20 20" className={`h-4 w-4 ${isUploading ? 'animate-pulse' : ''}`} fill="currentColor">
              <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <circle cx="7" cy="8" r="1.5" fill="currentColor"/>
              <path d="M4 16l4-5 3 3 2-2.5 3 4.5z" fill="currentColor" opacity="0.8"/>
            </svg>
          </button>
        )}

        {/* Blockquote */}
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Cita">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M3 7h5l-2 6H3V7zm8 0h5l-2 6h-3V7z" opacity="0.8"/></svg>
        </button>

        {/* Línea horizontal */}
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Línea horizontal">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="2" y="9" width="16" height="2" rx="1"/></svg>
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        {/* Deshacer / Rehacer */}
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className={btn(false, !editor.can().chain().focus().undo().run() ? 'opacity-40 cursor-not-allowed' : '')} title="Deshacer">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M5 8l-3-3 3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 5h10a5 5 0 010 10H8" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className={btn(false, !editor.can().chain().focus().redo().run() ? 'opacity-40 cursor-not-allowed' : '')} title="Rehacer">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M15 8l3-3-3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 5H8a5 5 0 000 10h4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
        </button>

        {/* Limpiar formato */}
        <button type="button" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={btn(false)} title="Limpiar formato">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><text x="7" y="12" fontSize="7" fontWeight="bold" fill="currentColor">T</text></svg>
        </button>
      </div>

      {/* ── EDITOR AREA ─────────────────────────────────────────────────── */}
      <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md focus-within:border-transparent focus-within:ring-2 focus-within:ring-blue-500 dark:bg-zinc-950">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {onUploadImage && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Arrastra imágenes o pégalas con Ctrl+V</span>
          </div>
        )}
        <span className="text-muted-foreground/80">Para enlaces: selecciona texto → clic en 🔗</span>
      </div>

      {isUploading && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Subiendo imagen...</span>
        </div>
      )}
    </div>
  );
}
