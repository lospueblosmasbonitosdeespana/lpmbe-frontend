import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  description: 'La página que buscas no existe o ha sido movida. Vuelve al inicio para seguir descubriendo los pueblos más bonitos de España.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-4 text-xl text-foreground">
        La página que buscas no existe o ha sido movida.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
