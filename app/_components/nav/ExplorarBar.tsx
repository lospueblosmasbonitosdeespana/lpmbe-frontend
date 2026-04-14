'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function ExplorarBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');

  if (pathname?.startsWith('/explorar')) return null;
  if (pathname?.startsWith('/gestion')) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/explorar?q=${encodeURIComponent(q)}` : '/explorar');
  }

  return (
    <div className="border-b border-border/30 bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-1.5">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca pueblos por patrimonio, naturaleza o servicios del visitante"
            className="w-full rounded-lg bg-background/80 py-1.5 pl-9 pr-3 text-[13px] shadow-[inset_0_0_0_1px] shadow-border/40 transition-all placeholder:text-muted-foreground/60 focus:shadow-primary/40 focus:outline-none dark:bg-card/60"
          />
        </form>
      </div>
    </div>
  );
}
