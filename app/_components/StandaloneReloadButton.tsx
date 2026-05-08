'use client';

import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

/**
 * Botón flotante de recarga que SOLO aparece cuando la página se está mostrando
 * en modo "Web App standalone" (icono añadido al home screen del iPhone /
 * Android). En estos modos iOS oculta toda la UI del navegador, incluyendo el
 * botón de recargar — este botón devuelve esa funcionalidad sin afectar al
 * Safari normal.
 */
export default function StandaloneReloadButton() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const detect = () => {
      const mq = window.matchMedia('(display-mode: standalone)').matches;
      // iOS Safari expone navigator.standalone (no estándar)
      const ios = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(mq || ios);
    };
    detect();
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener?.('change', detect);
    return () => mql.removeEventListener?.('change', detect);
  }, []);

  if (!isStandalone) return null;

  const handleReload = () => {
    setSpinning(true);
    window.location.reload();
  };

  return (
    <button
      onClick={handleReload}
      aria-label="Recargar página"
      className="fixed right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-stone-900/85 text-white shadow-lg backdrop-blur-sm transition active:scale-95 hover:bg-stone-900"
      style={{
        // Respeta el safe-area inferior en iPhones con notch / Dynamic Island
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
      }}
    >
      <RotateCw className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} />
    </button>
  );
}
