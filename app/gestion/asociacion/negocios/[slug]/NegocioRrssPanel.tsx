'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPlanFeatures, PRODUCTOS_RRSS_SUELTOS, type PlanNegocio } from '@/lib/plan-features';

type Solicitud = {
  id: number;
  tipo: string;
  estado: string;
  briefNegocio?: string | null;
  briefMediaUrl?: string | null;
  borradorCopy?: string | null;
  publicadaUrl?: string | null;
  fechaPublicacion?: string | null;
  importeCents?: number | null;
  conLinkExtra?: boolean;
  mesImputacion?: string | null;
  pagadaAt?: string | null;
  createdAt: string;
};

const TIPOS_DE_PAGO = [
  'INSTAGRAM_STORY',
  'INSTAGRAM_POST',
  'INSTAGRAM_REEL',
  'FACEBOOK_POST',
];

type Cupo = {
  mes: string;
  storiesIncluidas: number;
  storiesUsadas: number;
  storiesRestantes: number;
  mencionesIncluidas: number;
  mencionesUsadas: number;
  mencionesRestantes: number;
};

type RrssData = {
  solicitudes: Solicitud[];
  cupoMes: Cupo;
};

const TIPO_LABEL: Record<string, string> = {
  STORY_INCLUIDA: 'Story incluida',
  MENCION_EDITORIAL: 'Mención editorial',
  INSTAGRAM_STORY: 'Story Instagram (extra)',
  INSTAGRAM_POST: 'Post Instagram (extra)',
  INSTAGRAM_REEL: 'Reel Instagram (extra)',
  FACEBOOK_POST: 'Post Facebook (extra)',
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobada',
  PUBLICADA: 'Publicada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

function badgeClass(estado: string): string {
  switch (estado) {
    case 'PUBLICADA':
      return 'bg-green-100 text-green-800';
    case 'EN_REVISION':
      return 'bg-blue-100 text-blue-800';
    case 'APROBADA':
      return 'bg-amber-100 text-amber-800';
    case 'RECHAZADA':
    case 'CANCELADA':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

export default function NegocioRrssPanel({
  negocioId,
  planNegocio,
}: {
  negocioId: number;
  planNegocio: string;
}) {
  const features = getPlanFeatures(planNegocio as PlanNegocio);
  const tieneIncluidas =
    features.monthlyStoryIncluded > 0 || features.monthlyEditorialMention > 0;

  const [data, setData] = useState<RrssData | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showSueltaPicker, setShowSueltaPicker] = useState(false);
  const [showIncluidaForm, setShowIncluidaForm] = useState<
    null | 'STORY_INCLUIDA' | 'MENCION_EDITORIAL'
  >(null);
  const [briefDraft, setBriefDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/club/rrss/negocio/${negocioId}`, {
        cache: 'no-store',
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => {
    load();
  }, [load]);

  const solicitarIncluida = async (tipo: 'STORY_INCLUIDA' | 'MENCION_EDITORIAL') => {
    setMsg(null);
    const res = await fetch('/api/club/rrss/incluida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recursoId: negocioId,
        tipo,
        briefNegocio: briefDraft || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg('Solicitud enviada. El equipo de Comunicación la revisará pronto.');
      setBriefDraft('');
      setShowIncluidaForm(null);
      load();
    } else {
      setMsg(d?.message || 'No se pudo crear la solicitud');
    }
  };

  const solicitarSuelta = async (tipo: string, conLinkExtra: boolean) => {
    setMsg(null);
    const res = await fetch('/api/club/rrss/suelta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recursoId: negocioId,
        tipo,
        conLinkExtra,
        briefNegocio: briefDraft || undefined,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg('Solicitud enviada. Te enviaremos un presupuesto para confirmarla.');
      setBriefDraft('');
      setShowSueltaPicker(false);
      load();
    } else {
      setMsg(d?.message || 'No se pudo crear la solicitud');
    }
  };

  const cancelar = async (id: number) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    const res = await fetch(`/api/club/rrss/${id}/cancelar`, { method: 'PATCH' });
    if (res.ok) load();
  };

  const pagar = async (id: number) => {
    setMsg(null);
    const successUrl = `${window.location.origin}${window.location.pathname}?pago=ok#rrss-${id}`;
    const cancelUrl = `${window.location.origin}${window.location.pathname}?pago=cancel#rrss-${id}`;
    const res = await fetch(`/api/club/rrss/${id}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ successUrl, cancelUrl }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.sessionUrl) {
      window.location.href = d.sessionUrl;
    } else {
      setMsg(d?.message || 'No se pudo iniciar el pago');
    }
  };

  const cupo = data?.cupoMes;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">RRSS de LPMBE</h4>
          <p className="text-xs text-muted-foreground">
            Pide tus publicaciones del mes y contrata extras cuando lo necesites.
          </p>
        </div>
      </div>

      {/* Cupo del mes */}
      {tieneIncluidas && cupo ? (
        <div className="grid gap-3 sm:grid-cols-2 mb-4">
          {features.monthlyStoryIncluded > 0 && (
            <CupoCard
              titulo="Stories del mes"
              usadas={cupo.storiesUsadas}
              total={cupo.storiesIncluidas}
              cta={
                cupo.storiesRestantes > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowIncluidaForm('STORY_INCLUIDA')}
                    className="rounded bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90"
                  >
                    Solicitar story
                  </button>
                ) : null
              }
            />
          )}
          {features.monthlyEditorialMention > 0 && (
            <CupoCard
              titulo="Menciones editoriales"
              usadas={cupo.mencionesUsadas}
              total={cupo.mencionesIncluidas}
              cta={
                cupo.mencionesRestantes > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowIncluidaForm('MENCION_EDITORIAL')}
                    className="rounded bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-600"
                  >
                    Solicitar mención
                  </button>
                ) : null
              }
            />
          )}
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 mb-4">
          <p className="text-xs text-amber-900">
            Tu plan actual no incluye publicaciones en RRSS. Mejora a Recomendado
            para 1 story/mes o a Premium para mención editorial + story.
          </p>
        </div>
      )}

      {/* Form para crear solicitud incluida */}
      {showIncluidaForm && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3 mb-4">
          <p className="text-xs font-semibold text-foreground mb-2">
            ¿Qué quieres destacar este mes? ({TIPO_LABEL[showIncluidaForm]})
          </p>
          <textarea
            value={briefDraft}
            onChange={(e) => setBriefDraft(e.target.value)}
            placeholder="Ej: Tenemos cena maridaje el sábado 15. Carta nueva de temporada con productos del valle…"
            className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs"
            rows={3}
          />
          <p className="mt-1 text-[10px] text-muted-foreground">
            Cuanto más concreto, mejor: oferta, fecha, foto destacada, link de reserva.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => solicitarIncluida(showIncluidaForm)}
              className="rounded bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary/90"
            >
              Enviar solicitud
            </button>
            <button
              type="button"
              onClick={() => {
                setShowIncluidaForm(null);
                setBriefDraft('');
              }}
              className="rounded border border-border bg-white px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Contratar publicación suelta (cualquier plan) */}
      <div className="rounded-md border border-border p-3 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Publicaciones extra</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Contrata stories, posts o reels sueltos cuando quieras destacar algo concreto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSueltaPicker((v) => !v)}
            className="rounded border border-primary px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/5 shrink-0"
          >
            {showSueltaPicker ? 'Ocultar' : 'Ver tarifas'}
          </button>
        </div>

        {showSueltaPicker && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PRODUCTOS_RRSS_SUELTOS.map((p) => (
              <div
                key={p.tipo}
                className="rounded border border-border bg-white p-3 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-foreground">{p.label}</p>
                  <p className="text-xs font-bold text-primary shrink-0">
                    {p.precioMax ? `${p.precio}–${p.precioMax} €` : `${p.precio} €`}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2 flex-1">
                  {p.descripcion}
                </p>
                {p.conLinkExtra ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => solicitarSuelta(p.tipo, false)}
                      className="rounded bg-primary px-2 py-1 text-[10px] font-semibold text-white hover:bg-primary/90"
                    >
                      Sin link · {p.precio}€
                    </button>
                    <button
                      type="button"
                      onClick={() => solicitarSuelta(p.tipo, true)}
                      className="rounded bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-600"
                    >
                      Con link · {p.precioMax}€
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => solicitarSuelta(p.tipo, false)}
                    className="rounded bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary/90"
                  >
                    Solicitar · {p.precio}€
                  </button>
                )}
                {p.requiereAprobacion && (
                  <p className="mt-1 text-[9px] text-amber-800">
                    Requiere aprobación editorial.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 mb-3 text-xs text-blue-900">
          {msg}
        </div>
      )}

      {/* Histórico */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Historial</p>
        {loading && <p className="text-[11px] text-muted-foreground">Cargando…</p>}
        {!loading && data && data.solicitudes.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            Aún no has solicitado ninguna publicación.
          </p>
        )}
        {!loading && data && data.solicitudes.length > 0 && (
          <div className="space-y-2">
            {data.solicitudes.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="rounded border border-border bg-white p-2 flex items-start justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-foreground">
                      {TIPO_LABEL[s.tipo] || s.tipo}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass(
                        s.estado,
                      )}`}
                    >
                      {ESTADO_LABEL[s.estado] || s.estado}
                    </span>
                    {s.importeCents != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {(s.importeCents / 100).toFixed(0)}€
                      </span>
                    )}
                    {s.pagadaAt && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                        Pagada
                      </span>
                    )}
                  </div>
                  {s.briefNegocio && (
                    <p className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                      {s.briefNegocio}
                    </p>
                  )}
                  {s.borradorCopy && (
                    <p className="mt-1 text-[10px] text-blue-900 line-clamp-2">
                      <strong>Borrador del CM:</strong> {s.borradorCopy}
                    </p>
                  )}
                  {s.publicadaUrl && (
                    <a
                      href={s.publicadaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-[10px] text-primary underline"
                    >
                      Ver publicación
                    </a>
                  )}
                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                {/* Botón "Pagar" si la suelta está aprobada y no pagada */}
                {TIPOS_DE_PAGO.includes(s.tipo) &&
                  s.estado === 'APROBADA' &&
                  !s.pagadaAt &&
                  s.importeCents != null && (
                    <button
                      type="button"
                      onClick={() => pagar(s.id)}
                      className="rounded bg-amber-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-600 shrink-0"
                    >
                      Pagar {(s.importeCents / 100).toFixed(0)}€
                    </button>
                )}
                {!['PUBLICADA', 'CANCELADA', 'RECHAZADA'].includes(s.estado) && !s.pagadaAt && (
                  <button
                    type="button"
                    onClick={() => cancelar(s.id)}
                    className="text-[10px] text-red-600 hover:underline shrink-0"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CupoCard({
  titulo,
  usadas,
  total,
  cta,
}: {
  titulo: string;
  usadas: number;
  total: number;
  cta: React.ReactNode;
}) {
  const restantes = Math.max(0, total - usadas);
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <p className="text-[11px] font-semibold text-foreground">{titulo}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        <strong>{restantes}</strong> de {total} disponibles este mes
      </p>
      <div className="mt-2">{cta}</div>
    </div>
  );
}
