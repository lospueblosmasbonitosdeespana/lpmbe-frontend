'use client';

import { useEffect, useState } from 'react';

const LS_KEY = 'lpmbe_importantesLastSeen';
const REMIND_INTERVAL_MS = 72 * 60 * 60 * 1000; // 72 horas

export default function DestacadosBadge() {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/admin/documentos-pueblo/destacados-count', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const n = data.count ?? 0;
        if (n === 0) { setShow(false); return; }

        const lastSeen = localStorage.getItem(LS_KEY);
        const latestUpdate = data.latestUpdatedAt ? new Date(data.latestUpdatedAt).getTime() : 0;

        if (!lastSeen) {
          setCount(n);
          setShow(true);
          return;
        }

        const lastSeenTime = new Date(lastSeen).getTime();

        if (latestUpdate > lastSeenTime) {
          setCount(n);
          setShow(true);
          return;
        }

        const elapsed = Date.now() - lastSeenTime;
        if (elapsed >= REMIND_INTERVAL_MS) {
          setCount(n);
          setShow(true);
          return;
        }

        setShow(false);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
      {count}
    </span>
  );
}
