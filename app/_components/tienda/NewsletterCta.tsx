'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { Eyebrow, Headline, Body } from '@/app/components/ui/typography';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';

export function NewsletterCta() {
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
        body: JSON.stringify({ email: email.trim(), origen: 'tienda' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setEmail('');
        trackEvent('newsletter_subscribe', { category: 'conversion', label: 'tienda' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <Section spacing="lg" background="primary" className="text-primary-foreground">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-4 text-primary-foreground/70">Newsletter</Eyebrow>
          <Headline as="h2" className="mb-4 text-primary-foreground">
            10% de descuento en tu primera compra
          </Headline>
          <Body className="mb-8 text-primary-foreground/80">
            Suscríbete a nuestra newsletter y recibe un código de descuento exclusivo,
            además de novedades sobre productos artesanales de los pueblos más bonitos.
          </Body>

          {status === 'success' ? (
            <p className="rounded-md bg-primary-foreground/20 px-4 py-3 text-sm font-medium text-primary-foreground">
              ¡Gracias! Revisa tu email para confirmar la suscripción.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                required
                disabled={status === 'loading'}
                className="w-full rounded-md border-0 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 disabled:opacity-70 sm:max-w-xs"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="rounded-md bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90 disabled:opacity-70"
              >
                {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-2 text-sm text-primary-foreground/80">
              Ha ocurrido un error. Inténtalo de nuevo.
            </p>
          )}

          <Link
            href="/newsletter"
            className="mt-4 inline-block text-sm font-medium text-primary-foreground/90 hover:text-primary-foreground underline underline-offset-2"
          >
            Últimas newsletters →
          </Link>
        </div>
      </Container>
    </Section>
  );
}
