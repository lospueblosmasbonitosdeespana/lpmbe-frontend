import type { SVGProps } from 'react';

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

export function HeroIconHeart(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
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
