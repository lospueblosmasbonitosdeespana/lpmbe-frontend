'use client';

import { useEffect } from 'react';
import { upgradeLegacyCountdownBlocks, attachLiveCountdowns } from '@/app/_lib/builder-countdown-dom';

/**
 * Se monta en el layout raíz. Escanea el document completo una vez que
 * el navegador ha terminado de pintar y activa las cuentas atrás de bloques
 * "contador" generados por el constructor.
 *
 * - Funciona para contenido existente (formato antiguo sin data-attribute).
 * - No depende del ciclo de render de SafeHtml ni de la hidratación SSR.
 */
export default function CountdownHydrator() {
  useEffect(() => {
    let stopFn: (() => void) | null = null;

    const run = () => {
      upgradeLegacyCountdownBlocks(document.body);
      stopFn = attachLiveCountdowns(document.body);
    };

    // Primer intento: tras un frame completo (post-hydration)
    const rafId = requestAnimationFrame(() => {
      run();
    });

    // Segundo intento a los 500ms por si hay lazy-loading o Suspense tardío
    const tid = setTimeout(run, 500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tid);
      stopFn?.();
    };
  }, []);

  return null;
}
