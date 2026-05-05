'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Info,
  MapPin,
  QrCode,
  ScanLine,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  scope: string;
  activo: boolean;
  cerradoTemporal: boolean;
  descuentoPorcentaje: number | null;
  puntosCustom: number | null;
  maxAdultos: number;
  maxMenores: number;
  edadMaxMenor: number;
  validacionTipo: 'QR' | 'GEO' | 'AMBOS' | string;
  planNegocio: string | null;
  pueblo: { id: number; nombre: string; slug: string } | null;
  permisos?: string;
};

type ScanResult = {
  valido: boolean;
  resultado:
    | 'OK'
    | 'OK_VIA_COMBO'
    | 'INVALIDO'
    | 'CADUCADO'
    | 'YA_USADO'
    | 'RECURSO_INCORRECTO'
    | 'NO_AUTORIZADO'
    | 'ERROR';
  mensaje: string;
  adultosUsados: number;
  menoresUsados: number;
  puebloNombre: string | null;
  recursoNombre: string | null;
  descuentoPorcentaje: number | null;
};

type HistorialItem = {
  id: string;
  ts: number;
  recursoNombre: string;
  ok: boolean;
  resultado: string;
  mensaje: string;
};

function normalizeQrToken(raw: string): string {
  let v = (raw || '').trim();
  if (!v) return '';
  try {
    if (/^https?:\/\//i.test(v)) {
      const url = new URL(v);
      const fromQuery =
        url.searchParams.get('qr') ||
        url.searchParams.get('token') ||
        url.searchParams.get('t');
      if (fromQuery) v = fromQuery;
    }
  } catch {
    // ignore
  }
  if (v.startsWith('LPBME:QR:')) v = v.slice('LPBME:QR:'.length);
  else if (v.startsWith('LPBME:USER:')) v = v.slice('LPBME:USER:'.length);
  return v.trim();
}

function esRecursoNatural(r: Recurso): boolean {
  return r.validacionTipo === 'GEO' || r.validacionTipo === 'AMBOS';
}

function esNegocio(r: Recurso): boolean {
  return r.scope === 'NEGOCIO';
}

