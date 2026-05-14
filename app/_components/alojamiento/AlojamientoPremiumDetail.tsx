'use client'

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

export default function AlojamientoPremiumDetail() {
  return (
    <main className="overflow-hidden">
      <HeroCarousel />
      <QuickStats />
      <AboutStory />
      <RoomsSection />
      <ExperiencesSection />
      <BreakfastSection />
      <AmenitiesSection />
      <ReviewsSection />
      <PracticalInfo />
      <LocationSection />
      <BookingBanner />
      <MemberOffers />
      <SocialSection />
      <JoinCTA />
    </main>
  )
}

export { AlojamientoPremiumDetail }
