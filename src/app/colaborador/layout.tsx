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
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
      <aside
        style={{
          width: 220,
          borderRight: '1px solid #e5e7eb',
          padding: '24px 16px',
          background: '#f9fafb',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>
          Panel Colaborador
        </h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: isActive ? '#1d4ed8' : '#374151',
                  background: isActive ? '#eff6ff' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
