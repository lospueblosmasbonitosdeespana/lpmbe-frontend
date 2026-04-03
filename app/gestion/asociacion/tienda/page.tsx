import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import CierreTiendaClient from './cierre/CierreTiendaClient';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCart } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TiendaAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Tienda"
      subtitle="Productos, pedidos, cupones, envíos e informes · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconCart />}
      maxWidthClass="max-w-5xl"
    >
      <div className="mb-8">
        <CierreTiendaClient />
      </div>

      <div className="space-y-4">
        <Link
          href="/gestion/asociacion/tienda/productos"
          className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Productos</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crear, editar y gestionar el catálogo de productos
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/promocion-global"
          className="block rounded-2xl border border-blue-200/80 bg-blue-50/80 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-blue-900/50 dark:bg-blue-950/30"
        >
          <h2 className="text-xl font-semibold">Promoción global</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Promoción que se aplica a productos sin descuento propio
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/pedidos"
          className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Pedidos</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ver y gestionar pedidos realizados</p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/cupones"
          className="block rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Cupones</h2>
          <p className="mt-2 text-sm text-muted-foreground">Cupones y descuentos</p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/envio"
          className="block rounded-2xl border border-green-200/80 bg-green-50/80 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-green-900/50 dark:bg-green-950/25"
        >
          <h2 className="text-xl font-semibold">Envío</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Zonas, tarifas por peso y envío gratuito (SendCloud)
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/ventas"
          className="block rounded-2xl border border-purple-200/80 bg-purple-50/80 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-purple-900/50 dark:bg-purple-950/25"
        >
          <h2 className="text-xl font-semibold">Informe de ventas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Listado fiscal y exportación CSV
          </p>
        </Link>
      </div>
    </GestionAsociacionSubpageShell>
  );
}
