'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContentBlock } from '@/app/_components/content-builder/ContentBlockBuilder';
import DraftsAndScheduler, {
  type DraftRow,
} from '../_components/DraftsAndScheduler';

type Attachment = { name: string; url: string; contentType: string; size: number };

const ContentBlockBuilder = dynamic(
  () => import('@/app/_components/content-builder/ContentBlockBuilder'),
  {
    ssr: false,
    loading: () => (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Cargando constructor…
      </div>
    ),
  },
);

type RegionCode = 'NORTE' | 'CENTRO' | 'SUR' | 'ESTE';

const REGIONS: Array<{ code: RegionCode; label: string }> = [
  { code: 'NORTE', label: 'Norte' },
  { code: 'CENTRO', label: 'Centro' },
  { code: 'SUR', label: 'Sur' },
  { code: 'ESTE', label: 'Este' },
];

const ROLES: Array<{ code: string; label: string }> = [
  { code: 'ALCALDE', label: 'Alcaldes' },
  { code: 'ALCALDESA', label: 'Alcaldesas' },
  { code: 'CONCEJAL', label: 'Concejales' },
  { code: 'CONCEJALA', label: 'Concejalas' },
  { code: 'TECNICO_TURISMO', label: 'Técnicos de turismo' },
  { code: 'OFICINA_TURISMO', label: 'Oficinas de turismo' },
  { code: 'SECRETARIO', label: 'Secretarios/as' },
  { code: 'GERENTE', label: 'Gerentes' },
  { code: 'AYUNTAMIENTO', label: 'Genérico ayuntamiento' },
  { code: 'OTRO', label: 'Otros' },
];

