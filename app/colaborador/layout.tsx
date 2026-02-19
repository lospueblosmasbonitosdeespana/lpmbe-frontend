'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/colaborador', label: 'Mis Recursos' },
  { href: '/colaborador/validar', label: 'Validar QR' },
];

export default function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Panel de Colaborador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tu recurso turístico asignado
          </p>
        </div>
        <Link
          href="/cuenta"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a cuenta
        </Link>
      </div>

      <nav className="mb-8 flex gap-1 rounded-lg border border-border bg-card p-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
