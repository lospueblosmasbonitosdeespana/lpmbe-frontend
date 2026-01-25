import Link from 'next/link';

export default function CuponesPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Cupones y Descuentos</h1>
        <p className="text-lg text-gray-600">
          Aprovecha nuestros cupones de descuento en tus compras
        </p>
      </div>

      {/* Información sobre cómo usar cupones */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3 text-blue-900">¿Cómo usar un cupón?</h2>
        <ol className="space-y-2 text-blue-800">
          <li className="flex gap-2">
            <span className="font-semibold">1.</span>
            <span>Añade productos a tu carrito</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">2.</span>
            <span>Ve al checkout</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">3.</span>
            <span>Introduce tu código de cupón en el campo correspondiente</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold">4.</span>
            <span>El descuento se aplicará automáticamente</span>
          </li>
        </ol>
      </div>

      {/* Información sobre promociones automáticas */}
      <div className="rounded-lg bg-green-50 border border-green-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3 text-green-900">Promociones Activas</h2>
        <p className="text-green-800 mb-3">
          Las promociones activas se aplican automáticamente. No necesitas introducir ningún código.
        </p>
        <p className="text-sm text-green-700">
          💡 Consulta los productos con promoción activa en la tienda. Verás un badge especial indicando el descuento.
        </p>
      </div>

      {/* Sección de cupones disponibles (preparada para futuro) */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Cupones Disponibles</h2>
        
        <div className="space-y-4">
          {/* Card de ejemplo (cuando haya cupones disponibles) */}
          <div className="rounded-lg border border-gray-200 p-6 bg-white">
            <p className="text-gray-500 text-center py-8">
              No hay cupones disponibles en este momento
            </p>
          </div>
        </div>
      </div>

      {/* Condiciones de uso */}
      <div className="rounded-lg border border-gray-200 p-6 bg-gray-50">
        <h3 className="font-semibold mb-3">Condiciones de Uso</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Los cupones solo pueden usarse una vez por usuario</li>
          <li>• Los cupones pueden tener fecha de caducidad</li>
          <li>• Los cupones pueden tener importe mínimo de compra</li>
          <li>• Los cupones no son acumulables con todas las promociones</li>
          <li>• Los cupones no son válidos para productos ya rebajados (si aplica)</li>
        </ul>
      </div>

      {/* CTA para ir a la tienda */}
      <div className="mt-8 text-center">
        <Link
          href="/tienda"
          className="inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Ir a la tienda
        </Link>
      </div>
    </main>
  );
}
