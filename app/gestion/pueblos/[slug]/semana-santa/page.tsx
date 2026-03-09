'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import R2ImageUploader from '@/app/components/R2ImageUploader';

type DiaConfig = { fecha: string; nombreDia: string; orden: number };
type PuebloDia = {
  id?: number;
  fecha: string;
  nombreDia: string;
  titulo?: string | null;
  descripcion?: string | null;
  fotoUrl?: string | null;
  orden: number;
};
type AgendaItem = {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  fotoUrl: string | null;
  orden: number;
};
type Participante = {
  id: number;
  puebloId: number;
  titulo: string | null;
  descripcion: string | null;
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  streamUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  activo: boolean;
  pueblo: { id: number; nombre: string; slug: string };
  agenda: AgendaItem[];
  dias: PuebloDia[];
};

export default function GestionPuebloSemanaSantaPage() {
  const { slug } = useParams<{ slug: string }>();
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [configDias, setConfigDias] = useState<DiaConfig[]>([]);
  const [data, setData] = useState<Participante | null>(null);
  const [notInscribed, setNotInscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewAgenda, setShowNewAgenda] = useState(false);
  const [newAgenda, setNewAgenda] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    fechaInicio: '',
    fechaFin: '',
    fotoUrl: '',
  });

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/pueblos/${slug}`);
      if (!res.ok) return;
      const p = await res.json();
      setPuebloId(p.id);
    })();
  }, [slug]);

  const loadData = useCallback(async () => {
    if (!puebloId) return;
    setLoading(true);
    setError(null);
    setNotInscribed(false);
    try {
      const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}`);
      if (res.status === 404) {
        setNotInscribed(true);
        return;
      }
      if (!res.ok) throw new Error('Error cargando datos');
      const json = await res.json();
      setData(json.participante);
      setConfigDias(json.config?.dias ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => {
    if (puebloId) loadData();
  }, [puebloId, loadData]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const saveInfo = async () => {
    if (!puebloId || !data) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/info`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: data.titulo || null,
        descripcion: data.descripcion || null,
        cartelVerticalUrl: data.cartelVerticalUrl || null,
        cartelHorizontalUrl: data.cartelHorizontalUrl || null,
        streamUrl: data.streamUrl || null,
        interesTuristico: data.interesTuristico,
        activo: data.activo,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudo guardar la información');
      return;
    }
    await loadData();
    flash('Información guardada');
  };

  const saveDias = async () => {
    if (!puebloId || !data) return;
    setSaving(true);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/dias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dias: data.dias.map((d, idx) => ({
          fecha: d.fecha,
          nombreDia: d.nombreDia,
          titulo: d.titulo || undefined,
          descripcion: d.descripcion || undefined,
          fotoUrl: d.fotoUrl || undefined,
          orden: idx,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudieron guardar los días');
      return;
    }
    await loadData();
    flash('Días de procesiones guardados');
  };

  const createAgenda = async () => {
    if (!puebloId || !newAgenda.titulo || !newAgenda.fechaInicio) return;
    setSaving(true);
    const res = await fetch(`/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/agenda`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: newAgenda.titulo,
        descripcion: newAgenda.descripcion || undefined,
        ubicacion: newAgenda.ubicacion || undefined,
        fechaInicio: new Date(newAgenda.fechaInicio).toISOString(),
        fechaFin: newAgenda.fechaFin ? new Date(newAgenda.fechaFin).toISOString() : undefined,
        fotoUrl: newAgenda.fotoUrl || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError('No se pudo crear el evento de agenda');
      return;
    }
    setShowNewAgenda(false);
    setNewAgenda({ titulo: '', descripcion: '', ubicacion: '', fechaInicio: '', fechaFin: '', fotoUrl: '' });
    await loadData();
    flash('Evento de agenda añadido');
  };

  const deleteAgenda = async (id: number) => {
    if (!confirm('¿Eliminar este evento de agenda?')) return;
    const res = await fetch(`/api/admin/semana-santa/agenda/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError('No se pudo eliminar');
      return;
    }
    await loadData();
    flash('Evento eliminado');
  };

  const orderedDias = useMemo(() => {
    if (!data) return [];
    if (data.dias.length > 0) return data.dias;
    return configDias.map((d, i) => ({
      fecha: d.fecha,
      nombreDia: d.nombreDia,
      titulo: '',
      descripcion: '',
      fotoUrl: '',
      orden: i,
    }));
  }, [configDias, data]);

  if (loading && !data) {
    return <main className="mx-auto max-w-5xl p-6 text-muted-foreground">Cargando...</main>;
  }

  if (notInscribed) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="text-2xl font-semibold">Semana Santa</h1>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-5 text-amber-800">
          Este pueblo no está inscrito en Semana Santa este año.
        </div>
        <div className="mt-6 text-sm">
          <Link href={`/gestion/pueblos/${slug}`} className="text-muted-foreground hover:underline">
            ← Volver al pueblo
          </Link>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl">✝️</span>
        <div>
          <h1 className="text-2xl font-semibold">Semana Santa · {data.pueblo.nombre}</h1>
          <p className="text-sm text-muted-foreground">Edita cartel, agenda y días de procesiones.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <section className="mb-8 rounded-lg border p-5">
        <h2 className="mb-4 text-lg font-semibold">Información general</h2>
        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm">Título</label>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={data.titulo ?? ''}
              onChange={(e) => setData({ ...data, titulo: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Descripción</label>
            <textarea
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={data.descripcion ?? ''}
              onChange={(e) => setData({ ...data, descripcion: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <R2ImageUploader
              label="Cartel vertical"
              value={data.cartelVerticalUrl}
              onChange={(url) => setData({ ...data, cartelVerticalUrl: url })}
              folder="semana-santa/pueblos"
              previewHeight="h-56"
            />
            <R2ImageUploader
              label="Cartel horizontal"
              value={data.cartelHorizontalUrl}
              onChange={(url) => setData({ ...data, cartelHorizontalUrl: url })}
              folder="semana-santa/pueblos"
              previewHeight="h-40"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm">Stream / webcam (URL embebible)</label>
              <input
                type="url"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="https://www.youtube.com/embed/..."
                value={data.streamUrl ?? ''}
                onChange={(e) => setData({ ...data, streamUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Distintivo turístico</label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={data.interesTuristico}
                onChange={(e) =>
                  setData({
                    ...data,
                    interesTuristico: e.target.value as Participante['interesTuristico'],
                  })
                }
              >
                <option value="NINGUNO">Sin distintivo</option>
                <option value="REGIONAL">Interés Turístico Regional</option>
                <option value="NACIONAL">Interés Turístico Nacional</option>
                <option value="INTERNACIONAL">Interés Turístico Internacional</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data.activo}
              onChange={(e) => setData({ ...data, activo: e.target.checked })}
            />
            Pueblo activo en la lista pública de Semana Santa
          </label>
          <button
            onClick={saveInfo}
            disabled={saving}
            className="w-fit rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar información'}
          </button>
        </div>
      </section>

      <section className="mb-8 rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Días de procesiones</h2>
          <button
            onClick={() =>
              setData({
                ...data,
                dias: [
                  ...data.dias,
                  { fecha: '', nombreDia: '', titulo: '', descripcion: '', fotoUrl: '', orden: data.dias.length },
                ],
              })
            }
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            + Añadir día
          </button>
        </div>
        <div className="space-y-4">
          {orderedDias.map((d, idx) => (
            <div key={`${d.fecha}-${idx}`} className="rounded-md border p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={d.fecha}
                  onChange={(e) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], fecha: e.target.value };
                    setData({ ...data, dias: next });
                  }}
                />
                <input
                  type="text"
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="Nombre del día"
                  value={d.nombreDia}
                  onChange={(e) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], nombreDia: e.target.value };
                    setData({ ...data, dias: next });
                  }}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  className="rounded-md border px-3 py-2 text-sm"
                  placeholder="Título opcional"
                  value={d.titulo ?? ''}
                  onChange={(e) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], titulo: e.target.value };
                    setData({ ...data, dias: next });
                  }}
                />
                <button
                  className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600"
                  onClick={() => {
                    const next = orderedDias.filter((_, i) => i !== idx).map((x, i) => ({ ...x, orden: i }));
                    setData({ ...data, dias: next });
                  }}
                >
                  Quitar día
                </button>
              </div>
              <div className="mt-3">
                <textarea
                  rows={2}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Descripción opcional"
                  value={d.descripcion ?? ''}
                  onChange={(e) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], descripcion: e.target.value };
                    setData({ ...data, dias: next });
                  }}
                />
              </div>
              <div className="mt-3">
                <R2ImageUploader
                  label="Foto principal del día (opcional)"
                  value={d.fotoUrl || null}
                  onChange={(url) => {
                    const next = [...orderedDias];
                    next[idx] = { ...next[idx], fotoUrl: url };
                    setData({ ...data, dias: next });
                  }}
                  folder="semana-santa/dias"
                  previewHeight="h-36"
                />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={saveDias}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Guardar días
        </button>
      </section>

      <section className="mb-8 rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Agenda de procesiones y actos</h2>
          <button
            onClick={() => setShowNewAgenda(true)}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            + Añadir evento
          </button>
        </div>

        {showNewAgenda && (
          <div className="mb-4 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Título del evento"
              value={newAgenda.titulo}
              onChange={(e) => setNewAgenda({ ...newAgenda, titulo: e.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                className="rounded-md border px-3 py-2 text-sm"
                value={newAgenda.fechaInicio}
                onChange={(e) => setNewAgenda({ ...newAgenda, fechaInicio: e.target.value })}
              />
              <input
                type="datetime-local"
                className="rounded-md border px-3 py-2 text-sm"
                value={newAgenda.fechaFin}
                onChange={(e) => setNewAgenda({ ...newAgenda, fechaFin: e.target.value })}
              />
            </div>
            <input
              type="text"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Ubicación"
              value={newAgenda.ubicacion}
              onChange={(e) => setNewAgenda({ ...newAgenda, ubicacion: e.target.value })}
            />
            <textarea
              rows={2}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Descripción"
              value={newAgenda.descripcion}
              onChange={(e) => setNewAgenda({ ...newAgenda, descripcion: e.target.value })}
            />
            <R2ImageUploader
              label="Foto del evento (opcional)"
              value={newAgenda.fotoUrl || null}
              onChange={(url) => setNewAgenda({ ...newAgenda, fotoUrl: url ?? '' })}
              folder="semana-santa/agenda"
              previewHeight="h-32"
            />
            <div className="flex gap-2">
              <button
                onClick={createAgenda}
                disabled={saving || !newAgenda.titulo || !newAgenda.fechaInicio}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Crear evento
              </button>
              <button
                onClick={() => setShowNewAgenda(false)}
                className="rounded-md border px-4 py-1.5 text-sm text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {data.agenda.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos todavía.</p>
        ) : (
          <div className="space-y-2">
            {data.agenda.map((a) => (
              <div key={a.id} className="flex items-start justify-between rounded-md border p-3">
                <div>
                  <p className="font-medium">{a.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(a.fechaInicio).toLocaleString('es-ES')}
                    {a.fechaFin ? ` - ${new Date(a.fechaFin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </p>
                  {a.ubicacion && <p className="text-sm text-muted-foreground">{a.ubicacion}</p>}
                </div>
                <button
                  onClick={() => deleteAgenda(a.id)}
                  className="rounded-md border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 text-sm">
        <Link href={`/gestion/pueblos/${slug}`} className="text-muted-foreground hover:text-foreground hover:underline">
          ← Volver al pueblo
        </Link>
      </div>
    </main>
  );
}
