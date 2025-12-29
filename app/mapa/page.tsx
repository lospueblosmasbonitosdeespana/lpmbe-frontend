import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Mapa | LPBME",
};

export default function MapaPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold">Mapa interactivo</h1>
      <p className="mt-4 text-black/60">
        El mapa se abre en una nueva pestaña.
      </p>

      <a
        href="https://maps.lospueblosmasbonitosdeespana.org/es/pueblos"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-black px-6 py-4 text-white"
      >
        Abrir mapa
      </a>
    </main>
  );
}
