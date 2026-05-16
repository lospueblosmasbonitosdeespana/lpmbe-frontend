'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { LodgingLandingConfig } from '@/app/gestion/asociacion/negocios/[slug]/_editor-alojamiento/lodging-types'

/**
 * Context para inyectar el `LodgingLandingConfig` (schema V0 del editor) al
 * árbol de la página pública premium de alojamiento. Cada sub-componente
 * lee su slice con `useLodgingSlice('hero')` etc. y, si no hay valor,
 * cae a sus defaults internos.
 */

export interface LodgingPublicMeta {
  /** ID del negocio en BD (necesario para enviar solicitudes de reserva). */
  id?: number
  /** Nombre del negocio (sobreescribe el del config si está). */
  nombre?: string
  /** Localidad para mostrar en el hero. */
  locationText?: string
  /** Imágenes reales del negocio para el carrusel hero. */
  heroImages?: { src: string; alt: string }[]
  /** Tipo (etiqueta) para el badge del hero (Hotel rural / Casa rural...). */
  propertyTypeLabel?: string
  telefono?: string | null
  email?: string | null
  web?: string | null
  bookingUrl?: string | null
  whatsapp?: string | null
  lat?: number | null
  lng?: number | null
}

interface CtxValue {
  config: Partial<LodgingLandingConfig> | null
  meta: LodgingPublicMeta
}

const Ctx = createContext<CtxValue>({ config: null, meta: {} })

export function LodgingConfigProvider({
  config,
  meta,
  children,
}: {
  config: Partial<LodgingLandingConfig> | null
  meta?: LodgingPublicMeta
  children: ReactNode
}) {
  return <Ctx.Provider value={{ config, meta: meta ?? {} }}>{children}</Ctx.Provider>
}

export function useLodgingSlice<K extends keyof LodgingLandingConfig>(
  key: K,
): Partial<LodgingLandingConfig[K]> | null {
  const ctx = useContext(Ctx)
  const slice = ctx.config?.[key]
  return (slice ?? null) as Partial<LodgingLandingConfig[K]> | null
}

export function useLodgingMeta(): LodgingPublicMeta {
  return useContext(Ctx).meta
}
