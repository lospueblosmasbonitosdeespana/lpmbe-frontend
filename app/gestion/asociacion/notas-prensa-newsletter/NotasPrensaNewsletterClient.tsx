'use client';

import { useEffect, useState } from 'react';

type Campaign = {
  id: number;
  kind: 'NEWSLETTER' | 'PRESS';
  subject: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  sentAt?: string | null;
  createdAt: string;
};

type PressContact = {
  id: number;
  email: string;
  name?: string | null;
  mediaOutlet?: string | null;
  scope: string;
  ccaa: string;
  provincia: string;
  puebloSlug: string;
};

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES');
}

export default function NotasPrensaNewsletterClient() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pressContacts, setPressContacts] = useState<PressContact[]>([]);
  const [campaignForm, setCampaignForm] = useState({
    kind: 'PRESS' as 'PRESS' | 'NEWSLETTER',
    subject: '',
    html: '',
    scope: 'NACIONAL',
    ccaa: '',
    provincia: '',
    puebloSlug: '',
    source: '',
  });

  async function loadData() {
    try {
      const [campaignsRes, contactsRes] = await Promise.all([
        fetch('/api/admin/newsletter/campaigns?limit=25', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/press-contacts?limit=20', { cache: 'no-store' }),
      ]);
      if (campaignsRes.ok) {
        const c = await campaignsRes.json();
        setCampaigns(Array.isArray(c) ? c : []);
      }
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setPressContacts(Array.isArray(data?.items) ? data.items : []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleImportUsers() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/newsletter/import-users', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error importando usuarios');
      setMessage(
        `Importación completada. Importados: ${data.imported ?? 0}. Usuarios fuente: ${data.totalSourceUsers ?? 0}.`,
      );
    } catch (e: any) {
      setError(e?.message || 'Error importando usuarios');
    } finally {
      setLoading(false);
    }
  }

  async function handleImportPressCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', csvFile);
      const res = await fetch('/api/admin/newsletter/press-contacts/import-csv', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error importando CSV');
      setMessage(`CSV de prensa importado. Filas procesadas: ${data.imported ?? 0}.`);
      setCsvFile(null);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Error importando CSV');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCampaign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!campaignForm.subject.trim() || !campaignForm.html.trim()) {
        throw new Error('Asunto y contenido son obligatorios');
      }

      const filters =
        campaignForm.kind === 'PRESS'
          ? {
              scope: campaignForm.scope,
              ccaa: campaignForm.ccaa,
              provincia: campaignForm.provincia,
              puebloSlug: campaignForm.puebloSlug,
            }
          : { source: campaignForm.source };

      const res = await fetch('/api/admin/newsletter/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: campaignForm.kind,
          subject: campaignForm.subject,
          html: campaignForm.html,
          filters,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error enviando campaña');
      setMessage(
        `Campaña enviada. Destinatarios: ${data.totalRecipients}. Enviados: ${data.sentCount}. Fallidos: ${data.failedCount}.`,
      );
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Error enviando campaña');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">1) Importar usuarios actuales a newsletter (regla de oro activa)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Esto crea/actualiza contactos en la base de datos separada de newsletter y no toca cuentas de usuario.
        </p>
        <button
          onClick={handleImportUsers}
          disabled={loading}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? 'Procesando…' : 'Importar usuarios actuales'}
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">2) Importar contactos de prensa (CSV)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cabeceras recomendadas: email,name,media_outlet,scope,ccaa,provincia,pueblo_slug
        </p>
        <form onSubmit={handleImportPressCsv} className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <button
            type="submit"
            disabled={!csvFile || loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Importando…' : 'Importar CSV'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">3) Enviar campaña</h2>
        <form onSubmit={handleSendCampaign} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Tipo de campaña
              <select
                value={campaignForm.kind}
                onChange={(e) => setCampaignForm((s) => ({ ...s, kind: e.target.value as 'PRESS' | 'NEWSLETTER' }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="PRESS">Nota de prensa</option>
                <option value="NEWSLETTER">Newsletter</option>
              </select>
            </label>
            <label className="text-sm">
              Asunto
              <input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm((s) => ({ ...s, subject: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>

          {campaignForm.kind === 'PRESS' ? (
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-sm">
                Scope
                <select
                  value={campaignForm.scope}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, scope: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="NACIONAL">Nacional</option>
                  <option value="CCAA">CCAA</option>
                  <option value="PROVINCIA">Provincia</option>
                  <option value="LOCAL">Local</option>
                </select>
              </label>
              <label className="text-sm">
                CCAA
                <input
                  value={campaignForm.ccaa}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, ccaa: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Provincia
                <input
                  value={campaignForm.provincia}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, provincia: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm">
                Pueblo (slug)
                <input
                  value={campaignForm.puebloSlug}
                  onChange={(e) => setCampaignForm((s) => ({ ...s, puebloSlug: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </label>
            </div>
          ) : (
            <label className="text-sm">
              Origen newsletter (opcional)
              <input
                value={campaignForm.source}
                onChange={(e) => setCampaignForm((s) => ({ ...s, source: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="legacy_web_users_import, tienda, web..."
              />
            </label>
          )}

          <label className="block text-sm">
            HTML (contenido)
            <textarea
              rows={8}
              value={campaignForm.html}
              onChange={(e) => setCampaignForm((s) => ({ ...s, html: e.target.value }))}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 font-mono text-sm"
              placeholder="<h1>Nota de prensa</h1><p>Contenido...</p>"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar campaña'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Últimas campañas</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left">Fecha</th>
                <th className="px-2 py-2 text-left">Tipo</th>
                <th className="px-2 py-2 text-left">Asunto</th>
                <th className="px-2 py-2 text-left">Estado</th>
                <th className="px-2 py-2 text-right">Dest.</th>
                <th className="px-2 py-2 text-right">OK</th>
                <th className="px-2 py-2 text-right">Fallos</th>
                <th className="px-2 py-2 text-right">Aperturas</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={8}>
                    Sin campañas todavía.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-2 py-2">{fmtDate(c.sentAt || c.createdAt)}</td>
                    <td className="px-2 py-2">{c.kind}</td>
                    <td className="px-2 py-2">{c.subject}</td>
                    <td className="px-2 py-2">{c.status}</td>
                    <td className="px-2 py-2 text-right">{c.totalRecipients}</td>
                    <td className="px-2 py-2 text-right">{c.sentCount}</td>
                    <td className="px-2 py-2 text-right">{c.failedCount}</td>
                    <td className="px-2 py-2 text-right">{c.openedCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Muestra de contactos de prensa</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-2 py-2 text-left">Email</th>
                <th className="px-2 py-2 text-left">Medio</th>
                <th className="px-2 py-2 text-left">Scope</th>
                <th className="px-2 py-2 text-left">CCAA</th>
                <th className="px-2 py-2 text-left">Provincia</th>
              </tr>
            </thead>
            <tbody>
              {pressContacts.length === 0 ? (
                <tr>
                  <td className="px-2 py-3 text-muted-foreground" colSpan={5}>
                    Sin contactos cargados.
                  </td>
                </tr>
              ) : (
                pressContacts.map((c) => (
                  <tr key={c.id} className="border-b border-border">
                    <td className="px-2 py-2">{c.email}</td>
                    <td className="px-2 py-2">{c.mediaOutlet || '—'}</td>
                    <td className="px-2 py-2">{c.scope}</td>
                    <td className="px-2 py-2">{c.ccaa || '—'}</td>
                    <td className="px-2 py-2">{c.provincia || '—'}</td>
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
