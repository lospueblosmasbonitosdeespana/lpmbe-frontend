import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="bg-gray-100 px-6 py-12 md:px-10">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">
            Empieza a planificar tu próxima escapada
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Explora los pueblos, consulta la actualidad y descubre el mapa interactivo.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/pueblos"
            className="bg-white px-5 py-4 text-sm font-medium hover:underline"
          >
            Ver todos los pueblos →
            <div className="mt-1 text-xs text-gray-500">
              Listado completo y búsqueda
            </div>
          </Link>

          <Link
            href="/notificaciones"
            className="bg-white px-5 py-4 text-sm font-medium hover:underline"
          >
            Centro de notificaciones →
            <div className="mt-1 text-xs text-gray-500">
              Noticias, semáforos y avisos
            </div>
          </Link>

          <a
            href="https://maps.lospueblosmasbonitosdeespana.org/es/pueblos"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white px-5 py-4 text-sm font-medium hover:underline"
          >
            Abrir mapa interactivo →
            <div className="mt-1 text-xs text-gray-500">
              Explorar por ubicación
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}



