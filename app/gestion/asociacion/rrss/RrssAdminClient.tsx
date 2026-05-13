'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Recurso = {
  id: number;
  nombre: string;
  slug: string | null;
  planNegocio: string | null;
  fotoUrl: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  pueblo: { id: number; nombre: string; slug: string } | null;
};

type Solicitud = {
  id: number;
  recursoId: number;
  tipo: string;
  estado: string;
  briefNegocio: string | null;
  briefMediaUrl: string | null;
  borradorCopy: string | null;
  notasAdmin: string | null;
  publicadaUrl: string | null;
  fechaPublicacion: string | null;
  importeCents: number | null;
  conLinkExtra: boolean;
  mesImputacion: string | null;
  createdAt: string;
  recurso: Recurso;
  solicitadaPor?: {
    id: number;
    nombre: string | null;
    apellidos: string | null;
    email: string | null;
  } | null;
};

const ESTADOS = [
  'PENDIENTE',
  'EN_REVISION',
  'APROBADA',
  'PUBLICADA',
  'RECHAZADA',
  'CANCELADA',
] as const;

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendientes',
  EN_REVISION: 'En revisión',
  APROBADA: 'Aprobadas (esperan pago/programación)',
  PUBLICADA: 'Publicadas',
  RECHAZADA: 'Rechazadas',
  CANCELADA: 'Canceladas',
};

