'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { ActivityLandingConfig } from '@/app/gestion/asociacion/negocios/[slug]/_editor-actividad/activity-config'

export interface ActivityPublicMeta {
  nombre?: string
  locationText?: string
  heroImages?: { src: string; alt: string }[]
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  web?: string | null
  bookingUrl?: string | null
  lat?: number | null
  lng?: number | null
}

interface CtxValue {
  config: Partial<ActivityLandingConfig> | null
  meta: ActivityPublicMeta
}

const Ctx = createContext<CtxValue>({ config: null, meta: {} })

export function ActivityConfigProvider({
  config,
  meta,
  children,
}: {
  config: Partial<ActivityLandingConfig> | null
  meta?: ActivityPublicMeta
  children: ReactNode
}) {
  return <Ctx.Provider value={{ config, meta: meta ?? {} }}>{children}</Ctx.Provider>
}

export function useActivitySlice<K extends keyof ActivityLandingConfig>(
  key: K,
): Partial<ActivityLandingConfig[K]> | null {
  const ctx = useContext(Ctx)
  const slice = ctx.config?.[key]
  return (slice ?? null) as Partial<ActivityLandingConfig[K]> | null
}

export function useActivityMeta(): ActivityPublicMeta {
  return useContext(Ctx).meta
}
