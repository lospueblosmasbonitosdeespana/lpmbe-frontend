"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/src/lib/tiendaApi";
import type { Product } from "@/src/types/tienda";
import { formatEUR, toNumber } from "@/src/lib/money";
import ProductGalleryManager from "./ProductGalleryManager";

type FormMode = "create" | "edit" | null;

type ProductForm = {
  nombre: string;
  slug: string;
  descripcion: string;
  precio: string;
  stock: string;
  activo: boolean;
  destacado: boolean;
  orden: string;
  categoria: string;
  imagenUrl: string;
  discountPercent: string; // 0-100
  discountLabel: string;
};

const emptyForm: ProductForm = {
  nombre: "",
  slug: "",
  descripcion: "",
  precio: "",
  stock: "0",
  activo: true,
  destacado: false,
  orden: "0",
  categoria: "",
  imagenUrl: "",
  discountPercent: "",
  discountLabel: "",
};

export default function ProductosAdminClient() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [mode, setMode] = useState<FormMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function loadProducts() {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts();
      setProductos(data);
    } catch (e: any) {
      setError(e?.message ?? "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function openCreate() {
    setMode("create");
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    setSuccess(null);
  }

  function openEdit(producto: Product) {
    setMode("edit");
    setEditingId(producto.id);
    setForm({
      nombre: producto.nombre,
      slug: producto.slug,
      descripcion: producto.descripcion ?? "",
      precio: producto.precio.toString(),
      stock: producto.stock.toString(),
      activo: producto.activo,
      destacado: producto.destacado,
      orden: producto.orden.toString(),
      categoria: producto.categoria ?? "",
      imagenUrl: producto.imagenUrl ?? "",
      discountPercent: producto.discountPercent?.toString() ?? "",
      discountLabel: producto.discountLabel ?? "",
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

  async function handleUploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        setError('La imagen pesa demasiado (máx 25MB)');
        return;
      }

      setUploadingImage(true);
      setError(null);

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'productos');

        const res = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error ?? data?.message ?? `Error ${res.status}`;
          throw new Error(typeof msg === 'string' ? msg : 'Error subiendo imagen');
        }

        const url = data?.url ?? data?.publicUrl;
        if (!url || typeof url !== 'string') throw new Error('La subida no devolvió URL');

        setForm({ ...form, imagenUrl: url });
      } catch (e: any) {
        setError(e?.message ?? 'Error subiendo imagen');
      } finally {
        setUploadingImage(false);
      }
    };

    input.click();
  }

  function handleRemoveImage() {
    if (!confirm('¿Eliminar la imagen actual?')) return;
    setForm({ ...form, imagenUrl: '' });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validaciones
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }

    const precio = toNumber(form.precio);
    if (precio < 0) {
      setError("El precio no puede ser negativo");
      return;
    }

    const stock = toNumber(form.stock);
    if (stock < 0) {
      setError("El stock no puede ser negativo");
      return;
    }

    // Validar descuento
    const discountPercent = form.discountPercent.trim() ? toNumber(form.discountPercent) : null;
    if (discountPercent !== null && (discountPercent < 0 || discountPercent > 100)) {
      setError("El descuento debe estar entre 0 y 100");
      return;
    }

    // Auto-rellenar label si hay descuento pero no hay label
    let discountLabel = form.discountLabel.trim() || null;
    if (discountPercent !== null && discountPercent > 0 && !discountLabel) {
      discountLabel = `Descuento ${discountPercent}%`;
    }

    const payload: Partial<Product> = {
      nombre: form.nombre.trim(),
      slug: form.slug.trim() || undefined,
      descripcion: form.descripcion.trim() || null,
      precio,
      stock: Math.floor(stock),
      activo: form.activo,
      destacado: form.destacado,
      orden: toNumber(form.orden),
      categoria: form.categoria.trim() || null,
      imagenUrl: form.imagenUrl.trim() || null,
      discountPercent,
      discountLabel,
    };

    console.log("[ProductosAdmin] Payload a enviar:", payload);

    try {
      if (mode === "create") {
        await createProduct(payload);
        setSuccess("Producto creado correctamente");
      } else if (mode === "edit" && editingId) {
        console.log("[ProductosAdmin] Actualizando producto", editingId, payload);
        await updateProduct(editingId, payload);
        setSuccess("Producto actualizado correctamente");
      }
      await loadProducts();
      closeForm();
    } catch (e: any) {
      console.error("[ProductosAdmin] Error guardando:", e);
      setError(e?.message ?? "Error guardando producto");
    }
  }

  async function handleDelete(id: number, nombre: string) {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;

    try {
      setError(null);
      await deleteProduct(id);
      setSuccess("Producto eliminado correctamente");
      await loadProducts();
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando producto");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-gray-600">Cargando productos...</p>
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
            <h1 className="text-3xl font-bold">Productos</h1>
            <p className="mt-2 text-gray-600">
              Gestión de productos de la tienda ({productos.length})
            </p>
          </div>
          {!mode && (
            <button
              onClick={openCreate}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Nuevo Producto
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
            {mode === "create" ? "Crear Producto" : "Editar Producto"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Slug (autogenerado si vacío)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="auto"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Precio (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <input
                  type="text"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ej: Merchandising, Libros..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Orden
                </label>
                <input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={4}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Imagen del producto
              </label>
              
              {form.imagenUrl ? (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img
                      src={form.imagenUrl}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg border border-gray-300 object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {uploadingImage ? "Subiendo..." : "Cambiar imagen"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                  className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-100 disabled:opacity-50"
                >
                  {uploadingImage ? "Subiendo..." : "+ Subir imagen"}
                </button>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Solo subida de archivo. Formato: JPG, PNG, WebP (máx 25MB). No se usan URLs externas.
              </p>
            </div>

            {/* GALERÍA (solo en modo edición) */}
            {mode === "edit" && editingId && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <ProductGalleryManager productId={editingId} productNombre={form.nombre || "Producto"} />
              </div>
            )}

            {/* DESCUENTO (opcional) */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-blue-900">
                  Descuento del producto (opcional)
                </label>
                <p className="text-xs text-blue-700 mb-3">
                  Si pones descuento en el producto, se ignora la promoción global.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Deja vacío para usar la promoción global
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Etiqueta del descuento
                  </label>
                  <input
                    type="text"
                    value={form.discountLabel}
                    onChange={(e) => setForm({ ...form, discountLabel: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder='Ej: "Black Friday", "Especial"'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Si está vacío, se genera automáticamente
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.destacado}
                  onChange={(e) => setForm({ ...form, destacado: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Destacado</span>
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
      {productos.length === 0 && !mode && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No hay productos todavía.</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-black underline hover:no-underline"
          >
            Crear el primero
          </button>
        </div>
      )}

      {productos.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Orden
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imagenUrl && (
                        <img
                          src={p.imagenUrl}
                          alt={p.nombre}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{p.nombre}</div>
                        <div className="text-xs text-gray-500">{p.slug}</div>
                        {p.categoria && (
                          <div className="text-xs text-gray-500">
                            {p.categoria}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {formatEUR(p.precio)} €
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {p.stock}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          p.activo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                      {p.destacado && (
                        <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Destacado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {p.orden}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-3 text-black hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.nombre)}
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
