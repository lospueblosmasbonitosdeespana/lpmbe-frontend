'use client'

import { Fragment, type ReactNode } from 'react'
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

interface Props {
  recurso?: { landingConfig?: any } | null
}

export default function AlojamientoPremiumDetail({ recurso }: Props = {}) {
  const layout = resolveLayout(
    (recurso?.landingConfig as { v0?: { _layout?: unknown } } | null | undefined)?.v0?._layout,
    ALOJAMIENTO_PUBLIC_SECTION_KEYS,
  )

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

export { AlojamientoPremiumDetail }
