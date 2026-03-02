'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';

type OrderItem = {
  id: number;
  productNombre: string | null;
  productImagenUrl: string | null;
  cantidad: number;
  precioUnit: number;
  subtotal: number;
};

type Order = {
  id: number;
  orderNumber: string | null;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente de pago', color: 'bg-yellow-100 text-yellow-800' },
  PAID: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  PROCESSING: { label: 'En preparación', color: 'bg-blue-100 text-blue-800' },
  SHIPPED: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  FAILED: { label: 'Error en pago', color: 'bg-red-100 text-red-800' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(amount: number) {
  return `${Number(amount).toFixed(2)} €`;
}

export default function MisPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/usuarios/me/pedidos', { cache: 'no-store' });
        if (res.status === 401) {
          router.push('/entrar');
          return;
        }
        if (!res.ok) throw new Error('Error');
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <main>
      <Section spacing="none" background="default">
        <Container>
          <div className="py-8 lg:py-12">
            <div className="mb-2">
              <Link
                href="/mi-cuenta"
                className="text-sm text-muted-foreground hover:underline"
              >
                ← Mi cuenta
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-2">Mis pedidos</h1>
            <p className="text-muted-foreground mb-8">
              Historial de tus compras en la tienda
            </p>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando pedidos...
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  Aún no tienes ningún pedido.
                </p>
                <Link
                  href="/tienda"
                  className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Ir a la tienda
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = STATUS_LABELS[order.status] ?? {
                    label: order.status,
                    color: 'bg-gray-100 text-gray-800',
                  };
                  return (
                    <div
                      key={order.id}
                      className="rounded-lg border bg-card p-6 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div>
                          <span className="font-semibold text-lg">
                            {order.orderNumber || `#${order.id}`}
                          </span>
                          <span className="ml-3 text-sm text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.color}`}
                          >
                            {status.label}
                          </span>
                          <span className="font-semibold text-lg">
                            {formatPrice(order.total)}
                          </span>
                        </div>
                      </div>

                      {order.items.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="space-y-3">
                            {order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4"
                              >
                                {item.productImagenUrl ? (
                                  <img
                                    src={item.productImagenUrl}
                                    alt={item.productNombre || 'Producto'}
                                    className="h-14 w-14 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">
                                      Sin foto
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {item.productNombre || 'Producto'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.cantidad} ud. × {formatPrice(item.precioUnit)}
                                  </p>
                                </div>
                                <span className="font-medium">
                                  {formatPrice(item.subtotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Container>
      </Section>
    </main>
  );
}
