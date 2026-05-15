import Image from 'next/image';
import type { ReactNode } from 'react';

export type EventoTipo = 'NOCHE_ROMANTICA' | 'NAVIDAD' | 'SEMANA_SANTA';

/**
 * Ruta pública del logo oficial de La Noche Romántica.
 * El PNG vive en `frontend/public/eventos/noche-romantica.png`.
 */
export const NOCHE_ROMANTICA_LOGO_URL = '/eventos/noche-romantica.png';

type Props = {
  className?: string;
  /** Tamaño aproximado en px (alto). Por defecto 24. */
  size?: number;
  /** Aria-label opcional para lectores de pantalla. */
  alt?: string;
};

/**
 * Logo oficial de La Noche Romántica. Sustituye al emoji 🌹.
 * Usa next/image con object-contain para preservar la proporción
 * vertical (luna creciente + corazón + casas + lockup tipográfico).
 */
export function NocheRomanticaIcon({ className = '', size = 24, alt = 'La Noche Romántica' }: Props) {
  // El logo es vertical (≈ 2:3). Damos un poco más de alto que ancho.
  const w = Math.round(size * 0.7);
  const h = size;
  return (
    <Image
      src={NOCHE_ROMANTICA_LOGO_URL}
      alt={alt}
      width={w * 4}
      height={h * 4}
      className={`inline-block object-contain ${className}`}
      style={{ width: w, height: h }}
      priority={false}
    />
  );
}

/**
 * Renderiza el icono adecuado para un tipo de evento. Devuelve el logo
 * oficial de Noche Romántica cuando aplica, y el emoji por defecto en
 * el resto de eventos.
 */
export function EventoIcon({
  tipo,
  emoji,
  size = 24,
  className = '',
}: {
  tipo: EventoTipo;
  emoji: string;
  size?: number;
  className?: string;
}): ReactNode {
  if (tipo === 'NOCHE_ROMANTICA') {
    return <NocheRomanticaIcon size={size} className={className} />;
  }
  return (
    <span className={className} style={{ fontSize: size }} aria-hidden>
      {emoji}
    </span>
  );
}
