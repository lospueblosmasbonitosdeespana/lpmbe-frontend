'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type CampaignKind = 'NEWSLETTER' | 'PRESS' | 'AYUNTAMIENTOS';
type DraftStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED';

export interface DraftSnapshot {
  subject: string;
  contentHtml: string;
  blocksJson?: unknown;
  filters?: Record<string, unknown>;
  tags?: Array<{ name: string; value: string }>;
  attachmentUrls?: Array<{
    url: string;
    filename?: string;
    contentType?: string;
  }>;
  fromEmail?: string;
  internalName?: string;
}

export interface DraftRow {
  id: number;
  kind: CampaignKind;
  status: DraftStatus;
  internalName: string | null;
  subject: string;
  contentHtml: string | null;
  blocksJson?: unknown;
  filters?: Record<string, unknown>;
  tags?: Array<{ name: string; value: string }>;
  attachmentUrls?: Array<{ url: string; filename?: string; contentType?: string }>;
  fromEmail?: string | null;
  scheduledAt: string | null;
  lastError: string | null;
  updatedAt: string;
  createdAt: string;
  createdByUserId: number | null;
  updatedByUserId: number | null;
}

interface Props {
  kind: CampaignKind;
  getSnapshot: () => DraftSnapshot | Promise<DraftSnapshot>;
  onLoadDraft: (draft: DraftRow) => void;
  onAfterSend?: () => void;
  className?: string;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function toLocalDatetimeInput(date: Date): string {
  // "YYYY-MM-DDTHH:MM" en hora local del navegador
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const STATUS_LABEL: Record<DraftStatus, string> = {
  DRAFT: 'Borrador',
  SCHEDULED: 'Programado',
  SENDING: 'Enviando…',
  SENT: 'Enviado',
  FAILED: 'Fallido',
};

const STATUS_COLOR: Record<DraftStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-800 border-slate-200',
  SCHEDULED: 'bg-amber-100 text-amber-900 border-amber-300',
  SENDING: 'bg-blue-100 text-blue-900 border-blue-300',
  SENT: 'bg-green-100 text-green-900 border-green-300',
  FAILED: 'bg-red-100 text-red-900 border-red-300',
};

export default function DraftsAndScheduler({
  kind,
  getSnapshot,
  onLoadDraft,
  onAfterSend,
  className,
}: Props) {
  const [items, setItems] = useState<DraftRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [internalName, setInternalName] = useState<string>('');
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [bulkDeletingOld, setBulkDeletingOld] = useState(false);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const defaultScheduledLocal = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return toLocalDatetimeInput(d);
  }, []);
  const [scheduleAtLocal, setScheduleAtLocal] = useState<string>(
    defaultScheduledLocal,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        kind,
        status: 'ALL_EDITABLE',
        limit: '100',
      });
      const res = await fetch(`/api/admin/newsletter/drafts?${params}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => []);
      if (res.ok && Array.isArray(data)) {
        setItems(data as DraftRow[]);
      } else if (res.ok && Array.isArray((data as any)?.items)) {
        setItems((data as any).items as DraftRow[]);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  async function saveDraft() {
    setError(null);
    setMessage(null);
    setSaving(true);
    let snap: DraftSnapshot;
    try {
      snap = await getSnapshot();
    } catch (e: any) {
      setError(e?.message || 'No se pudo preparar el contenido');
      setSaving(false);
      return;
    }
    if (!snap.subject?.trim() && !snap.contentHtml?.trim() && !internalName.trim()) {
      setError('Pon al menos un nombre, asunto o contenido antes de guardar.');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        kind,
        internalName: internalName.trim() || snap.internalName || null,
        subject: snap.subject || '',
        contentHtml: snap.contentHtml || '',
        blocksJson: snap.blocksJson ?? [],
        filters: snap.filters ?? {},
        tags: snap.tags ?? [],
        attachmentUrls: snap.attachmentUrls ?? [],
        fromEmail: snap.fromEmail ?? null,
      };

      let res: Response;
      if (editingId) {
        res = await fetch(`/api/admin/newsletter/drafts/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/newsletter/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo guardar');
      if (!editingId && (data as any)?.id) setEditingId((data as any).id);
      setMessage(editingId ? 'Borrador actualizado' : 'Borrador creado');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error al guardar borrador');
    } finally {
      setSaving(false);
    }
  }

  async function openSchedule() {
    // Si todavía no se ha guardado, guardamos primero y luego programamos.
    setError(null);
    setMessage(null);
    setShowScheduleModal(true);
  }

  async function confirmSchedule() {
    setError(null);
    setMessage(null);
    if (!scheduleAtLocal) {
      setError('Selecciona fecha y hora.');
      return;
    }
    const localDate = new Date(scheduleAtLocal);
    if (Number.isNaN(localDate.getTime())) {
      setError('Fecha inválida.');
      return;
    }
    if (localDate.getTime() < Date.now() + 60_000) {
      setError('La hora debe ser al menos 1 minuto en el futuro.');
      return;
    }
    setScheduling(true);
    try {
      // Garantizamos que el borrador está guardado antes de programar
      let id = editingId;
      const snap = await getSnapshot();

      const payload = {
        kind,
        internalName: internalName.trim() || snap.internalName || null,
        subject: snap.subject || '',
        contentHtml: snap.contentHtml || '',
        blocksJson: snap.blocksJson ?? [],
        filters: snap.filters ?? {},
        tags: snap.tags ?? [],
        attachmentUrls: snap.attachmentUrls ?? [],
        fromEmail: snap.fromEmail ?? null,
      };

      if (!id) {
        if (!snap.subject?.trim() || !snap.contentHtml?.trim()) {
          throw new Error(
            'Para programar el envío necesitas un asunto y contenido.',
          );
        }
        const res = await fetch(`/api/admin/newsletter/drafts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'No se pudo guardar');
        id = (data as any)?.id ?? null;
        if (id) setEditingId(id);
      } else {
        // actualizamos con el último estado antes de programar
        const res = await fetch(`/api/admin/newsletter/drafts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'No se pudo guardar');
      }

      if (!id) throw new Error('No se pudo crear el borrador.');

      const scheduleRes = await fetch(
        `/api/admin/newsletter/drafts/${id}/schedule`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledAt: localDate.toISOString() }),
        },
      );
      const scheduleData = await scheduleRes.json().catch(() => ({}));
      if (!scheduleRes.ok) {
        throw new Error(scheduleData?.message || 'No se pudo programar');
      }

      setMessage(
        `Envío programado para ${formatDate(localDate.toISOString())}.`,
      );
      setShowScheduleModal(false);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error al programar');
    } finally {
      setScheduling(false);
    }
  }

  async function doAction(
    id: number,
    action: 'unschedule' | 'duplicate' | 'send-now',
  ) {
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/drafts/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo ejecutar');
      if (action === 'unschedule') setMessage('Programación cancelada.');
      if (action === 'duplicate') setMessage('Borrador duplicado.');
      if (action === 'send-now') {
        setMessage(
          `Enviado · destinatarios ${(data as any)?.totalRecipients ?? 0} · ok ${(data as any)?.sentCount ?? 0}`,
        );
        if (editingId === id) setEditingId(null);
        onAfterSend?.();
      }
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error');
    }
  }

  async function deleteDraft(id: number) {
    if (!window.confirm('¿Eliminar este borrador? No se podrá recuperar.'))
      return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/newsletter/drafts/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar');
      if (editingId === id) {
        setEditingId(null);
        setInternalName('');
      }
      setMessage('Borrador eliminado.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Error');
    }
  }

  function loadIntoEditor(d: DraftRow) {
    setEditingId(d.id);
    setInternalName(d.internalName || '');
    setMessage(`Borrador «${d.internalName || d.subject || `#${d.id}`}» cargado en el editor.`);
    onLoadDraft(d);
  }

  function resetToNew() {
    if (editingId) {
      const confirmed = window.confirm(
        '¿Descartar la referencia al borrador actual y empezar una nueva comunicación?',
      );
      if (!confirmed) return;
    }
    setEditingId(null);
    setInternalName('');
    setMessage('Editor reiniciado. Los siguientes «Guardar» crearán un borrador nuevo.');
  }

  // Reordenamos cliente-side para mantener la lista ordenada y limpia:
  //  · SCHEDULED arriba (por fecha de envío programado, próximos primero)
  //  · DRAFT después, sólo los 2 más recientes por defecto (newest first)
  //  · FAILED al final (newest first)
  // Los borradores antiguos siguen disponibles con "Ver borradores antiguos".
  const groups = useMemo(() => {
    const scheduled = items
      .filter((d) => d.status === 'SCHEDULED')
      .sort(
        (a, b) =>
          new Date(a.scheduledAt || a.updatedAt).getTime() -
          new Date(b.scheduledAt || b.updatedAt).getTime(),
      );
    const drafts = items
      .filter((d) => d.status === 'DRAFT' || d.status === 'SENDING')
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    const failed = items
      .filter((d) => d.status === 'FAILED')
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    return { scheduled, drafts, failed };
  }, [items]);

  const visibleDrafts = showAllDrafts ? groups.drafts : groups.drafts.slice(0, 2);
  const hiddenOldDrafts = groups.drafts.slice(2);
  const displayItems = [...groups.scheduled, ...visibleDrafts, ...groups.failed];

  async function bulkDeleteOldDrafts() {
    if (hiddenOldDrafts.length === 0) return;
    if (
      !window.confirm(
        `¿Eliminar ${hiddenOldDrafts.length} borradores antiguos? Sólo se conservarán los 2 más recientes y los programados/fallidos. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }
    setBulkDeletingOld(true);
    setError(null);
    setMessage(null);
    let deleted = 0;
    let errors = 0;
    for (const d of hiddenOldDrafts) {
      try {
        const res = await fetch(`/api/admin/newsletter/drafts/${d.id}`, {
          method: 'DELETE',
        });
        if (res.ok) deleted += 1;
        else errors += 1;
      } catch {
        errors += 1;
      }
    }
    setBulkDeletingOld(false);
    setMessage(
      `Limpieza completada: ${deleted} borradores eliminados${errors ? `, ${errors} errores` : ''}.`,
    );
    if (editingId && hiddenOldDrafts.some((d) => d.id === editingId)) {
      setEditingId(null);
      setInternalName('');
    }
    await load();
  }

  return (
    <section
      className={[
        'rounded-xl border border-amber-200 bg-amber-50/40 p-5',
        className || '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-amber-900">
            Borradores y programados
          </h2>
          <p className="mt-1 text-xs text-amber-900/80">
            Guarda borradores compartidos con otros admins o programa el envío
            para una hora concreta. Un cron se encarga de enviar a la hora exacta.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium"
          >
            {loading ? '…' : 'Refrescar'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetToNew}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium"
            >
              Nuevo (descartar edición)
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[2fr_auto_auto_auto] md:items-end">
          <div>
            <label className="text-xs font-semibold text-amber-900">
              Nombre interno del borrador (opcional)
            </label>
            <input
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              placeholder="p. ej. Circular marzo 2026"
              className="mt-1 w-full rounded-md border border-amber-200 bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-amber-900/70">
              {editingId
                ? `Editando borrador #${editingId}. «Guardar» actualizará este borrador.`
                : 'Se creará un borrador nuevo con el contenido actual del editor.'}
            </p>
          </div>
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className="h-fit rounded-lg border border-amber-400 bg-white px-3 py-2 text-xs font-semibold text-amber-900 disabled:opacity-50"
          >
            {saving
              ? 'Guardando…'
              : editingId
                ? 'Actualizar borrador'
                : 'Guardar borrador'}
          </button>
          <button
            type="button"
            onClick={openSchedule}
            className="h-fit rounded-lg border border-amber-400 bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-200"
          >
            Programar envío
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-amber-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-amber-200 bg-amber-50 text-xs uppercase text-amber-900">
              <th className="px-3 py-2 text-left">Nombre / Asunto</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Envío</th>
              <th className="px-3 py-2 text-left">Actualizado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  {loading
                    ? 'Cargando…'
                    : 'Aún no hay borradores ni envíos programados para esta sección.'}
                </td>
              </tr>
            ) : (
              displayItems.map((d) => {
                const isEditing = editingId === d.id;
                return (
                  <tr
                    key={d.id}
                    className={[
                      'border-b border-amber-100 align-top',
                      isEditing ? 'bg-amber-50/70' : '',
                    ].join(' ')}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">
                        {d.internalName || d.subject || `(sin nombre) #${d.id}`}
                      </div>
                      {d.internalName && d.subject ? (
                        <div className="text-xs text-muted-foreground">
                          Asunto: {d.subject}
                        </div>
                      ) : null}
                      {d.lastError ? (
                        <div className="mt-1 text-[11px] text-red-700">
                          Error: {d.lastError}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={[
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          STATUS_COLOR[d.status] || STATUS_COLOR.DRAFT,
                        ].join(' ')}
                      >
                        {STATUS_LABEL[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {d.status === 'SCHEDULED' ? (
                        <div>
                          <div className="font-medium text-amber-900">
                            {formatDate(d.scheduledAt)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            Se enviará automáticamente
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {formatDate(d.updatedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => loadIntoEditor(d)}
                          className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium"
                        >
                          Cargar
                        </button>
                        <button
                          type="button"
                          onClick={() => doAction(d.id, 'duplicate')}
                          className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px]"
                        >
                          Duplicar
                        </button>
                        {d.status === 'SCHEDULED' ? (
                          <button
                            type="button"
                            onClick={() => doAction(d.id, 'unschedule')}
                            className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px]"
                          >
                            Cancelar programación
                          </button>
                        ) : null}
                        {d.status === 'DRAFT' || d.status === 'FAILED' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  '¿Enviar este borrador AHORA mismo a todos los destinatarios según sus filtros?',
                                )
                              )
                                return;
                              doAction(d.id, 'send-now');
                            }}
                            className="rounded border border-green-400 bg-green-50 px-2 py-1 text-[11px] font-medium text-green-800"
                          >
                            Enviar ahora
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => deleteDraft(d.id)}
                          className="rounded border border-red-300 bg-white px-2 py-1 text-[11px] text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {hiddenOldDrafts.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2 text-xs">
          <span className="text-amber-900">
            {showAllDrafts
              ? `Mostrando los ${groups.drafts.length} borradores. Sólo los 2 más recientes son los que necesitas habitualmente.`
              : `Hay ${hiddenOldDrafts.length} borradores antiguos ocultos. Sólo se muestran los 2 más recientes.`}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAllDrafts((v) => !v)}
              className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-50"
            >
              {showAllDrafts ? 'Ocultar antiguos' : `Ver ${hiddenOldDrafts.length} antiguos`}
            </button>
            <button
              type="button"
              onClick={bulkDeleteOldDrafts}
              disabled={bulkDeletingOld}
              className="rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              title="Borrar de golpe los borradores antiguos (mantiene los 2 más recientes y los programados/fallidos)"
            >
              {bulkDeletingOld
                ? 'Limpiando…'
                : `Limpiar ${hiddenOldDrafts.length} antiguos`}
            </button>
          </div>
        </div>
      ) : null}

      {showScheduleModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (!scheduling ? setShowScheduleModal(false) : undefined)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold">Programar envío</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Guardaremos el borrador actual y lo enviaremos automáticamente en
              la fecha y hora que indiques. Hora local del navegador.
            </p>
            <label className="mt-4 block text-xs font-semibold">
              Fecha y hora de envío
            </label>
            <input
              type="datetime-local"
              value={scheduleAtLocal}
              onChange={(e) => setScheduleAtLocal(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mínimo 1 minuto en el futuro. Se procesa cada minuto.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                disabled={scheduling}
                className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmSchedule}
                disabled={scheduling}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {scheduling ? 'Programando…' : 'Programar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
