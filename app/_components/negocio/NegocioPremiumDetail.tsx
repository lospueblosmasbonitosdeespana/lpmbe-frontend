'use client';

import { getPlanFeatures, type PlanNegocio, SERVICIOS_DISPONIBLES, SOCIAL_NETWORKS } from '@/lib/plan-features';
import PremiumHeroGallery from './PremiumHeroGallery';
import PremiumServicesGrid from './PremiumServicesGrid';
import PremiumDescription from './PremiumDescription';
import PremiumContactSection from './PremiumContactSection';
import PremiumLocationMap from './PremiumLocationMap';
import PremiumMemberOffers from './PremiumMemberOffers';
import Link from 'next/link';

type Imagen = { id: number; url: string; alt: string | null; orden: number };

type OfertaPublic = {
  id: number;
  tipoOferta: string;
  titulo: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  valorFijoCents?: number | null;
  aplicaA?: string | null;
  condicionTexto?: string | null;
  importeMinimoCents?: number | null;
  minNoches?: number | null;
  minComensales?: number | null;
  destacada: boolean;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
};

export type NegocioPremiumProps = {
  recurso: {
    id: number;
    nombre: string;
    tipo: string;
    scope: string;
    slug: string;
    descripcion?: string | null;
    descuentoPorcentaje?: number | null;
    telefono?: string | null;
    email?: string | null;
    web?: string | null;
    whatsapp?: string | null;
    bookingUrl?: string | null;
    socialLinks?: Record<string, string> | null;
    servicios?: string[] | null;
    contacto?: string | null;
    fotoUrl?: string | null;
    horarios?: string | null;
    cerradoTemporal?: boolean;
    lat?: number | null;
    lng?: number | null;
    localidad?: string | null;
    planNegocio?: PlanNegocio;
    puntosClub?: number | null;
    imprescindible?: boolean;
    ratingVerificado?: { rating: number | null; reviews: number | null } | null;
    pueblo?: { id: number; nombre: string; slug: string } | null;
    imagenes?: Imagen[];
    horariosSemana?: Array<{
      diaSemana: number;
      abierto: boolean;
      horaAbre: string | null;
      horaCierra: string | null;
    }>;
    ofertas?: OfertaPublic[];
  };
  puebloSlug: string;
  backHref: string;
  backLabel: string;
  t: (key: string) => string;
};

const TIPO_LABELS: Record<string, string> = {
  HOTEL: 'Hotel',
  CASA_RURAL: 'Casa rural',
  RESTAURANTE: 'Restaurante',
  BAR: 'Bar / Cafetería',
  COMERCIO: 'Comercio',
  TIENDA_ARTESANIA: 'Tienda de artesanía',
  BODEGA: 'Bodega',
  EXPERIENCIA: 'Experiencia',
  OTRO: 'Otro',
};

export default function NegocioPremiumDetail({ recurso, puebloSlug, backHref, backLabel, t }: NegocioPremiumProps) {
  const plan = recurso.planNegocio ?? 'FREE';
  const features = getPlanFeatures(plan);
  const tipoLabel = TIPO_LABELS[recurso.tipo] ?? recurso.tipo;

  const images = recurso.imagenes?.length
    ? recurso.imagenes.sort((a, b) => a.orden - b.orden)
    : recurso.fotoUrl
      ? [{ id: 0, url: recurso.fotoUrl, alt: recurso.nombre, orden: 0 }]
      : [];

  const servicios = (recurso.servicios ?? [])
    .map((key) => SERVICIOS_DISPONIBLES.find((s) => s.key === key))
    .filter(Boolean) as { key: string; label: string; icon: string }[];

  const socialLinks = recurso.socialLinks
    ? Object.entries(recurso.socialLinks)
        .filter(([, url]) => url)
        .map(([key, url]) => {
          const net = SOCIAL_NETWORKS.find((n) => n.key === key);
          return { key, url: url as string, label: net?.label ?? key };
        })
    : [];

  const ofertas = (recurso.ofertas ?? []).filter((o) => o.destacada);

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 py-3 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link>
        <span className="mx-1.5">/</span>
        <Link href={backHref} className="hover:text-foreground">{backLabel}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground font-medium">{recurso.nombre}</span>
      </nav>

      <PremiumHeroGallery
        images={images}
        nombre={recurso.nombre}
        tipoLabel={tipoLabel}
        pueblo={recurso.pueblo}
        imprescindible={recurso.imprescindible}
        ratingVerificado={recurso.ratingVerificado}
        cerradoTemporal={recurso.cerradoTemporal}
        t={t}
      />

      {servicios.length > 0 && (
        <PremiumServicesGrid servicios={servicios} t={t} />
      )}

      {recurso.descripcion && (
        <PremiumDescription
          descripcion={recurso.descripcion}
          secondaryImage={images[1]?.url}
          nombre={recurso.nombre}
          ratingVerificado={recurso.ratingVerificado}
          puntosClub={recurso.puntosClub}
          t={t}
        />
      )}

      <PremiumContactSection
        telefono={recurso.telefono}
        email={recurso.email}
        web={recurso.web}
        whatsapp={recurso.whatsapp}
        bookingUrl={recurso.bookingUrl}
        horariosSemana={recurso.horariosSemana}
        socialLinks={socialLinks}
        t={t}
      />

      {(recurso.lat && recurso.lng) && (
        <PremiumLocationMap
          lat={recurso.lat}
          lng={recurso.lng}
          nombre={recurso.nombre}
          pueblo={recurso.pueblo}
          localidad={recurso.localidad}
          t={t}
        />
      )}

      {ofertas.length > 0 && (
        <PremiumMemberOffers
          ofertas={ofertas}
          descuentoPorcentaje={recurso.descuentoPorcentaje}
          t={t}
        />
      )}
    </main>
  );
}
