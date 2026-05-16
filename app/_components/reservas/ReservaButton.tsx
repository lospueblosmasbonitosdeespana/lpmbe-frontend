'use client';

import { useState, type ReactNode } from 'react';
import { CalendarCheck } from 'lucide-react';
import ReservaModal, { type ReservaTipoNegocio } from './ReservaModal';
import { cn } from '@/lib/utils';

interface Props {
  negocioId: number;
  negocioNombre: string;
  tipoNegocio: ReservaTipoNegocio;
  /** Texto que se muestra en el botón. Si null, usa traducción genérica. */
  label?: string;
  /** Visual del botón. */
  variant?: 'primary' | 'outline' | 'gold' | 'forest';
  /** Tamaño del botón. */
  size?: 'sm' | 'md' | 'lg';
  /** Si true, ocupa el ancho del contenedor. */
  fullWidth?: boolean;
  /** Children opcional (se renderiza dentro del botón antes del icono). */
  icon?: ReactNode;
  className?: string;
  /** Renderer custom del trigger. Recibe el onClick para abrir. */
  renderTrigger?: (open: () => void) => ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-stone-900 text-white hover:bg-stone-800',
  outline: 'bg-transparent border border-stone-300 text-stone-900 hover:bg-stone-100',
  gold: 'bg-amber-600 text-white hover:bg-amber-700',
  forest: 'bg-emerald-800 text-white hover:bg-emerald-900',
};

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * Botón "Reservar" reutilizable. Lanza el modal de solicitud de reserva
 * para cualquier tipo de negocio premium.
 *
 * Uso típico:
 *   <ReservaButton negocioId={123} negocioNombre="Casa Oliveira"
 *                  tipoNegocio="RESTAURANTE" variant="gold" />
 *
 * O con trigger personalizado (para integrarse en banners/cards):
 *   <ReservaButton {...props} renderTrigger={(open) => (
 *     <button onClick={open}>Reserva tu mesa</button>
 *   )} />
 */
export default function ReservaButton({
  negocioId,
  negocioNombre,
  tipoNegocio,
  label,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className,
  renderTrigger,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {renderTrigger ? (
        renderTrigger(() => setOpen(true))
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors',
            VARIANT_CLASSES[variant],
            SIZE_CLASSES[size],
            fullWidth && 'w-full',
            className,
          )}
        >
          {icon ?? <CalendarCheck size={size === 'lg' ? 18 : 14} />}
          {label || 'Reservar'}
        </button>
      )}
      <ReservaModal
        negocio={{ id: negocioId, nombre: negocioNombre, tipo: tipoNegocio }}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
