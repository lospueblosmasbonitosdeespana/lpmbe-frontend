'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  horarios?: string | null;
  contacto?: string | null;
  web?: string | null;
  fotoUrl?: string | null;
  activo: boolean;
  cerradoTemporal: boolean;
  descuentoPorcentaje?: number | null;
  provincia?: string | null;
  comunidad?: string | null;
  scope?: string;
  pueblo?: { id: number; nombre: string; slug: string } | null;
};

type FormData = {
  nombre: string;
  descripcion: string;
  horarios: string;
  contacto: string;
  web: string;
  fotoUrl: string;
};

export default function EditarRecursoClient({
  recursoId,
}: {
  recursoId: number;
}) {
  const router = useRouter();
  const [recurso, setRecurso] = useState<Recurso | null>(null);
  const [form, setForm] = useState<FormData>({
    nombre: '',
    descripcion: '',
    horarios: '',
    contacto: '',
    web: '',
    fotoUrl: '',
  });
  const [cerradoTemporal, setCerradoTemporal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/club/mis-recursos');

        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          setError(errData?.message || 'Error cargando recurso');
          return;
        }

        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        const found = lista.find((r: Recurso) => r.id === recursoId);

        if (!found) {
          setError('Recurso no encontrado o sin permiso');
          return;
        }

        setRecurso(found);
        setForm({
          nombre: found.nombre || '',
          descripcion: found.descripcion || '',
          horarios: found.horarios || '',
          contacto: found.contacto || '',
          web: found.web || '',
          fotoUrl: found.fotoUrl || '',
        });
        setCerradoTemporal(!!found.cerradoTemporal);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [recursoId]);

  async function handleSave() {
    if (!recurso) return;

    setSaving(true);
    setError(null);

    try {
      const patchUrl =
        recurso.scope === 'ASOCIACION' || !recurso.pueblo
          ? `/api/gestion/asociacion/recursos-turisticos/${recurso.id}`
          : `/api/club/recursos/${recurso.id}`;

      const body: Record<string, unknown> = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        horarios: form.horarios.trim() || null,
        contacto: form.contacto.trim() || null,
        web: form.web.trim() || null,
        fotoUrl: form.fotoUrl.trim() || null,
      };

      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || errData?.error || 'Error guardando');
        return;
      }

      router.push('/gestion/mis-recursos');
      router.refresh();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleCerradoTemporal() {
    if (!recurso) return;

    setError(null);
    const newVal = !cerradoTemporal;

    try {
      const res = await fetch(
        `/api/club/recursos/${recurso.id}/cerrado-temporal`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cerradoTemporal: newVal }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.message || 'Error actualizando');
        return;
      }

      setCerradoTemporal(newVal);
      setRecurso((prev) => (prev ? { ...prev, cerradoTemporal: newVal } : null));
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Error actualizando');
    }
  }

  if (loading) {
    return <div className="text-gray-500">Cargando recurso...</div>;
  }

  if (error && !recurso) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
        <Link
          href="/gestion/mis-recursos"
          className="mt-2 block text-sm underline"
        >
          Volver a mis recursos
        </Link>
      </div>
    );
  }

  if (!recurso) {
    return null;
  }

  const metricasHref = recurso.pueblo
    ? `/gestion/asociacion/club/metricas/${recurso.pueblo.id}`
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Editar recurso: {recurso.nombre}</h1>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Read-only fields */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Información de solo lectura
        </h2>
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Tipo</dt>
            <dd className="font-medium">{recurso.tipo || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Provincia</dt>
            <dd className="font-medium">{recurso.provincia || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Comunidad</dt>
            <dd className="font-medium">{recurso.comunidad || '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Descuento</dt>
            <dd className="font-medium">
              {recurso.descuentoPorcentaje != null
                ? `${recurso.descuentoPorcentaje}%`
                : '—'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Cerrado temporal toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <p className="font-medium text-gray-900">Cerrado temporalmente</p>
          <p className="text-sm text-gray-500">
            Marca si el recurso está temporalmente cerrado
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleCerradoTemporal}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            cerradoTemporal ? 'bg-orange-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              cerradoTemporal ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Editable form */}
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            disabled={saving}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) =>
              setForm((f) => ({ ...f, descripcion: e.target.value }))
            }
            disabled={saving}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Horarios
          </label>
          <input
            type="text"
            value={form.horarios}
            onChange={(e) =>
              setForm((f) => ({ ...f, horarios: e.target.value }))
            }
            disabled={saving}
            placeholder="Ej: L-V 10:00-14:00, 16:00-20:00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contacto
          </label>
          <input
            type="text"
            value={form.contacto}
            onChange={(e) =>
              setForm((f) => ({ ...f, contacto: e.target.value }))
            }
            disabled={saving}
            placeholder="Teléfono o email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Web
          </label>
          <input
            type="url"
            value={form.web}
            onChange={(e) => setForm((f) => ({ ...f, web: e.target.value }))}
            disabled={saving}
            placeholder="https://..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL de foto
          </label>
          <input
            type="url"
            value={form.fotoUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, fotoUrl: e.target.value }))
            }
            disabled={saving}
            placeholder="https://..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.nombre.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <Link
            href="/gestion/mis-recursos"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </div>

      {/* Métricas link */}
      {metricasHref && (
        <div>
          <Link
            href={metricasHref}
            className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            Ver métricas del pueblo
          </Link>
        </div>
      )}

      {recurso.activo && (
        <div>
          <Link
            href={`/validador/${recurso.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Abrir validador (nueva pestaña)
          </Link>
        </div>
      )}
    </div>
  );
}
