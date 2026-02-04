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

export default function TipTapEditor({
  content,
  onChange,
  onUploadImage,
  placeholder = 'Escribe algo increíble...',
  minHeight = '400px',
}: TipTapEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'editor-image',
          style: 'max-width: 800px; width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0;',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-700 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-none px-6 py-4`,
        style: `min-height: ${minHeight}`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!onUploadImage || !event.dataTransfer?.files?.length) {
          return false;
        }

        const file = event.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageUpload(file);
          return true;
        }

        return false;
      },
      handlePaste: (view, event) => {
        if (!onUploadImage || !event.clipboardData?.files?.length) {
          return false;
        }

        const file = event.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          event.preventDefault();
          handleImageUpload(file);
          return true;
        }

        return false;
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!onUploadImage || !editor) return;

    setIsUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
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
      if (file) {
        await handleImageUpload(file);
      }
    };

    input.click();
  }, [editor, handleImageUpload, onUploadImage]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    // Si hay texto seleccionado, obtener su URL si es un enlace
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) return;

    // Si está vacío, eliminar el enlace
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Si hay selección, aplicar enlace
    // Si no hay selección, mostrar advertencia
    const { from, to } = editor.state.selection;
    if (from === to) {
      alert('Por favor, selecciona el texto al que quieres añadir el enlace');
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
      </div>
    );
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    disabled, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-2 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Barra de herramientas fija con gradiente sutil */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-sm p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Negrita (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Cursiva (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Título 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Título 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Lista con viñetas"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Lista numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            title="Insertar enlace"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>

          {onUploadImage && (
            <ToolbarButton
              onClick={triggerImageUpload}
              disabled={isUploading}
              title="Insertar imagen"
            >
              <ImageIcon className={`w-4 h-4 ${isUploading ? 'animate-pulse' : ''}`} />
            </ToolbarButton>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            title="Rehacer (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor con diseño más cuidado */}
      <div className="group rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        <EditorContent editor={editor} />
      </div>

      {/* Ayuda y feedback */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {onUploadImage && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Arrastra imágenes aquí o pégalas con Ctrl+V (máx. 800px de ancho)</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-400">
          <span>{editor.storage.characterCount?.characters() || 0} caracteres</span>
        </div>
      </div>

      {/* Notificación de carga */}
      {isUploading && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Subiendo imagen...</span>
        </div>
      )}
    </div>
  );
}
