'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, X, MapPin, SlidersHorizontal } from 'lucide-react';

type PuebloLite = {
  id: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  foto: string | null;
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function ExplorarBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pueblos, setPueblos] = useState<PuebloLite[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (pathname?.startsWith('/gestion')) return null;

  const isExplorar = pathname?.startsWith('/explorar');

  useEffect(() => {
    if (pueblos) return;
    fetch('/api/public/explorar')
      .then((r) => r.json())
      .then((d) => setPueblos(d.pueblos ?? []))
      .catch(() => {});
  }, [pueblos]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const results =
    query.trim().length >= 2 && pueblos
      ? pueblos.filter((p) => {
          const q = norm(query);
          return (
            norm(p.nombre).includes(q) ||
            norm(p.provincia).includes(q) ||
            norm(p.comunidad).includes(q)
          );
        }).slice(0, 8)
      : [];

  const showDropdown = focused && query.trim().length >= 2;
  const hasResults = results.length > 0;

  const clear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  if (isExplorar) return null;

  return (
    <div className="border-b border-border/30 bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-1.5">
        <div ref={wrapperRef} className="relative mx-auto max-w-lg">
          {/* Input + buttons */}
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/50" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                placeholder="Buscar pueblo..."
                enterKeyHint="search"
                autoComplete="off"
                className="w-full rounded-lg bg-background/80 py-1.5 pl-8 pr-8 text-sm shadow-[inset_0_0_0_1px] shadow-border/40 transition-all placeholder:text-muted-foreground/50 focus:shadow-primary/40 focus:outline-none dark:bg-card/60"
              />
              {query && (
                <button
                  type="button"
                  onClick={clear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Link
              href="/explorar"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span className="hidden xs:inline">Filtros</span>
            </Link>
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg">
              {hasResults ? (
                <ul>
                  {results.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/pueblos/${p.slug}`}
                        onClick={() => { setFocused(false); setQuery(''); }}
                        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        {p.foto ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.foto}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.nombre}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {p.provincia}, {p.comunidad}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No se encontraron pueblos para "{query}"
                </div>
              )}
              <Link
                href={`/explorar?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setFocused(false)}
                className="flex items-center justify-center gap-1.5 border-t border-border/40 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
              >
                <SlidersHorizontal className="h-3 w-3" />
                Búsqueda avanzada con filtros
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
