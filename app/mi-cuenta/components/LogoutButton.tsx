'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/entrar');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="mt-10 inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive disabled:opacity-70"
    >
      <LogOut className="h-4 w-4" />
      {loading ? 'Cerrando sesión…' : 'Cerrar sesión'}
    </button>
  );
}
