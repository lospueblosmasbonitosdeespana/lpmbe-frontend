'use client';

import { useCallback, useEffect, useState } from 'react';

type Candidatura = {
  id: number;
  nombreNegocio: string;
  tipo: string;
  localidad: string;
  provincia: string;
  web?: string | null;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono?: string | null;
  descripcion: string;
  estado: string;
  notasAdmin?: string | null;
  createdAt: string;
};

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA'] as const;
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  EN_REVISION: 'bg-blue-100 text-blue-800',
  APROBADA: 'bg-green-100 text-green-800',
  RECHAZADA: 'bg-red-100 text-red-800',
};

export default function SelectionAdminPage() {
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filtro ? `?estado=${filtro}` : '';
      const res = await fetch(`/api/club/selection/candidaturas${qs}`);
      if (res.ok) {
        const data = await res.json();
        setCandidaturas(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoading(false);
  }, [filtro]);

  useEffect(() => { load(); }, [load]);

  const updateCandidatura = async (id: number, data: { estado?: string; notasAdmin?: string }) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/club/selection/candidaturas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setCandidaturas((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c)),
        );
      }
    } catch {}
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Candidaturas Selection</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las solicitudes de adhesión al programa Club LPMBE Selection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : candidaturas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          No hay candidaturas{filtro ? ` con estado "${filtro}"` : ''}.
        </div>
      ) : (
        <div className="space-y-3">
          {candidaturas.map((c) => {
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-xl border bg-card shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{c.nombreNegocio}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_COLORS[c.estado] ?? 'bg-muted text-muted-foreground'}`}>
                        {c.estado}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {c.tipo} · {c.localidad}, {c.provincia} · {new Date(c.createdAt).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <svg
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="border-t px-5 py-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div><span className="font-medium text-muted-foreground">Contacto:</span> {c.contactoNombre}</div>
                      <div><span className="font-medium text-muted-foreground">Email:</span>{' '}
                        <a href={`mailto:${c.contactoEmail}`} className="text-primary hover:underline">{c.contactoEmail}</a>
                      </div>
                      {c.contactoTelefono && (
                        <div><span className="font-medium text-muted-foreground">Teléfono:</span> {c.contactoTelefono}</div>
                      )}
                      {c.web && (
                        <div><span className="font-medium text-muted-foreground">Web:</span>{' '}
                          <a href={c.web.startsWith('http') ? c.web : `https://${c.web}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{c.web}</a>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-muted-foreground mb-1">Descripción / motivación</span>
                      <p className="text-sm text-foreground whitespace-pre-line bg-muted/50 rounded-lg p-3">{c.descripcion}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Notas internas</label>
                        <textarea
                          defaultValue={c.notasAdmin ?? ''}
                          onBlur={(e) => {
                            if (e.target.value !== (c.notasAdmin ?? '')) {
                              updateCandidatura(c.id, { notasAdmin: e.target.value });
                            }
                          }}
                          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          rows={2}
                          placeholder="Notas solo visibles para el equipo..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
                        <div className="flex gap-2 flex-wrap">
                          {ESTADOS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              disabled={saving === c.id}
                              onClick={() => updateCandidatura(c.id, { estado: e })}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                                c.estado === e
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-card text-muted-foreground border-border hover:bg-muted'
                              } ${saving === c.id ? 'opacity-50' : ''}`}
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
