'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
  Sparkles,
} from 'lucide-react';

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
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'editor-image' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-600 hover:text-blue-700 underline' } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-none px-6 py-4',
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!onUploadImage || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageUploadWithSize(file);
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (!onUploadImage || !event.clipboardData?.files?.length) return false;
        const file = event.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageUploadWithSize(file);
          return true;
        }
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
      if (lastImage && lastImage.src === url) {
        lastImage.style.cssText = style;
        onChange(editor.getHTML());
      }
    }, 100);
    setShowImageSizeModal(false);
    setPendingImageUrl(null);
  }, [editor, onChange]);

  const handleImageUploadWithSize = useCallback(async (file: File) => {
    if (!onUploadImage || !editor) return;
    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) {
        setPendingImageUrl(url);
        setShowImageSizeModal(true);
      }
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
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
      finalUrl = 'https://' + finalUrl;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
      </div>
    );
  }

  const ToolbarButton = ({ onClick, isActive, disabled, children, title }: {
    onClick: () => void; isActive?: boolean; disabled?: boolean; children: React.ReactNode; title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {showImageSizeModal && pendingImageUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Elige el tamaño de la imagen</h3>
            <div className="mb-4">
              <img src={pendingImageUrl} alt="Vista previa" className="w-full h-32 object-cover rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(IMAGE_SIZES) as ImageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => insertImageWithSize(pendingImageUrl, size)}
                  className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm font-medium"
                >
                  {IMAGE_SIZES[size].label}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowImageSizeModal(false); setPendingImageUrl(null); }}
              className="mt-4 w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm p-2 shadow-sm">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} disabled={!editor.can().chain().focus().toggleBold().run()} title="Negrita">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} disabled={!editor.can().chain().focus().toggleItalic().run()} title="Cursiva">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Título 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Título 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Lista">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Lista numerada">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-6 bg-gray-300" />
        <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Enlace">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        {onUploadImage && (
          <ToolbarButton onClick={triggerImageUpload} disabled={isUploading} title="Imagen">
            <ImageIcon className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
          </ToolbarButton>
        )}
        <div className="w-px h-6 bg-gray-300" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} title="Deshacer">
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} title="Rehacer">
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <div className="group rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <EditorContent editor={editor} />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        {onUploadImage && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Arrastra imágenes o pégalas con Ctrl+V</span>
          </div>
        )}
        <span className="text-gray-400">Para enlaces: selecciona texto → clic en 🔗</span>
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
