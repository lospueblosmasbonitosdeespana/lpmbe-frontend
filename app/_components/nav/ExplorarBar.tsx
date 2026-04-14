'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, MapPin, Castle, Wrench } from 'lucide-react';
import { TagIcon } from '@/lib/tag-icon-map';
import { filterToSlug } from '@/lib/explorar-slugs';

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
  categoria: string;
  nombre_i18n: Record<string, string>;
  icono: string;
  color: string;
  count: number;
};

type SvcCount = {
  tipo: string;
  count: number;
};

const SVC_LABELS: Record<string, string> = {
  PARKING: 'Aparcamiento', TURISMO: 'Oficina de turismo', FARMACIA: 'Farmacia',
  HOSPITAL: 'Centro de salud', PARQUE_INFANTIL: 'Parque infantil', LAVABO: 'Lavabos públicos',
  AUTOBUS: 'Autobús', CARAVANAS: 'Área de caravanas', BANCO: 'Cajero / Banco',
  FUENTE: 'Fuente de agua', COCHE_ELECTRICO: 'Cargador eléctrico', PICNIC: 'Zona de picnic',
  POLICIA: 'Policía', SUPERMERCADO: 'Supermercado', GASOLINERA: 'Gasolinera',
  DESFIBRILADOR: 'Desfibrilador', TAXI: 'Taxi', BANO_NATURAL: 'Baño natural',
  PIPICAN: 'Pipicán', TREN: 'Tren', ALQUILER_BICI: 'Alquiler bici',
  COCHE_ELECTRICO_ULTRA: 'Carga ultra-rápida', PLAYA: 'Playa',
};

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function ExplorarBar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [pueblos, setPueblos] = useState<PuebloLite[] | null>(null);
  const [tags, setTags] = useState<TagCount[] | null>(null);
  const [servicios, setServicios] = useState<SvcCount[] | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (pathname?.startsWith('/gestion')) return null;
  if (pathname?.startsWith('/explorar')) return null;

  useEffect(() => {
    if (pueblos) return;
    Promise.all([
      fetch('/api/public/explorar').then((r) => r.json()),
      fetch('/api/public/explorar/counts').then((r) => r.json()),
    ])
      .then(([explorar, counts]) => {
        setPueblos(explorar.pueblos ?? []);
        setTags(counts.tags ?? []);
        setServicios(counts.servicios ?? []);
      })
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

  const q = norm(query.trim());
  const hasQuery = q.length >= 2;

  const matchingTags = hasQuery && tags
    ? tags.filter((t) => {
        const name = norm(t.nombre_i18n?.es ?? '');
        return name.includes(q) || norm(t.tag).includes(q);
      }).slice(0, 4)
    : [];

  const matchingSvcs = hasQuery && servicios
    ? servicios.filter((s) => {
        const label = norm(SVC_LABELS[s.tipo] ?? s.tipo);
        return label.includes(q) || norm(s.tipo).includes(q);
      }).slice(0, 3)
    : [];

  const matchingPueblos = hasQuery && pueblos
    ? pueblos.filter((p) =>
        norm(p.nombre).includes(q) ||
        norm(p.provincia).includes(q) ||
        norm(p.comunidad).includes(q)
      ).slice(0, 5)
    : [];

  const hasAnyResults = matchingTags.length > 0 || matchingSvcs.length > 0 || matchingPueblos.length > 0;
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
            <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              {hasAnyResults ? (
                <>
                  {/* Tags / characteristics */}
                  {matchingTags.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Características
                      </p>
                      {matchingTags.map((t) => {
                        const slug = filterToSlug('tag', t.tag);
                        if (!slug) return null;
                        return (
                          <Link
                            key={t.tag}
                            href={`/explorar/${slug}`}
                            onClick={() => { setFocused(false); setQuery(''); }}
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

                  {/* Services */}
                  {matchingSvcs.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Servicios del visitante
                      </p>
                      {matchingSvcs.map((s) => {
                        const slug = filterToSlug('servicio', s.tipo);
                        if (!slug) return null;
                        return (
                          <Link
                            key={s.tipo}
                            href={`/explorar/${slug}`}
                            onClick={() => { setFocused(false); setQuery(''); }}
                            className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Wrench className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {SVC_LABELS[s.tipo] ?? s.tipo}
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

                  {/* Pueblos */}
                  {matchingPueblos.length > 0 && (
                    <div>
                      <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Pueblos
                      </p>
                      {matchingPueblos.map((p) => (
                        <Link
                          key={p.id}
                          href={`/pueblos/${p.slug}`}
                          onClick={() => { setFocused(false); setQuery(''); }}
                          className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/50"
                        >
                          {p.foto ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={p.foto} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{p.nombre}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{p.provincia}</p>
                          </div>
                        </Link>
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
