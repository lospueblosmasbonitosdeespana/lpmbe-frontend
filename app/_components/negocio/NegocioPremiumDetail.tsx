'use client';

import { type PlanNegocio, SERVICIOS_DISPONIBLES, SOCIAL_NETWORKS } from '@/lib/plan-features';
import PremiumHeroGallery from './PremiumHeroGallery';
import PremiumServicesGrid from './PremiumServicesGrid';
import PremiumDescription from './PremiumDescription';
import PremiumContactSection from './PremiumContactSection';
import PremiumLocationMap from './PremiumLocationMap';
import PremiumMemberOffers from './PremiumMemberOffers';
import PremiumMembershipCTA from './PremiumMembershipCTA';
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
  translations: Record<string, string>;
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

const TIPO_TAGLINES: Record<string, string> = {
  HOTEL: 'Donde la elegancia rural se encuentra con la auténtica hospitalidad',
  CASA_RURAL: 'Tu refugio de calma rodeado de naturaleza',
  RESTAURANTE: 'Cocina artesanal con producto local de temporada',
  BAR: 'Un rincón con encanto para los buenos momentos',
  COMERCIO: 'Producto local con historia y autenticidad',
  TIENDA_ARTESANIA: 'Artesanía hecha a mano con alma y tradición',
  BODEGA: 'Vinos con identidad y carácter del territorio',
  EXPERIENCIA: 'Una experiencia única para descubrir nuestra tierra',
  OTRO: 'Una experiencia premium del Club LPMBE',
};

export default function NegocioPremiumDetail({ recurso, puebloSlug, backHref, backLabel, translations }: NegocioPremiumProps) {
  const t = (key: string) => translations[key] ?? key;
  const tipoLabel = TIPO_LABELS[recurso.tipo] ?? recurso.tipo;
  const tagline = TIPO_TAGLINES[recurso.tipo] ?? TIPO_TAGLINES.OTRO;

  const images = recurso.imagenes?.length
    ? [...recurso.imagenes].sort((a, b) => a.orden - b.orden)
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

  const ofertas = (recurso.ofertas ?? []).filter((o) => o.destacada || (recurso.ofertas ?? []).length <= 3);

  // Stats: usa datos reales (rating Google, puntos Club, % descuento socios)
  const stats: { value: string; label: string }[] = [];
  if (recurso.ratingVerificado?.rating != null) {
    stats.push({
      value: recurso.ratingVerificado.rating.toFixed(1),
      label: `Valoración Google${recurso.ratingVerificado.reviews ? ` (${recurso.ratingVerificado.reviews} reseñas)` : ''}`,
    });
  }
  if (recurso.puntosClub != null && recurso.puntosClub > 0) {
    stats.push({
      value: String(recurso.puntosClub),
      label: 'Puntos Club LPMBE por visita',
    });
  }
  if (recurso.descuentoPorcentaje != null && recurso.descuentoPorcentaje > 0) {
    stats.push({
      value: `${recurso.descuentoPorcentaje}%`,
      label: 'Descuento exclusivo socios',
    });
  }

  // Cómo llegar — datos genéricos basados en la ubicación
  const accessInfo: { label: string; detail: string }[] = [];
  if (recurso.pueblo?.nombre) {
    accessInfo.push(
      { label: `Centro de ${recurso.pueblo.nombre}`, detail: 'A pocos minutos a pie del corazón del pueblo' },
      { label: 'Aparcamiento', detail: 'Zonas de aparcamiento gratuito en las inmediaciones' },
      { label: 'Transporte', detail: 'Bien comunicado por carretera con poblaciones cercanas' },
    );
  }

  // Texto introductorio del contacto
  const contactDescription = `Nuestro equipo está a tu disposición para reservas, consultas y para ayudarte a planificar tu visita perfecta a ${recurso.nombre}.`;

  // Nota sobre horarios
  const scheduleNote = recurso.cerradoTemporal
    ? 'Estamos cerrados temporalmente. Consulta nuestras redes sociales para conocer la fecha de reapertura.'
    : 'Te recomendamos consultar disponibilidad antes de tu visita, especialmente en temporada alta y festivos.';

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
        tagline={tagline}
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
          stats={stats}
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
        contactDescription={contactDescription}
        scheduleNote={scheduleNote}
        t={t}
      />

      {(recurso.lat && recurso.lng) && (
        <PremiumLocationMap
          lat={recurso.lat}
          lng={recurso.lng}
          nombre={recurso.nombre}
          pueblo={recurso.pueblo}
          localidad={recurso.localidad}
          accessInfo={accessInfo}
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

      <PremiumMembershipCTA t={t} />
    </main>
  );
}
