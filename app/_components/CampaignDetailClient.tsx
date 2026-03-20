'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface CampaignDetail {
  id: number;
  kind: string;
  subject: string;
  status: string;
  fromEmail: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  complainedCount: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  complaintRate: number;
  deliveredCount: number;
  sentAt: string | null;
  createdAt: string;
}

interface Recipient {
  id: number;
  email: string;
  status: string;
  lastEvent: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  error: string | null;
}

interface ClickLink {
  url: string;
  totalClicks: number;
  uniqueClickers: number;
}

type Tab = 'resumen' | 'destinatarios' | 'clics';

const EVENT_BADGE: Record<string, string> = {
  'email.delivered': 'bg-green-100 text-green-700',
  'email.opened': 'bg-blue-100 text-blue-700',
  'email.clicked': 'bg-purple-100 text-purple-700',
  'email.bounced': 'bg-red-100 text-red-700',
  'email.complained': 'bg-orange-100 text-orange-700',
  default: 'bg-slate-100 text-slate-600',
};

function formatDate(d: string | null) {
  if (!d) return '–';
  return new Date(d).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({ label, value, sub, color = 'slate' }: { label: string; value: string | number; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    red: 'border-red-200 bg-red-50',
    orange: 'border-orange-200 bg-orange-50',
    slate: 'border-slate-200 bg-white',
  };
  const valColor: Record<string, string> = {
    blue: 'text-blue-700', green: 'text-green-700', purple: 'text-purple-700',
    red: 'text-red-600', orange: 'text-orange-600', slate: 'text-slate-800',
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.slate}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valColor[color] || valColor.slate}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const bg: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500', purple: 'bg-purple-500',
    red: 'bg-red-500', orange: 'bg-orange-400',
  };
  return (
    <div className="h-2 w-full rounded-full bg-slate-200">
      <div
        className={`h-2 rounded-full transition-all ${bg[color] || bg.blue}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export default function CampaignDetailClient({ campaignId, backHref, kind }: {
  campaignId: number;
  backHref: string;
  kind: 'newsletter' | 'prensa';
}) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [recipientsPage, setRecipientsPage] = useState(0);
  const [recipientsSearch, setRecipientsSearch] = useState('');
  const [recipientsStatus, setRecipientsStatus] = useState('');
  const [clickLinks, setClickLinks] = useState<ClickLink[]>([]);
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [error, setError] = useState('');

  const PAGE_SIZE = 50;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [detailRes, clicksRes] = await Promise.all([
          fetch(`/api/admin/newsletter/campaigns/${campaignId}/detail`),
          fetch(`/api/admin/newsletter/campaigns/${campaignId}/click-links`),
        ]);
        if (!detailRes.ok) { setError('No se pudo cargar la campaña'); setLoading(false); return; }
        const detail = await detailRes.json();
        const clicksData = await clicksRes.json().catch(() => ({ clicks: [] }));
        setCampaign(detail);
        setClickLinks(clicksData.clicks || []);
      } catch {
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId]);

  const loadRecipients = useCallback(async (page: number, search: string, status: string) => {
    setLoadingRecipients(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      const res = await fetch(`/api/admin/newsletter/campaigns/${campaignId}/recipients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data.items || []);
        setRecipientsTotal(data.total || 0);
      }
    } finally {
      setLoadingRecipients(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (tab === 'destinatarios') {
      loadRecipients(recipientsPage, recipientsSearch, recipientsStatus);
    }
  }, [tab, recipientsPage, recipientsSearch, recipientsStatus, loadRecipients]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center text-slate-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3" />
          <p>Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error || 'Campaña no encontrada'}</p>
        <Link href={backHref} className="mt-4 inline-block text-indigo-600 hover:underline text-sm">
          ← Volver
        </Link>
      </div>
    );
  }

  const totalPages = Math.ceil(recipientsTotal / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href={backHref} className="mt-1 text-slate-400 hover:text-slate-700 transition-colors shrink-0">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              kind === 'newsletter' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {kind === 'newsletter' ? 'Newsletter' : 'Nota de prensa'}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              campaign.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {campaign.status}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 truncate">{campaign.subject}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {campaign.sentAt ? `Enviada el ${formatDate(campaign.sentAt)}` : `Creada el ${formatDate(campaign.createdAt)}`}
            {campaign.fromEmail ? ` · Desde: ${campaign.fromEmail}` : ''}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {(['resumen', 'destinatarios', 'clics'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                tab === t
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t === 'resumen' ? 'Resumen' : t === 'destinatarios' ? 'Destinatarios' : 'Clics en enlaces'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Resumen */}
      {tab === 'resumen' && (
        <div className="space-y-6">
          {/* Métricas principales */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total enviados" value={campaign.totalRecipients.toLocaleString()} color="slate" />
            <StatCard label="Entregados" value={campaign.deliveredCount.toLocaleString()}
              sub={`${campaign.bouncedCount} rebotes`} color="green" />
            <StatCard label="Fallidos" value={campaign.failedCount.toLocaleString()} color={campaign.failedCount > 0 ? 'red' : 'slate'} />
            <StatCard label="Quejas" value={campaign.complainedCount.toLocaleString()}
              sub={`${campaign.complaintRate}%`} color={campaign.complainedCount > 0 ? 'orange' : 'slate'} />
          </div>

          {/* Tasas */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Tasas de interacción</h2>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Apertura</span>
                <span className="font-semibold text-blue-700">{campaign.openRate}%</span>
              </div>
              <ProgressBar value={campaign.openRate} color="blue" />
              <p className="text-xs text-slate-400 mt-0.5">{campaign.openedCount.toLocaleString()} aperturas</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Clic sobre enviados (CTR)</span>
                <span className="font-semibold text-purple-700">{campaign.clickRate}%</span>
              </div>
              <ProgressBar value={campaign.clickRate} color="purple" />
              <p className="text-xs text-slate-400 mt-0.5">{campaign.clickedCount.toLocaleString()} clics</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Clic sobre abiertos (CTOR)</span>
                <span className="font-semibold text-indigo-700">{campaign.clickToOpenRate}%</span>
              </div>
              <ProgressBar value={campaign.clickToOpenRate} color="blue" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Rebote</span>
                <span className={`font-semibold ${campaign.bounceRate > 2 ? 'text-red-600' : 'text-slate-600'}`}>
                  {campaign.bounceRate}%
                </span>
              </div>
              <ProgressBar value={campaign.bounceRate} color="red" />
              <p className="text-xs text-slate-400 mt-0.5">{campaign.bouncedCount.toLocaleString()} rebotes</p>
            </div>
          </div>

          {/* Benchmarks informativos */}
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800 space-y-1">
            <p className="font-medium">Benchmarks del sector (referencia)</p>
            <ul className="list-disc list-inside text-xs text-amber-700 space-y-0.5">
              <li>Apertura media turismo/cultura: 22–28%</li>
              <li>CTR medio: 2–5% · CTOR: 10–20%</li>
              <li>Rebote aceptable: {'<'}2% · Queja: {'<'}0.1%</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab: Destinatarios */}
      {tab === 'destinatarios' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              placeholder="Buscar email..."
              value={recipientsSearch}
              onChange={(e) => { setRecipientsSearch(e.target.value); setRecipientsPage(0); }}
              className="flex-1 min-w-48 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <select
              value={recipientsStatus}
              onChange={(e) => { setRecipientsStatus(e.target.value); setRecipientsPage(0); }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Todos los estados</option>
              <option value="email.opened">Abrieron</option>
              <option value="email.clicked">Clicaron</option>
              <option value="email.bounced">Rebotaron</option>
              <option value="email.complained">Se quejaron</option>
              <option value="email.delivered">Solo entregado</option>
            </select>
          </div>

          {loadingRecipients ? (
            <div className="py-8 text-center text-slate-400">Cargando destinatarios...</div>
          ) : recipients.length === 0 ? (
            <div className="py-8 text-center text-slate-400">No hay destinatarios con ese filtro.</div>
          ) : (
            <>
              <div className="text-xs text-slate-400">{recipientsTotal.toLocaleString()} destinatarios</div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-3 py-3 text-left">Último evento</th>
                      <th className="px-3 py-3 text-left hidden md:table-cell">Entregado</th>
                      <th className="px-3 py-3 text-left hidden md:table-cell">Abierto</th>
                      <th className="px-3 py-3 text-left hidden lg:table-cell">Clic</th>
                      <th className="px-3 py-3 text-left hidden lg:table-cell">Rebote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipients.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-700 max-w-48 truncate">{r.email}</td>
                        <td className="px-3 py-2.5">
                          {r.lastEvent ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              EVENT_BADGE[r.lastEvent] || EVENT_BADGE.default
                            }`}>
                              {r.lastEvent.replace('email.', '')}
                            </span>
                          ) : <span className="text-slate-300">–</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-slate-400 hidden md:table-cell">{formatDate(r.deliveredAt)}</td>
                        <td className="px-3 py-2.5 text-xs hidden md:table-cell">
                          {r.openedAt ? <span className="text-blue-600">{formatDate(r.openedAt)}</span> : <span className="text-slate-300">–</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs hidden lg:table-cell">
                          {r.clickedAt ? <span className="text-purple-600">{formatDate(r.clickedAt)}</span> : <span className="text-slate-300">–</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs hidden lg:table-cell">
                          {r.bouncedAt ? <span className="text-red-500">{formatDate(r.bouncedAt)}</span> : <span className="text-slate-300">–</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    disabled={recipientsPage === 0}
                    onClick={() => setRecipientsPage((p) => p - 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-slate-500">
                    Página {recipientsPage + 1} de {totalPages}
                  </span>
                  <button
                    disabled={recipientsPage >= totalPages - 1}
                    onClick={() => setRecipientsPage((p) => p + 1)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Clics */}
      {tab === 'clics' && (
        <div className="space-y-4">
          {clickLinks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <svg className="h-10 w-10 mx-auto mb-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <p className="font-medium">Sin datos de clics todavía</p>
              <p className="text-xs mt-1">Los clics aparecerán aquí cuando los destinatarios interactúen con los enlaces.</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-400">{clickLinks.length} enlace{clickLinks.length !== 1 ? 's' : ''} clicado{clickLinks.length !== 1 ? 's' : ''}</div>
              <div className="space-y-2">
                {clickLinks.map((link, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline break-all font-mono"
                      >
                        {link.url}
                      </a>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-slate-800">{link.totalClicks}</p>
                        <p className="text-xs text-slate-400">clics</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{link.uniqueClickers} personas únicas</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-purple-500"
                        style={{ width: `${Math.min((link.totalClicks / (clickLinks[0]?.totalClicks || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
