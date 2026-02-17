'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Tema claro/oscuro:
 * - Por defecto (sin cuenta o sin preferencia guardada) se usa "system": la web sigue
 *   la preferencia del sistema operativo (prefers-color-scheme). Si el SO está en oscuro,
 *   automático o claro, la web se adapta.
 * - El usuario puede cambiar la apariencia en Mi cuenta; esa elección se guarda en
 *   localStorage y tiene prioridad sobre el sistema.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
