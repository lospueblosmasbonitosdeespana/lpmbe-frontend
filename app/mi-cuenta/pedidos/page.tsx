'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
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

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  FAILED: 'bg-red-100 text-red-800',
};

type OrderStatusKey = keyof typeof STATUS_STYLES;

function isOrderStatusKey(status: string): status is OrderStatusKey {
  return status in STATUS_STYLES;
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
    Number(amount),
  );
}

export default function MisPedidosPage() {
  const t = useTranslations('myAccount.ordersPage');
  const locale = useLocale();
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
                ← {t('backToMyAccount')}
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground mb-8">
              {t('subtitle')}
            </p>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('loading')}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                <p className="text-muted-foreground mb-4">
                  {t('empty')}
                </p>
                <Link
                  href="/tienda"
                  className="inline-block rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t('goShop')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusColor = STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-800';
                  const statusLabel = isOrderStatusKey(order.status)
                    ? t(`status.${order.status}`)
                    : order.status;
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
                            {formatDate(order.createdAt, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                          <span className="font-semibold text-lg">
                            {formatPrice(order.total, locale)}
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
                                    alt={item.productNombre || t('productFallback')}
                                    className="h-14 w-14 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded-md bg-muted flex items-center justify-center">
                                    <span className="text-xs text-muted-foreground">
                                      {t('noPhoto')}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {item.productNombre || t('productFallback')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t('units', { count: item.cantidad })} × {formatPrice(item.precioUnit, locale)}
                                  </p>
                                </div>
                                <span className="font-medium">
                                  {formatPrice(item.subtotal, locale)}
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
