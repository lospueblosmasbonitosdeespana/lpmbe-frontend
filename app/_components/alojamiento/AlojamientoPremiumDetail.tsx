'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

const HeroCarousel = dynamic(() => import('./HeroCarousel'), { ssr: false })
import { QuickStats } from './QuickStats'
import { AboutStory } from './AboutStory'
import { RoomsSection } from './RoomsSection'
import { ExperiencesSection } from './ExperiencesSection'
import { BreakfastSection } from './BreakfastSection'
import { AmenitiesSection } from './AmenitiesSection'
import { ReviewsSection } from './ReviewsSection'
import { PracticalInfo } from './PracticalInfo'
const LocationSection = dynamic(() => import('./LocationSection'), { ssr: false })
import { BookingBanner } from './BookingBanner'
import { MemberOffers } from './MemberOffers'
import { SocialSection } from './SocialSection'
import { JoinCTA } from './JoinCTA'

import { resolveLayout } from '@/app/_lib/landing/sections-layout'
import { ALOJAMIENTO_PUBLIC_SECTION_KEYS } from './alojamiento-sections'
import { LodgingConfigProvider, type LodgingPublicMeta } from './lodging-config-context'
import type { LodgingLandingConfig } from '@/app/gestion/asociacion/negocios/[slug]/_editor-alojamiento/lodging-types'

const TIPO_LABELS: Record<string, string> = {
  HOTEL: 'Hotel',
  CASA_RURAL: 'Casa rural',
}

interface Recurso {
  nombre?: string
  tipo?: string
  telefono?: string | null
  whatsapp?: string | null
  email?: string | null
  web?: string | null
  bookingUrl?: string | null
  fotoUrl?: string | null
  lat?: number | null
  lng?: number | null
  imagenes?: { id: number; url: string; alt: string | null; orden: number }[]
  pueblo?: { nombre?: string; provincia?: string | null; comunidad?: string | null } | null
  landingConfig?: any
}

interface Props {
  recurso?: Recurso | null
}

function parseV0(raw: unknown): Partial<LodgingLandingConfig> | null {
  if (!raw || typeof raw !== 'object') return null
  const v0 = (raw as { v0?: unknown }).v0
  if (!v0 || typeof v0 !== 'object') return null
  return v0 as Partial<LodgingLandingConfig>
}

export default function AlojamientoPremiumDetail({ recurso }: Props = {}) {
  const config = useMemo(() => parseV0(recurso?.landingConfig), [recurso?.landingConfig])

  const layout = resolveLayout(
    (recurso?.landingConfig as { v0?: { _layout?: unknown } } | null | undefined)?.v0?._layout,
    ALOJAMIENTO_PUBLIC_SECTION_KEYS,
  )

  const meta: LodgingPublicMeta = useMemo(() => {
    const sortedImages = recurso?.imagenes?.length
      ? [...recurso.imagenes].sort((a, b) => a.orden - b.orden)
      : []
    const heroImages =
      sortedImages.length > 0
        ? sortedImages.map((img) => ({ src: img.url, alt: img.alt ?? recurso?.nombre ?? '' }))
        : recurso?.fotoUrl
          ? [{ src: recurso.fotoUrl, alt: recurso?.nombre ?? '' }]
          : undefined
    const locationParts = [
      recurso?.pueblo?.nombre,
      recurso?.pueblo?.provincia,
      recurso?.pueblo?.comunidad,
    ].filter(Boolean)
    return {
      nombre: recurso?.nombre,
      heroImages,
      locationText: locationParts.length > 0 ? locationParts.join(' · ') : undefined,
      propertyTypeLabel: recurso?.tipo ? TIPO_LABELS[recurso.tipo] : undefined,
      telefono: recurso?.telefono,
      email: recurso?.email,
      web: recurso?.web,
      bookingUrl: recurso?.bookingUrl,
      whatsapp: recurso?.whatsapp,
      lat: recurso?.lat,
      lng: recurso?.lng,
    }
  }, [recurso])

  const renderers: Record<string, () => ReactNode> = {
    hero: () => <HeroCarousel />,
    quickStats: () => <QuickStats />,
    aboutStory: () => <AboutStory />,
    rooms: () => <RoomsSection />,
    experiences: () => <ExperiencesSection />,
    breakfast: () => <BreakfastSection />,
    amenities: () => <AmenitiesSection />,
    reviews: () => <ReviewsSection />,
    practicalInfo: () => <PracticalInfo />,
    location: () => <LocationSection />,
    booking: () => <BookingBanner />,
    memberOffers: () => <MemberOffers />,
    social: () => <SocialSection />,
    joinCTA: () => <JoinCTA />,
  }

  return (
    <LodgingConfigProvider config={config} meta={meta}>
      <main className="overflow-hidden">
        {layout.map(({ key, visible }) => {
          if (!visible) return null
          const node = renderers[key]?.()
          if (!node) return null
          return <Fragment key={key}>{node}</Fragment>
        })}
      </main>
    </LodgingConfigProvider>
  )
}

export { AlojamientoPremiumDetail }
