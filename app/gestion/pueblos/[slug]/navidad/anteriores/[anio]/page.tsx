'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../../_components/GestionPuebloSubpageShell';
import { HeroIconTree } from '../../../../_components/gestion-pueblo-hero-icons';
import { CAMPANA_NAVIDAD } from '../../../../../_components/gestion-campana-themes';

const TIPO_LABELS: Record<string, string> = {
  ENCENDIDO_LUCES: 'Encendido de luces',
  MERCADILLO: 'Mercadillo navideño',
  BELEN: 'Belén',
  BELEN_VIVIENTE: 'Belén viviente',
  CONCIERTO: 'Concierto / Villancicos',
  TALLER_INFANTIL: 'Taller infantil',
  ESPECTACULO: 'Espectáculo',
  ZAMBOMBA: 'Zambomba',
  NOCHEVIEJA: 'Nochevieja / Fin de año',
  CABALGATA_REYES: 'Cabalgata de Reyes',
  CABALGATA_PAPA_NOEL: 'Cabalgata de Papá Noel',
  GASTRONOMIA: 'Gastronomía',
  RUTA_TURISTICA: 'Ruta turística',
  OTRO: 'Otro',
};

interface Evento {
  id: number;
  tipo: string;
  publicoObjetivo: string;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  fotoUrl: string | null;
  esFiestaInteresTuristico: boolean;
}

