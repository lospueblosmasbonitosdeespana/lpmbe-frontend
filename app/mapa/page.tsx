import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa interactivo | Los Pueblos Más Bonitos de España",
  description: "Mapa interactivo con todos los pueblos más bonitos de España",
};

export default function MapaPage() {
  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      <iframe
        src="https://maps.lospueblosmasbonitosdeespana.org/es/pueblos"
        className="w-full flex-1 border-0"
        allow="geolocation"
        loading="lazy"
        title="Mapa interactivo de Los Pueblos Más Bonitos de España"
      />
    </main>
  );
}
