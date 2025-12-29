"use client";

import { useEffect, useState } from "react";

export default function MapClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="bg-gray-100 px-6 py-10 text-sm text-gray-600">
          Cargando mapa…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Mapa interactivo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Esta página está marcada como no indexable. El mapa se carga solo aquí.
      </p>

      <div className="mt-6 bg-gray-100 px-6 py-10 text-sm text-gray-600">
        Aquí irá el mapa (Leaflet/Boldest/etc). De momento es un placeholder.
      </div>
    </div>
  );
}

