"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  listGlobalPromotions,
  createGlobalPromotion,
  updateGlobalPromotion,
  activateGlobalPromotion,
  deactivateGlobalPromotion,
  deleteGlobalPromotion,
} from "@/src/lib/tiendaApi";
import type { GlobalPromotion } from "@/src/types/tienda";

type FormMode = "create" | "edit" | null;

type PromotionForm = {
  title: string;
  percent: string;
  description: string;
};

const emptyForm: PromotionForm = {
  title: "",
  percent: "",
  description: "",
};

export default function GlobalPromotionClient() {
  const [promotions, setPromotions] = useState<GlobalPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [mode, setMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromotionForm>(emptyForm);

  async function loadPromotions() {
    try {
      setLoading(true);
      setError(null);
      const data = await listGlobalPromotions();
      setPromotions(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando promociones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotions();
  }, []);

  function openCreate() {
    setMode("create");
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  }

  function openEdit(promo: GlobalPromotion) {
    setMode("edit");
    setEditingId(promo.id);
    setForm({
      title: promo.title,
      percent: promo.percent.toString(),
      description: promo.description ?? "",
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

    if (!form.title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    const percent = Number(form.percent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      setError("El descuento debe estar entre 0 y 100");
      return;
    }

    const payload = {
      title: form.title.trim(),
      percent,
      description: form.description.trim() || undefined,
    };

    try {
      if (mode === "create") {
        await createGlobalPromotion(payload);
        setSuccess("Promoción global creada correctamente");
      } else if (mode === "edit" && editingId) {
        await updateGlobalPromotion(editingId, payload);
        setSuccess("Promoción global actualizada correctamente");
      }
      await loadPromotions();
      closeForm();
    } catch (e: any) {
      setError(e?.message ?? "Error guardando promoción");
    }
  }

  async function handleActivate(id: number, title: string) {
    if (!confirm(`¿Activar promoción "${title}"? (Se desactivarán las demás)`)) return;

    try {
      setError(null);
      await activateGlobalPromotion(id);
      setSuccess(`Promoción "${title}" activada correctamente`);
      await loadPromotions();
    } catch (e: any) {
      setError(e?.message ?? "Error activando promoción");
    }
  }

  async function handleDeactivate(id: number) {
    try {
      setError(null);
      await deactivateGlobalPromotion(id);
      setSuccess("Promoción desactivada correctamente");
      await loadPromotions();
    } catch (e: any) {
      setError(e?.message ?? "Error desactivando promoción");
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`¿Eliminar la promoción "${title}"?`)) return;

    try {
      setError(null);
      await deleteGlobalPromotion(id);
      setSuccess("Promoción eliminada correctamente");
      await loadPromotions();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando promoción");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-muted-foreground">Cargando promociones...</p>
      </main>
    );
  }

  const activePromo = promotions.find((p) => p.active);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/tienda"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
        >
          ← Volver a Tienda
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Promoción Global</h1>
            <p className="mt-2 text-muted-foreground">
              Gestión de promociones globales que se aplican a todos los productos sin descuento propio
            </p>
          </div>
          {!mode && (
            <button
              onClick={openCreate}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Nueva promoción
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ESTADO ACTUAL */}
      {activePromo && !mode && (
        <div className="mb-6 rounded-lg border-2 border-green-500 bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-green-900">
                🔥 Promoción global activa:
              </div>
              <div className="mt-1 text-lg font-bold text-green-900">
                {activePromo.title} ({activePromo.percent}%)
              </div>
              {activePromo.description && (
                <div className="mt-1 text-sm text-green-700">
                  {activePromo.description}
                </div>
              )}
            </div>
            <button
              onClick={() => handleDeactivate(activePromo.id)}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50"
            >
              Desactivar
            </button>
          </div>
        </div>
      )}

      {/* FORMULARIO */}
      {mode && (
        <div className="mb-8 rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">
            {mode === "create" ? "Nueva promoción global" : "Editar promoción global"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Título <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder='Ej: "Black Friday", "Rebajas de Verano"'
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descuento (%) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={form.percent}
                onChange={(e) => setForm({ ...form, percent: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                placeholder="0-100"
                min="0"
                max="100"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descripción (opcional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
                rows={3}
                placeholder="Descripción interna para administradores..."
              />
            </div>

            <div className="flex gap-3 border-t border-border pt-4">
              <button
                type="submit"
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                {mode === "create" ? "Crear" : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-muted/30"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTADO */}
      {promotions.length === 0 && !mode && (
        <div className="rounded-lg border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">No hay promociones globales todavía.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-black underline hover:no-underline"
          >
            Crear la primera
          </button>
        </div>
      )}

      {promotions.length > 0 && !mode && (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className={`rounded-lg border p-4 ${
                promo.active
                  ? "border-green-500 bg-green-50"
                  : "border-border bg-white"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{promo.title}</h3>
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        promo.active
                          ? "bg-green-200 text-green-900"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {promo.active ? "✓ Activa" : "Inactiva"}
                    </span>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    −{promo.percent}%
                  </div>
                  {promo.description && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {promo.description}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!promo.active && (
                    <button
                      onClick={() => handleActivate(promo.id, promo.title)}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Activar
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(promo)}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-muted/30"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id, promo.title)}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
