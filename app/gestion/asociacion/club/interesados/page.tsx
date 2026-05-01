'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Lead = {
  id: number;
  email: string;
  idiomaPreferido: string | null;
  source: string;
  ip: string | null;
  createdAt: string;
};

type Resp = {
  items: Lead[];
  total: number;
  take: number;
  skip: number;
};

function fmtFecha(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClubInteresadosPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [idiomaEnvio, setIdiomaEnvio] = useState('all');
  const [subject, setSubject] = useState('Ya puedes unirte al Club de Amigos');
  const [mensaje, setMensaje] = useState(
    '¡Hola!\n\nYa hemos abierto el Club de Amigos de Los Pueblos Más Bonitos de España.\n\nPuedes entrar ahora y activar tu membresía para acceder a premios, cupones, sorteos y ventajas exclusivas.\n\n👉 https://lospueblosmasbonitosdeespana.org/mi-cuenta/club',
  );
  const [sending, setSending] = useState(false);
  const [sendInfo, setSendInfo] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/club/admin/lead-prelanzamiento?take=500', {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message ?? `Error ${res.status}`);
        }
        if (!cancelled) setData(json as Resp);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Error cargando interesados');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        x.email.toLowerCase().includes(q) ||
        (x.idiomaPreferido ?? '').toLowerCase().includes(q) ||
        (x.source ?? '').toLowerCase().includes(q),
    );
  }, [data?.items, search]);

  const idiomasDisponibles = useMemo(() => {
    const items = data?.items ?? [];
    const set = new Set<string>();
    for (const x of items) {
      const lang = (x.idiomaPreferido ?? '').trim().toLowerCase();
      if (lang) set.add(lang);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [data?.items]);

  const totalObjetivo = useMemo(() => {
    const items = data?.items ?? [];
    if (idiomaEnvio === 'all') return items.length;
    return items.filter(
      (x) => (x.idiomaPreferido ?? '').trim().toLowerCase() === idiomaEnvio,
    ).length;
  }, [data?.items, idiomaEnvio]);

  async function enviarAviso() {
    setSendError(null);
    setSendInfo(null);
    if (!subject.trim()) {
      setSendError('El asunto es obligatorio');
      return;
    }
    if (!mensaje.trim()) {
      setSendError('El mensaje es obligatorio');
      return;
    }
    if (totalObjetivo <= 0) {
      setSendError('No hay interesados para el idioma seleccionado');
      return;
    }
    setSending(true);
    try {
      const html = mensaje
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${line}</p>`)
        .join('');
      const res = await fetch('/api/club/admin/lead-prelanzamiento/notificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idiomaPreferido: idiomaEnvio === 'all' ? null : idiomaEnvio,
          subject: subject.trim(),
          html,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message ?? `Error ${res.status}`);
      }
      setSendInfo(
        `Aviso enviado. Total objetivo: ${json?.total ?? totalObjetivo}. Enviados: ${json?.sent ?? 0}.`,
      );
    } catch (e: any) {
      setSendError(e?.message ?? 'Error enviando aviso');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/gestion/asociacion/club"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a Club
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interesados en Club</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista de usuarios que han pulsado “Avísame cuando se abra”.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Total en lista</p>
          <p className="text-xl font-bold text-foreground">{data?.total ?? 0}</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email, idioma o source..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">Avisar cuando se abra el Club</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Envío masivo por idioma a los interesados de la lista de espera.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Idioma</span>
            <select
              value={idiomaEnvio}
              onChange={(e) => setIdiomaEnvio(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">Todos ({data?.total ?? 0})</option>
              {idiomasDisponibles.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()} (
                  {(data?.items ?? []).filter(
                    (x) => (x.idiomaPreferido ?? '').trim().toLowerCase() === lang,
                  ).length}
                  )
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Asunto</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-muted-foreground">Mensaje</span>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Destinatarios objetivo: <strong>{totalObjetivo}</strong>
          </p>
          <button
            type="button"
            onClick={enviarAviso}
            disabled={sending || totalObjetivo <= 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? 'Enviando...' : 'Enviar aviso'}
          </button>
        </div>
        {sendInfo ? (
          <p className="mt-2 text-sm text-emerald-700">{sendInfo}</p>
        ) : null}
        {sendError ? (
          <p className="mt-2 text-sm text-red-700">{sendError}</p>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Cargando interesados...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Idioma</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Origen</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    No hay resultados
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 font-medium text-foreground">{lead.email}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {lead.idiomaPreferido || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.source || '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{fmtFecha(lead.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

