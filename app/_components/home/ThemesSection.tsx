import Link from "next/link";
import { homeConfig } from "./home.config";

export function ThemesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Ideas para tu viaje</h2>
        <p className="mt-2 text-sm text-gray-600">
          Descubre los pueblos según la experiencia que buscas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {homeConfig.themes.map((theme) => (
          <Link
            key={theme.key}
            href={theme.href}
            className="group relative block h-[240px] overflow-hidden bg-gray-100"
          >
            {/* Imagen */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={theme.image}
              alt={theme.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/35" />

            {/* Texto */}
            <div className="relative z-10 flex h-full items-end p-6">
              <div className="text-white">
                <h3 className="text-xl font-semibold">{theme.title}</h3>
                <span className="mt-1 inline-block text-sm opacity-90">
                  Ver pueblos →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}



