'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { HeroVideo } from './HeroVideo'
import { ActivityHighlights } from './ActivityHighlights'
import { AboutStory } from './AboutStory'
import { ActivitiesGrid } from './ActivitiesGrid'
import { FeaturedExperience } from './FeaturedExperience'
import { GuidesTeam } from './GuidesTeam'
import { SeasonCalendar } from './SeasonCalendar'
import { TestimonialsSection } from './TestimonialsSection'
import { SafetyAndEquipment } from './SafetyAndEquipment'
import { PracticalInfo } from './PracticalInfo'
const LocationMap = dynamic(() => import('./LocationMap'), { ssr: false })
import { BookingBanner } from './BookingBanner'
import { MemberOffers } from './MemberOffers'
import { JoinCTA } from './JoinCTA'

import { resolveLayout } from '@/app/_lib/landing/sections-layout'
import { ACTIVIDAD_PUBLIC_SECTION_KEYS } from './actividad-sections'
import { ActivityConfigProvider, type ActivityPublicMeta } from './activity-config-context'
import type { ActivityLandingConfig } from '@/app/gestion/asociacion/negocios/[slug]/_editor-actividad/activity-config'

interface Recurso {
  id?: number
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

function parseV0(raw: unknown): Partial<ActivityLandingConfig> | null {
  if (!raw || typeof raw !== 'object') return null
  const v0 = (raw as { v0?: unknown }).v0
  if (!v0 || typeof v0 !== 'object') return null
  return v0 as Partial<ActivityLandingConfig>
}

export default function ActividadPremiumDetail({ recurso }: Props = {}) {
  const config = useMemo(() => parseV0(recurso?.landingConfig), [recurso?.landingConfig])

  const layout = resolveLayout(
    (recurso?.landingConfig as { v0?: { _layout?: unknown } } | null | undefined)?.v0?._layout,
    ACTIVIDAD_PUBLIC_SECTION_KEYS,
  )

  const meta: ActivityPublicMeta = useMemo(() => {
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
      id: recurso?.id,
      nombre: recurso?.nombre,
      heroImages,
      locationText: locationParts.length > 0 ? locationParts.join(', ') : undefined,
      telefono: recurso?.telefono,
      whatsapp: recurso?.whatsapp,
      email: recurso?.email,
      web: recurso?.web,
      bookingUrl: recurso?.bookingUrl,
      lat: recurso?.lat,
      lng: recurso?.lng,
    }
  }, [recurso])

  const renderers: Record<string, () => ReactNode> = {
    hero: () => <HeroVideo />,
    highlights: () => <ActivityHighlights />,
    aboutStory: () => <AboutStory />,
    activitiesGrid: () => <ActivitiesGrid />,
    featured: () => <FeaturedExperience />,
    guidesTeam: () => <GuidesTeam />,
    seasonCalendar: () => <SeasonCalendar />,
    testimonials: () => <TestimonialsSection />,
    safety: () => <SafetyAndEquipment />,
    practicalInfo: () => <PracticalInfo />,
    location: () => <LocationMap />,
    booking: () => <BookingBanner />,
    memberOffers: () => <MemberOffers />,
    joinCTA: () => <JoinCTA />,
  }

  return (
    <ActivityConfigProvider config={config} meta={meta}>
      <main className="overflow-hidden">
        {layout.map(({ key, visible }) => {
          if (!visible) return null
          const node = renderers[key]?.()
          if (!node) return null
          return <Fragment key={key}>{node}</Fragment>
        })}
      </main>
    </ActivityConfigProvider>
  )
}

export { ActividadPremiumDetail }
