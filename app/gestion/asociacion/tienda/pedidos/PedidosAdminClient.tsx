"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders, updateOrderStatus } from "@/src/lib/tiendaApi";
import type { Order } from "@/src/types/tienda";
import { formatEUR, toNumber } from "@/src/lib/money";

const ESTADOS: Order['status'][] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const ESTADO_COLORS: Record<Order['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const ESTADO_LABELS: Record<Order['status'], string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function PedidosAdminClient() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<Order['status'] | ''>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminOrders();
      setPedidos(data);
    } catch (e: any) {
      console.error("[Pedidos] Error:", e);
      // Error específico de backend sin migración
      if (e?.message?.includes('couponCode') || e?.message?.includes('Internal server error')) {
        setError(
          "El backend requiere una migración de base de datos. " +
          "Por favor, contacta al administrador del sistema."
        );
      } else {
        setError(e?.message ?? "Error cargando pedidos");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  function startEditStatus(order: Order) {
    setEditingStatusId(order.id);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setError(null);
    setSuccess(null);
  }

  function cancelEditStatus() {
    setEditingStatusId(null);
    setNewStatus('');
    setTrackingNumber('');
  }

  async function saveStatus(orderId: number) {
    if (!newStatus) {
      setError("Selecciona un estado");
      return;
    }

    try {
      setError(null);
      const payload: any = { status: newStatus };
      
      // Solo enviar trackingNumber si el estado es SHIPPED y hay número
      if (newStatus === 'SHIPPED' && trackingNumber.trim()) {
        payload.trackingNumber = trackingNumber.trim();
      }
      
      await updateOrderStatus(orderId, payload);
      setSuccess("Estado actualizado correctamente");
      await loadOrders();
      cancelEditStatus();
    } catch (e: any) {
      setError(e?.message ?? "Error actualizando estado");
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-gray-600">Cargando pedidos...</p>
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
        <div>
          <h1 className="text-3xl font-bold">Pedidos</h1>
          <p className="mt-2 text-gray-600">
            Gestión de pedidos de la tienda ({pedidos.length})
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            ⚠️ Error cargando pedidos
          </p>
          <p className="text-sm text-red-700 mt-1">
            {error}
          </p>
          {error.includes('migración') && (
            <p className="text-xs text-red-600 mt-2">
              El backend necesita ejecutar: <code className="bg-red-100 px-1 rounded">npx prisma migrate dev</code>
            </p>
          )}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">No hay pedidos todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
              {/* HEADER DEL PEDIDO */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Pedido #{pedido.orderNumber || pedido.id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(pedido.createdAt)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Cliente</div>
                    <div className="text-sm font-medium text-gray-900">
                      {pedido.user?.email || `Usuario ${pedido.userId}`}
                    </div>
                    {(pedido.user?.nombre || pedido.user?.apellidos) && (
                      <div className="text-xs text-gray-500">
                        {pedido.user.nombre} {pedido.user.apellidos}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-sm font-bold text-gray-900">
                      {formatEUR(toNumber(pedido.total))} €
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        ESTADO_COLORS[pedido.status]
                      }`}
                    >
                      {ESTADO_LABELS[pedido.status]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {editingStatusId === pedido.id ? (
                    <>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {ESTADO_LABELS[estado]}
                          </option>
                        ))}
                      </select>
                      {newStatus === 'SHIPPED' && (
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Nº seguimiento"
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                        />
                      )}
                      <button
                        onClick={() => saveStatus(pedido.id)}
                        className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditStatus}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditStatus(pedido)}
                        className="text-sm text-black hover:underline"
                      >
                        Cambiar estado
                      </button>
                      <button
                        onClick={() => toggleExpand(pedido.id)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        {expandedId === pedido.id ? "▼ Ocultar" : "▶ Ver detalles"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* DETALLES DEL PEDIDO (EXPANDIBLE) */}
              {expandedId === pedido.id && (
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-900">
                      Productos ({pedido.items.length})
                    </h3>
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-200">
                        <tr>
                          <th className="pb-2 text-left font-medium text-gray-600">
                            Producto
                          </th>
                          <th className="pb-2 text-right font-medium text-gray-600">
                            Precio Unit.
                          </th>
                          <th className="pb-2 text-right font-medium text-gray-600">
                            Cantidad
                          </th>
                          <th className="pb-2 text-right font-medium text-gray-600">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedido.items.map((item) => {
                          // ✅ Conversión segura a número antes de operar
                          const precioUnitarioNum = toNumber(item.precioUnitario);
                          const cantidadNum = Number(item.cantidad);
                          const subtotalLinea = precioUnitarioNum * cantidadNum;

                          return (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="py-2">
                                {item.producto?.nombre || `Producto ${item.productId}`}
                              </td>
                              <td className="py-2 text-right">
                                {formatEUR(precioUnitarioNum)} €
                              </td>
                              <td className="py-2 text-right">{cantidadNum}</td>
                              <td className="py-2 text-right font-medium">
                                {formatEUR(subtotalLinea)} €
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        {toNumber(pedido.discountTotal) > 0 && (
                          <>
                            <tr>
                              <td colSpan={3} className="pt-3 text-right text-gray-600">
                                Subtotal:
                              </td>
                              <td className="pt-3 text-right">
                                {formatEUR(toNumber(pedido.totalBeforeDiscount))} €
                              </td>
                            </tr>
                            <tr>
                              <td colSpan={3} className="text-right text-gray-600">
                                Descuento {pedido.couponCode && `(${pedido.couponCode})`}:
                              </td>
                              <td className="text-right text-green-600">
                                -{formatEUR(toNumber(pedido.discountTotal))} €
                              </td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td colSpan={3} className="pt-3 text-right font-medium">
                            Total:
                          </td>
                          <td className="pt-3 text-right text-lg font-bold">
                            {formatEUR(toNumber(pedido.total))} €
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {pedido.shippingAddressRef && (
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-gray-900">
                        Dirección de envío
                      </h3>
                      <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                        <div className="font-medium">{pedido.shippingAddressRef.nombre}</div>
                        <div>{pedido.shippingAddressRef.direccion}</div>
                        <div>
                          {pedido.shippingAddressRef.codigoPostal} {pedido.shippingAddressRef.ciudad},{" "}
                          {pedido.shippingAddressRef.provincia}
                        </div>
                        <div>{pedido.shippingAddressRef.pais}</div>
                        {pedido.shippingAddressRef.telefono && (
                          <div>Tel: {pedido.shippingAddressRef.telefono}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {pedido.trackingNumber && (
                    <div className="mt-3">
                      <h3 className="mb-1 text-sm font-medium text-gray-900">
                        Número de seguimiento
                      </h3>
                      <p className="font-mono text-sm text-gray-700">
                        {pedido.trackingNumber}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                    {pedido.paidAt && (
                      <div>
                        <span className="font-medium">Pagado:</span>{" "}
                        {formatDate(pedido.paidAt)}
                      </div>
                    )}
                    {pedido.shippedAt && (
                      <div>
                        <span className="font-medium">Enviado:</span>{" "}
                        {formatDate(pedido.shippedAt)}
                      </div>
                    )}
                    {pedido.deliveredAt && (
                      <div>
                        <span className="font-medium">Entregado:</span>{" "}
                        {formatDate(pedido.deliveredAt)}
                      </div>
                    )}
                    {pedido.cancelledAt && (
                      <div>
                        <span className="font-medium text-red-600">Cancelado:</span>{" "}
                        {formatDate(pedido.cancelledAt)}
                      </div>
                    )}
                  </div>

                  {pedido.stripePaymentIntentId && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Stripe Payment Intent: {pedido.stripePaymentIntentId}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
