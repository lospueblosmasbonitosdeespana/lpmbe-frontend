import type { Metadata } from "next";
import MapaPageClient from "./MapaPageClient";

export const metadata: Metadata = {
  title: "Mapa interactivo | Los Pueblos Más Bonitos de España",
  description:
    "Explora el mapa interactivo con todos los pueblos más bonitos de España. Descubre su ubicación y planifica tu próxima escapada.",
};

export default function MapaPage() {
  return <MapaPageClient />;
}