interface Participante {
  id: number;
  anio: number;
  titulo: string | null;
  descripcion: string | null;
  cartelUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: { id: number; nombre: string; slug: string };
  eventos: Evento[];
}

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' })} · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Madrid' })}`;
};

export default function GestionPuebloNavidadAnoAnteriorPage() {
  const router = useRouter();
  const { slug, anio: anioParam } = useParams<{ slug: string; anio: string }>();
  const anioNum = Number(anioParam);

  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [activeAnio, setActiveAnio] = useState<number | null>(null);
  const [participante, setParticipante] = useState<Participante | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [opciones, setOpciones] = useState({
    infoGeneral: true,
    cartel: true,
    streamYVideos: false,
    eventos: false,
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
        `/api/admin/navidad/pueblos/by-pueblo/${puebloId}/ediciones/${anioNum}`,
        { credentials: 'include', cache: 'no-store' },
      );
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (!res.ok) throw new Error('No se pudo cargar la edición');
      const json = await res.json();
      setActiveAnio(json.activeAnio ?? null);
      setParticipante(json.participante ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId, anioNum]);

  useEffect(() => { if (puebloId) load(); }, [puebloId, load]);

  const algoSeleccionado =
    opciones.infoGeneral || opciones.cartel || opciones.streamYVideos || opciones.eventos;

  const importar = async () => {
    if (!puebloId || !algoSeleccionado) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/navidad/pueblos/by-pueblo/${puebloId}/importar-desde/${anioNum}`,
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
      if (body?.importado?.streamYVideos) partes.push('stream y vídeos');
      if (body?.importado?.eventos > 0) partes.push(`${body.importado.eventos} eventos`);
      const resumen = partes.length > 0 ? partes.join(', ') : 'Sin cambios';
      setImportResult(`Importado a la edición ${body?.anioDestino ?? activeAnio}: ${resumen}.`);
      setShowImportModal(false);
      setTimeout(() => {
        router.push(`/gestion/pueblos/${slug}/navidad`);
      }, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setImporting(false);
    }
  };

  const accion =
    activeAnio && activeAnio !== anioNum ? (
      <button
        type="button"
        onClick={() => setShowImportModal(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-md transition hover:bg-emerald-50"
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
          Navidad · <span className="font-semibold text-white/95">archivo histórico</span>
        </>
      }
      heroIcon={<HeroIconTree />}
      heroAction={accion}
      maxWidthClass="max-w-5xl"
      theme="navidad"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/gestion/pueblos/${slug}/navidad/anteriores`}
          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Otras ediciones anteriores
        </Link>
        <Link
          href={`/gestion/pueblos/${slug}/navidad`}
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
        pueblo publicó en Navidad de {anioNum}. No se puede modificar. Si quieres reutilizar partes en
        {' '}{activeAnio ?? 'la edición actual'}, usa el botón{' '}
        <span className="font-semibold">«Importar a edición {activeAnio ?? 'actual'}»</span>.
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando edición {anioNum}…</p>
      ) : !participante ? (
        <p className="text-sm text-muted-foreground">No hay datos para esta edición.</p>
      ) : (
        <div className="space-y-6">
          {/* INFO GENERAL */}
          <section className={`rounded-xl border p-5 shadow-sm ${CAMPANA_NAVIDAD.sectionAccent}`}>
            <h2 className="mb-3 text-lg font-semibold text-emerald-900">Información general</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-emerald-800/70">Título</dt>
                <dd className="mt-1 text-emerald-950">{participante.titulo || <em className="text-muted-foreground">— sin título —</em>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-emerald-800/70">Descripción general</dt>
                <dd className="mt-1 whitespace-pre-line text-emerald-950">{participante.descripcion || <em className="text-muted-foreground">— sin descripción —</em>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-emerald-800/70">Interés turístico</dt>
                <dd className="mt-1 text-emerald-950">{participante.interesTuristico}</dd>
              </div>
              {participante.cartelUrl && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-emerald-800/70">Cartel anunciador</dt>
                  <dd className="mt-2">
                    <img src={participante.cartelUrl} alt={`Cartel ${anioNum}`} className="max-h-64 rounded-lg border border-emerald-100 object-contain" />
                  </dd>
                </div>
              )}
              {(participante.streamUrl || participante.videoUrl) && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-emerald-800/70">Stream / Vídeo</dt>
                  <dd className="mt-1 space-y-1 text-emerald-950">
                    {participante.streamUrl && (
                      <p className="break-all text-xs">📡 <a href={participante.streamUrl} target="_blank" rel="noopener noreferrer" className="underline">{participante.streamUrl}</a></p>
                    )}
                    {participante.videoUrl && (
                      <p className="break-all text-xs">🎬 <a href={participante.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">{participante.videoUrl}</a></p>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* EVENTOS */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-3 text-lg font-semibold">
              Eventos de Navidad
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({participante.eventos.length})
              </span>
            </h2>
            {participante.eventos.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No hubo eventos en esta edición.</p>
            ) : (
              <div className="space-y-2">
                {participante.eventos.map((e) => (
                  <div key={e.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      {e.fotoUrl && (
                        <img src={e.fotoUrl} alt="" className="h-16 w-16 rounded object-cover" loading="lazy" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{e.titulo}</h3>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            {TIPO_LABELS[e.tipo] ?? e.tipo}
                          </span>
                          {e.esFiestaInteresTuristico && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              Interés turístico
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatFecha(e.fechaInicio)}</p>
                        {e.ubicacion && <p className="text-xs text-muted-foreground">📍 {e.ubicacion}</p>}
                        {e.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{e.descripcion}</p>}
                      </div>
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
            <div className="border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-amber-50/60 to-red-50/40 px-6 py-5">
              <h2 className="text-lg font-semibold text-emerald-950">
                Importar {anioNum} → {activeAnio}
              </h2>
              <p className="mt-1 text-sm text-emerald-900/80">
                Marca qué partes de la edición de {anioNum} quieres copiar a la edición actual de
                {' '}{activeAnio}. <strong>Después podrás editar todo</strong> normalmente. Si no
                quieres algo, lo desmarcas y no se tocará.
              </p>
              <p className="mt-2 rounded-md bg-amber-100/60 p-2 text-xs text-amber-900">
                <strong>Aviso:</strong> Las fechas de los eventos se trasladan automáticamente al año
                {' '}{activeAnio} (mismo mes y día), pero <strong>tendrás que repasarlas y ajustarlas</strong>{' '}
                porque las fiestas pueden caer en otro día de la semana.
              </p>
            </div>

            <div className="px-6 py-5">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
                  <input type="checkbox" id="opt-info" className="mt-1 h-4 w-4 rounded border-emerald-300"
                    checked={opciones.infoGeneral}
                    onChange={(e) => setOpciones({ ...opciones, infoGeneral: e.target.checked })} />
                  <label htmlFor="opt-info" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Información general</div>
                    <div className="text-xs text-muted-foreground">
                      Sobreescribe el <strong>título</strong>, la <strong>descripción</strong> y el
                      <strong> interés turístico</strong> de la edición {activeAnio} con los de {anioNum}.
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
                  <input type="checkbox" id="opt-cartel" className="mt-1 h-4 w-4 rounded border-emerald-300"
                    checked={opciones.cartel}
                    onChange={(e) => setOpciones({ ...opciones, cartel: e.target.checked })}
                    disabled={!participante.cartelUrl} />
                  <label htmlFor="opt-cartel" className={`flex-1 cursor-pointer ${!participante.cartelUrl ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">Cartel anunciador</div>
                    <div className="text-xs text-muted-foreground">
                      {participante.cartelUrl
                        ? <>Sobreescribe el cartel de {activeAnio} con el de {anioNum}. Cámbialo cuando tengas el cartel nuevo del año.</>
                        : <>La edición {anioNum} no tenía cartel.</>}
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
                  <input type="checkbox" id="opt-stream" className="mt-1 h-4 w-4 rounded border-emerald-300"
                    checked={opciones.streamYVideos}
                    onChange={(e) => setOpciones({ ...opciones, streamYVideos: e.target.checked })}
                    disabled={!participante.streamUrl && !participante.videoUrl} />
                  <label htmlFor="opt-stream" className={`flex-1 cursor-pointer ${(!participante.streamUrl && !participante.videoUrl) ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">Stream y vídeos</div>
                    <div className="text-xs text-muted-foreground">
                      {(participante.streamUrl || participante.videoUrl)
                        ? <>Sobreescribe los enlaces de stream en directo y vídeo. Recomendado solo si vais a usar los mismos.</>
                        : <>La edición {anioNum} no tenía stream ni vídeo.</>}
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3">
                  <input type="checkbox" id="opt-eventos" className="mt-1 h-4 w-4 rounded border-emerald-300"
                    checked={opciones.eventos}
                    onChange={(e) => setOpciones({ ...opciones, eventos: e.target.checked })}
                    disabled={participante.eventos.length === 0} />
                  <label htmlFor="opt-eventos" className={`flex-1 cursor-pointer ${participante.eventos.length === 0 ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">
                      Eventos{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({participante.eventos.length})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Añade copias de los {participante.eventos.length} evento{participante.eventos.length === 1 ? '' : 's'} (encendido, mercadillo, belén, cabalgata…)
                      a la edición {activeAnio}. <strong>No borra</strong> los que ya tengas. Las fechas se trasladan
                      al año {activeAnio}; <strong>repasa cada evento</strong> tras importar.
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

            <div className="flex items-center justify-end gap-2 border-t border-emerald-100 bg-emerald-50/30 px-6 py-4">
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
                className={CAMPANA_NAVIDAD.primaryButton}
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
