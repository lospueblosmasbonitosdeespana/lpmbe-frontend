'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, X, MapPin, Wrench,
  Newspaper, CalendarDays, UtensilsCrossed, Landmark, TreePine, PawPrint, Users,
} from 'lucide-react';
import { TagIcon } from '@/lib/tag-icon-map';

type PuebloLite = {
  id: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  foto: string | null;
};

type TagCount = {
  tag: string;
  slug?: string;
  categoria: string;
  nombre_i18n: Record<string, string>;
  icono: string;
  color: string;
  count: number;
};

type SvcCount = {
  tipo: string;
  slug?: string;
  label?: string;
  count: number;
};

const PUEBLO_SECTIONS = [
  { keyword: 'noticias', label: 'Noticias', path: (s: string) => `/pueblos/${s}#noticias`, icon: Newspaper },
  { keyword: 'eventos', label: 'Eventos', path: (s: string) => `/pueblos/${s}#eventos`, icon: CalendarDays },
  { keyword: 'comer', label: 'Qué comer', path: (s: string) => `/que-comer/${s}`, icon: UtensilsCrossed },
  { keyword: 'ver', label: 'Qué ver', path: (s: string) => `/patrimonio/${s}`, icon: Landmark },
  { keyword: 'naturaleza', label: 'Naturaleza', path: (s: string) => `/naturaleza/${s}`, icon: TreePine },
  { keyword: 'familia', label: 'En familia', path: (s: string) => `/en-familia/${s}`, icon: Users },
  { keyword: 'mascotas', label: 'Petfriendly', path: (s: string) => `/petfriendly/${s}`, icon: PawPrint },
] as const;

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function toSlug(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function ExplorarBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pueblos, setPueblos] = useState<PuebloLite[] | null>(null);
  const [tags, setTags] = useState<TagCount[] | null>(null);
  const [servicios, setServicios] = useState<SvcCount[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hidden =
    pathname?.startsWith('/gestion') || pathname?.startsWith('/explorar');

  useEffect(() => {
    if (hidden || pueblos) return;
    Promise.all([
      fetch('/api/public/explorar').then((r) => r.json()),
      fetch('/api/public/explorar/counts?soloColecciones=true').then((r) => r.json()),
    ])
      .then(([explorar, counts]) => {
        setPueblos(explorar.pueblos ?? []);
        setTags(counts.tags ?? []);
        setServicios(counts.servicios ?? []);
      })
      .catch(() => {});
  }, [hidden, pueblos]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const q = norm(query.trim());
  const hasQuery = q.length >= 2;

  const sectionKeyword = useMemo(() => {
    if (!hasQuery) return null;
    return PUEBLO_SECTIONS.find(sec => q.includes(sec.keyword)) ?? null;
  }, [hasQuery, q]);

  const puebloQuery = useMemo(() => {
    if (!sectionKeyword) return q;
    return q.replace(sectionKeyword.keyword, '').trim();
  }, [q, sectionKeyword]);

  const matchingTags = useMemo(
    () =>
      hasQuery && tags && !sectionKeyword
        ? tags
            .filter((t) => {
              const name = norm(t.nombre_i18n?.es ?? '');
              return name.includes(q) || norm(t.tag).includes(q);
            })
            .slice(0, 4)
        : [],
    [hasQuery, tags, q, sectionKeyword],
  );

  const matchingSvcs = useMemo(
    () =>
      hasQuery && servicios && !sectionKeyword
        ? servicios
            .filter((s) => {
              const label = norm(s.label ?? s.tipo);
              return label.includes(q) || norm(s.tipo).includes(q);
            })
            .slice(0, 3)
        : [],
    [hasQuery, servicios, q, sectionKeyword],
  );

  const matchingPueblos = useMemo(
    () =>
      hasQuery && pueblos
        ? pueblos
            .filter(
              (p) =>
                norm(p.nombre).includes(puebloQuery) ||
                norm(p.provincia).includes(puebloQuery) ||
                norm(p.comunidad).includes(puebloQuery),
            )
            .slice(0, sectionKeyword ? 3 : 5)
        : [],
    [hasQuery, pueblos, puebloQuery, sectionKeyword],
  );

  if (hidden) return null;

  const close = () => { setFocused(false); setQuery(''); };

  const hasAnyResults =
    matchingTags.length > 0 || matchingSvcs.length > 0 || matchingPueblos.length > 0;
  const showDropdown = focused && hasQuery;

  return (
    <div className="border-b border-border/30 bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-1.5">
        <div ref={wrapperRef} className="relative mx-auto max-w-lg">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Buscar pueblo, castillo, naturaleza, servicios..."
              enterKeyHint="search"
              autoComplete="off"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-card/80"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
              {hasAnyResults ? (
                <>
                  {matchingTags.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Características
                      </p>
                      {matchingTags.map((t) => {
                        const slug = t.slug || toSlug(t.nombre_i18n?.es ?? t.tag);
                        return (
                          <Link
                            key={t.tag}
                            href={`/explorar/${slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${t.color}18` }}
                            >
                              <TagIcon name={t.icono} color={t.color} size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {t.nombre_i18n?.es ?? t.tag}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {t.count} pueblos
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {matchingSvcs.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Servicios del visitante
                      </p>
                      {matchingSvcs.map((s) => {
                        const slug = s.slug || toSlug(s.label ?? s.tipo);
                        return (
                          <Link
                            key={s.tipo}
                            href={`/explorar/${slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Wrench className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {s.label ?? s.tipo}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {s.count} pueblos
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {matchingPueblos.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {sectionKeyword
                          ? `${sectionKeyword.label} en pueblos`
                          : 'Pueblos'}
                      </p>
                      {matchingPueblos.map((p) => (
                        <div key={p.id}>
                          <Link
                            href={sectionKeyword
                              ? sectionKeyword.path(p.slug)
                              : `/pueblos/${p.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            {p.foto ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={p.foto}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {sectionKeyword
                                  ? `${sectionKeyword.label} de ${p.nombre}`
                                  : p.nombre}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {p.provincia}
                              </p>
                            </div>
                          </Link>
                          {!sectionKeyword && (
                            <div className="flex flex-wrap gap-1 px-3 pb-2 pl-14">
                              {PUEBLO_SECTIONS.slice(0, 5).map((sec) => (
                                <Link
                                  key={sec.keyword}
                                  href={sec.path(p.slug)}
                                  onClick={close}
                                  className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                >
                                  <sec.icon className="h-2.5 w-2.5" />
                                  {sec.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No se encontraron resultados para &ldquo;{query}&rdquo;
                </div>
              )}
              <Link
                href="/explorar"
                onClick={() => setFocused(false)}
                className="flex items-center justify-center gap-1.5 border-t border-border/40 px-3 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <Search className="h-3 w-3" />
                Explorar con filtros avanzados
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
