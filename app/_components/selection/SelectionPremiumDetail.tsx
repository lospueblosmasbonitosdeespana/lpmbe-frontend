'use client'

import { useMemo, Fragment, type ReactNode } from 'react'
import { resolveLayout } from '@/app/_lib/landing/sections-layout'
import { SELECTION_PUBLIC_SECTION_KEYS } from './selection-sections'
import { SelectionConfigProvider, type SelectionPublicMeta } from './selection-config-context'
import { defaultHotelConfig } from './defaultConfig'
import type { HotelConfig } from './types'

import NavBar from './NavBar'
import HeroSection from './HeroSection'
import StatsBar from './StatsBar'
import EditorialStory from './EditorialStory'
import AwardsSection from './AwardsSection'
import RoomsCarousel from './RoomsCarousel'
import GastronomySection from './GastronomySection'
import SpaSection from './SpaSection'
import GallerySection from './GallerySection'
import PressSection from './PressSection'
import SurroundingsSection from './SurroundingsSection'
import ExperiencesSection from './ExperiencesSection'
import OffersSection from './OffersSection'
import ReviewsSection from './ReviewsSection'
import PracticalInfoSection from './PracticalInfoSection'
import BookingBanner from './BookingBanner'
import Footer from './Footer'

interface Props {
  recurso?: {
    id: number
    nombre: string
    slug?: string | null
    descripcion?: string | null
    telefono?: string | null
    email?: string | null
    web?: string | null
    whatsapp?: string | null
    lat?: number | null
    lng?: number | null
    localidad?: string | null
    provincia?: string | null
    comunidad?: string | null
    landingConfig?: unknown
    imagenes?: Array<{ url: string; descripcion?: string | null; orden?: number | null }>
    pueblo?: { nombre?: string; slug?: string } | null
    socialLinks?: Record<string, string> | null
  }
}

function parseV0(raw: unknown): HotelConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  if (obj.v0 && typeof obj.v0 === 'object') return obj.v0 as unknown as HotelConfig
  if (obj.name && obj.stats) return raw as unknown as HotelConfig
  return null
}

export default function SelectionPremiumDetail({ recurso }: Props) {
  const config = useMemo(() => {
    const v0 = recurso?.landingConfig ? parseV0(recurso.landingConfig) : null
    return v0 ?? defaultHotelConfig
  }, [recurso?.landingConfig])

  const mergedConfig = useMemo<HotelConfig>(() => {
    if (!recurso) return config

    const locationVillage = recurso.localidad
      ?? recurso.pueblo?.nombre
      ?? config.location.village
    const region = [recurso.provincia, recurso.comunidad].filter(Boolean).join(', ') || config.location.region

    return {
      ...config,
      name: recurso.nombre || config.name,
      heroImage: recurso.imagenes?.[0]?.url ?? config.heroImage,
      location: {
        ...config.location,
        village: locationVillage,
        region,
        phone: recurso.telefono ?? config.location.phone,
        email: recurso.email ?? config.location.email,
        coordinates: recurso.lat != null && recurso.lng != null
          ? { lat: recurso.lat, lng: recurso.lng }
          : config.location.coordinates,
      },
      social: {
        instagram: recurso.socialLinks?.instagram ?? config.social.instagram,
        facebook: recurso.socialLinks?.facebook ?? config.social.facebook,
        twitter: recurso.socialLinks?.twitter ?? config.social.twitter,
      },
    }
  }, [recurso, config])

  const layout = resolveLayout(
    (recurso?.landingConfig as { v0?: { _layout?: unknown } } | null | undefined)?.v0?._layout,
    SELECTION_PUBLIC_SECTION_KEYS,
  )

  const meta: SelectionPublicMeta = useMemo(() => ({
    name: mergedConfig.name,
    location: mergedConfig.location,
    social: mergedConfig.social,
    images: recurso?.imagenes?.map((i) => i.url) ?? [],
  }), [mergedConfig, recurso?.imagenes])

  const renderers: Record<string, () => ReactNode> = {
    hero: () => (
      <HeroSection config={{
        name: mergedConfig.name,
        tagline: mergedConfig.tagline,
        location: mergedConfig.location,
        heroImage: mergedConfig.heroImage,
        badges: mergedConfig.badges,
      }} />
    ),
    stats: () => <StatsBar stats={mergedConfig.stats} />,
    story: () => <EditorialStory story={mergedConfig.story} />,
    awards: () => <AwardsSection awards={mergedConfig.awards} />,
    rooms: () => <RoomsCarousel rooms={mergedConfig.rooms} />,
    gastronomy: () => <GastronomySection gastronomy={mergedConfig.gastronomy} />,
    spa: () => <SpaSection spa={mergedConfig.spa} />,
    gallery: () => <GallerySection gallery={mergedConfig.gallery} />,
    press: () => <PressSection press={mergedConfig.press} />,
    surroundings: () => <SurroundingsSection surroundings={mergedConfig.surroundings} location={mergedConfig.location} />,
    experiences: () => <ExperiencesSection experiences={mergedConfig.experiences} />,
    offers: () => <OffersSection offers={mergedConfig.offers} />,
    reviews: () => <ReviewsSection reviews={mergedConfig.reviews} />,
    practicalInfo: () => <PracticalInfoSection info={mergedConfig.practicalInfo} />,
    booking: () => <BookingBanner phone={mergedConfig.location.phone} email={mergedConfig.location.email} negocioId={recurso?.id} negocioNombre={recurso?.nombre} />,
    footer: () => <Footer name={mergedConfig.name} location={mergedConfig.location} social={mergedConfig.social} />,
  }

  return (
    <SelectionConfigProvider config={config} meta={meta}>
      <div data-theme="selection">
        <NavBar name={mergedConfig.name} location={mergedConfig.location} />
        <main className="min-h-screen" style={{ background: 'var(--hotel-charcoal)' }}>
          {layout.map(({ key, visible }) => {
            if (!visible) return null
            if (key === 'hero') return <Fragment key={key}>{renderers.hero()}</Fragment>
            const node = renderers[key]?.()
            if (!node) return null
            return <Fragment key={key}>{node}</Fragment>
          })}
        </main>
      </div>
    </SelectionConfigProvider>
  )
}
