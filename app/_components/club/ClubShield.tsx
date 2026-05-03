'use client';

import { useEffect, useState } from 'react';
import {
  type MiCuentaAssets,
  getClubLogoOverride,
  getClubLogoTransform,
} from '@/app/mi-cuenta/components/miCuentaAssets';

interface ClubShieldProps {
  /** Año de membresía del socio (por defecto: año actual) */
  year?: number;
  className?: string;
  /** Tamaño en píxeles del componente cuadrado (por defecto 200) */
  size?: number;
  /**
   * URL del logo configurada por el admin. Si se pasa, se usa esa imagen
   * y NO se pinta el overlay del año (se asume que el logo subido ya es
   * el escudo definitivo del año en curso).
   */
  srcOverride?: string | null;
  /** Escala/desplazamiento del logo dentro del cuadrado (sólo aplica con srcOverride). */
  transform?: { scale: number; offsetX: number; offsetY: number } | null;
}

/**
 * Muestra el escudo del Club de Amigos LPMBE con el año de membresía
 * superpuesto dinámicamente sobre el medallón de la imagen. Si el admin
 * ha subido un logo personalizado en /gestion/asociacion/mi-cuenta-usuarios
 * (slot clubLogo), se usa ese y no se pinta el overlay del año.
 */
export function ClubShield({
  year = new Date().getFullYear(),
  className = '',
  size = 200,
  srcOverride,
  transform,
}: ClubShieldProps) {
  // El medallón dorado con el año ocupa aproximadamente:
  // top: 77%, left: 43%, width: 14%, height: 6.5% de la imagen 1024×1024
  const overlayTop = size * 0.772;
  const overlayLeft = size * 0.432;
  const overlayW = size * 0.14;
  const overlayH = size * 0.065;
  const fontSize = Math.round(size * 0.068);

  const useCustom = !!(srcOverride && srcOverride.trim());
  const src = useCustom ? srcOverride! : '/club-escudo.png';
  const t = useCustom && transform ? transform : null;
  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  };
  if (t) {
    imgStyle.transform = `translate(${t.offsetX}%, ${t.offsetY}%) scale(${t.scale})`;
  }

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Escudo Club de Amigos LPMBE"
        style={imgStyle}
        draggable={false}
      />
      {/* Cubre el "2026" original y pone el año dinámico (sólo en escudo por defecto). */}
      {!useCustom && (
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
      )}
    </div>
  );
}

/**
 * Hook que carga los activos editables de /mi-cuenta desde la API pública
 * y devuelve el override + transform listos para pasar a <ClubShield />.
 * Reutilizable en cualquier client component.
 */
export function useClubLogoFromSettings(variant: 'header' | 'card' = 'header') {
  const [assets, setAssets] = useState<MiCuentaAssets | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/public/site-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { miCuentaAssets?: MiCuentaAssets | null };
        if (!cancelled) setAssets(json?.miCuentaAssets ?? null);
      } catch {
        // Fallback silencioso: usaremos el escudo por defecto del bundle.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cardOverride = getClubLogoOverride(assets, 'card');
  const headerOverride = getClubLogoOverride(assets, 'header');
  const resolvedVariant =
    variant === 'card' && cardOverride ? 'card' : 'header';

  return {
    srcOverride:
      variant === 'card' ? cardOverride ?? headerOverride : headerOverride,
    transform: getClubLogoTransform(assets, resolvedVariant),
  };
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
