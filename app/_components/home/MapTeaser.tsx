import Link from "next/link";

export function MapTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Mapa interactivo</h2>
          <p className="mt-3 text-sm text-gray-600">
            Explora los pueblos sobre el mapa. El mapa no se carga en la home:
            solo se abre al hacer click.
          </p>

          <div className="mt-6">
            <Link
              href="/mapa"
              className="inline-flex items-center justify-center bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Abrir mapa →
            </Link>
          </div>
        </div>

        <div className="overflow-hidden bg-gray-100">
          {/* Imagen estática (placeholder). Cambiar por imagen real cuando quieras. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lospueblosmasbonitosdeespana.org/wp-content/uploads/2023/12/mapa-placeholder.jpg"
            alt="Vista previa del mapa"
            className="h-[260px] w-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

