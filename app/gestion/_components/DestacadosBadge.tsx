'use client';

import { useEffect, useState } from 'react';

export default function DestacadosBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/documentos-pueblo/destacados-count', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
      {count}
    </span>
  );
}
