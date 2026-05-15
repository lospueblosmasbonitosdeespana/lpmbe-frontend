import type { SVGProps } from 'react';
import Image from 'next/image';

/** Campana / notificaciones (alertas del pueblo) */
export function HeroIconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroIconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroIconChart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path d="M4 19h16M4 15l4-6 4 4 4-8 4 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HeroIconKey(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Hero icon de "La Noche Romántica": logo oficial del evento (luna creciente
 * con corazón colgante sobre el lockup tipográfico). Sustituye al antiguo
 * corazón blanco SVG. El logo va sobre fondo blanco con un padding mínimo
 * para que conserve sus colores reales (luna dorada, corazón rojo).
 */
export function HeroIconHeart(_props: SVGProps<SVGSVGElement>) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 ring-1 ring-white/40 shadow-sm">
      <Image
        src="/eventos/noche-romantica.png"
        alt="La Noche Romántica"
        width={120}
        height={170}
        className="h-7 w-auto object-contain"
        priority={false}
      />
    </span>
  );
}

export function HeroIconCross(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden {...props}>
      <path d="M12 4v16M7 10h10" />
    </svg>
  );
}

export function HeroIconTree(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden {...props}>
      <path d="M12 22V12M9 10l3-6 3 6M8 14l4-3 4 3M7 18l5-4 5 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
