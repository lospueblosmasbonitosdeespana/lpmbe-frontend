'use client'

import { useMemo } from 'react'

import { HeroSection } from './hero-section'
import { StatsSection } from './stats-section'
import { HistorySection } from './history-section'
import { ProductsSection } from './products-section'
import { ProcessSection } from './process-section'
import { ObradorSection } from './obrador-section'
import { ExperiencesSection } from './experiences-section'
import { AwardsSection } from './awards-section'
import { TestimonialsSection } from './testimonials-section'
import { PracticalInfoSection } from './practical-info-section'
import { LocationSection } from './location-section'
import { CTAReservaSection } from './cta-reserva-section'
import { ClubOffersSection } from './club-offers-section'
import { SocialSection } from './social-section'
import { ClubCTASection } from './club-cta-section'
import { MobileStickyBar } from './mobile-sticky-bar'

import type { LandingConfig } from './comercio-config'
import { defaultConfig } from './comercio-default-config'

/**
 * Orquestador de la plantilla pública premium para comercio / artesanía /
 * tipos genéricos (TIENDA_ARTESANIA, COMERCIO).
 *
 * Recibe el `landingConfig` del recurso. Por ahora, mientras los negocios
 * reales no tengan landingConfig propio, prioriza:
 *   1. raw.v0 (formato del editor V0 cuando exista)
 *   2. raw (legacy si tuviera estructura compatible)
 *   3. defaultConfig (datos demo "Quesos del Pirineo Pardo")
 *
 * Cuando llegue el editor V0 de comercio, el adapter conectará el legacy
 * con el V0 al guardar (mismo patrón que en RestauranteLandingEditor).
 */
function parseLandingConfig(raw: unknown): LandingConfig {
  if (!raw || typeof raw !== 'object') return defaultConfig
  const v0 = (raw as { v0?: Partial<LandingConfig> }).v0
  if (v0 && typeof v0 === 'object' && (v0.hero || v0.products || v0.history)) {
    return { ...defaultConfig, ...v0 }
  }
  return defaultConfig
}

interface Recurso {
  id: number
  nombre: string
  slug: string | null
  fotoUrl?: string | null
  telefono?: string | null
  whatsapp?: string | null
  bookingUrl?: string | null
  web?: string | null
  email?: string | null
  lat?: number | null
  lng?: number | null
  landingConfig?: any
  pueblo?: { id: number; nombre: string; slug: string; provincia?: string | null; comunidad?: string | null } | null
}

interface ComercioPremiumDetailProps {
  recurso: Recurso
}

export default function ComercioPremiumDetail({ recurso }: ComercioPremiumDetailProps) {
  const config = useMemo(() => parseLandingConfig(recurso.landingConfig), [recurso.landingConfig])

  // Sobrescritura defensiva: si el negocio real tiene contacto en BD,
  // úsalo en los CTAs aunque el config sea demo.
  const heroConfig = useMemo(() => ({
    ...config.hero,
    title: recurso.nombre || config.hero.title,
  }), [config.hero, recurso.nombre])

  const ctaConfig = useMemo(() => {
    const base = config.ctaReserva
    return {
      ...base,
      buttons: {
        reserva: base.buttons.reserva,
        llamar: recurso.telefono
          ? { text: 'Llamar', href: `tel:${recurso.telefono.replace(/\s+/g, '')}` }
          : base.buttons.llamar,
        whatsapp: recurso.whatsapp
          ? { text: 'WhatsApp', href: `https://wa.me/${recurso.whatsapp.replace(/[^\d]/g, '')}` }
          : base.buttons.whatsapp,
      },
    }
  }, [config.ctaReserva, recurso.telefono, recurso.whatsapp])

  const locationConfig = useMemo(() => ({
    ...config.location,
    coordinates: {
      lat: typeof recurso.lat === 'number' ? recurso.lat : config.location.coordinates.lat,
      lng: typeof recurso.lng === 'number' ? recurso.lng : config.location.coordinates.lng,
    },
    provincia: recurso.pueblo?.provincia
      ? `${recurso.pueblo.provincia}${recurso.pueblo.comunidad ? `, ${recurso.pueblo.comunidad}` : ''}`
      : config.location.provincia,
  }), [config.location, recurso.lat, recurso.lng, recurso.pueblo])

  return (
    <div data-theme="comercio">
    <main className="grain-overlay relative">
      <HeroSection config={heroConfig} />
      <StatsSection stats={config.stats} />
      <HistorySection config={config.history} />
      <ProductsSection products={config.products} />
      <ProcessSection steps={config.process} />
      <ObradorSection config={config.obrador} />
      <ExperiencesSection experiences={config.experiences} />
      <AwardsSection config={config.awards} />
      <TestimonialsSection testimonials={config.testimonials} />
      <PracticalInfoSection info={config.practicalInfo} />
      <LocationSection config={locationConfig} />
      <CTAReservaSection config={ctaConfig} />
      <ClubOffersSection config={config.clubOffers} />
      <SocialSection links={config.socialLinks} />
      <ClubCTASection config={config.clubCTA} />
      <MobileStickyBar visitHref="#reserva" shopHref="#productos" />
      <div className="h-16 md:hidden" />
    </main>
    </div>
  )
}
