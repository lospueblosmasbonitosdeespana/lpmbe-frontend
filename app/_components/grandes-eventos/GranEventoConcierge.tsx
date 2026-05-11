'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function GranEventoConcierge({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('granEvento.concierge');
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
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
        body: JSON.stringify({
          message: text,
          locale,
          history: nextMessages.slice(-6),
        }),
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

  const suggestions = [
    t('sugerencia1'),
    t('sugerencia2'),
    t('sugerencia3'),
  ];

  const useSuggestion = (s: string) => {
    setInput(s);
    setTimeout(() => {
      const userMsg: Message = { role: 'user', content: s };
      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setInput('');
      setLoading(true);
      fetch(`/api/public/grandes-eventos/${slug}/concierge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: s, locale, history: nextMessages.slice(-6) }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]))
        .catch(() => setMessages((prev) => [...prev, { role: 'assistant', content: t('errorRespuesta') }]))
        .finally(() => setLoading(false));
    }, 0);
  };

  return (
    <>
      {/* Botón flotante (esquina inferior IZQUIERDA para no tapar la barra de Safari iOS) */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
          open
            ? 'bg-stone-700 text-white hover:bg-stone-800'
            : 'bg-gradient-to-br from-amber-600 to-amber-800 text-white hover:from-amber-700 hover:to-amber-900'
        }`}
        aria-label={open ? 'Cerrar conserje' : 'Abrir conserje'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Indicador de disponibilidad */}
      {!open ? (
        <div className="fixed bottom-[76px] left-5 z-50 animate-bounce">
          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-lg border border-stone-200">
            <Sparkles className="mr-1 inline h-3 w-3 text-amber-600" />
            {t('disponible')}
          </div>
        </div>
      ) : null}

      {/* Panel del chat */}
      {open ? (
        <div className="fixed bottom-24 left-4 z-50 flex h-[min(520px,75vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="shrink-0 bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="text-sm font-bold">{t('titulo')}</p>
                <p className="text-[11px] opacity-80">{t('subtitulo')}</p>
              </div>
            </div>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-stone-700">
                  <Bot className="mb-1 inline h-4 w-4 text-amber-700" />{' '}
                  {t('bienvenida')}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    {t('sugerenciasLabel')}
                  </p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => useSuggestion(s)}
                      className="block w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-left text-xs text-stone-700 hover:border-amber-300 hover:bg-amber-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user'
                      ? 'bg-stone-200 text-stone-600'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-amber-700 text-white'
                      : 'bg-stone-100 text-stone-800'
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

          {/* Input */}
          <div className="shrink-0 border-t border-stone-200 bg-stone-50 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('placeholder')}
                disabled={loading}
                className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-700 text-white shadow-sm hover:bg-amber-800 disabled:opacity-40"
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
  const parts = content.split(/(https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=[^\s)]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('https://www.google.com/maps/') ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-amber-700 underline hover:text-amber-900"
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
