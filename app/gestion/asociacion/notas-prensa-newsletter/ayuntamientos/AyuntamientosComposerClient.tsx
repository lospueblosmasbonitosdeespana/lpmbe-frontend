'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContentBlock } from '@/app/_components/content-builder/ContentBlockBuilder';
import DraftsAndScheduler, {
  type DraftRow,
} from '../_components/DraftsAndScheduler';

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
    }),
    [subject, html, blocks, filters],
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const canSend = subject.trim().length > 0 && html.trim().length > 0 && !sending;

  async function doTestSend() {
    if (!testEmail.trim()) {
      setError('Indica un email de prueba.');
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
      const res = await fetch('/api/admin/newsletter/campaigns/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'AYUNTAMIENTOS',
          subject: subject.trim(),
          html,
          to: testEmail.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo enviar la prueba');
      setMessage(`Prueba enviada a ${testEmail.trim()}.`);
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
      const res = await fetch('/api/admin/newsletter/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'AYUNTAMIENTOS',
          subject: subject.trim(),
          html,
          filters,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo enviar la campaña');
      setMessage(
        `Campaña enviada · destinatarios: ${data?.totalRecipients ?? 0} · ok: ${data?.sentCount ?? 0}${
          data?.failedCount ? ` · fallos: ${data.failedCount}` : ''
        }`,
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
            uploadFileNameBase={
              subject
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 60) || 'ayuntamientos'
            }
          />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">3. Destinatarios</h2>
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
        <h2 className="text-base font-semibold">4. Envío</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Email de prueba
            <div className="mt-1 flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu@email.es"
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
