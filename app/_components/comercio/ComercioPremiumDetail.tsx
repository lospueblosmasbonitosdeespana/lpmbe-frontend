'use client'

import { Fragment, useMemo, type ReactNode } from 'react'

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
import { resolveLayout } from '@/app/_lib/landing/sections-layout'
import { COMERCIO_PUBLIC_SECTION_KEYS } from './comercio-sections'

/**
 * Orquestador de la plantilla pública premium para comercio / artesanía /
 * tipos genéricos (TIENDA_ARTESANIA, COMERCIO).
 *
 * Renderizado:
 *   1. parsea `recurso.landingConfig.v0` como `LandingConfig` (o cae a
 *      `defaultConfig`).
 *   2. resuelve la "visibilidad y orden" desde `landingConfig.v0._layout`
 *      (gestionado por el editor) o, en ausencia, usa el orden por defecto
 *      del template con todas las secciones visibles.
 *   3. rinde sólo las secciones marcadas como visibles, en el orden
 *      indicado.
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

  const layout = useMemo(
    () => resolveLayout((recurso.landingConfig as { v0?: { _layout?: unknown } })?.v0?._layout, COMERCIO_PUBLIC_SECTION_KEYS),
    [recurso.landingConfig],
  )

  const renderers: Record<string, () => ReactNode> = {
    hero:          () => <HeroSection config={heroConfig} />,
    stats:         () => <StatsSection stats={config.stats} />,
    history:       () => <HistorySection config={config.history} />,
    products:      () => <ProductsSection products={config.products} />,
    process:       () => <ProcessSection steps={config.process} />,
    obrador:       () => <ObradorSection config={config.obrador} />,
    experiences:   () => <ExperiencesSection experiences={config.experiences} />,
    awards:        () => <AwardsSection config={config.awards} />,
    testimonials:  () => <TestimonialsSection testimonials={config.testimonials} />,
    practicalInfo: () => <PracticalInfoSection info={config.practicalInfo} />,
    location:      () => <LocationSection config={locationConfig} />,
    ctaReserva:    () => <CTAReservaSection config={ctaConfig} negocioId={recurso.id} negocioNombre={recurso.nombre} />,
    clubOffers:    () => <ClubOffersSection config={config.clubOffers} />,
    social:        () => <SocialSection links={config.socialLinks} />,
    clubCTA:       () => <ClubCTASection config={config.clubCTA} />,
  }

  return (
    <div data-theme="comercio">
      <main className="grain-overlay relative">
        {layout.map(({ key, visible }) => {
          if (!visible) return null
          const render = renderers[key]
          if (!render) return null
          return <Fragment key={key}>{render()}</Fragment>
        })}
        <MobileStickyBar visitHref="#reserva" shopHref="#productos" />
        <div className="h-16 md:hidden" />
      </main>
    </div>
  )
}
