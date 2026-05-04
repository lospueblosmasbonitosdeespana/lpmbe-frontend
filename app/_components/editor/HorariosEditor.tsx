'use client';

import { useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface HorarioDia {
  diaSemana: number; // 0=Lun … 6=Dom
  abierto: boolean;
  horaAbre?: string;
  horaCierra?: string;
}

export interface CierreEspecial {
  fecha: string; // "YYYY-MM-DD"
  motivo?: string;
}

interface Props {
  horariosSemana?: HorarioDia[];
  cierresEspeciales?: CierreEspecial[];
  onChange: (horarios: HorarioDia[], cierres: CierreEspecial[]) => void;
  readOnly?: boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function buildDefaultHorarios(): HorarioDia[] {
  return DIAS.map((_, i) => ({
    diaSemana: i,
    abierto: i < 5, // Lun-Vie abierto por defecto
    horaAbre: '09:00',
    horaCierra: '18:00',
  }));
}

function normalizarHorarios(raw?: HorarioDia[]): HorarioDia[] {
  const base = buildDefaultHorarios();
  if (!raw || raw.length === 0) return base;
  const map = new Map(raw.map((h) => [h.diaSemana, h]));
  return base.map((d) => {
    const r = map.get(d.diaSemana);
    if (!r) return d;
    return { diaSemana: r.diaSemana, abierto: r.abierto, horaAbre: r.horaAbre, horaCierra: r.horaCierra };
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HorariosEditor({ horariosSemana, cierresEspeciales, onChange, readOnly }: Props) {
  const [horarios, setHorarios] = useState<HorarioDia[]>(() => normalizarHorarios(horariosSemana));
  const [cierres, setCierres] = useState<CierreEspecial[]>(
    (cierresEspeciales ?? []).map(({ fecha, motivo }) => ({ fecha: typeof fecha === 'string' ? fecha.slice(0, 10) : fecha, motivo }))
  );
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoMotivo, setNuevoMotivo] = useState('');

  const notifyChange = (h: HorarioDia[], c: CierreEspecial[]) => {
    onChange(h, c);
  };

  const updateHorario = (idx: number, field: keyof HorarioDia, value: boolean | string) => {
    const updated = horarios.map((h, i) => (i === idx ? { ...h, [field]: value } : h));
    setHorarios(updated);
    notifyChange(updated, cierres);
  };

  const addCierre = () => {
    if (!nuevaFecha) return;
    if (cierres.find((c) => c.fecha === nuevaFecha)) return; // ya existe
    const updated = [...cierres, { fecha: nuevaFecha, motivo: nuevoMotivo || undefined }].sort(
      (a, b) => a.fecha.localeCompare(b.fecha),
    );
    setCierres(updated);
    notifyChange(horarios, updated);
    setNuevaFecha('');
    setNuevoMotivo('');
  };

  const removeCierre = (fecha: string) => {
    const updated = cierres.filter((c) => c.fecha !== fecha);
    setCierres(updated);
    notifyChange(horarios, updated);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Horario semanal */}
      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Horario semanal</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600 font-medium w-28">Día</th>
                <th className="px-3 py-2 text-gray-600 font-medium w-20 text-center">Abierto</th>
                <th className="px-3 py-2 text-gray-600 font-medium text-center">Abre</th>
                <th className="px-3 py-2 text-gray-600 font-medium text-center">Cierra</th>
              </tr>
            </thead>
            <tbody>
              {horarios.map((h, i) => (
                <tr key={h.diaSemana} className={`border-t border-gray-100 ${h.abierto ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-3 py-2 font-medium text-gray-800">{DIAS[h.diaSemana]}</td>
                  <td className="px-3 py-2 text-center">
                    {readOnly ? (
                      <span className={`inline-block w-3 h-3 rounded-full ${h.abierto ? 'bg-green-500' : 'bg-red-400'}`} />
                    ) : (
                      <input
                        type="checkbox"
                        checked={h.abierto}
                        onChange={(e) => updateHorario(i, 'abierto', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {readOnly ? (
                      <span className="text-gray-600">{h.abierto ? (h.horaAbre ?? '—') : '—'}</span>
                    ) : (
                      <input
                        type="time"
                        value={h.horaAbre ?? ''}
                        disabled={!h.abierto}
                        onChange={(e) => updateHorario(i, 'horaAbre', e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm w-24 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {readOnly ? (
                      <span className="text-gray-600">{h.abierto ? (h.horaCierra ?? '—') : 'Cerrado'}</span>
                    ) : (
                      <input
                        type="time"
                        value={h.horaCierra ?? ''}
                        disabled={!h.abierto}
                        onChange={(e) => updateHorario(i, 'horaCierra', e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm w-24 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cierres especiales */}
      <div>
        <h4 className="font-semibold text-sm text-gray-700 mb-3">Cierres especiales</h4>

        {cierres.length === 0 && (
          <p className="text-sm text-gray-400 italic mb-3">Sin cierres especiales programados.</p>
        )}

        {cierres.length > 0 && (
          <ul className="space-y-1 mb-4">
            {cierres.map((c) => {
              const esPasado = c.fecha < today;
              const esHoy = c.fecha === today;
              return (
                <li
                  key={c.fecha}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                    esHoy
                      ? 'bg-red-50 border border-red-300 text-red-700'
                      : esPasado
                      ? 'bg-gray-50 border border-gray-200 text-gray-400'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatFecha(c.fecha)}</span>
                    {esHoy && <span className="text-xs font-bold text-red-600 uppercase">HOY</span>}
                    {c.motivo && <span className="text-xs opacity-80">— {c.motivo}</span>}
                  </div>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeCierre(c.fecha)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-2 leading-none"
                      title="Eliminar cierre"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!readOnly && (
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={nuevaFecha}
              min={today}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <input
              type="text"
              placeholder="Motivo (opcional)"
              value={nuevoMotivo}
              onChange={(e) => setNuevoMotivo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="button"
              onClick={addCierre}
              disabled={!nuevaFecha}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              + Añadir cierre
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split('-');
  return `${d}/${m}/${y}`;
}
