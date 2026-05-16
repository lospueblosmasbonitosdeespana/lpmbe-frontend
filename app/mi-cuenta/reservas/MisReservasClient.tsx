'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  ExternalLink,
} from 'lucide-react';

type Estado = 'PENDIENTE' | 'CONFIRMADA' | 'RECHAZADA' | 'CANCELADA' | 'NO_SHOW' | 'COMPLETADA';

interface Reserva {
  id: number;
  createdAt: string;
  fecha: string;
  hora: string | null;
  fechaSalida: string | null;
  personas: number;
  ninos: number | null;
  habitaciones: number | null;
  notas: string | null;
  estado: Estado;
  notaNegocio: string | null;
  esSocio: boolean;
  socioVerificado: boolean;
  numeroSocio: number | null;
  beneficioClub: string | null;
  tipoNegocio: string;
  recurso: {
    id: number;
    nombre: string;
    tipo: string;
    slug: string | null;
    telefono: string | null;
    email: string | null;
    pueblo: { slug: string; nombre: string } | null;
  };
}

interface Labels {
  titulo: string;
  subtitulo: string;
  vacio: string;
  volver: string;
  cancelar: string;
  cancelarConfirm: string;
  verNegocio: string;
  socio: string;
  beneficio: string;
  notaNegocio: string;
  estado: Record<Estado, string>;
}

const ESTADO_COLOR: Record<Estado, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-900 border-amber-300',
  CONFIRMADA: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  RECHAZADA: 'bg-rose-100 text-rose-900 border-rose-300',
  CANCELADA: 'bg-stone-100 text-stone-700 border-stone-300',
  NO_SHOW: 'bg-orange-100 text-orange-900 border-orange-300',
  COMPLETADA: 'bg-blue-100 text-blue-900 border-blue-300',
};

const TIPO_TO_ROUTE: Record<string, string> = {
  RESTAURANTE: 'donde-comer',
  BAR: 'donde-comer',
  HOTEL: 'donde-dormir',
  CASA_RURAL: 'donde-dormir',
  COMERCIO: 'donde-comprar',
  TIENDA_ARTESANIA: 'donde-comprar',
  BODEGA: 'donde-comprar',
  EXPERIENCIA: 'experiencias',
};

function formatFechaHora(fecha: string, hora: string | null): string {
  const d = new Date(fecha);
  const dia = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return hora ? `${dia} · ${hora}` : dia;
}

export default function MisReservasClient({ labels }: { labels: Labels }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reservas/mias', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudieron cargar tus reservas');
      const data = await res.json();
      setReservas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cancelar(id: number) {
    if (!confirm(labels.cancelarConfirm)) return;
    try {
      const res = await fetch(`/api/reservas/${id}/cancelar`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo cancelar');
      await cargar();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          href="/mi-cuenta"
          className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
        >
          <ArrowLeft size={14} /> {labels.volver}
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900">{labels.titulo}</h1>
          <p className="text-sm text-stone-500 mt-1">{labels.subtitulo}</p>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-stone-500">Cargando…</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-rose-700">{error}</div>
        ) : reservas.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-stone-200 text-center">
            <CalendarCheck className="mx-auto text-stone-300 mb-3" size={36} />
            <p className="text-sm text-stone-500">{labels.vacio}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reservas.map((r) => {
              const route = TIPO_TO_ROUTE[r.recurso.tipo];
              const negocioHref =
                r.recurso.slug && r.recurso.pueblo?.slug && route
                  ? `/${route}/${r.recurso.pueblo.slug}/${r.recurso.slug}`
                  : null;
              const cancelable = r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA';
              return (
                <li
                  key={r.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-stone-900 leading-tight">
                        {r.recurso.nombre}
                      </h2>
                      {r.recurso.pueblo?.nombre && (
                        <p className="text-xs text-stone-500 mt-0.5">{r.recurso.pueblo.nombre}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${ESTADO_COLOR[r.estado]}`}
                    >
                      {r.estado === 'CONFIRMADA' && <CheckCircle2 size={11} />}
                      {r.estado === 'PENDIENTE' && <Clock size={11} />}
                      {(r.estado === 'RECHAZADA' || r.estado === 'CANCELADA' || r.estado === 'NO_SHOW') && (
                        <XCircle size={11} />
                      )}
                      {labels.estado[r.estado]}
                    </span>
                  </div>

                  <p className="text-sm text-stone-700">
                    📅 {formatFechaHora(r.fecha, r.hora)}
                    {r.fechaSalida && ` → ${formatFechaHora(r.fechaSalida, null)}`}
                  </p>
                  <p className="text-sm text-stone-700">
                    👥 {r.personas}
                    {r.ninos ? ` + ${r.ninos} niños` : ''}
                    {r.habitaciones ? ` · ${r.habitaciones} habitaciones` : ''}
                  </p>

                  {r.esSocio && r.socioVerificado && r.numeroSocio && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                      <Star size={11} className="fill-amber-500 text-amber-500" />
                      {labels.socio} #{r.numeroSocio}
                      {r.beneficioClub && (
                        <span className="hidden sm:inline">· {r.beneficioClub}</span>
                      )}
                    </div>
                  )}

                  {r.notaNegocio && (
                    <div className="mt-3 p-2.5 bg-stone-50 border-l-4 border-stone-300 rounded text-sm">
                      <p className="text-xs font-semibold text-stone-500 mb-0.5">
                        {labels.notaNegocio}:
                      </p>
                      <p className="text-stone-800">«{r.notaNegocio}»</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 flex-wrap">
                    {negocioHref && (
                      <Link
                        href={negocioHref}
                        className="text-xs font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
                      >
                        <ExternalLink size={11} />
                        {labels.verNegocio}
                      </Link>
                    )}
                    {cancelable && (
                      <button
                        onClick={() => cancelar(r.id)}
                        className="text-xs font-medium text-rose-700 hover:text-rose-900"
                      >
                        {labels.cancelar}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
