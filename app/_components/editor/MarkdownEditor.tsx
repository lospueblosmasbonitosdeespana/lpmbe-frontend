'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import SafeHtml from '@/app/_components/ui/SafeHtml';

type EditorMode = 'edit' | 'html' | 'preview';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  uploading: boolean;
  onUploadImages: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export default function MarkdownEditor({
  value,
  onChange,
  uploading,
  onUploadImages,
  textareaRef: externalRef,
}: MarkdownEditorProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef || internalRef;
  
  // Detectar si el contenido parece HTML para elegir modo por defecto
  const looksLikeHtml = value.includes('<div') || value.includes('<h2>') || value.includes('<p>') || value.includes('class=');
  const [mode, setMode] = useState<EditorMode>(looksLikeHtml ? 'html' : 'edit');
  const [advancedMode, setAdvancedMode] = useState(false);

  function insertMarkdown(text: string) {
    if (!textareaRef.current) {
      // Fallback: añadir al final
      onChange(value + text);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const newText = before + text + after;
    
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + text.length;
      textarea.selectionStart = newCursor;
      textarea.selectionEnd = newCursor;
    }, 0);
  }

  function insertAtCursor(markdown: string) {
    insertMarkdown(markdown);
  }

  function appendToEnd(markdown: string) {
    onChange(value + markdown);
  }

  function wrapSelection(before: string, after: string = '') {
    if (!textareaRef.current) {
      insertMarkdown(before + 'texto' + after);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end) || 'texto';
    const replacement = before + selectedText + after;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Contenido</label>
        
        {/* TOGGLE BÁSICO/AVANZADO */}
        <button
          type="button"
          onClick={() => setAdvancedMode(!advancedMode)}
          className="text-xs text-gray-600 hover:text-gray-800 underline"
        >
          {advancedMode ? 'Modo básico' : 'Modo avanzado'}
        </button>
      </div>

      {/* TABS - 3 modos: Editor, HTML, Vista previa */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'edit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => setMode('html')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'html'
              ? 'bg-amber-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          HTML
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            mode === 'preview'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Vista previa
        </button>
      </div>

      {/* MODO EDITAR */}
      {mode === 'edit' && (
        <>
          {/* INDICADOR MODO AVANZADO */}
          {advancedMode && (
            <p className="text-xs text-gray-500 italic">Markdown (modo avanzado)</p>
          )}

          {/* TOOLBAR */}
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => wrapSelection('**', '**')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              title="Negrita"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('## ', '')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              title="Título"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('\n\n- Punto 1\n- Punto 2\n- Punto 3\n\n')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              title="Lista"
            >
              • Lista
            </button>
            <button
              type="button"
              onClick={() => wrapSelection('[', '](url)')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              title="Enlace"
            >
              🔗 Enlace
            </button>
            <button
              type="button"
              onClick={onUploadImages}
              disabled={uploading}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              title="Insertar imagen(es)"
            >
              {uploading ? 'Subiendo...' : '📷 Imagen(es)'}
            </button>
            
            {/* SEPARADOR */}
            <span className="border-l mx-1"></span>
            
            {/* BLOQUES GUIADOS */}
            <button
              type="button"
              onClick={() => insertMarkdown('\n\n## Título de sección\n\nTexto...\n\n')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              title="Sección"
            >
              Sección
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('\n\n---\n\n')}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              title="Separador"
            >
              Separador
            </button>
          </div>

          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            className="w-full rounded-md border px-3 py-2 font-mono text-sm"
            rows={20}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Escribe aquí el contenido..."
          />

          {!advancedMode && (
            <p className="text-xs text-gray-600">
              <strong>Consejo:</strong> usa "Vista previa" para ver cómo quedará antes de publicar.
            </p>
          )}
        </>
      )}

      {/* MODO HTML - textarea directo para HTML */}
      {mode === 'html' && (
        <div className="space-y-2">
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
            Modo HTML: pega aquí código HTML directamente. Útil para contenido complejo con grids, tarjetas o enlaces externos.
          </p>
          <textarea
            ref={textareaRef}
            className="w-full rounded-md border px-3 py-2 font-mono text-sm"
            rows={20}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="<h2>Título</h2>\n<p>Párrafo...</p>"
          />
        </div>
      )}

      {/* MODO PREVIEW */}
      {mode === 'preview' && (
        <div
          className="rounded-md border px-4 py-3 min-h-[400px] bg-white"
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#333',
          }}
        >
          {value.trim() ? (
            // Si parece HTML, usar SafeHtml; si no, usar ReactMarkdown
            value.includes('<') && (value.includes('<div') || value.includes('<p>') || value.includes('<h2>') || value.includes('<h3>')) ? (
              <SafeHtml html={value} />
            ) : (
              <div className="markdown-preview">
                <ReactMarkdown>{value}</ReactMarkdown>
              </div>
            )
          ) : (
            <p className="text-gray-400 italic">
              Aquí verás cómo quedará tu contenido cuando escribas.
            </p>
          )}
        </div>
      )}

      {/* ESTILOS PREVIEW */}
      <style jsx>{`
        .markdown-preview img {
          max-width: 100%;
          height: auto;
          margin: 16px 0;
          border-radius: 4px;
        }
        .markdown-preview p {
          margin-bottom: 16px;
        }
        .markdown-preview h2 {
          font-size: 24px;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
          color: #111;
        }
        .markdown-preview h3 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
          color: #222;
        }
        .markdown-preview ul,
        .markdown-preview ol {
          margin-bottom: 16px;
          padding-left: 24px;
        }
        .markdown-preview li {
          margin-bottom: 8px;
        }
        .markdown-preview hr {
          margin: 32px 0;
          border: none;
          border-top: 1px solid #ddd;
        }
        .markdown-preview a {
          color: #0066cc;
          text-decoration: none;
        }
        .markdown-preview a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// EXPORT HELPERS PARA USO EXTERNO
export function useMarkdownEditorHelpers(textareaRef: React.RefObject<HTMLTextAreaElement>) {
  function insertAtCursor(markdown: string) {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    return before + markdown + after;
  }

  function appendToEnd(markdown: string, currentValue: string) {
    return currentValue + markdown;
  }

  return { insertAtCursor, appendToEnd };
}