export default function ValidadorGlobalClient() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [recursoSeleccionado, setRecursoSeleccionado] = useState<Recurso | null>(null);
  const [adultos, setAdultos] = useState(2);
  const [menores, setMenores] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmittedRef = useRef<{ value: string; at: number } | null>(null);

  const cargarRecursos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/club/mis-recursos', { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudieron cargar tus recursos');
      const data = (await res.json()) as Recurso[];
      const lista = Array.isArray(data) ? data : [];
      setRecursos(lista);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar recursos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRecursos();
  }, [cargarRecursos]);

  useEffect(() => {
    if (recursoSeleccionado && !scanning) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [recursoSeleccionado, scanning, lastResult]);

  useEffect(() => {
    if (!recursoSeleccionado) return;
    const max = recursoSeleccionado.maxAdultos ?? 2;
    setAdultos((a) => Math.min(Math.max(1, a), max));
    setMenores((m) => Math.min(Math.max(0, m), recursoSeleccionado.maxMenores ?? 0));
  }, [recursoSeleccionado]);

  function pushHistorial(r: ScanResult) {
    setHistorial((prev) => {
      const item: HistorialItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        recursoNombre: r.recursoNombre || '',
        ok: r.valido,
        resultado: r.resultado,
        mensaje: r.mensaje,
      };
      return [item, ...prev].slice(0, 12);
    });
  }

  const submitScan = useCallback(
    async (rawValue: string) => {
      if (!recursoSeleccionado) return;
      const value = normalizeQrToken(rawValue);
      if (!value) return;

      const now = Date.now();
      if (
        lastSubmittedRef.current &&
        lastSubmittedRef.current.value === value &&
        now - lastSubmittedRef.current.at < 2000
      ) {
        return;
      }
      lastSubmittedRef.current = { value, at: now };

      setScanning(true);
      try {
        const res = await fetch('/api/club/validador/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrToken: value,
            recursoId: recursoSeleccionado.id,
            adultosUsados: Math.max(
              1,
              Math.min(adultos, recursoSeleccionado.maxAdultos ?? 2),
            ),
            menoresUsados: Math.max(
              0,
              Math.min(menores, recursoSeleccionado.maxMenores ?? 0),
            ),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as Partial<ScanResult> & { message?: string };

        if (!res.ok && !data?.resultado) {
          const fallback: ScanResult = {
            valido: false,
            resultado: 'ERROR',
            mensaje: data?.message || 'Error en el servidor',
            adultosUsados: 0,
            menoresUsados: 0,
            puebloNombre: null,
            recursoNombre: recursoSeleccionado.nombre,
            descuentoPorcentaje: null,
          };
          setLastResult(fallback);
          pushHistorial(fallback);
        } else {
          const finalRes: ScanResult = {
            valido: !!data.valido,
            resultado: (data.resultado as ScanResult['resultado']) || (data.valido ? 'OK' : 'ERROR'),
            mensaje: data.mensaje || '',
            adultosUsados: data.adultosUsados ?? 0,
            menoresUsados: data.menoresUsados ?? 0,
            puebloNombre: data.puebloNombre ?? null,
            recursoNombre: data.recursoNombre ?? recursoSeleccionado.nombre,
            descuentoPorcentaje: data.descuentoPorcentaje ?? null,
          };
          setLastResult(finalRes);
          pushHistorial(finalRes);
        }
      } catch (e: any) {
        const fallback: ScanResult = {
          valido: false,
          resultado: 'ERROR',
          mensaje: e?.message || 'Error de red',
          adultosUsados: 0,
          menoresUsados: 0,
          puebloNombre: null,
          recursoNombre: recursoSeleccionado.nombre,
          descuentoPorcentaje: null,
        };
        setLastResult(fallback);
        pushHistorial(fallback);
      } finally {
        setScanning(false);
        setQrInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [recursoSeleccionado, adultos, menores],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submitScan(qrInput);
    }
  };

  const recursosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return recursos;
    return recursos.filter((r) => {
      return (
        r.nombre.toLowerCase().includes(q) ||
        r.tipo.toLowerCase().includes(q) ||
        (r.pueblo?.nombre || '').toLowerCase().includes(q)
      );
    });
  }, [recursos, busqueda]);

  const negocios = useMemo(() => recursosFiltrados.filter(esNegocio), [recursosFiltrados]);
  const rrtt = useMemo(() => recursosFiltrados.filter((r) => !esNegocio(r)), [recursosFiltrados]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-5">
        <div className="flex items-start gap-3">
          <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
          <div>
            <p className="font-semibold">Compatible con pistola lectora de QR</p>
            <p className="mt-0.5 text-amber-800/90">
              Selecciona un recurso o negocio, asegúrate de que el cursor esté
              en el campo de validación y dispara la pistola contra el QR del
              socio. Cada lectura se valida automáticamente.
            </p>
          </div>
        </div>
      </div>

      {!recursoSeleccionado ? (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Paso 1 · Selecciona qué vas a validar
              </h2>
              <p className="text-sm text-muted-foreground">
                Solo aparecen los recursos y negocios para los que tienes permisos.
              </p>
            </div>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, tipo o pueblo…"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:border-primary sm:w-72"
            />
          </div>

          {loading && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Cargando recursos…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">No se han podido cargar los recursos</p>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void cargarRecursos()}
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!loading && !error && recursos.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              No tienes recursos asignados.
            </div>
          )}

          {!loading && !error && rrtt.length > 0 && (
            <section className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MapPin className="h-4 w-4" /> Recursos turísticos
                <span className="ml-auto text-xs text-muted-foreground/80">{rrtt.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {rrtt.map((r) => (
                  <RecursoCard key={r.id} r={r} onSelect={() => setRecursoSeleccionado(r)} />
                ))}
              </div>
            </section>
          )}

          {!loading && !error && negocios.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Building2 className="h-4 w-4" /> Negocios del Club
                <span className="ml-auto text-xs text-muted-foreground/80">{negocios.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {negocios.map((r) => (
                  <RecursoCard key={r.id} r={r} onSelect={() => setRecursoSeleccionado(r)} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  esNegocio(recursoSeleccionado) ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {esNegocio(recursoSeleccionado) ? <Building2 className="h-6 w-6" /> : <QrCode className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Validando en
                </p>
                <p className="text-lg font-bold text-foreground">{recursoSeleccionado.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {recursoSeleccionado.tipo}
                  {recursoSeleccionado.pueblo?.nombre ? ` · ${recursoSeleccionado.pueblo.nombre}` : ''}
                  {recursoSeleccionado.descuentoPorcentaje
                    ? ` · -${recursoSeleccionado.descuentoPorcentaje}% Club`
                    : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRecursoSeleccionado(null);
                setLastResult(null);
                setQrInput('');
              }}
              className="self-start rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted sm:self-auto"
            >
              Cambiar recurso
            </button>
          </div>

          {(recursoSeleccionado.maxAdultos > 1 || (recursoSeleccionado.maxMenores ?? 0) > 0) &&
            !esNegocio(recursoSeleccionado) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Stepper
                  label="Adultos"
                  icon={<Users className="h-4 w-4" />}
                  value={adultos}
                  min={1}
                  max={recursoSeleccionado.maxAdultos ?? 2}
                  onChange={setAdultos}
                />
                <Stepper
                  label={`Menores${recursoSeleccionado.edadMaxMenor ? ` (<${recursoSeleccionado.edadMaxMenor} años)` : ''}`}
                  icon={<Users className="h-4 w-4" />}
                  value={menores}
                  min={0}
                  max={recursoSeleccionado.maxMenores ?? 0}
                  onChange={setMenores}
                />
              </div>
            )}

          <div className="rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <label
              htmlFor="qr-input"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900"
            >
              <ScanLine className="h-5 w-5" />
              Apunta la pistola al QR del socio (o escríbelo) y pulsa Enter
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={inputRef}
                id="qr-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={scanning}
                placeholder="Esperando escaneo…"
                className="w-full rounded-xl border-2 border-amber-300 bg-white px-4 py-3 text-base font-mono shadow-inner outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-300 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void submitScan(qrInput)}
                disabled={scanning || qrInput.trim().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {scanning ? 'Validando…' : 'Validar'}
              </button>
            </div>
            <p className="mt-2 text-xs text-amber-900/70">
              Pista: si el cursor sale del campo, haz click sobre él de nuevo para que la pistola escriba aquí.
            </p>
          </div>

          {lastResult && (
            <div
              className={`rounded-2xl border-2 p-5 shadow-sm ${
                lastResult.valido
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-rose-300 bg-rose-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {lastResult.valido ? (
                  <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-rose-600" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-2xl font-extrabold ${
                      lastResult.valido ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {lastResult.valido ? '✓ VÁLIDO' : `✗ ${lastResult.resultado}`}
                  </p>
                  {lastResult.mensaje && (
                    <p className={`mt-1 text-sm ${lastResult.valido ? 'text-emerald-900' : 'text-rose-900'}`}>
                      {lastResult.mensaje}
                    </p>
                  )}
                  {lastResult.valido && (
                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
                      {lastResult.recursoNombre && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-foreground">
                          <Info className="h-4 w-4 text-emerald-600" />
                          {lastResult.recursoNombre}
                        </span>
                      )}
                      {lastResult.adultosUsados > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-foreground">
                          <Users className="h-4 w-4 text-emerald-600" />
                          {lastResult.adultosUsados} adulto{lastResult.adultosUsados !== 1 ? 's' : ''}
                          {lastResult.menoresUsados > 0
                            ? ` + ${lastResult.menoresUsados} menor${lastResult.menoresUsados !== 1 ? 'es' : ''}`
                            : ''}
                        </span>
                      )}
                      {lastResult.descuentoPorcentaje != null && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-white">
                          -{lastResult.descuentoPorcentaje}% Club
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {historial.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-foreground">Últimas validaciones</h3>
              <ul className="space-y-2">
                {historial.map((h) => (
                  <li
                    key={h.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
                  >
                    {h.ok ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{h.recursoNombre}</p>
                      <p className="truncate text-xs text-muted-foreground">{h.mensaje || h.resultado}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(h.ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecursoCard({ r, onSelect }: { r: Recurso; onSelect: () => void }) {
  const isNatural = esRecursoNatural(r);
  const isNegocio = esNegocio(r);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!r.activo || r.cerradoTemporal || isNatural}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          isNegocio
            ? 'bg-amber-100 text-amber-700'
            : isNatural
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
        }`}
      >
        {isNegocio ? (
          <Building2 className="h-5 w-5" />
        ) : isNatural ? (
          <MapPin className="h-5 w-5" />
        ) : (
          <QrCode className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground">{r.nombre}</p>
        <p className="text-xs text-muted-foreground">
          {r.tipo}
          {r.pueblo?.nombre ? ` · ${r.pueblo.nombre}` : ''}
          {r.planNegocio && isNegocio ? ` · ${r.planNegocio}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          {!r.activo && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">Inactivo</span>
          )}
          {r.cerradoTemporal && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">Cerrado temporal</span>
          )}
          {isNatural && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">GPS · sin QR</span>
          )}
          {r.descuentoPorcentaje ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
              -{r.descuentoPorcentaje}%
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function Stepper({
  label,
  icon,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-base font-bold disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[2ch] text-center text-xl font-bold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-base font-bold disabled:opacity-40"
        >
          +
        </button>
        <span className="ml-auto text-[11px] text-muted-foreground">máx {max}</span>
      </div>
    </div>
  );
}
