import Link from 'next/link';

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function PedidoConfirmacionPage({ params }: PageProps) {
  const { orderId } = await params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-lg bg-green-50 border border-green-200 p-8 text-center">
        <div className="mb-4 text-6xl">✓</div>
        <h1 className="text-3xl font-bold mb-3">¡Pedido realizado!</h1>
        <p className="text-gray-700 mb-2">
          Tu pedido #{orderId} ha sido recibido correctamente.
        </p>
        <p className="text-gray-600 text-sm mb-6">
          Recibirás un email de confirmación en breve.
        </p>

        <div className="space-x-4">
          <Link
            href="/tienda"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Volver a la tienda
          </Link>
          <Link
            href="/cuenta"
            className="inline-block rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-50"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold mb-4">¿Qué sigue?</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-blue-600">1.</span>
            <span>Recibirás un email de confirmación con los detalles de tu pedido.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600">2.</span>
            <span>Procesaremos tu pedido y te enviaremos un email cuando esté en camino.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600">3.</span>
            <span>Podrás seguir el estado de tu pedido desde tu cuenta.</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
