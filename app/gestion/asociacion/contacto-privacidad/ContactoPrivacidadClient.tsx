'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TipTapEditor from '@/app/_components/editor/TipTapEditor';

type SiteSettings = {
  contactAddress?: string | null;
  contactPhone?: string | null;
  contactPressPhone?: string | null;
  contactEmail?: string | null;
};

type StaticPage = {
  key: string;
  titulo: string;
  contenido: string | null;
};

const STATIC_PAGE_LABELS: Record<string, string> = {
  PRIVACIDAD: 'Política de privacidad',
  AVISO_LEGAL: 'Aviso legal',
  COOKIES: 'Política de cookies',
};

const STATIC_PAGE_ROUTES: Record<string, string> = {
  PRIVACIDAD: '/privacidad',
  AVISO_LEGAL: '/aviso-legal',
  COOKIES: '/cookies',
};

export default function ContactoPrivacidadClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);
  const [savingPage, setSavingPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [contactAddress, setContactAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPressPhone, setContactPressPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [expandedPage, setExpandedPage] = useState<string | null>('PRIVACIDAD');

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, pagesRes] = await Promise.all([
          fetch('/api/admin/site-settings', { cache: 'no-store' }),
          fetch('/api/admin/static-pages', { cache: 'no-store' }),
        ]);

        if (settingsRes.status === 401 || pagesRes.status === 401) {
          window.location.href = '/entrar';
          return;
        }

        if (settingsRes.ok) {
          const settings: SiteSettings = await settingsRes.json();
          setContactAddress(settings.contactAddress ?? '');
          setContactPhone(settings.contactPhone ?? '');
          setContactPressPhone(settings.contactPressPhone ?? '');
          setContactEmail(settings.contactEmail ?? '');
        }

        if (pagesRes.ok) {
          const pages: StaticPage[] = await pagesRes.json();
          const ordered = ['PRIVACIDAD', 'AVISO_LEGAL', 'COOKIES'].map((key) => {
            const found = pages.find((p) => p.key === key);
            return (
              found ?? {
                key,
                titulo: STATIC_PAGE_LABELS[key] ?? key,
                contenido: '',
              }
            );
          });
          setStaticPages(ordered);
        }
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSaveContact(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSavingContact(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactAddress: contactAddress.trim() || null,
          contactPhone: contactPhone.trim() || null,
          contactPressPhone: contactPressPhone.trim() || null,
          contactEmail: contactEmail.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Error guardando');
      }

      setSuccess('Datos de contacto guardados');
      setTimeout(() => router.refresh(), 500);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Error al guardar');
    } finally {
      setSavingContact(false);
    }
  }

  async function handleSaveStaticPage(key: string, titulo: string, contenido: string) {
    setError(null);
    setSuccess(null);
    setSavingPage(key);
    try {
      const res = await fetch(`/api/admin/static-pages/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, contenido }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Error guardando');
      }

      setSuccess(`${STATIC_PAGE_LABELS[key] ?? key} guardado`);
      setStaticPages((prev) =>
        prev.map((p) => (p.key === key ? { ...p, titulo, contenido } : p))
      );
      setTimeout(() => router.refresh(), 500);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Error al guardar');
    } finally {
      setSavingPage(null);
    }
  }

  if (loading) {
    return <div className="mt-6 text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="mt-8 space-y-10">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Datos de contacto */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Datos de contacto</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Estos datos se muestran en la página de contacto y en el footer.
        </p>
        <form onSubmit={handleSaveContact} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Dirección</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="Calle, número, código postal, ciudad"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+34 900 000 000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Teléfono prensa</label>
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={contactPressPhone}
                onChange={(e) => setContactPressPhone(e.target.value)}
                placeholder="+34 900 000 001"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="info@lospueblosmasbonitosdeespana.org"
            />
          </div>
          <button
            type="submit"
            disabled={savingContact}
            className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {savingContact ? 'Guardando...' : 'Guardar contacto'}
          </button>
        </form>
      </section>

      {/* Páginas estáticas */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Páginas estáticas</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Edita el contenido de privacidad, aviso legal y cookies. Usa H2 para secciones principales (ej. &quot;1. INFORMACIÓN AL USUARIO&quot;) y H3 para subsecciones (ej. &quot;RESPONSABLE DEL TRATAMIENTO&quot;) para una mejor jerarquía visual.
        </p>

        <div className="space-y-4">
          {staticPages.map((page) => (
            <StaticPageEditor
              key={page.key}
              page={page}
              expanded={expandedPage === page.key}
              onToggle={() =>
                setExpandedPage((prev) => (prev === page.key ? null : page.key))
              }
              onSave={(titulo, contenido) =>
                handleSaveStaticPage(page.key, titulo, contenido)
              }
              saving={savingPage === page.key}
              label={STATIC_PAGE_LABELS[page.key]}
              route={STATIC_PAGE_ROUTES[page.key]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function StaticPageEditor({
  page,
  expanded,
  onToggle,
  onSave,
  saving,
  label,
  route,
}: {
  page: StaticPage;
  expanded: boolean;
  onToggle: () => void;
  onSave: (titulo: string, contenido: string) => void;
  saving: boolean;
  label: string;
  route: string;
}) {
  const [titulo, setTitulo] = useState(page.titulo);
  const [contenido, setContenido] = useState(page.contenido ?? '');

  useEffect(() => {
    setTitulo(page.titulo);
    setContenido(page.contenido ?? '');
  }, [page.titulo, page.contenido]);

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-muted/50"
      >
        <span>{label}</span>
        <span className="text-muted-foreground">
          {expanded ? '▼' : '▶'}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Contenido (HTML)</label>
            <TipTapEditor
              content={contenido}
              onChange={setContenido}
              placeholder="Escribe el contenido..."
              minHeight="300px"
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onSave(titulo, contenido)}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <Link
              href={route}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              Ver página →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
