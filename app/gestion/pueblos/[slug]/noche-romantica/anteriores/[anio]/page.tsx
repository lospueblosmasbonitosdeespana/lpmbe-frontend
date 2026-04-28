'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../../_components/GestionPuebloSubpageShell';
import { HeroIconHeart } from '../../../../_components/gestion-pueblo-hero-icons';
import { CAMPANA_NOCHE_ROMANTICA } from '../../../../../_components/gestion-campana-themes';

interface Actividad {
  id: number;
  titulo: string;
  descripcion: string | null;
  horario: string | null;
  fotoUrl: string | null;
  direccion: string | null;
}

interface Negocio {
  id: number;
  tipo: 'HOTEL' | 'RESTAURANTE' | 'COMERCIO' | 'OTRO';
  nombre: string;
  descripcion: string | null;
  horario: string | null;
  fotoUrl: string | null;
  menuUrl: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
}

interface Participante {
  id: number;
  anio: number;
  cartelUrl: string | null;
  titulo: string | null;
  descripcion: string | null;
  pueblo: { id: number; nombre: string; slug: string };
  actividades: Actividad[];
  negocios: Negocio[];
}

const NEGOCIO_LABEL: Record<string, string> = {
  HOTEL: 'Hoteles y Alojamientos',
  RESTAURANTE: 'Restaurantes',
  COMERCIO: 'Comercios',
  OTRO: 'Otros',
};

function formatFechaLarga(iso: string | null | undefined): string {
  if (!iso) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Madrid',
  });
}

