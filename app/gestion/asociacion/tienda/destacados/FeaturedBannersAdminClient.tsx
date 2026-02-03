"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  nombre: string;
  slug: string;
  precio: number;
  imagenUrl: string | null;
};

type FeaturedBanner = {
  id: number;
  productId: number;
  position: number;
  title: string;
  description: string | null;
  ctaText: string;
  images: string[];
  active: boolean;
  product: Product;
};

type FormData = {
  productId: number | null;
  position: number;
  title: string;
  description: string;
  ctaText: string;
  images: string[];
  active: boolean;
};

export default function FeaturedBannersAdminClient() {
  const router = useRouter();
  const [banners, setBanners] = useState<FeaturedBanner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [imageInput, setImageInput] = useState("");

  const emptyForm: FormData = {
    productId: null,
    position: 1,
    title: "",
    description: "",
    ctaText: "Descubrir",
    images: [],
    active: true,
  };

  const [form, setForm] = useState<FormData>(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [bannersRes, productsRes] = await Promise.all([
        fetch("/api/featured-banners", { credentials: "include" }),
        fetch("/api/products", { credentials: "include" }),
      ]);

      if (bannersRes.ok) {
        const bannersData = await bannersRes.json();
        setBanners(bannersData);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      setMessage("Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImageInput("");
    setShowModal(true);
  }

  function openEdit(banner: FeaturedBanner) {
    setEditingId(banner.id);
    setForm({
      productId: banner.productId,
      position: banner.position,
      title: banner.title,
      description: banner.description || "",
      ctaText: banner.ctaText,
      images: banner.images,
      active: banner.active,
    });
    setImageInput("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setImageInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!form.productId) {
      setMessage("Debes seleccionar un producto");
      return;
    }

    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/featured-banners/${editingId}` : "/api/featured-banners";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage(editingId ? "Banner actualizado" : "Banner creado");
        await loadData();
        closeModal();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error al guardar");
      }
    } catch (error) {
      setMessage("Error de conexión");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este banner destacado?")) return;

    try {
      const res = await fetch(`/api/featured-banners/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setMessage("Banner eliminado");
        await loadData();
      } else {
        const data = await res.json();
        setMessage(data.message || "Error al eliminar");
      }
    } catch (error) {
      setMessage("Error de conexión");
    }
  }

  function addImage() {
    if (!imageInput.trim()) return;
    setForm({ ...form, images: [...form.images, imageInput.trim()] });
    setImageInput("");
  }

  function removeImage(index: number) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p>Cargando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/gestion/asociacion/tienda"
            className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver
          </Link>
          <h1 className="text-3xl font-bold">Productos Destacados</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los banners grandes de la tienda (máximo 2 activos)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          + Crear Banner
        </button>
      </div>

      {message && (
        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-blue-800">
          {message}
        </div>
      )}

      {/* Lista de banners */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            No hay banners destacados. Crea uno para empezar.
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex gap-6">
                  {banner.product.imagenUrl && (
                    <img
                      src={banner.product.imagenUrl}
                      alt={banner.product.nombre}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          banner.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {banner.active ? "Activo" : "Inactivo"}
                      </span>
                      <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                        Posición {banner.position}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {banner.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Producto: {banner.product.nombre}
                    </p>
                    {banner.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                        {banner.description}
                      </p>
                    )}
                    {banner.images.length > 0 && (
                      <p className="mt-2 text-xs text-gray-400">
                        {banner.images.length} imagen(es) adicional(es)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(banner)}
                    className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-6 text-2xl font-bold">
              {editingId ? "Editar Banner" : "Crear Banner"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Producto */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Producto *
                </label>
                <select
                  value={form.productId || ""}
                  onChange={(e) =>
                    setForm({ ...form, productId: Number(e.target.value) })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} - {p.precio}€
                    </option>
                  ))}
                </select>
              </div>

              {/* Posición */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Posición (1 o 2) *
                </label>
                <select
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: Number(e.target.value) })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
              </div>

              {/* Título */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Título del Banner *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Ej: Libro: Los Pueblos Más Bonitos de España"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Descripción larga del banner..."
                />
              </div>

              {/* Texto del botón */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Texto del botón
                </label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Descubrir"
                />
              </div>

              {/* Imágenes adicionales */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Imágenes adicionales (URLs)
                </label>
                <div className="mb-2 flex gap-2">
                  <input
                    type="text"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Añadir
                  </button>
                </div>
                {form.images.length > 0 && (
                  <div className="space-y-2">
                    {form.images.map((img, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm"
                      >
                        <span className="truncate">{img}</span>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label className="text-sm font-medium text-gray-700">
                  Activo (mostrar en la tienda)
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 border-t pt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md bg-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
