import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mapa interactivo | Los Pueblos Más Bonitos de España",
  description: "Explora el mapa interactivo con todos los pueblos más bonitos de España",
};

export default function MapaPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
          Mapa interactivo
        </h1>
        <p className="mt-4 text-gray-500 leading-relaxed">
          Explora todos nuestros pueblos en un mapa interactivo.
          El mapa se abrirá en una nueva pestaña.
        </p>

        <a
          href="https://maps.lospueblosmasbonitosdeespana.org/es/pueblos"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#7c2d34] px-8 py-4 text-white font-semibold shadow-md transition hover:bg-[#6b2530] hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
          Abrir mapa
        </a>

        <p className="mt-6 text-sm text-gray-400">
          Tu web permanecerá abierta en esta pestaña
        </p>
      </div>
    </main>
  );
}
