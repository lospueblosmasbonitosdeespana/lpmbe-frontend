import type { Metadata } from "next";
import MapClient from "../_components/mapa/MapClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Mapa | LPBME",
};

export default function MapaPage() {
  return <MapClient />;
}
