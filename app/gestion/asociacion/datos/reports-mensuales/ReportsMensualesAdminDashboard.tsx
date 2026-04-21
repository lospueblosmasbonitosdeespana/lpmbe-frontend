'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  History,
  Settings2,
} from 'lucide-react';

interface ReportRow {
  id: number;
  puebloId: number;
  mes: string;
  asunto: string;
  destinatarios: string[];
  enviadoAt: string;
  error: string | null;
}

interface PuebloRow {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
  report: ReportRow | null;
}

interface Listado {
  mes: string;
  etiquetaLarga: string;
  pueblos: PuebloRow[];
}

/**
 * Devuelve los últimos 12 meses como opciones del selector (más el mes
 * "en curso" con etiqueta "mes actual"). No dejamos escoger meses futuros.
 */
function listarMesesSelector(): Array<{ value: string; label: string; esFuturo: boolean }> {
  const items: Array<{ value: string; label: string; esFuturo: boolean }> = [];
  const now = new Date();
  const baseY = now.getUTCFullYear();
  const baseM = now.getUTCMonth();
  for (let i = -1; i < 12; i++) {
    const y = baseY;
    const m = baseM - i;
    const date = new Date(Date.UTC(y, m, 1));
    const iso = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    items.push({ value: iso, label, esFuturo: i === -1 });
  }
  return items;
}

