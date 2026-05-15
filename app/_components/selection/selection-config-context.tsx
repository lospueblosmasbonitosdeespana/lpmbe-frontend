'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { HotelConfig } from './types'

export interface SelectionPublicMeta {
  name: string
  location: HotelConfig['location']
  social: HotelConfig['social']
  images: string[]
}

interface Ctx {
  config: HotelConfig | null
  meta: SelectionPublicMeta
}

const SelectionCtx = createContext<Ctx>({
  config: null,
  meta: { name: '', location: { village: '', region: '', address: '', phone: '', email: '' }, social: {}, images: [] },
})

export function SelectionConfigProvider({
  config,
  meta,
  children,
}: {
  config: HotelConfig | null
  meta: SelectionPublicMeta
  children: ReactNode
}) {
  const value = useMemo(() => ({ config, meta }), [config, meta])
  return <SelectionCtx.Provider value={value}>{children}</SelectionCtx.Provider>
}

export function useSelectionConfig(): HotelConfig | null {
  return useContext(SelectionCtx).config
}

export function useSelectionMeta(): SelectionPublicMeta {
  return useContext(SelectionCtx).meta
}
