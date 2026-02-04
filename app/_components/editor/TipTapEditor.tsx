'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useCallback } from 'react';

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
  placeholder = 'Escribe aquí...',
  minHeight = '300px',
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg focus:outline-none max-w-none px-4 py-3`,
        style: `min-height: ${minHeight}`,
      },
    },
  });

  const handleImageUpload = useCallback(async () => {
    if (!onUploadImage || !editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const url = await onUploadImage(file);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error subiendo imagen');
      }
    };

    input.click();
  }, [editor, onUploadImage]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL del enlace:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return <div className="rounded-lg border border-gray-300 p-4 text-gray-400">Cargando editor...</div>;
  }

  return (
    <div className="space-y-2">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          Negrita
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } disabled:opacity-50`}
        >
          Cursiva
        </button>

        <div className="w-px bg-gray-300" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H3
        </button>

        <div className="w-px bg-gray-300" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Lista
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Numerada
        </button>

        <div className="w-px bg-gray-300" />

        <button
          type="button"
          onClick={setLink}
          className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
            editor.isActive('link')
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Enlace
        </button>

        {onUploadImage && (
          <>
            <div className="w-px bg-gray-300" />
            <button
              type="button"
              onClick={handleImageUpload}
              className="rounded bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              📷 Imagen
            </button>
          </>
        )}
      </div>

      {/* Editor */}
      <div className="rounded-b-lg border border-gray-300 bg-white">
        <EditorContent editor={editor} />
      </div>

      {placeholder && !editor.getText() && (
        <p className="text-xs text-gray-500 italic">
          Tip: Usa los botones para formatear el texto. Puedes pegar imágenes directamente.
        </p>
      )}
    </div>
  );
}
