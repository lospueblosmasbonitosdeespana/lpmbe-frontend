'use client';

import Image from 'next/image';

/**
 * Avatares PNG de niveles (fondo transparente), cargados desde /public.
 */
export const NIVEL_AVATAR_SRC: Record<string, string> = {
  'Turista Curioso': '/niveles-avatares/turista curioso 1.png',
  'Explorador Local': '/niveles-avatares/Explorador Local 2.png',
  'Viajero Apasionado': '/niveles-avatares/Viajero apasionado 3.png',
  'Amante de los Pueblos': '/niveles-avatares/Amante de los pueblos 4.png',
  'Gran Viajero': '/niveles-avatares/Gran viajero 5.png',
  'Leyenda LPBE': '/niveles-avatares/Leyenda LPBE 6.png',
  'Embajador de los Pueblos': '/niveles-avatares/Embajador de los pueblos 7.png',
  'Maestro Viajero': '/niveles-avatares/Maestro viajero 8.png',
  'Gran Maestre de los Pueblos': '/niveles-avatares/Gran Maestre de los Pueblos 9.png',
};

type Props = {
  nombreNivel: string;
  className?: string;
  imgClassName?: string;
  /** Permite a la página inyectar URLs administradas desde SiteSettings.miCuentaAssets */
  srcOverride?: string | null;
};

export default function NivelIcono({
  nombreNivel,
  className = '',
  imgClassName = '',
  srcOverride,
}: Props) {
  const fallback =
    NIVEL_AVATAR_SRC[nombreNivel] ?? NIVEL_AVATAR_SRC['Turista Curioso'];
  const src = srcOverride && srcOverride.trim() ? srcOverride : fallback;
  return (
    <div
      className={`relative h-14 w-14 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-b from-amber-50 to-amber-100/50 shadow-sm dark:border-amber-900/60 dark:from-amber-950/40 dark:to-amber-900/20 ${className}`}
      title={nombreNivel}
      aria-hidden
    >
      <Image
        src={src}
        alt={nombreNivel}
        fill
        sizes="(max-width: 768px) 96px, 128px"
        className={`object-contain p-[2px] scale-[1.22] drop-shadow-[0_2px_3px_rgba(0,0,0,0.2)] ${imgClassName}`}
      />
    </div>
  );
}
