'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef } from 'react';
import { Search } from 'lucide-react';

export default function ExplorarBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  if (pathname?.startsWith('/explorar')) return null;
  if (pathname?.startsWith('/gestion')) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push('/explorar');
  }

  function handleFocus() {
    router.push('/explorar');
  }

  return (
    <div className="border-b border-border/30 bg-muted/30 dark:bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 py-1.5">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="submit"
            className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg bg-background/80 px-3 py-1.5 text-left shadow-[inset_0_0_0_1px] shadow-border/40 transition-all hover:shadow-primary/30 dark:bg-card/60"
            onClick={handleFocus}
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-primary/50" />
            <span className="text-[13px] text-muted-foreground/70">
              Busca pueblos por patrimonio, naturaleza o servicios del visitante
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