type Campaign = {
  id: number;
  kind: string;
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  deliveredCount: number;
  sentAt?: string | null;
  createdAt: string;
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

const DRAFT_KEY = 'ayuntamientos-composer-v1';

export default function AyuntamientosComposerClient() {
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const [selectedRegions, setSelectedRegions] = useState<Set<RegionCode>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [includeAlcaldesUser, setIncludeAlcaldesUser] = useState(true);
  const [includeInstitutional, setIncludeInstitutional] = useState(true);

  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const uploadFileNameBase = useMemo(
    () =>
      subject
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'ayuntamientos',
    [subject],
  );

  const attachmentUrlsForSend = useMemo(() => {
    const list: Array<{ url: string; filename?: string; contentType?: string }> = [];
    if (pdfUrl) {
      const fromUrl = pdfUrl.split('/').pop()?.split('?')[0] || '';
      const safe =
        fromUrl && /\.pdf$/i.test(fromUrl)
          ? fromUrl
          : (fromUrl || `circular-${Date.now()}`).replace(/\.[^.]+$/, '') + '.pdf';
      list.push({ url: pdfUrl, filename: safe, contentType: 'application/pdf' });
    }
    for (const a of attachments) {
      list.push({ url: a.url, filename: a.name, contentType: a.contentType });
    }
    return list;
  }, [pdfUrl, attachments]);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch(
        '/api/admin/newsletter/campaigns?kind=AYUNTAMIENTOS&limit=30',
        { cache: 'no-store' },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const items: Campaign[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        setCampaigns(items);
      }
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const toggleRegion = (code: RegionCode) => {
    setSelectedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleRole = (code: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const filters = useMemo(
    () => ({
      regions: Array.from(selectedRegions),
      roles: Array.from(selectedRoles),
      includeAlcaldesUser,
      includeInstitutional,
    }),
    [selectedRegions, selectedRoles, includeAlcaldesUser, includeInstitutional],
  );

  const getSnapshot = useCallback(
    () => ({
      subject: subject.trim(),
      contentHtml: html,
      blocksJson: blocks,
      filters,
      attachmentUrls: attachmentUrlsForSend,
    }),
    [subject, html, blocks, filters, attachmentUrlsForSend],
  );

  const loadFromDraft = useCallback((draft: DraftRow) => {
    setSubject(draft.subject || '');
    setHtml(draft.contentHtml || '');
    if (Array.isArray(draft.blocksJson)) {
      setBlocks(draft.blocksJson as ContentBlock[]);
    }
    const f = (draft.filters || {}) as Record<string, unknown>;
    const regs = Array.isArray(f.regions) ? (f.regions as RegionCode[]) : [];
    const roles = Array.isArray(f.roles) ? (f.roles as string[]) : [];
    setSelectedRegions(new Set(regs));
    setSelectedRoles(new Set(roles));
    if (typeof f.includeAlcaldesUser === 'boolean')
      setIncludeAlcaldesUser(f.includeAlcaldesUser);
    if (typeof f.includeInstitutional === 'boolean')
      setIncludeInstitutional(f.includeInstitutional);

    const incomingAttachments = Array.isArray(draft.attachmentUrls)
      ? draft.attachmentUrls
      : [];
    const pdfEntry = incomingAttachments.find(
      (a) =>
        a.contentType === 'application/pdf' ||
        (typeof a.filename === 'string' && /\.pdf$/i.test(a.filename)) ||
        /\.pdf$/i.test(a.url),
    );
    setPdfFile(null);
    setPdfUrl(pdfEntry ? pdfEntry.url : '');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    const others = incomingAttachments.filter((a) => a !== pdfEntry);
    setAttachments(
      others.map((a) => ({
        name: a.filename || a.url.split('/').pop()?.split('?')[0] || 'adjunto',
        url: a.url,
        contentType: a.contentType || 'application/octet-stream',
        size: 0,
      })),
    );
    if (attachInputRef.current) attachInputRef.current.value = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const canSend = subject.trim().length > 0 && html.trim().length > 0 && !sending;

  // ---------- Subida directa a R2 (evita el límite del proxy de Vercel) ----------
  // Vercel limita el body de las funciones serverless a ~4,5 MB. Para archivos
  // mayores (PDFs de circulares, vídeos, etc.) usamos el flujo de "ticket": el
  // navegador pide un JWT corto al backend y luego sube el archivo directamente
  // al backend (Railway), sin pasar por la función de Vercel. Si el backend
  // todavía no expone /media/upload-ticket, caemos a una URL firmada de R2
  // (presign) y hacemos PUT directo a Cloudflare R2.
  async function uploadFileViaPresign(file: File, folder: string): Promise<string> {
    const contentType = file.type || 'application/octet-stream';
    const presignRes = await fetch('/api/media/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType, folder }),
    });
    if (!presignRes.ok) {
      const txt = await presignRes.text().catch(() => '');
      throw new Error(txt || `No se pudo firmar la subida (status ${presignRes.status})`);
    }
    const presign = await presignRes.json();
    const uploadRes = await fetch(String(presign.uploadUrl), {
      method: 'PUT',
      headers: { 'Content-Type': String(presign.contentType || contentType) },
      body: file,
    });
    if (!uploadRes.ok) throw new Error(`Error subiendo a R2 (status ${uploadRes.status})`);
    const publicUrl = String(presign.publicUrl || '');
    if (!publicUrl) throw new Error('R2 no devolvió URL pública');
    return publicUrl;
  }

  async function uploadFileDirectToR2(file: File, folder: string): Promise<string> {
    const ticketRes = await fetch('/api/media/upload-ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });
    if (!ticketRes.ok) {
      const raw = await ticketRes.text().catch(() => '');
      if (ticketRes.status === 404 || /Cannot POST \/media\/upload-ticket/i.test(raw)) {
        return uploadFileViaPresign(file, folder);
      }
      throw new Error(raw || 'No se pudo preparar la subida');
    }
    const ticketData = await ticketRes.json();
    const uploadUrl = String(ticketData.uploadUrl || '');
    const ticket = String(ticketData.ticket || '');
    if (!uploadUrl || !ticket) throw new Error('No se pudo preparar la subida');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('ticket', ticket);
    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: fd });
    if (!uploadRes.ok) {
      const txt = await uploadRes.text().catch(() => '');
      throw new Error(`Error subiendo archivo (status ${uploadRes.status})${txt ? `: ${txt}` : ''}`);
    }
    const data = await uploadRes.json().catch(() => ({}));
    const publicUrl = String(data.publicUrl || data.url || '');
    if (!publicUrl) throw new Error('R2 no devolvió URL pública');
    return publicUrl;
  }

  async function uploadPdf(): Promise<string> {
    if (!pdfFile) return pdfUrl;
    if (!/\.pdf$/i.test(pdfFile.name) && pdfFile.type !== 'application/pdf') {
      throw new Error('El archivo debe ser PDF');
    }
    if (pdfFile.size > 12 * 1024 * 1024) {
      throw new Error('El PDF supera el límite máximo de 12 MB para envío por email');
    }
    setUploadingPdf(true);
    try {
      const url = await uploadFileDirectToR2(pdfFile, 'newsletter/ayuntamientos-pdf');
      setPdfUrl(url);
      return url;
    } finally {
      setUploadingPdf(false);
    }
  }

  async function handlePdfButtonClick() {
    if (!pdfFile) {
      pdfInputRef.current?.click();
      return;
    }
    setError(null);
    try {
      await uploadPdf();
      setMessage('PDF subido correctamente.');
    } catch (e: any) {
      setError(e?.message || 'Error subiendo PDF');
    }
  }

  function handleRemovePdf() {
    setPdfFile(null);
    setPdfUrl('');
    if (pdfInputRef.current) pdfInputRef.current.value = '';
    setMessage('PDF eliminado del envío.');
    setError(null);
  }

  async function uploadAttachmentFile(file: File): Promise<Attachment> {
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('El adjunto supera el límite máximo de 12 MB para envío por email');
    }
    const url = await uploadFileDirectToR2(file, 'newsletter/ayuntamientos-attachments');
    return {
      url,
      name: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    };
  }

  async function doTestSend() {
    // El backend acepta hasta 3 destinatarios separados por coma. Lo
    // alineamos con el composer de Notas de prensa / Newsletter, que
    // también pasa un array. Antes mandábamos un string suelto y el
    // endpoint /admin/newsletter/campaigns/test-send respondía 400
    // ("Campos obligatorios: to, subject, html") porque comprueba
    // `Array.isArray(body.to)`.
    const recipients = testEmail
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    if (recipients.length === 0) {
      setError('Indica un email de prueba.');
      return;
    }
    if (recipients.length > 3) {
      setError('Máximo 3 emails de prueba (separados por coma).');
      return;
    }
    if (!subject.trim() || !html.trim()) {
      setError('Escribe asunto y contenido antes de enviar la prueba.');
      return;
    }
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      let effectivePdfUrl = pdfUrl;
      if (pdfFile && !pdfUrl) {
        effectivePdfUrl = await uploadPdf();
      }
      const attachmentUrls = [
        ...(effectivePdfUrl
          ? [
              {
                url: effectivePdfUrl,
                filename:
                  (effectivePdfUrl.split('/').pop()?.split('?')[0] ||
                    `circular-${Date.now()}.pdf`).toLowerCase().endsWith('.pdf')
                    ? effectivePdfUrl.split('/').pop()?.split('?')[0]
                    : `${(effectivePdfUrl.split('/').pop()?.split('?')[0] || `circular-${Date.now()}`).replace(/\.[^.]+$/, '')}.pdf`,
                contentType: 'application/pdf',
              },
            ]
          : []),
        ...attachments.map((a) => ({
          url: a.url,
          filename: a.name,
          contentType: a.contentType,
        })),
      ];
      const res = await fetch('/api/admin/newsletter/campaigns/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'AYUNTAMIENTOS',
          subject: subject.trim(),
          html,
          to: recipients,
          ...(attachmentUrls.length > 0 ? { attachmentUrls } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo enviar la prueba');
      setMessage(
        `Prueba enviada a ${recipients.join(', ')}${
          attachmentUrls.length > 0 ? ` con ${attachmentUrls.length} adjunto(s)` : ''
        }.`,
      );
    } catch (e: any) {
      setError(e?.message || 'Error al enviar prueba');
    } finally {
      setTesting(false);
    }
  }

  async function doRealSend() {
    if (!subject.trim() || !html.trim()) {
      setError('Escribe asunto y contenido.');
      return;
    }
    if (!includeAlcaldesUser && !includeInstitutional) {
      setError('Selecciona al menos una fuente de destinatarios.');
      return;
    }
    const confirmMsg =
      selectedRegions.size === 0
        ? '¿Enviar a TODOS los alcaldes/institucionales (sin filtro de región)?'
        : `¿Enviar a las regiones seleccionadas (${Array.from(selectedRegions).join(', ')})?`;
    if (!window.confirm(confirmMsg)) return;

    setSending(true);
    setError(null);
    setMessage(null);
    try {
      let effectivePdfUrl = pdfUrl;
      if (pdfFile && !pdfUrl) {
        effectivePdfUrl = await uploadPdf();
      }
      const attachmentUrls = [
        ...(effectivePdfUrl
          ? [
              {
                url: effectivePdfUrl,
                filename:
                  (effectivePdfUrl.split('/').pop()?.split('?')[0] ||
                    `circular-${Date.now()}.pdf`).toLowerCase().endsWith('.pdf')
                    ? effectivePdfUrl.split('/').pop()?.split('?')[0]
                    : `${(effectivePdfUrl.split('/').pop()?.split('?')[0] || `circular-${Date.now()}`).replace(/\.[^.]+$/, '')}.pdf`,
                contentType: 'application/pdf',
              },
            ]
          : []),
        ...attachments.map((a) => ({
          url: a.url,
          filename: a.name,
          contentType: a.contentType,
        })),
      ];

      const res = await fetch('/api/admin/newsletter/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'AYUNTAMIENTOS',
          subject: subject.trim(),
          html,
          filters,
          ...(attachmentUrls.length > 0 ? { attachmentUrls } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo enviar la campaña');
      setMessage(
        `Campaña enviada · destinatarios: ${data?.totalRecipients ?? 0} · ok: ${data?.sentCount ?? 0}${
          data?.failedCount ? ` · fallos: ${data.failedCount}` : ''
        }${attachmentUrls.length > 0 ? ` · adjuntos: ${attachmentUrls.length}` : ''}`,
      );
      await loadCampaigns();
    } catch (e: any) {
      setError(e?.message || 'Error al enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">1. Asunto</h2>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ej.: Circular marzo 2026 para alcaldes"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">2. Contenido</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Mismo constructor que Newsletter / Notas de prensa: bloques, imágenes, botones, columnas.
        </p>
        <div className="mt-3">
          <ContentBlockBuilder
            initialBlocks={blocks}
            onChange={(nextHtml) => setHtml(nextHtml)}
            onBlocksChange={(next) => setBlocks(next)}
            draftKey={DRAFT_KEY}
            showBrandLogos
            uploadFileNameBase={uploadFileNameBase}
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">3. Adjuntos (opcional)</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF principal (circular oficial, convocatoria, etc.) y archivos
              adicionales (imágenes, vídeo, audio, Word, Excel, ZIP). Máx.{' '}
              <strong>12 MB por archivo</strong> y <strong>35 MB en total</strong> por correo.
            </p>
          </div>
          {attachmentUrlsForSend.length > 0 ? (
            <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-800">
              {attachmentUrlsForSend.length} adjunto{attachmentUrlsForSend.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {/* PDF principal */}
          <div className="space-y-3 overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/40 to-white p-4 shadow-sm shadow-rose-100/40 dark:border-rose-800/50 dark:from-rose-950/30 dark:to-card dark:shadow-none">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-foreground">PDF principal</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Circular, convocatoria u oficio en formato PDF (máx. 12 MB).
                </p>
              </div>
              {pdfUrl ? (
                <span className="shrink-0 self-start rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800">
                  Listo
                </span>
              ) : null}
            </div>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPdfFile(file);
                if (file) setPdfUrl('');
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePdfButtonClick}
                disabled={uploadingPdf || sending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-rose-200/60 transition hover:from-rose-600 hover:to-rose-700 disabled:opacity-50 active:scale-[0.98]"
              >
                {uploadingPdf ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                      <path d="M22 12a10 10 0 01-10 10" />
                    </svg>
                    Subiendo PDF…
                  </>
                ) : pdfFile ? (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <path d="M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Subir PDF
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Seleccionar PDF
                  </>
                )}
              </button>
              {pdfFile || pdfUrl ? (
                <button
                  type="button"
                  onClick={handleRemovePdf}
                  disabled={uploadingPdf || sending}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-card dark:hover:bg-red-950/40"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  </svg>
                  Quitar PDF
                </button>
              ) : null}
              <span className="text-xs font-medium text-muted-foreground">
                {pdfFile
                  ? `Seleccionado: ${pdfFile.name}`
                  : pdfUrl
                    ? 'PDF listo para enviar'
                    : 'Aún no subido'}
              </span>
            </div>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 underline-offset-2 hover:underline dark:text-rose-300"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Ver PDF subido
              </a>
            ) : null}
          </div>

          {/* Adjuntos adicionales */}
          <div className="space-y-3 overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/40 to-white p-4 shadow-sm shadow-indigo-100/40 dark:border-indigo-800/50 dark:from-indigo-950/30 dark:to-card dark:shadow-none">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-200/60">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-foreground">Adjuntos adicionales</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Imágenes (JPG, PNG, WEBP), vídeo (MP4, MOV), audio (MP3, WAV),
                  Word, Excel, PowerPoint o ZIP. Máx. 12 MB por archivo.
                </p>
              </div>
              <span className="shrink-0 self-start rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-800">
                {attachments.length}/5
              </span>
            </div>

            {attachments.length > 0 && (
              <ul className="space-y-1.5">
                {attachments.map((a, i) => (
                  <li
                    key={`${a.url}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-sm shadow-sm dark:border-indigo-900/60 dark:bg-card"
                  >
                    <svg className="h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="flex-1 truncate font-medium text-foreground">{a.name}</span>
                    {a.size > 0 ? (
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-900">
                        {a.size > 1024 * 1024
                          ? `${(a.size / 1024 / 1024).toFixed(1)} MB`
                          : `${Math.round(a.size / 1024)} KB`}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-md p-1 text-red-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                      aria-label="Eliminar adjunto"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {attachments.length < 5 && (
              <>
                <button
                  type="button"
                  disabled={uploadingAttachment}
                  onClick={() => attachInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-800 dark:bg-card dark:text-indigo-200 dark:hover:bg-indigo-950/40"
                >
                  {uploadingAttachment ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <circle cx="12" cy="12" r="10" strokeOpacity=".3" />
                        <path d="M22 12a10 10 0 01-10 10" />
                      </svg>
                      Subiendo…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Añadir adjunto
                    </>
                  )}
                </button>
                <input
                  ref={attachInputRef}
                  type="file"
                  className="sr-only"
                  disabled={uploadingAttachment}
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,video/mp4,video/quicktime,video/webm,video/x-msvideo,audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/aac,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/csv,application/zip,.mp4,.mov,.mp3,.wav,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.avi"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setError(null);
                    setUploadingAttachment(true);
                    try {
                      const uploaded = await uploadAttachmentFile(file);
                      setAttachments((prev) => [...prev, uploaded]);
                    } catch (err: any) {
                      setError(err?.message || 'Error subiendo adjunto');
                    } finally {
                      setUploadingAttachment(false);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">4. Destinatarios</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Se envía a la unión de <strong>alcaldes usuarios</strong> y{' '}
          <strong>contactos institucionales</strong> con los filtros activos. Sin filtros, entran todos.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fuentes
            </h3>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeAlcaldesUser}
                onChange={(e) => setIncludeAlcaldesUser(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Alcaldes usuarios de la web{' '}
                <span className="text-xs text-muted-foreground">
                  (rol ALCALDE activo en `User`). Se recomienda dejarlo marcado.
                </span>
              </span>
            </label>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeInstitutional}
                onChange={(e) => setIncludeInstitutional(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Contactos institucionales{' '}
                <span className="text-xs text-muted-foreground">
                  (VCF importados: concejales, oficinas de turismo…).
                </span>
              </span>
            </label>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Regiones (opcional)
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {REGIONS.map((r) => {
                const active = selectedRegions.has(r.code);
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => toggleRegion(r.code)}
                    className={[
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/40',
                    ].join(' ')}
                  >
                    {r.label}
                  </button>
                );
              })}
              {selectedRegions.size > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedRegions(new Set())}
                  className="text-xs text-muted-foreground underline"
                >
                  Limpiar
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Si no seleccionas ninguna, se envía a todas las regiones.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cargos (opcional — solo afecta a contactos institucionales)
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const active = selectedRoles.has(r.code);
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => toggleRole(r.code)}
                    className={[
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/40',
                    ].join(' ')}
                  >
                    {r.label}
                  </button>
                );
              })}
              {selectedRoles.size > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedRoles(new Set())}
                  className="text-xs text-muted-foreground underline"
                >
                  Limpiar
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Sin cargos seleccionados se envía a todos los cargos importados.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">5. Envío</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Email de prueba
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                inputMode="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu@email.es (o hasta 3 separados por coma)"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={doTestSend}
                disabled={testing}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {testing ? 'Enviando…' : 'Enviar prueba'}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Puedes poner hasta 3 emails separados por coma para revisar el
              correo en distintas bandejas (Gmail, Outlook, móvil…).
            </p>
          </label>

          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={doRealSend}
              disabled={!canSend}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {sending
                ? 'Enviando…'
                : 'Enviar campaña a alcaldes y ayuntamientos'}
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Remitente:{' '}
              <code>ayuntamientos@lospueblosmasbonitosdeespana.org</code>. Se añade
              enlace de baja al pie.
            </p>
            {attachmentUrlsForSend.length > 0 ? (
              <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
                Con adjuntos, el envío es individual (~9 correos/seg) para garantizar la entrega.
                Por ejemplo, 200 destinatarios tardarán ~25 segundos.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <DraftsAndScheduler
        kind="AYUNTAMIENTOS"
        getSnapshot={getSnapshot}
        onLoadDraft={loadFromDraft}
        onAfterSend={() => loadCampaigns()}
      />

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Últimas campañas a ayuntamientos</h2>
            <p className="text-xs text-muted-foreground">
              Métricas de envío, aperturas y rebotes.
            </p>
          </div>
          <button
            type="button"
            onClick={loadCampaigns}
            disabled={loadingCampaigns}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium"
          >
            {loadingCampaigns ? '…' : 'Refrescar'}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-2 py-2 text-left">Asunto</th>
                <th className="px-2 py-2 text-left">Estado</th>
                <th className="px-2 py-2 text-left">Enviada</th>
                <th className="px-2 py-2 text-right">Dest.</th>
                <th className="px-2 py-2 text-right">OK</th>
                <th className="px-2 py-2 text-right">Abrieron</th>
                <th className="px-2 py-2 text-right">Rebotes</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-muted-foreground">
                    {loadingCampaigns
                      ? 'Cargando…'
                      : 'Todavía no se ha enviado ninguna campaña a ayuntamientos.'}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border align-top">
                    <td className="px-2 py-2 font-medium">{c.subject || `#${c.id}`}</td>
                    <td className="px-2 py-2 text-xs uppercase text-muted-foreground">
                      {c.status}
                    </td>
                    <td className="px-2 py-2 text-xs">{formatDate(c.sentAt)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {c.totalRecipients}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums text-green-700">
                      {c.sentCount}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{c.openedCount}</td>
                    <td
                      className={[
                        'px-2 py-2 text-right tabular-nums',
                        c.bouncedCount > 0 ? 'text-red-600' : '',
                      ].join(' ')}
                    >
                      {c.bouncedCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
