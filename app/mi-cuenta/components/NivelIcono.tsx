'use client';

/**
 * Iconos de avatar/badge para cada nivel de logro.
 * Complementan la foto del usuario sin sustituirla.
 */
const iconos: Record<string, React.ReactNode> = {
  'Turista Curioso': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  'Explorador Local': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76 2.83 2.83" />
      <path d="M14.12 14.12 17 17" />
      <path d="M12 18v-6" />
      <path d="M9 9l-2.83 2.83" />
    </svg>
  ),
  'Viajero Apasionado': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M12 12h.01" />
    </svg>
  ),
  'Amante de los Pueblos': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  'Gran Viajero': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  ),
  'Leyenda LPBE': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
    </svg>
  ),
  'Embajador de los Pueblos': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8" />
      <path d="M8 21h8" />
      <path d="M9 17h6" />
    </svg>
  ),
};

type Props = {
  nombreNivel: string;
  className?: string;
};

export default function NivelIcono({ nombreNivel, className = '' }: Props) {
  const icono = iconos[nombreNivel] ?? iconos['Turista Curioso'];
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-700 ${className}`}
      title={nombreNivel}
      aria-hidden
    >
      {icono}
    </div>
  );
}
