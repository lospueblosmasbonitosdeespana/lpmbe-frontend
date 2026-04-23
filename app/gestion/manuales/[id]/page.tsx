import { getMeServer } from '@/lib/me';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetch-safe';
import { redirect, notFound } from 'next/navigation';
import {
  GestionHubBackLink,
  GestionHubHero,
} from '../../_components/GestionHub';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

type ArchivoAdjunto = { url: string; nombre: string };

type ManualDoc = {
  id: number;
  nombre: string;
  url: string;
  descripcion: string | null;
  tipo: string;
  creadoEn?: string | null;
  archivosAdicionales?: ArchivoAdjunto[] | null;
};

async function fetchManual(id: number): Promise<ManualDoc | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetchWithTimeout(
      `${getApiUrl()}/admin/documentos-pueblo?compartidos=true`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    if (!res.ok) return null;
    const all = await res.json();
    if (!Array.isArray(all)) return null;
    const found = (all as ManualDoc[]).find((d) => d?.id === id);
    return found ?? null;
  } catch {
    return null;
  }
}

function getExt(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
    return (match?.[1] ?? '').toLowerCase();
  } catch {
    const m = url.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
    return (m?.[1] ?? '').toLowerCase();
  }
}

function isPdf(url: string) {
  return getExt(url) === 'pdf';
}

function isImage(url: string) {
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(
    getExt(url),
  );
}

function iconForUrl(url: string) {
  if (isPdf(url)) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    );
  }
  if (isImage(url)) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function formatBytes(url: string) {
  // Sin metadatos: solo sacamos la extensión como etiqueta
  const ext = getExt(url).toUpperCase();
  return ext || 'FILE';
}

type Item = {
  key: string;
  nombre: string;
  url: string;
  isPrincipal: boolean;
};

function flatten(doc: ManualDoc): Item[] {
  const items: Item[] = [];
  if (doc.url) {
    items.push({
      key: `${doc.id}-main`,
      nombre: doc.nombre,
      url: doc.url,
      isPrincipal: true,
    });
  }
  const extras = Array.isArray(doc.archivosAdicionales)
    ? doc.archivosAdicionales
    : [];
  extras.forEach((a, idx) => {
    if (!a?.url) return;
    items.push({
      key: `${doc.id}-adj-${idx}`,
      nombre: a.nombre || `Archivo ${idx + 2}`,
      url: a.url,
      isPrincipal: false,
    });
  });
  return items;
}

export default async function ManualDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const search = (await searchParams) ?? {};
  const backHref =
    typeof search.from === 'string' && search.from.startsWith('/')
      ? search.from
      : '/gestion/documentos-compartidos';
  const backLabel = backHref.includes('/pueblos/')
    ? 'Volver al pueblo'
    : 'Volver a documentos compartidos';

  const doc = await fetchManual(numId);
  if (!doc) notFound();

  const items = flatten(doc);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <GestionHubBackLink href={backHref}>{backLabel}</GestionHubBackLink>

      <GestionHubHero
        title="Manual y ayuda de la web"
        highlightTitle={doc.nombre}
        subtitle={
          doc.descripcion ?? (
            <>Guía publicada por la asociación con {items.length} {items.length === 1 ? 'archivo' : 'archivos'}.</>
          )
        }
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Este manual todavía no tiene archivos.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((it, idx) => (
            <article
              key={it.key}
              className="overflow-hidden rounded-2xl border border-sky-200/50 bg-card shadow-sm dark:border-sky-900/40"
            >
              <header className="flex flex-wrap items-center gap-3 border-b border-sky-100/70 bg-sky-50/40 px-4 py-3 dark:border-sky-900/40 dark:bg-sky-950/30 sm:px-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800/50">
                  {iconForUrl(it.url)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-foreground sm:text-base">
                      {it.nombre}
                    </h3>
                    {it.isPrincipal ? (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50">
                        Principal
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 ring-1 ring-sky-200/70 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900/50">
                        Archivo {idx + 1}
                      </span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {formatBytes(it.url)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200/70 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition-all hover:border-sky-400 hover:bg-sky-50 dark:border-sky-900/50 dark:bg-card dark:text-sky-200"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M15 3h6v6M10 14L21 3M21 14v6a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h6" />
                    </svg>
                    Abrir
                  </a>
                  <a
                    href={it.url}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-sky-700"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Descargar
                  </a>
                </div>
              </header>

              {isPdf(it.url) ? (
                <div className="relative w-full bg-muted/30">
                  <iframe
                    src={`${it.url}#view=FitH&toolbar=1`}
                    title={it.nombre}
                    className="h-[72vh] min-h-[520px] w-full"
                  />
                </div>
              ) : isImage(it.url) ? (
                <div className="flex items-center justify-center bg-muted/20 p-4">
                  <a href={it.url} target="_blank" rel="noopener noreferrer" className="block max-w-full">
                    <img
                      src={it.url}
                      alt={it.nombre}
                      className="max-h-[72vh] w-auto rounded-lg object-contain shadow-sm"
                    />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-muted/20 p-6 text-sm text-muted-foreground">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  Formato no previsualizable. Usa «Abrir» o «Descargar».
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
