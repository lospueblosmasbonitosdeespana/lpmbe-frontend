import { redirect } from 'next/navigation';

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = Number(params?.orderId);
  
  if (!orderId || Number.isNaN(orderId)) {
    redirect('/tienda');
  }

  // El webhook es quien marca PAID. Aquí solo devolvemos al usuario a su pedido.
  redirect(`/tienda/pedido/${orderId}`);
}
