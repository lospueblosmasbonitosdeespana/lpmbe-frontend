'use client';

import Link from 'next/link';
import { Search, Castle, TreePine, Car, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';

const QUICK_FILTERS = [
  { label: 'Castillos', href: '/explorar/castillo', icon: Castle },
  { label: 'Naturaleza', href: '/explorar/parque-natural', icon: TreePine },
  { label: 'Servicios', href: '/explorar/parking', icon: Car },
  { label: 'Norte', href: '/explorar?region=norte', icon: MapPin },
];

export default function ExplorarBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/explorar')) return null;
  if (pathname?.startsWith('/gestion')) return null;

  return (
    <div className="border-b border-border/40 bg-gradient-to-r from-primary/[0.03] to-primary/[0.06] dark:from-primary/[0.06] dark:to-primary/[0.10]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <Link
          href="/explorar"
          className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-border/60 bg-white/80 px-3.5 py-2 shadow-sm transition-all hover:border-primary/30 hover:shadow-md dark:bg-card/80"
        >
          <Search className="h-4 w-4 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
          <span className="truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground">
            Busca tu pueblo: patrimonio, naturaleza, servicios...
          </span>
        </Link>

        <div className="hidden items-center gap-1.5 sm:flex">
          {QUICK_FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary dark:bg-card/70"
              >
                <Icon className="h-3 w-3" />
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
