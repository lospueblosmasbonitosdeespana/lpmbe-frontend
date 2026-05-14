'use client'

import { Fragment, type ReactNode } from 'react'
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

interface Props {
  recurso?: { landingConfig?: any } | null
}

export default function ActividadPremiumDetail({ recurso }: Props = {}) {
  const layout = resolveLayout(
    (recurso?.landingConfig as { v0?: { _layout?: unknown } } | null | undefined)?.v0?._layout,
    ACTIVIDAD_PUBLIC_SECTION_KEYS,
  )

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
    <main className="overflow-hidden">
      {layout.map(({ key, visible }) => {
        if (!visible) return null
        const node = renderers[key]?.()
        if (!node) return null
        return <Fragment key={key}>{node}</Fragment>
      })}
    </main>
  )
}

export { ActividadPremiumDetail }
