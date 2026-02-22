'use client';

interface ClubShieldProps {
  /** Año de membresía del socio (por defecto: año actual) */
  year?: number;
  className?: string;
  /** Tamaño en píxeles del componente cuadrado (por defecto 200) */
  size?: number;
}

/**
 * Muestra el escudo del Club de Amigos LPMBE con el año de membresía
 * superpuesto dinámicamente sobre el medallón de la imagen.
 */
export function ClubShield({ year = new Date().getFullYear(), className = '', size = 200 }: ClubShieldProps) {
  // El medallón dorado con el año ocupa aproximadamente:
  // top: 77%, left: 43%, width: 14%, height: 6.5% de la imagen 1024×1024
  const overlayTop = size * 0.772;
  const overlayLeft = size * 0.432;
  const overlayW = size * 0.14;
  const overlayH = size * 0.065;
  const fontSize = Math.round(size * 0.068);

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/club-escudo.png"
        alt="Escudo Club de Amigos LPMBE"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        draggable={false}
      />
      {/* Cubre el "2026" original y pone el año dinámico */}
      <div
        style={{
          position: 'absolute',
          top: overlayTop,
          left: overlayLeft,
          width: overlayW,
          height: overlayH,
          backgroundColor: '#e2cc6e',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#1c4e28',
            fontWeight: '700',
            fontSize,
            letterSpacing: '0.04em',
            lineHeight: 1,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {year}
        </span>
      </div>
    </div>
  );
}

/**
 * Calcula el año de membresía a partir de validUntil y el plan.
 * Plan anual: validUntil.año - 1 (ej. válido hasta 2027 → socio desde 2026)
 * Plan mensual: validUntil.año (el mismo año de expiración)
 */
export function getMemberYear(validUntil: string | null, plan: string | null): number {
  if (!validUntil) return new Date().getFullYear();
  const until = new Date(validUntil).getFullYear();
  return plan === 'MENSUAL' ? until : until - 1;
}
