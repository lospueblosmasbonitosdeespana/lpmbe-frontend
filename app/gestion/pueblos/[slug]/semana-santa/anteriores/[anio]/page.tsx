'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../../_components/GestionPuebloSubpageShell';
import { HeroIconCross } from '../../../../_components/gestion-pueblo-hero-icons';

interface Dia {
  id: number;
  fecha: string;
  nombreDia: string;
  titulo: string | null;
  descripcion: string | null;
  fotoUrl: string | null;
}

interface AgendaItem {
  id: number;
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
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: { id: number; nombre: string; slug: string };
  agenda: AgendaItem[];
  dias: Dia[];
}

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' })} · ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Madrid' })}`;
};

export default function GestionPuebloSemanaSantaAnoAnteriorPage() {
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
    dias: true,
    agenda: false,
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
        `/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/ediciones/${anioNum}`,
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
    opciones.infoGeneral || opciones.cartel || opciones.streamYVideos || opciones.dias || opciones.agenda;

  const importar = async () => {
    if (!puebloId || !algoSeleccionado) return;
    setImporting(true);
    setImportResult(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/importar-desde/${anioNum}`,
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
      if (body?.importado?.cartel) partes.push('carteles');
      if (body?.importado?.streamYVideos) partes.push('stream y vídeos');
      if (body?.importado?.dias > 0) partes.push(`${body.importado.dias} días`);
      if (body?.importado?.agenda > 0) partes.push(`${body.importado.agenda} actos`);
      const resumen = partes.length > 0 ? partes.join(', ') : 'Sin cambios';
      setImportResult(`Importado a la edición ${body?.anioDestino ?? activeAnio}: ${resumen}.`);
      setShowImportModal(false);
      setTimeout(() => {
        router.push(`/gestion/pueblos/${slug}/semana-santa`);
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
        className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow-md transition hover:bg-stone-50"
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
          Semana Santa · <span className="font-semibold text-white/95">archivo histórico</span>
        </>
      }
      heroIcon={<HeroIconCross />}
      heroAction={accion}
      maxWidthClass="max-w-5xl"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/gestion/pueblos/${slug}/semana-santa/anteriores`}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Otras ediciones anteriores
        </Link>
        <Link
          href={`/gestion/pueblos/${slug}/semana-santa`}
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
        pueblo publicó en Semana Santa de {anioNum}. No se puede modificar. Si quieres reutilizar
        partes en {activeAnio ?? 'la edición actual'}, usa el botón{' '}
        <span className="font-semibold">«Importar a edición {activeAnio ?? 'actual'}»</span>.
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando edición {anioNum}…</p>
      ) : !participante ? (
        <p className="text-sm text-muted-foreground">No hay datos para esta edición.</p>
      ) : (
        <div className="space-y-6">
          {/* INFO GENERAL */}
          <section className="rounded-xl border border-stone-200 bg-stone-50/40 p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Información general</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-stone-700">Título</dt>
                <dd className="mt-1 text-stone-900">{participante.titulo || <em className="text-muted-foreground">— sin título —</em>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-stone-700">Descripción general</dt>
                <dd className="mt-1 whitespace-pre-line text-stone-900">{participante.descripcion || <em className="text-muted-foreground">— sin descripción —</em>}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-stone-700">Interés turístico</dt>
                <dd className="mt-1 text-stone-900">{participante.interesTuristico}</dd>
              </div>
              {(participante.cartelHorizontalUrl || participante.cartelVerticalUrl) && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-stone-700">Carteles</dt>
                  <dd className="mt-2 flex flex-wrap gap-3">
                    {participante.cartelHorizontalUrl && (
                      <img src={participante.cartelHorizontalUrl} alt="Cartel horizontal" className="max-h-44 rounded-lg border border-stone-200 object-contain" />
                    )}
                    {participante.cartelVerticalUrl && (
                      <img src={participante.cartelVerticalUrl} alt="Cartel vertical" className="max-h-44 rounded-lg border border-stone-200 object-contain" />
                    )}
                  </dd>
                </div>
              )}
              {(participante.streamUrl || participante.videoUrl) && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-stone-700">Stream / Vídeo</dt>
                  <dd className="mt-1 space-y-1 text-stone-900">
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

          {/* DÍAS */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-3 text-lg font-semibold">
              Días de Semana Santa
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({participante.dias.length})
              </span>
            </h2>
            {participante.dias.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No hay días configurados en esta edición.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {participante.dias.map((d) => (
                  <div key={d.id} className="rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      {d.fotoUrl && (
                        <img src={d.fotoUrl} alt="" className="h-14 w-14 rounded object-cover" loading="lazy" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-medium">{d.nombreDia}</h3>
                        <p className="text-xs text-muted-foreground">{d.fecha}</p>
                        {d.titulo && <p className="text-sm">{d.titulo}</p>}
                        {d.descripcion && <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{d.descripcion}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* AGENDA */}
          <section className="rounded-lg border p-5">
            <h2 className="mb-3 text-lg font-semibold">
              Agenda de actos
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({participante.agenda.length})
              </span>
            </h2>
            {participante.agenda.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">No hubo actos en agenda en esta edición.</p>
            ) : (
              <div className="space-y-2">
                {participante.agenda.map((a) => (
                  <div key={a.id} className="rounded-lg border p-4">
                    <div className="flex items-start gap-3">
                      {a.fotoUrl && (
                        <img src={a.fotoUrl} alt="" className="h-16 w-16 rounded object-cover" loading="lazy" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{a.titulo}</h3>
                          {a.esFiestaInteresTuristico && (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              Interés turístico
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatFecha(a.fechaInicio)}</p>
                        {a.ubicacion && <p className="text-xs text-muted-foreground">📍 {a.ubicacion}</p>}
                        {a.descripcion && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{a.descripcion}</p>}
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
            <div className="border-b border-stone-200 bg-gradient-to-br from-stone-50 to-amber-50 px-6 py-5">
              <h2 className="text-lg font-semibold text-stone-900">
                Importar {anioNum} → {activeAnio}
              </h2>
              <p className="mt-1 text-sm text-stone-700">
                Marca qué partes de la edición de {anioNum} quieres copiar a la edición actual de{' '}
                {activeAnio}. <strong>Después podrás editar todo</strong> normalmente. Si no quieres
                algo, lo desmarcas y no se tocará.
              </p>
              <p className="mt-2 rounded-md bg-amber-100/60 p-2 text-xs text-amber-900">
                <strong>Aviso:</strong> Semana Santa cambia de fechas cada año. Las fechas de los días y
                la agenda se trasladarán automáticamente al año {activeAnio} (mismo mes y día), pero
                tendrás que <strong>repasarlas y ajustarlas</strong> después.
              </p>
            </div>

            <div className="px-6 py-5">
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/40 p-3">
                  <input type="checkbox" id="opt-info" className="mt-1 h-4 w-4 rounded border-stone-300"
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

                <li className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/40 p-3">
                  <input type="checkbox" id="opt-cartel" className="mt-1 h-4 w-4 rounded border-stone-300"
                    checked={opciones.cartel}
                    onChange={(e) => setOpciones({ ...opciones, cartel: e.target.checked })}
                    disabled={!participante.cartelHorizontalUrl && !participante.cartelVerticalUrl} />
                  <label htmlFor="opt-cartel" className={`flex-1 cursor-pointer ${(!participante.cartelHorizontalUrl && !participante.cartelVerticalUrl) ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">Carteles</div>
                    <div className="text-xs text-muted-foreground">
                      {(participante.cartelHorizontalUrl || participante.cartelVerticalUrl)
                        ? <>Sobreescribe el cartel horizontal y vertical de {activeAnio} con los de {anioNum}. Cámbialos cuando tengas el cartel nuevo del año.</>
                        : <>La edición {anioNum} no tenía cartel.</>}
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/40 p-3">
                  <input type="checkbox" id="opt-stream" className="mt-1 h-4 w-4 rounded border-stone-300"
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

                <li className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/40 p-3">
                  <input type="checkbox" id="opt-dias" className="mt-1 h-4 w-4 rounded border-stone-300"
                    checked={opciones.dias}
                    onChange={(e) => setOpciones({ ...opciones, dias: e.target.checked })}
                    disabled={participante.dias.length === 0} />
                  <label htmlFor="opt-dias" className={`flex-1 cursor-pointer ${participante.dias.length === 0 ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">
                      Días{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({participante.dias.length})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Copia los días (Domingo de Ramos, Jueves Santo…) reciclando nombre, descripción y foto.
                      Las fechas se cambian automáticamente al año {activeAnio}. Tendrás que repasarlas
                      porque <strong>Semana Santa cae en fechas distintas cada año</strong>.
                    </div>
                  </label>
                </li>

                <li className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50/40 p-3">
                  <input type="checkbox" id="opt-agenda" className="mt-1 h-4 w-4 rounded border-stone-300"
                    checked={opciones.agenda}
                    onChange={(e) => setOpciones({ ...opciones, agenda: e.target.checked })}
                    disabled={participante.agenda.length === 0} />
                  <label htmlFor="opt-agenda" className={`flex-1 cursor-pointer ${participante.agenda.length === 0 ? 'opacity-50' : ''}`}>
                    <div className="font-semibold">
                      Agenda de actos{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({participante.agenda.length})
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Añade copias de los {participante.agenda.length} acto{participante.agenda.length === 1 ? '' : 's'} (procesiones, conciertos…) a la edición {activeAnio}.
                      <strong> No borra</strong> los que ya tengas. Las fechas y horas se trasladan al año {activeAnio};
                      <strong> repasa cada acto</strong> tras importar. Recomendado solo si los actos se repiten año a año.
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

            <div className="flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50/50 px-6 py-4">
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
                className="rounded-lg bg-stone-800 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-stone-700 disabled:opacity-50"
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
