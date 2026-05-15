'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { NocheRomanticaIcon } from '@/app/_components/eventos/EventoIcon';

type EventoTipo = 'NOCHE_ROMANTICA' | 'NAVIDAD' | 'SEMANA_SANTA';

type DocumentoEvento = {
  id: number;
  eventoTipo: EventoTipo;
  anio: number;
  nombre: string;
  descripcion: string | null;
  url: string;
  contentType: string | null;
  size: number | null;
  orden: number;
  createdAt: string;
  updatedAt: string;
};

const EVENTOS: Array<{
  tipo: EventoTipo;
  label: string;
  emoji: string;
  gradient: string;
  ringColor: string;
}> = [
  {
    tipo: 'NOCHE_ROMANTICA',
    label: 'La Noche Romántica',
    emoji: '🌹',
    gradient: 'from-rose-500 to-pink-600',
    ringColor: 'ring-rose-200/60',
  },
  {
    tipo: 'NAVIDAD',
    label: 'Navidad',
    emoji: '🎄',
    gradient: 'from-emerald-500 to-green-600',
    ringColor: 'ring-emerald-200/60',
  },
  {
    tipo: 'SEMANA_SANTA',
    label: 'Semana Santa',
    emoji: '✝️',
    gradient: 'from-amber-500 to-orange-600',
    ringColor: 'ring-amber-200/60',
  },
];

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}
function isPdfUrl(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}
function formatBytes(b: number | null) {
  if (!b || b <= 0) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ url, className = 'h-5 w-5' }: { url: string; className?: string }) {
  if (isImageUrl(url)) {
    return (
      <svg className={`${className} text-sky-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  if (isPdfUrl(url)) {
    return (
      <svg className={`${className} text-rose-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      </svg>
    );
  }
  return (
    <svg className={`${className} text-slate-400`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export default function DisenosEventosShared() {
  const [docs, setDocs] = useState<DocumentoEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shared/documentos-evento', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Error cargando diseños');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Agrupar por evento → año
  const grouped = useMemo(() => {
    const out: Array<{
      tipo: EventoTipo;
      meta: typeof EVENTOS[number];
      anios: Array<{ anio: number; docs: DocumentoEvento[] }>;
      total: number;
    }> = [];
    for (const ev of EVENTOS) {
      const docsEvento = docs.filter((d) => d.eventoTipo === ev.tipo);
      if (docsEvento.length === 0) continue;
      const aniosMap = new Map<number, DocumentoEvento[]>();
      for (const d of docsEvento) {
        if (!aniosMap.has(d.anio)) aniosMap.set(d.anio, []);
        aniosMap.get(d.anio)!.push(d);
      }
      const anios = Array.from(aniosMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([anio, list]) => ({ anio, docs: list }));
      out.push({ tipo: ev.tipo, meta: ev, anios, total: docsEvento.length });
    }
    return out;
  }, [docs]);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-purple-200/40 shadow-sm">
        <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 px-5 py-4 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>🎨</span> Diseños para usar — La Noche Romántica, Navidad, Semana Santa
          </h2>
        </div>
        <div className="p-8 text-center text-sm text-muted-foreground">Cargando diseños…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (docs.length === 0) {
    return null; // no mostramos sección vacía a alcaldes
  }

  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-purple-200/60 bg-card shadow-sm">
      <div className="flex items-start gap-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 px-5 py-4 text-white">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
          🎨
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold leading-tight">Diseños para usar</h2>
          <p className="mt-0.5 text-sm text-white/85 leading-relaxed">
            Carteles, folletos y artes finales que la asociación pone a tu disposición para{' '}
            <strong>La Noche Romántica</strong>, <strong>Navidad</strong> y <strong>Semana Santa</strong>.
          </p>
        </div>
        <span className="shrink-0 self-start rounded-full bg-white/20 px-3 py-0.5 text-xs font-bold">
          {docs.length} {docs.length === 1 ? 'archivo' : 'archivos'}
        </span>
      </div>

      <div className="divide-y divide-purple-100/70 bg-gradient-to-b from-purple-50/30 to-transparent">
        {grouped.map((g) => {
          const sectionKey = g.tipo;
          const isOpen = openSections[sectionKey] ?? true;
          return (
            <div key={sectionKey}>
              <button
                type="button"
                onClick={() => setOpenSections((prev) => ({ ...prev, [sectionKey]: !isOpen }))}
                className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-white/60"
              >
                {g.tipo === 'NOCHE_ROMANTICA' ? (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200/60 shadow-sm">
                    <NocheRomanticaIcon size={36} />
                  </div>
                ) : (
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${g.meta.gradient} text-white text-lg shadow-sm`}>
                    {g.meta.emoji}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground">{g.meta.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {g.anios.length} {g.anios.length === 1 ? 'edición' : 'ediciones'} · {g.total}{' '}
                    {g.total === 1 ? 'archivo' : 'archivos'}
                  </p>
                </div>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300 ${isOpen ? 'bg-purple-100 text-purple-600 rotate-180' : 'bg-slate-100 text-slate-500'}`}>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div className="space-y-4 px-5 pb-5">
                  {g.anios.map(({ anio, docs: docsAnio }) => (
                    <div key={anio} className={`overflow-hidden rounded-xl bg-card ring-1 ${g.meta.ringColor} shadow-sm`}>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-50/80 border-b border-slate-100">
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                          Año {anio}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {docsAnio.length} {docsAnio.length === 1 ? 'archivo' : 'archivos'}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {docsAnio.map((doc) => (
                          <div key={doc.id} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/40">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 ring-1 ring-slate-200 overflow-hidden">
                              {isImageUrl(doc.url) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={doc.url} alt={doc.nombre} className="h-full w-full object-cover" />
                              ) : (
                                <FileIcon url={doc.url} className="h-6 w-6" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground leading-tight">{doc.nombre}</p>
                              {doc.descripcion && (
                                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{doc.descripcion}</p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                {doc.size ? <span>{formatBytes(doc.size)}</span> : null}
                                <span>{new Date(doc.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-1.5">
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 active:scale-95"
                              >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                </svg>
                                Ver
                              </a>
                              <a
                                href={doc.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 rounded-lg bg-gradient-to-r ${g.meta.gradient} px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95`}
                              >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Descargar
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
