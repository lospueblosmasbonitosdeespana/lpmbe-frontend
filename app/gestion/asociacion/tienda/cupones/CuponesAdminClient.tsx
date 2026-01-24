"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/src/lib/tiendaApi";
import type { Coupon } from "@/src/types/tienda";
import { toNumber } from "@/src/lib/money";

type FormMode = "create" | "edit" | null;

type CouponForm = {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: string;
  activo: boolean;
  startsAt: string;
  endsAt: string;
  minAmount: string;
  usageLimit: string;
};

const emptyForm: CouponForm = {
  code: "",
  type: "PERCENT",
  value: "",
  activo: true,
  startsAt: "",
  endsAt: "",
  minAmount: "",
  usageLimit: "",
};

export default function CuponesAdminClient() {
  const [cupones, setCupones] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [mode, setMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);

  async function loadCoupons() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminCoupons();
      setCupones(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando cupones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  function openCreate() {
    setMode("create");
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  }

  function openEdit(cupon: Coupon) {
    setMode("edit");
    setEditingId(cupon.id);
    setForm({
      code: cupon.code,
      type: cupon.type,
      value: cupon.value.toString(),
      activo: cupon.activo,
      startsAt: cupon.startsAt ? cupon.startsAt.substring(0, 16) : "",
      endsAt: cupon.endsAt ? cupon.endsAt.substring(0, 16) : "",
      minAmount: cupon.minAmount?.toString() || "",
      usageLimit: cupon.usageLimit?.toString() || "",
    });
    setError(null);
    setSuccess(null);
  }

  function closeForm() {
    setMode(null);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.code.trim()) {
      setError("El código es obligatorio");
      return;
    }

    const value = toNumber(form.value);
    if (value <= 0) {
      setError("El valor debe ser mayor que 0");
      return;
    }

    if (form.type === 'PERCENT' && value > 100) {
      setError("El descuento porcentual no puede ser mayor que 100%");
      return;
    }

    const payload: Partial<Coupon> = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      activo: form.activo,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      minAmount: form.minAmount ? toNumber(form.minAmount) : null,
      usageLimit: form.usageLimit ? Math.floor(toNumber(form.usageLimit)) : null,
    };

    try {
      if (mode === "create") {
        await createCoupon(payload);
        setSuccess("Cupón creado correctamente");
      } else if (mode === "edit" && editingId) {
        await updateCoupon(editingId, payload);
        setSuccess("Cupón actualizado correctamente");
      }
      await loadCoupons();
      closeForm();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando cupón");
    }
  }

  async function handleDelete(id: number, code: string) {
    if (!confirm(`¿Eliminar el cupón "${code}"?`)) return;

    try {
      setError(null);
      await deleteCoupon(id);
      setSuccess("Cupón eliminado correctamente");
      await loadCoupons();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando cupón");
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-gray-600">Cargando cupones...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/tienda"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Tienda
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cupones</h1>
            <p className="mt-2 text-gray-600">
              Gestión de cupones y descuentos ({cupones.length})
            </p>
          </div>
          {!mode && (
            <button
              onClick={openCreate}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Nuevo Cupón
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      {/* FORMULARIO */}
      {mode && (
        <div className="mb-8 rounded-lg border border-gray-300 bg-gray-50 p-6">
          <h2 className="mb-4 text-xl font-bold">
            {mode === "create" ? "Crear Cupón" : "Editar Cupón"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Código *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase"
                  placeholder="VERANO2026"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipo de descuento *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENT' | 'FIXED' })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="PERCENT">Porcentaje (%)</option>
                  <option value="FIXED">Importe fijo (€)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Valor * {form.type === 'PERCENT' ? '(%)' : '(€)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.type === 'PERCENT' ? '100' : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pedido mínimo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Sin mínimo"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Límite de usos
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ilimitado"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fecha inicio
                </label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fecha fin
                </label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>

            <div className="flex gap-3 border-t border-gray-200 pt-4">
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {mode === "create" ? "Crear" : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTADO */}
      {cupones.length === 0 && !mode && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No hay cupones todavía.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-black underline hover:no-underline"
          >
            Crear el primero
          </button>
        </div>
      )}

      {cupones.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Descuento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Validez
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Usos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cupones.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-gray-900">{c.code}</div>
                    {c.minAmount && (
                      <div className="text-xs text-gray-500">
                        Mín: {typeof c.minAmount === 'string' ? c.minAmount : c.minAmount.toFixed(2)} €
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {c.type === 'PERCENT' 
                      ? `${typeof c.value === 'string' ? c.value : c.value.toFixed(2)}%` 
                      : `${typeof c.value === 'string' ? c.value : c.value.toFixed(2)} €`}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{formatDate(c.startsAt)}</div>
                    <div className="text-xs text-gray-500">hasta</div>
                    <div>{formatDate(c.endsAt)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        c.activo
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => openEdit(c)}
                      className="mr-3 text-black hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.code)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
