'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Mail } from 'lucide-react';

type Edition = {
  id: number;
  titulo: string;
  mes: number;
  anio: number;
  url: string;
  orden: number;
  activo: boolean;
};

export function NewsletterPageClient({
  editions,
  meses,
}: {
  editions: Edition[];
  meses: string[];
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), origen: 'newsletter' }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-12">
      {/* Suscripción */}
      <div className="rounded-xl border border-border bg-muted/30 p-8">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Suscríbete a nuestra newsletter</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Recibe novedades, eventos y contenidos exclusivos de Los Pueblos Más Bonitos en tu correo.
        </p>
        {status === 'success' ? (
          <p className="text-green-600 font-medium">
            ¡Gracias! Revisa tu email para confirmar la suscripción.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              required
              disabled={status === 'loading'}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            >
              {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="mt-2 text-sm text-destructive">Ha ocurrido un error. Inténtalo de nuevo.</p>
        )}
      </div>

      {/* Listado de ediciones */}
      <div>
        <h2 className="text-xl font-semibold mb-6">Últimas newsletters</h2>
        {editions.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/20 p-12 text-center text-muted-foreground">
            No hay newsletters publicadas aún. ¡Suscríbete para recibir la próxima!
          </div>
        ) : (
          <div className="space-y-4">
            {editions.map((ed) => (
              <div
                key={ed.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{ed.titulo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {meses[ed.mes - 1]} {ed.anio}
                    </p>
                  </div>
                </div>
                <a
                  href={ed.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-4 w-4" /> Leer
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
