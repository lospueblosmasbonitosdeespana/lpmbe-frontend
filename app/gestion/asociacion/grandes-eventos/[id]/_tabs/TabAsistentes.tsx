'use client';

import { useState, useMemo } from 'react';
import { Search, Bus, Phone, Mail, Hotel, UtensilsCrossed, Plane, AlertTriangle, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { ASISTENTES, DELEGACIONES_RESUMEN, type Asistente } from './asistentes-data';

type Vista = 'personas' | 'delegaciones';

const ALL_DELEGACIONES = [...new Set(ASISTENTES.map((a) => a.delegacion))].filter(Boolean).sort();

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${color}`}>
      {children}
    </span>
  );
}

function MealDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
        active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-400'
      }`}
    >
      {active ? '✓' : '–'}
    </span>
  );
}

function PersonCard({ a, expanded, onToggle }: { a: Asistente; expanded: boolean; onToggle: () => void }) {
  const hasContact = a.email || a.telefono;
  const hasHotels = a.hotelCastellar || a.hotelVejer || a.hotelGrazalema;

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-3 text-left sm:p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800">
          {(a.nombre || '?')[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-900">
              {a.nombre} {a.apellidos}
            </span>
            {a.acreditacion === 'sí' && <Badge color="bg-emerald-100 text-emerald-700">Acreditado</Badge>}
            {a.autobus && <Badge color="bg-blue-100 text-blue-700">Autobús</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-stone-500 line-clamp-1">{a.delegacion}</p>
          {a.cargo && <p className="text-xs text-stone-400">{a.cargo}</p>}
        </div>
        {expanded ? <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-stone-400" /> : <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-stone-400" />}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 px-3 pb-4 pt-3 sm:px-4">
          {/* Contacto */}
          {hasContact && (
            <div className="mb-3 space-y-1">
              {a.telefono && (
                <a href={`tel:${a.telefono.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-amber-700 hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {a.telefono}
                </a>
              )}
              {a.email && (
                <a href={`mailto:${a.email}`} className="flex items-center gap-2 text-sm text-amber-700 hover:underline">
                  <Mail className="h-3.5 w-3.5" /> {a.email}
                </a>
              )}
            </div>
          )}

          {a.dni && (
            <p className="mb-3 text-xs text-stone-500">
              <span className="font-medium text-stone-600">DNI:</span> {a.dni}
            </p>
          )}

          {/* Hoteles */}
          {hasHotels && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <Hotel className="h-3.5 w-3.5" /> Alojamiento
              </p>
              <div className="grid gap-1.5 text-xs sm:grid-cols-3">
                {a.hotelCastellar && (
                  <div className="rounded-lg bg-stone-50 p-2">
                    <span className="font-medium text-stone-600">Mié 20 – Castellar</span>
                    <br />
                    <span className="text-stone-900">{a.hotelCastellar}</span>
                  </div>
                )}
                {a.hotelVejer && (
                  <div className="rounded-lg bg-stone-50 p-2">
                    <span className="font-medium text-stone-600">Jue 21 – Vejer</span>
                    <br />
                    <span className="text-stone-900">{a.hotelVejer}</span>
                    {a.hotelVejerAsignado && (
                      <span className="block text-[10px] text-amber-700">{a.hotelVejerAsignado}</span>
                    )}
                  </div>
                )}
                {a.hotelGrazalema && (
                  <div className="rounded-lg bg-stone-50 p-2">
                    <span className="font-medium text-stone-600">Vie-Sáb – Grazalema</span>
                    <br />
                    <span className="text-stone-900">{a.hotelGrazalema}</span>
                    {a.hotelGrazalemaAsignado && (
                      <span className="block text-[10px] text-amber-700">{a.hotelGrazalemaAsignado}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comidas */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-stone-700">
              <UtensilsCrossed className="h-3.5 w-3.5" /> Comidas
            </p>
            <div className="grid grid-cols-3 gap-y-1 text-[11px] sm:grid-cols-6">
              <div className="flex items-center gap-1">
                <MealDot active={a.cenaMieCastellar} label="Cena mié Castellar" />
                <span className="text-stone-500">Cena mié</span>
              </div>
              <div className="flex items-center gap-1">
                <MealDot active={a.almuerzoJueCastellar} label="Almuerzo jue Castellar" />
                <span className="text-stone-500">Alm. jue</span>
              </div>
              <div className="flex items-center gap-1">
                <MealDot active={a.cenaJueVejer} label="Cena jue Vejer" />
                <span className="text-stone-500">Cena jue</span>
              </div>
              <div className="flex items-center gap-1">
                <MealDot active={a.almuerzoVieGrazalema} label="Almuerzo vie Grazalema" />
                <span className="text-stone-500">Alm. vie</span>
              </div>
              <div className="flex items-center gap-1">
                <MealDot active={a.cenaVieGrazalema} label="Cena vie Grazalema" />
                <span className="text-stone-500">Cena vie</span>
              </div>
              <div className="flex items-center gap-1">
                <MealDot active={a.almuerzoSabZahara} label="Almuerzo sáb Zahara" />
                <span className="text-stone-500">Alm. sáb</span>
              </div>
              <div className="flex items-center gap-1">
                <MealDot active={a.cenaSabSetenil} label="Cena sáb Setenil" />
                <span className="text-stone-500">Cena sáb</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TabAsistentes() {
  const [vista, setVista] = useState<Vista>('personas');
  const [search, setSearch] = useState('');
  const [filterDeleg, setFilterDeleg] = useState('');
  const [filterBus, setFilterBus] = useState<'' | 'si' | 'no'>('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ASISTENTES.filter((a) => {
      if (filterDeleg && a.delegacion !== filterDeleg) return false;
      if (filterBus === 'si' && !a.autobus) return false;
      if (filterBus === 'no' && a.autobus) return false;
      if (q) {
        const haystack = [a.nombre, a.apellidos, a.delegacion, a.cargo, a.email, a.telefono, a.dni, a.hotelVejerAsignado, a.hotelGrazalemaAsignado].join(' ').toLowerCase();
        return haystack.includes(q);
      }
      return true;
    });
  }, [search, filterDeleg, filterBus]);

  const toggle = (idx: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedIds(new Set(filtered.map((_, i) => i)));
      setAllExpanded(true);
    }
  };

  const totalBus = ASISTENTES.filter((a) => a.autobus).length;
  const totalAcreditados = ASISTENTES.filter((a) => a.acreditacion === 'sí').length;

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-2xl font-bold text-stone-900">{ASISTENTES.length}</p>
          <p className="text-xs text-stone-500">Total personas</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-2xl font-bold text-emerald-700">{totalAcreditados}</p>
          <p className="text-xs text-stone-500">Acreditados</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-2xl font-bold text-blue-700">{totalBus}</p>
          <p className="text-xs text-stone-500">En autobús</p>
        </div>
        <div className="rounded-xl bg-white p-3 text-center shadow-sm ring-1 ring-stone-200">
          <p className="text-2xl font-bold text-amber-700">{ALL_DELEGACIONES.length}</p>
          <p className="text-xs text-stone-500">Delegaciones</p>
        </div>
      </div>

      {/* Pestañas vista */}
      <div className="flex gap-2">
        <button
          onClick={() => setVista('personas')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${vista === 'personas' ? 'bg-amber-700 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'}`}
        >
          <Users className="mr-1.5 inline h-4 w-4" />
          Por persona
        </button>
        <button
          onClick={() => setVista('delegaciones')}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${vista === 'delegaciones' ? 'bg-amber-700 text-white' : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50'}`}
        >
          <Plane className="mr-1.5 inline h-4 w-4" />
          Por delegación
        </button>
      </div>

      {vista === 'personas' && (
        <>
          {/* Búsqueda y filtros */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono, email, hotel…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <select
              value={filterDeleg}
              onChange={(e) => setFilterDeleg(e.target.value)}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Todas las delegaciones</option>
              {ALL_DELEGACIONES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filterBus}
              onChange={(e) => setFilterBus(e.target.value as '' | 'si' | 'no')}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="">Autobús: todos</option>
              <option value="si">En autobús</option>
              <option value="no">No en autobús</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {filtered.length} de {ASISTENTES.length} personas
            </p>
            <button onClick={toggleAll} className="text-xs font-medium text-amber-700 hover:underline">
              {allExpanded ? 'Contraer todos' : 'Expandir todos'}
            </button>
          </div>

          <div className="space-y-2">
            {filtered.map((a, i) => (
              <PersonCard
                key={`${a.nombre}-${a.apellidos}-${i}`}
                a={a}
                expanded={expandedIds.has(i)}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
        </>
      )}

      {vista === 'delegaciones' && (
        <div className="space-y-3">
          {DELEGACIONES_RESUMEN.map((d) => (
            <div key={d.delegacion} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-stone-900">{d.delegacion}</h3>
                  {d.tipo && (
                    <Badge
                      color={
                        d.tipo === 'Activa'
                          ? 'bg-emerald-100 text-emerald-700'
                          : d.tipo === 'Observadora'
                            ? 'bg-blue-100 text-blue-700'
                            : d.tipo === 'Invitada'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-stone-100 text-stone-600'
                      }
                    >
                      {d.tipo}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-stone-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {d.totalAsistentes}
                  </span>
                  {d.enAutobus > 0 && (
                    <span className="flex items-center gap-1 text-blue-700">
                      <Bus className="h-3.5 w-3.5" /> {d.enAutobus}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                {d.necesitaTransfer > 0 && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2">
                    <Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <div>
                      <span className="font-semibold text-amber-800">Transfer: {d.necesitaTransfer} pax</span>
                      {d.horaLlegada && <span className="block text-stone-600">Llegada: {d.horaLlegada}</span>}
                      {d.horaPartida && <span className="block text-stone-600">Salida: {d.horaPartida}</span>}
                    </div>
                  </div>
                )}
                {d.alergias && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                    <div>
                      <span className="font-semibold text-red-700">Alergias</span>
                      <span className="block text-stone-700">{d.alergias}</span>
                    </div>
                  </div>
                )}
                {d.observaciones && (
                  <div className="rounded-lg bg-stone-50 p-2 text-stone-600 sm:col-span-2">
                    <span className="font-semibold text-stone-700">Obs: </span>
                    {d.observaciones}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
