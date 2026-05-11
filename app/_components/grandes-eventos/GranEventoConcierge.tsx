'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

/**
 * Hook que devuelve las dimensiones del Visual Viewport (el área visible real
 * cuando el teclado de iOS está abierto). Esencial para iOS Safari.
 */
function useVisualViewport() {
  const [vp, setVp] = useState({ height: 0, offsetTop: 0 });

  useEffect(() => {
    const update = () => {
      const vv = (window as any).visualViewport as VisualViewport | null;
      if (vv) {
        setVp({ height: vv.height, offsetTop: vv.offsetTop });
      } else {
        setVp({ height: window.innerHeight, offsetTop: 0 });
      }
    };

    update();

    const vv = (window as any).visualViewport as VisualViewport | null;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
      return () => {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      };
    } else {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
  }, []);

  return vp;
}

export default function GranEventoConcierge({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('granEvento.concierge');
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const vp = useVisualViewport();

  // Scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Al abrir, focus en el input (con pequeño delay para iOS)
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`/api/public/grandes-eventos/${slug}/concierge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, locale, history: nextMessages.slice(-6) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('errorRespuesta') },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, slug, locale, t]);

  const suggestions = [t('sugerencia1'), t('sugerencia2'), t('sugerencia3')];

  const sendSuggestion = (s: string) => {
    const userMsg: Message = { role: 'user', content: s };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    fetch(`/api/public/grandes-eventos/${slug}/concierge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: s, locale, history: nextMessages.slice(-6) }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]))
      .catch(() => setMessages((prev) => [...prev, { role: 'assistant', content: t('errorRespuesta') }]))
      .finally(() => setLoading(false));
  };

  // ── Estilo del panel calculado con visualViewport ──────────────────────────
  // En móvil (<640px): el panel se pega al visual viewport real (funciona con
  // el teclado de iOS abierto). En desktop: ventana flotante fija.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const panelStyle: React.CSSProperties =
    open && isMobile && vp.height > 0
      ? {
          position: 'fixed',
          left: 8,
          right: 8,
          top: vp.offsetTop + 8,
          height: vp.height - 16,
          zIndex: 50,
        }
      : {};

  return (
    <>
      {/* Botón flotante: derecha, elevado en móvil para no tapar la barra de Safari iOS */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-32 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xl sm:bottom-6"
          aria-label="Abrir conserje"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : null}

      {/* Badge "Conserje IA" */}
      {!open ? (
        <div className="fixed bottom-[188px] right-5 z-50 animate-bounce pointer-events-none sm:bottom-[84px]">
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-lg border border-stone-200">
            <Sparkles className="mr-1 inline h-3 w-3 text-amber-600" />
            {t('disponible')}
          </div>
        </div>
      ) : null}

      {/* Panel del chat */}
      {open ? (
        <div
          className={[
            // Base: flex column, clip, fondo blanco, sombra, bordes
            'flex flex-col overflow-hidden border border-stone-200 bg-white shadow-2xl rounded-2xl',
            // Móvil (<sm): lo posicionamos con JS (panelStyle); clases CSS solo de fallback
            'fixed inset-x-2 top-10 bottom-2',
            // Desktop (sm+): ventana flotante a la derecha
            'sm:inset-auto sm:right-4 sm:bottom-24 sm:left-auto sm:top-auto sm:h-[min(560px,80vh)] sm:w-[380px]',
          ].join(' ')}
          style={{ zIndex: 50, ...panelStyle }}
        >
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{t('titulo')}</p>
                <p className="text-[11px] opacity-75 truncate">{t('subtitulo')}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-full p-1.5 hover:bg-white/20 active:bg-white/30"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mensajes: flex-1 + min-h-0 es clave para que no desborde en flex column */}
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3"
          >
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-stone-700">
                  <Bot className="mb-1 inline h-4 w-4 text-amber-700" />{' '}
                  {t('bienvenida')}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {t('sugerenciasLabel')}
                </p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendSuggestion(s)}
                    className="block w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left text-xs text-stone-700 hover:border-amber-300 hover:bg-amber-50 active:bg-amber-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`max-w-[78%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  <ConciergeMessageContent content={m.content} />
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-xl bg-stone-100 px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
                </div>
              </div>
            ) : null}
          </div>

          {/* Input: shrink-0 para que nunca se comprima */}
          <div className="shrink-0 border-t border-stone-200 bg-stone-50 px-3 py-2.5">
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex gap-2 items-center"
            >
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('placeholder')}
                disabled={loading}
                className="flex-1 min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
                style={{ fontSize: 16 }} /* evita zoom automático en iOS */
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-white shadow-sm hover:bg-amber-800 active:bg-amber-900 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ConciergeMessageContent({ content }: { content: string }) {
  // Limpiar markdown básico que pueda colarse en la respuesta de la IA
  const cleaned = content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '');

  const parts = cleaned.split(/(https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('https://www.google.com/maps/') ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-amber-700 underline"
          >
            📍 Google Maps
          </a>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