function formatFecha(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function mesAnteriorIso(): string {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function ReportsMensualesAdminDashboard() {
  const [mes, setMes] = useState<string>(mesAnteriorIso());
  const [data, setData] = useState<Listado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const meses = useMemo(() => listarMesesSelector(), []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports-mensuales?mes=${mes}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await res.text());
      setData((await res.json()) as Listado);
    } catch (e: any) {
      setError(e?.message || 'Error cargando listado');
    } finally {
      setLoading(false);
    }
  }, [mes]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function enviarMasivo(dryRun: boolean, reenviarExistentes = false) {
    if (enviando) return;
    const confirmMsg = dryRun
      ? `Generar una SIMULACIÓN del report mensual de ${data?.etiquetaLarga ?? mes} para todos los pueblos activos? (guarda snapshots pero no envía emails)`
      : `ENVIAR el report mensual de ${data?.etiquetaLarga ?? mes} a todos los pueblos activos?\n\nSe enviarán emails reales a los alcaldes y equipos del pueblo.`;
    if (!window.confirm(confirmMsg)) return;
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/reports-mensuales/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes, dryRun, reenviarExistentes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const body = await res.json();
      setFeedback(
        `${dryRun ? 'Simulación' : 'Envío'} completado: ${body.ok} OK · ${body.ko} fallidos · ${body.saltados} ya enviados · ${body.total} pueblos totales.`,
      );
      void cargar();
    } catch (e: any) {
      setFeedback(e?.message || 'Error enviando');
    } finally {
      setEnviando(false);
    }
  }

  async function reenviarPueblo(puebloId: number, dryRun = false) {
    if (!window.confirm(`¿${dryRun ? 'Simular' : 'Reenviar'} el report del pueblo seleccionado?`)) {
      return;
    }
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/reports-mensuales/reenviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId, mes, dryRun }),
      });
      if (!res.ok) throw new Error(await res.text());
      setFeedback('Reenvío completado');
      void cargar();
    } catch (e: any) {
      setFeedback(e?.message || 'Error reenviando');
    }
  }

  const enviadosOk = data?.pueblos.filter((p) => p.report && !p.report.error).length ?? 0;
  const fallidos = data?.pueblos.filter((p) => p.report?.error).length ?? 0;
  const pendientes = data ? data.pueblos.length - (data.pueblos.filter((p) => p.report).length) : 0;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: 'linear-gradient(135deg, #854d0e 0%, #b45309 50%, #c2410c 100%)' }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Reports mensuales a pueblos
              </h1>
              <p className="mt-0.5 text-sm text-white/80">
                Cada día 1 a las 07:00 (Madrid) enviamos a los alcaldes su resumen del mes anterior.
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap items-end gap-3">
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Mes del report
            </label>
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="mt-1 min-w-[200px] bg-transparent text-sm font-semibold text-white outline-none [&>option]:text-foreground"
            >
              {meses.map((m) => (
                <option key={m.value} value={m.value} disabled={m.esFuturo}>
                  {m.label}{m.esFuturo ? ' · aún abierto' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Enviados OK
            </span>
            <span className="text-lg font-bold">{enviadosOk}</span>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Fallidos
            </span>
            <span className="text-lg font-bold">{fallidos}</span>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
              Pendientes
            </span>
            <span className="text-lg font-bold">{pendientes}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <button
          onClick={() => enviarMasivo(true)}
          disabled={enviando}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
        >
          <Eye className="h-4 w-4" />
          Simular envío (dry-run)
        </button>
        <button
          onClick={() => enviarMasivo(false)}
          disabled={enviando}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Enviar a todos los pueblos
        </button>
        <button
          onClick={() => enviarMasivo(false, true)}
          disabled={enviando}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          Forzar reenvío (sobreescribe OK)
        </button>
        <span className="ml-auto text-xs text-stone-500">
          El cron automático corre el día 1 a las 07:00 (Europe/Madrid).
        </span>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-900">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-stone-800">
            Pueblos · {data?.etiquetaLarga ?? '…'}
          </h2>
          <span className="text-xs text-stone-500">
            {data?.pueblos.length ?? 0} pueblos activos con opt-in
          </span>
        </div>
        {loading ? (
          <div className="p-10 text-center text-sm text-stone-500">Cargando…</div>
        ) : !data || data.pueblos.length === 0 ? (
          <div className="p-10 text-center text-sm text-stone-500">
            No hay pueblos activos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-2 text-left">Pueblo</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Destinatarios</th>
                  <th className="px-4 py-2 text-left">Enviado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.pueblos.map((row) => {
                  const r = row.report;
                  return (
                    <tr key={row.puebloId} className="border-t border-stone-100 hover:bg-stone-50/60">
                      <td className="px-4 py-2 font-medium text-stone-900">{row.puebloNombre}</td>
                      <td className="px-4 py-2">
                        {!r && (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
                            <Clock className="h-3.5 w-3.5" /> pendiente
                          </span>
                        )}
                        {r && !r.error && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" /> enviado
                          </span>
                        )}
                        {r?.error && (
                          <span
                            className="inline-flex items-center gap-1 text-xs text-rose-700"
                            title={r.error}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" /> error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-600">
                        {r?.destinatarios?.length
                          ? r.destinatarios.join(', ')
                          : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-600">
                        {r ? formatFecha(r.enviadoAt) : <span className="text-stone-400">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <a
                            href={`/api/admin/reports-mensuales/preview?puebloId=${row.puebloId}&mes=${mes}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </a>
                          {r && (
                            <a
                              href={`/api/admin/reports-mensuales/snapshot/${r.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                            >
                              <History className="h-3.5 w-3.5" /> Ver enviado
                            </a>
                          )}
                          <button
                            onClick={() => reenviarPueblo(row.puebloId)}
                            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            <Send className="h-3.5 w-3.5" /> Reenviar
                          </button>
                          <PuebloOptInButton puebloId={row.puebloId} onChanged={cargar} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PuebloOptInButton({
  puebloId,
  onChanged,
}: {
  puebloId: number;
  onChanged: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [recibir, setRecibir] = useState(true);
  const [saving, setSaving] = useState(false);

  async function guardar() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reports-mensuales/pueblo/${puebloId}/opt-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recibir, emailInstitucional: email }),
      });
      if (!res.ok) throw new Error(await res.text());
      setAbierto(false);
      onChanged();
    } catch (e: any) {
      window.alert(e?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-50"
        title="Ajustar email institucional y opt-in"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded border border-stone-300 bg-white p-1">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@ayto.es (opcional)"
        className="rounded border-0 bg-stone-50 px-2 py-1 text-xs outline-none focus:bg-white"
      />
      <label className="inline-flex items-center gap-1 px-1 text-xs text-stone-700">
        <input
          type="checkbox"
          checked={recibir}
          onChange={(e) => setRecibir(e.target.checked)}
        />
        Recibir
      </label>
      <button
        onClick={guardar}
        disabled={saving}
        className="rounded bg-amber-700 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
      >
        OK
      </button>
      <button
        onClick={() => setAbierto(false)}
        className="px-1 text-xs text-stone-500 hover:text-stone-900"
      >
        ✕
      </button>
    </div>
  );
}
