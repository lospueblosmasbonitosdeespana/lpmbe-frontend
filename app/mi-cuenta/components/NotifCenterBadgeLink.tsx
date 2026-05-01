'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

const LAST_READ_KEY = 'lpbe_notif_last_read_id';

export default function NotifCenterBadgeLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnread() {
      try {
        const res = await fetch(`/api/notificaciones/me?limit=50`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const items: Array<{ id: number }> = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : [];

        if (items.length === 0) return;

        const lastReadId = localStorage.getItem(LAST_READ_KEY);
        if (!lastReadId) {
          setUnread(items.length);
          return;
        }

        const lastIndex = items.findIndex((n) => String(n.id) === lastReadId);
        setUnread(lastIndex === -1 ? items.length : lastIndex);
      } catch {
        // silencioso
      }
    }

    fetchUnread();
    return () => { cancelled = true; };
  }, []);

  const handleClick = () => {
    // Marcar como leídas al entrar
    setUnread(0);
    // El valor real se guarda en la bandeja cuando la carga
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group relative flex min-h-[178px] flex-col items-center justify-center rounded-2xl border border-border/80 bg-gradient-to-br from-white via-card to-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg dark:from-card dark:via-card dark:to-card"
    >
      {/* Badge */}
      {unread > 0 && (
        <span className="absolute right-3 top-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
      <Bell className="mb-3 h-8 w-8 text-primary" />
      <span className="mb-1 text-center text-[15px] font-bold text-foreground">{title}</span>
      <p className="text-center text-[14px] text-muted-foreground group-hover:text-foreground">
        {description}
      </p>
    </Link>
  );
}