export default function GestionPuebloNocheRomanticaAnoAnteriorPage() {
  const router = useRouter();
  const { slug, anio: anioParam } = useParams<{ slug: string; anio: string }>();
  const anioNum = Number(anioParam);

  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [activeAnio, setActiveAnio] = useState<number | null>(null);
  const [activeFechaEvento, setActiveFechaEvento] = useState<string | null>(null);
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [opciones, setOpciones] = useState({
    infoGeneral: true,
    cartel: true,
    actividades: true,
    negocios: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pueblos/${slug}`);
        if (res.ok) {
          const p = await res.json();
          setPuebloId(p.id);
        }
      } catch { /* ignore */ }
    })();
  }, [slug]);

  const load = useCallback(async () => {
    if (!puebloId || !Number.isInteger(anioNum)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/ediciones/${anioNum}`,
        { credentials: 'include', cache: 'no-store' },
      );
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (!res.ok) throw new Error('No se pudo cargar la edición');
      const json = await res.json();
      setActiveAnio(json.activeAnio ?? null);
      setActiveFechaEvento(json.activeFechaEvento ?? null);
      setParticipante(json.participante ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId, anioNum]);

  useEffect(() => { if (puebloId) load(); }, [puebloId, load]);

  const negociosByType = useMemo(() => {
    return (participante?.negocios ?? []).reduce(
      (acc, n) => {
        if (!acc[n.tipo]) acc[n.tipo] = [];
        acc[n.tipo].push(n);
        return acc;
      },
      {} as Record<string, Negocio[]>,
    );
  }, [participante?.negocios]);

  const algoSeleccionado =
    opciones.infoGeneral || opciones.cartel || opciones.actividades || opciones.negocios;

  const importar = async () => {
    if (!puebloId || !algoSeleccionado) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/importar-desde/${anioNum}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(opciones),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo importar');
      }
      const body = await res.json();
      const partes: string[] = [];
      if (body?.importado?.infoGeneral) partes.push('título y descripción');
      if (body?.importado?.cartel) partes.push('cartel');
      if (body?.importado?.actividades > 0) partes.push(`${body.importado.actividades} actividades`);
      if (body?.importado?.negocios > 0) partes.push(`${body.importado.negocios} negocios`);
      const resumen = partes.length > 0 ? partes.join(', ') : 'Sin cambios';
      setImportResult(`Importado a la edición ${body?.anioDestino ?? activeAnio}: ${resumen}.`);
      setShowImportModal(false);
      setTimeout(() => {
        router.push(`/gestion/pueblos/${slug}/noche-romantica`);
      }, 1500);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setImporting(false);
    }
  };

  const accion =
    activeAnio && activeAnio !== anioNum ? (
      <button
        type="button"
        onClick={() => setShowImportModal(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white px-4 py-2 text-sm font-semibold text-pink-900 shadow-md transition hover:bg-pink-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        Importar a edición {activeAnio}
      </button>
    ) : null;

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title={`Edición ${anioNum}`}
      subtitle={
        <>
          La Noche Romántica · <span className="font-semibold text-white/95">archivo histórico</span>
        </>
      }
      heroIcon={<HeroIconHeart />}
      heroAction={accion}
      theme="nocheRomantica"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/gestion/pueblos/${slug}/noche-romantica/anteriores`}
          className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50/40 px-3 py-2 text-sm font-medium text-pink-900 transition hover:bg-pink-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Otras ediciones anteriores
        </Link>
        <Link
          href={`/gestion/pueblos/${slug}/noche-romantica`}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        >
          Edición actual
          {activeAnio ? <span className="text-xs"> ({activeAnio})</span> : null}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {importResult && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {importResult} Volviendo a la edición actual…
        </div>
      )}

      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4 text-sm text-amber-900">
        <strong className="font-semibold">Vista de archivo (sólo lectura).</strong> Esto es lo que tu
        pueblo publicó en La Noche Romántica de {anioNum}. No se puede modificar. Si quieres
        reutilizar partes en {activeAnio ?? 'la edición actual'}, usa el botón{' '}
        <span className="font-semibold">«Importar a edición {activeAnio ?? 'actual'}»</span>.
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando edición {anioNum}…</p>
      ) : !participante ? (
        <p className="text-sm text-muted-foreground">No hay datos para esta edición.</p>
      ) : (
        <div className="space-y-6">
          {/* INFO GENERAL */}
          <section className={`rounded-xl border p-5 shadow-sm ${CAMPANA_NOCHE_ROMANTICA.sectionAccent}`}>
            <h2 className="mb-3 text-lg font-semibold text-pink-950">Información general</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-pink-900/70">Título del evento</dt>
                <dd className="mt-1 text-pink-950">{participante.titulo || <em className="text-muted-foreground">— sin título —</em>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-pink-900/70">Descripción general</dt>
                <dd className="mt-1 whitespace-pre-line text-pink-950">{participante.descripcion || <em className="text-muted-foreground">— sin descripción —</em>}</dd>
              </div>
              {participante.cartelUrl && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-pink-900/70">Cartel anunciador</dt>
                  <dd className="mt-2">
                    <img
                      src={participante.cartelUrl}
                      alt={`Cartel ${anioNum}`}
                      className="max-h-64 rounded-lg border border-pink-100 object-contain"
                    />
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* ACTIVIDADES */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-3 text-lg font-semibold">
              Actividades / Programa
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({participante.actividades.length})
              </span>
            </h2>
            {participante.actividades.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No hubo actividades en esta edición.</p>
            ) : (
              <div className="space-y-2">
                {participante.actividades.map((a) => (
                  <div key={a.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      {a.fotoUrl && (
                        <img src={a.fotoUrl} alt="" className="h-16 w-16 rounded object-cover" loading="lazy" />
                      )}
                      <div>
                        <h3 className="font-medium">{a.titulo}</h3>
                        {a.horario && <p className="text-sm text-pink-700">{a.horario}</p>}
                        {a.direccion && <p className="text-xs text-muted-foreground">📍 {a.direccion}</p>}
                        {a.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{a.descripcion}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* NEGOCIOS */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-3 text-lg font-semibold">
              Negocios participantes
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({participante.negocios.length})
              </span>
            </h2>
            {participante.negocios.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No hubo negocios participantes en esta edición.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(negociosByType).map(([tipo, negocios]) => (
                  <div key={tipo}>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {NEGOCIO_LABEL[tipo] ?? tipo}
                    </h3>
                    <div className="space-y-2">
                      {negocios.map((n) => (
                        <div key={n.id} className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            {n.fotoUrl && (
                              <img src={n.fotoUrl} alt="" className="h-16 w-16 rounded object-cover" loading="lazy" />
                            )}
                            <div className="min-w-0">
                              <h4 className="font-medium">{n.nombre}</h4>
                              {n.horario && <p className="text-sm text-pink-700">{n.horario}</p>}
                              {n.direccion && <p className="text-xs text-muted-foreground">📍 {n.direccion}</p>}
                              {(n.telefono || n.email) && (
                                <p className="text-xs text-muted-foreground">
                                  {n.telefono && <>📞 {n.telefono}</>}
                                  {n.telefono && n.email && <> · </>}
                                  {n.email && <>✉️ {n.email}</>}
                                </p>
                              )}
                              {n.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{n.descripcion}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================== MODAL DE IMPORTACIÓN ==================== */}
      {showImportModal && participante && activeAnio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-pink-100 bg-gradient-to-br from-pink-50 to-fuchsia-50 px-6 py-5">
              <h2 className="text-lg font-semibold text-pink-950">
                Importar {anioNum} → {activeAnio}
              </h2>
              <p className="mt-1 text-sm text-pink-900/80">
                Marca qué partes de la edición de {anioNum} quieres copiar a la edición actual de{' '}
                {activeAnio}. <strong>Después podrás editar todo</strong> normalmente. Si no quieres
                algo, lo desmarcas y no se tocará.
              </p>
              <p className="mt-2 rounded-md bg-amber-100/60 p-2 text-xs text-amber-900">
                <strong>Aviso:</strong> La Noche Romántica se celebra cada año en el sábado más
                cercano al solsticio de verano, así que la fecha cambia.
                {activeFechaEvento && (
                  <> En {activeAnio} cae el <strong>{formatFechaLarga(activeFechaEvento)}</strong>.</>
                )}{' '}
                Si importas actividades, <strong>repasa los horarios y los textos</strong> por si
                había referencias a la fecha del año {anioNum}.
              </p>
            </div>

            <div className="px-6 py-5">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 rounded-lg border border-pink-100 bg-pink-50/30 p-3">
                  <input
                    type="checkbox"
                    id="opt-info"
                    className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-700"
                    checked={opciones.infoGeneral}
                    onChange={(e) => setOpciones({ ...opciones, infoGeneral: e.target.checked })}
                  />
                  <label htmlFor="opt-info" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Información general</div>
                    <div className="text-xs text-muted-foreground">
                      Sobreescribe el <strong>título</strong> y la <strong>descripción general</strong>
                      {' '}de la edición {activeAnio} con los de {anioNum}. Si la edición {activeAnio} ya
                      tenía algo, se reemplaza.
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-pink-100 bg-pink-50/30 p-3">
                  <input
                    type="checkbox"
                    id="opt-cartel"
                    className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-700"
                    checked={opciones.cartel}
                    onChange={(e) => setOpciones({ ...opciones, cartel: e.target.checked })}
                    disabled={!participante.cartelUrl}
                  />
                  <label htmlFor="opt-cartel" className={`flex-1 cursor-pointer ${!participante.cartelUrl ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">Cartel anunciador</div>
                    <div className="text-xs text-muted-foreground">
                      {participante.cartelUrl
                        ? <>Sobreescribe el cartel de {activeAnio} con el de {anioNum}. Recuerda actualizarlo cuando tengas el cartel nuevo del año.</>
                        : <>La edición {anioNum} no tenía cartel.</>}
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-pink-100 bg-pink-50/30 p-3">
                  <input
                    type="checkbox"
                    id="opt-act"
                    className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-700"
                    checked={opciones.actividades}
                    onChange={(e) => setOpciones({ ...opciones, actividades: e.target.checked })}
                    disabled={participante.actividades.length === 0}
                  />
                  <label htmlFor="opt-act" className={`flex-1 cursor-pointer ${participante.actividades.length === 0 ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">
                      Actividades / Programa{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({participante.actividades.length})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Añade copias de las {participante.actividades.length} actividad{participante.actividades.length === 1 ? '' : 'es'} de {anioNum}
                      a la edición {activeAnio}. <strong>No borra</strong> las que ya tengas en {activeAnio}.
                      Después podrás editar horarios, fotos, direcciones, etc.
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-pink-100 bg-pink-50/30 p-3">
                  <input
                    type="checkbox"
                    id="opt-neg"
                    className="mt-1 h-4 w-4 rounded border-pink-300 text-pink-700"
                    checked={opciones.negocios}
                    onChange={(e) => setOpciones({ ...opciones, negocios: e.target.checked })}
                    disabled={participante.negocios.length === 0}
                  />
                  <label htmlFor="opt-neg" className={`flex-1 cursor-pointer ${participante.negocios.length === 0 ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">
                      Negocios participantes{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({participante.negocios.length})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Añade copias de los {participante.negocios.length} negocio{participante.negocios.length === 1 ? '' : 's'} de {anioNum}
                      (hoteles, restaurantes, comercios…) a la edición {activeAnio}. <strong>No borra</strong> los que ya tengas.
                      Recomendado solo si los mismos negocios participan otra vez; si no, mejor desmárcalo.
                    </div>
                  </label>
                </li>
              </ul>

              {!algoSeleccionado && (
                <p className="mt-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                  Selecciona al menos una opción para importar.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-pink-100 bg-pink-50/40 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={importar}
                disabled={importing || !algoSeleccionado}
                className={CAMPANA_NOCHE_ROMANTICA.primaryButton}
              >
                {importing ? 'Importando…' : `Importar a edición ${activeAnio}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </GestionPuebloSubpageShell>
  );
}
