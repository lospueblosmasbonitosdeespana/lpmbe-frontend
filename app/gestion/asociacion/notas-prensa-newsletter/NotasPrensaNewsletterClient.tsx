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

type Overview = {
  usersTotal: number;
  newsletterSubscribersTotal: number;
  pressContactsTotal: number;
  campaignsTotal: number;
};

type Mode = 'newsletter' | 'press';

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES');
}

export default function NotasPrensaNewsletterClient({ mode }: { mode: Mode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pressContacts, setPressContacts] = useState<PressContact[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    kind: (mode === 'newsletter' ? 'NEWSLETTER' : 'PRESS') as 'PRESS' | 'NEWSLETTER',
    subject: '',
    html: '',
    scope: 'NACIONAL',
    ccaa: '',
    provincia: '',
    puebloSlug: '',
    source: '',
  });
  const [pressForm, setPressForm] = useState({
    email: '',
    name: '',
    mediaOutlet: '',
    scope: 'NACIONAL',
    ccaa: '',
    provincia: '',
    puebloSlug: '',
  });

  async function loadData() {
    try {
      const [overviewRes, campaignsRes, contactsRes] = await Promise.all([
        fetch('/api/admin/newsletter/overview', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/campaigns?limit=25', { cache: 'no-store' }),
        fetch('/api/admin/newsletter/press-contacts?limit=20', { cache: 'no-store' }),
      ]);
      if (overviewRes.ok) {
        const o = await overviewRes.json();
        setOverview({
          usersTotal: Number(o?.usersTotal || 0),
          newsletterSubscribersTotal: Number(o?.newsletterSubscribersTotal || 0),
          pressContactsTotal: Number(o?.pressContactsTotal || 0),
          campaignsTotal: Number(o?.campaignsTotal || 0),
        });
      }
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

  async function handleAddPressContact(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (!pressForm.email.trim() || !pressForm.mediaOutlet.trim()) {
        throw new Error('Email y medio son obligatorios');
      }
      const res = await fetch('/api/admin/newsletter/press-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pressForm.email.trim(),
          name: pressForm.name.trim() || undefined,
          mediaOutlet: pressForm.mediaOutlet.trim(),
          scope: pressForm.scope,
          ccaa: pressForm.ccaa.trim(),
          provincia: pressForm.provincia.trim(),
          puebloSlug: pressForm.puebloSlug.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error creando contacto de prensa');
      setMessage('Contacto de prensa guardado correctamente.');
      setPressForm({
        email: '',
        name: '',
        mediaOutlet: '',
        scope: 'NACIONAL',
        ccaa: '',
        provincia: '',
        puebloSlug: '',
      });
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Error guardando contacto');
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
        mode === 'press'
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
          kind: mode === 'press' ? 'PRESS' : 'NEWSLETTER',
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
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Usuarios web</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.usersTotal ?? '—'}</p>
        </article>
        {mode === 'newsletter' ? (
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Suscriptores newsletter</p>
            <p className="mt-2 text-2xl font-semibold">{overview?.newsletterSubscribersTotal ?? '—'}</p>
          </article>
        ) : (
          <article className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Contactos de prensa</p>
            <p className="mt-2 text-2xl font-semibold">{overview?.pressContactsTotal ?? '—'}</p>
          </article>
        )}
        <article className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Campañas registradas</p>
          <p className="mt-2 text-2xl font-semibold">{overview?.campaignsTotal ?? '—'}</p>
        </article>
      </section>

      {message ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {mode === 'press' ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">1) Añadir contacto de prensa</h2>
          <form onSubmit={handleAddPressContact} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Medio
              <input
                value={pressForm.mediaOutlet}
                onChange={(e) => setPressForm((s) => ({ ...s, mediaOutlet: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="Nombre del medio"
              />
            </label>
            <label className="text-sm">
              Email
              <input
                type="email"
                value={pressForm.email}
                onChange={(e) => setPressForm((s) => ({ ...s, email: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="contacto@medio.com"
              />
            </label>
            <label className="text-sm">
              Nombre (opcional)
              <input
                value={pressForm.name}
                onChange={(e) => setPressForm((s) => ({ ...s, name: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Ámbito
              <select
                value={pressForm.scope}
                onChange={(e) => setPressForm((s) => ({ ...s, scope: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="NACIONAL">Nacional</option>
                <option value="CCAA">CCAA</option>
                <option value="PROVINCIA">Provincia</option>
                <option value="LOCAL">Local</option>
              </select>
            </label>
            <label className="text-sm">
              CCAA (opcional)
              <input
                value={pressForm.ccaa}
                onChange={(e) => setPressForm((s) => ({ ...s, ccaa: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              Provincia (opcional)
              <input
                value={pressForm.provincia}
                onChange={(e) => setPressForm((s) => ({ ...s, provincia: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Guardando…' : 'Guardar contacto'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{mode === 'press' ? '2) Enviar nota de prensa' : '1) Enviar newsletter'}</h2>
        <form onSubmit={handleSendCampaign} className="mt-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              Asunto
              <input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm((s) => ({ ...s, subject: e.target.value }))}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          </div>

          {mode === 'press' ? (
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

      {mode === 'press' ? (
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
      ) : null}
    </div>
  );
}