const TIPO_LABELS: Record<string, string> = {
  STORY_INCLUIDA: 'Story (incluida)',
  MENCION_EDITORIAL: 'Mención editorial (incluida)',
  INSTAGRAM_STORY: 'Story Instagram (extra)',
  INSTAGRAM_POST: 'Post Instagram (extra)',
  INSTAGRAM_REEL: 'Reel Instagram (extra)',
  FACEBOOK_POST: 'Post Facebook (extra)',
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

function planClass(plan: string | null): string {
  switch (plan) {
    case 'SELECTION':
      return 'bg-slate-900 text-amber-300';
    case 'PREMIUM':
      return 'bg-amber-100 text-amber-900';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export default function RrssAdminClient() {
  const [filtroEstado, setFiltroEstado] = useState<string>('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filtroEstado === 'TODAS'
        ? '/api/club/rrss/admin'
        : `/api/club/rrss/admin?estado=${filtroEstado}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of solicitudes) c[s.estado] = (c[s.estado] || 0) + 1;
    return c;
  }, [solicitudes]);

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltroEstado('TODAS')}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filtroEstado === 'TODAS'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
        >
          Todas
        </button>
        {ESTADOS.map((est) => (
          <button
            key={est}
            type="button"
            onClick={() => setFiltroEstado(est)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroEstado === est
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {ESTADO_LABELS[est] || est}
            {counts[est] ? ` (${counts[est]})` : ''}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading && (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      )}
      {!loading && solicitudes.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No hay solicitudes en este estado.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {solicitudes.map((s) => (
          <SolicitudRow
            key={s.id}
            solicitud={s}
            isEditing={editing === s.id}
            onEdit={() => setEditing(s.id)}
            onClose={() => setEditing(null)}
            onChange={() => load()}
          />
        ))}
      </div>
    </div>
  );
}

function SolicitudRow({
  solicitud,
  isEditing,
  onEdit,
  onClose,
  onChange,
}: {
  solicitud: Solicitud;
  isEditing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onChange: () => void;
}) {
  const [estado, setEstado] = useState(solicitud.estado);
  const [borradorCopy, setBorradorCopy] = useState(solicitud.borradorCopy || '');
  const [notasAdmin, setNotasAdmin] = useState(solicitud.notasAdmin || '');
  const [publicadaUrl, setPublicadaUrl] = useState(solicitud.publicadaUrl || '');
  const [fechaPublicacion, setFechaPublicacion] = useState(
    solicitud.fechaPublicacion ? solicitud.fechaPublicacion.slice(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [generandoIa, setGenerandoIa] = useState(false);
  const [calidadAlta, setCalidadAlta] = useState(false);
  const [iaMsg, setIaMsg] = useState<string | null>(null);

  useEffect(() => {
    setEstado(solicitud.estado);
    setBorradorCopy(solicitud.borradorCopy || '');
    setNotasAdmin(solicitud.notasAdmin || '');
    setPublicadaUrl(solicitud.publicadaUrl || '');
    setFechaPublicacion(
      solicitud.fechaPublicacion ? solicitud.fechaPublicacion.slice(0, 10) : '',
    );
  }, [solicitud]);

  const guardar = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = { estado, borradorCopy, notasAdmin };
      if (publicadaUrl) body.publicadaUrl = publicadaUrl;
      if (fechaPublicacion) body.fechaPublicacion = new Date(fechaPublicacion).toISOString();
      const res = await fetch(`/api/club/rrss/${solicitud.id}/admin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMsg('Guardado');
        onChange();
        setTimeout(() => onClose(), 800);
      } else {
        const d = await res.json().catch(() => ({}));
        setMsg(d?.message || 'Error');
      }
    } finally {
      setSaving(false);
    }
  };

  const generarBorradorIa = async () => {
    if (
      borradorCopy &&
      !confirm(
        '¿Sobrescribir el borrador actual con uno nuevo generado por IA?',
      )
    ) {
      return;
    }
    setGenerandoIa(true);
    setIaMsg(null);
    try {
      const res = await fetch(`/api/club/rrss/${solicitud.id}/generar-borrador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calidadAlta }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.borrador) {
        setBorradorCopy(data.borrador);
        setIaMsg(`Borrador generado con ${data.modelo || 'IA'}. Revísalo y guárdalo.`);
      } else {
        setIaMsg(data?.message || 'No se pudo generar el borrador');
      }
    } catch (err) {
      setIaMsg('Error de red al generar el borrador');
    } finally {
      setGenerandoIa(false);
    }
  };

  const r = solicitud.recurso;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {/* Foto */}
        {r.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.fotoUrl}
            alt={r.nombre}
            className="h-14 w-14 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg bg-muted shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-foreground truncate">{r.nombre}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planClass(r.planNegocio)}`}>
              {r.planNegocio || 'FREE'}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeClass(solicitud.estado)}`}>
              {solicitud.estado}
            </span>
            {solicitud.importeCents != null && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {(solicitud.importeCents / 100).toFixed(0)}€
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {TIPO_LABELS[solicitud.tipo] || solicitud.tipo}
            {' · '}
            {r.pueblo ? r.pueblo.nombre : 'Selection (sin pueblo)'}
            {' · '}
            {new Date(solicitud.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {r.slug && r.pueblo && (
            <Link
              href={`/pueblos/${r.pueblo.slug}/club/${r.slug}`}
              target="_blank"
              className="rounded border border-border bg-white px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted/30"
            >
              Ver ficha
            </Link>
          )}
          <button
            type="button"
            onClick={isEditing ? onClose : onEdit}
            className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
          >
            {isEditing ? 'Cerrar' : 'Gestionar'}
          </button>
        </div>
      </div>

      {/* Brief del negocio (siempre visible) */}
      {(solicitud.briefNegocio || solicitud.briefMediaUrl) && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          {solicitud.briefNegocio && (
            <p className="text-xs text-foreground">
              <strong>Brief del negocio:</strong> {solicitud.briefNegocio}
            </p>
          )}
          {solicitud.briefMediaUrl && (
            <a
              href={solicitud.briefMediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-primary underline"
            >
              Ver foto/material aportado
            </a>
          )}
        </div>
      )}

      {/* Editor admin */}
      {isEditing && (
        <div className="border-t border-border p-4 bg-blue-50/30 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs"
              >
                {ESTADOS.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-foreground mb-1">
                Fecha de publicación
              </label>
              <input
                type="date"
                value={fechaPublicacion}
                onChange={(e) => setFechaPublicacion(e.target.value)}
                className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <label className="block text-[11px] font-semibold text-foreground">
                Borrador del copy (visible para el negocio)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={calidadAlta}
                    onChange={(e) => setCalidadAlta(e.target.checked)}
                    className="h-3 w-3"
                  />
                  Calidad alta
                </label>
                <button
                  type="button"
                  onClick={generarBorradorIa}
                  disabled={generandoIa}
                  className="rounded bg-purple-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  title="Genera un borrador a partir del brief del negocio usando IA"
                >
                  {generandoIa ? 'Generando…' : '✨ Generar con IA'}
                </button>
              </div>
            </div>
            <textarea
              value={borradorCopy}
              onChange={(e) => setBorradorCopy(e.target.value)}
              className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs"
              rows={6}
              placeholder="Texto que se publicará. Pégalo aquí o genéralo con IA desde el brief del negocio."
            />
            {iaMsg && (
              <p className="mt-1 text-[10px] text-muted-foreground">{iaMsg}</p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              Notas internas (no visibles para el negocio)
            </label>
            <textarea
              value={notasAdmin}
              onChange={(e) => setNotasAdmin(e.target.value)}
              className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-foreground mb-1">
              URL de la publicación (Instagram/Facebook)
            </label>
            <input
              type="url"
              value={publicadaUrl}
              onChange={(e) => setPublicadaUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/…"
              className="w-full rounded border border-border bg-white px-2 py-1.5 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={saving}
              className="rounded bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
