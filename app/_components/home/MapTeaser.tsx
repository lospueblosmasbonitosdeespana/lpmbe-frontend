import Link from "next/link";
import Image from "next/image";

const MAP_URL = "https://maps.lospueblosmasbonitosdeespana.org/es/pueblos";

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
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-black px-5 py-3 text-sm font-medium text-white"
            >
              Abrir mapa →
            </a>
          </div>
        </div>

        <Link
          href={MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir mapa interactivo"
          className="group relative block overflow-hidden rounded-2xl border border-black/10"
        >
          {/* Imagen local del mapa (NO carga mapa real) */}
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/mapa_espana_pueblos.png"
              alt="Vista previa del mapa de España"
              fill
              className="object-cover"
              priority={false}
            />

            {/* Capa gris tipo Francia */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] transition group-hover:bg-white/30" />
          </div>

          {/* Etiqueta superior */}
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/80 px-3 py-2 text-sm font-medium text-black">
            Vista previa del mapa
          </div>
        </Link>
      </div>
    </section>
  );
}
