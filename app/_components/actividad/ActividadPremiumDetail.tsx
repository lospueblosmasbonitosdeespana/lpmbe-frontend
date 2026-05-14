'use client'

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

export default function ActividadPremiumDetail() {
  return (
    <main className="overflow-hidden">
      <HeroVideo />
      <ActivityHighlights />
      <AboutStory />
      <ActivitiesGrid />
      <FeaturedExperience />
      <GuidesTeam />
      <SeasonCalendar />
      <TestimonialsSection />
      <SafetyAndEquipment />
      <PracticalInfo />
      <LocationMap />
      <BookingBanner />
      <MemberOffers />
      <JoinCTA />
    </main>
  )
}

export { ActividadPremiumDetail }
