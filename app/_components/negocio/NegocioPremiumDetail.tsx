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

// Descripción demo cuando el negocio no la tiene aún configurada
const TIPO_DESCRIPCION_DEMO: Record<string, (nombre: string, pueblo?: string) => string> = {
  HOTEL: (nombre, pueblo) =>
    `<p>Enclavado en el corazón ${pueblo ? `de ${pueblo}` : 'del Pirineo'}, ${nombre} ofrece una experiencia que combina el encanto de la tradición con el confort de la hostelería contemporánea. Cada habitación ha sido pensada para transmitir calma y autenticidad.</p>` +
    `<p>Nuestro equipo cuida hasta el último detalle para que tu estancia sea memorable: desde el desayuno casero con productos de proximidad hasta las recomendaciones personalizadas para descubrir el entorno.</p>` +
    `<p>Tanto si buscas una escapada romántica, una aventura en familia o un retiro tranquilo, encontrarás el espacio ideal para desconectar y reconectar con lo esencial.</p>`,
  CASA_RURAL: (nombre, pueblo) =>
    `<p>${nombre} es un alojamiento singular ${pueblo ? `en ${pueblo}` : 'en plena naturaleza'} que invita a vivir la esencia del entorno rural sin renunciar al confort. Una casa con historia, restaurada con materiales nobles y mucho cariño.</p>` +
    `<p>Cada rincón ha sido cuidado para ofrecer una experiencia auténtica: desde la chimenea encendida en invierno hasta el jardín en flor en primavera. El silencio, las estrellas y el aroma del campo son parte del viaje.</p>`,
  RESTAURANTE: (nombre) =>
    `<p>${nombre} es mucho más que un restaurante: es una declaración de amor por el producto local y por la cocina hecha sin prisa. Cada plato cuenta una historia del territorio.</p>` +
    `<p>Nuestra carta evoluciona con las estaciones, trabajando con productores cercanos y técnicas que respetan al máximo la materia prima. Un viaje gastronómico para los sentidos.</p>`,
  RESTAURANTE_DEFAULT: (nombre) =>
    `<p>${nombre} ofrece una experiencia gastronómica única en la zona, con una propuesta cuidada y un servicio personalizado.</p>`,
};

function getDescripcionDemo(tipo: string, nombre: string, pueblo?: string): string {
  const fn = TIPO_DESCRIPCION_DEMO[tipo] ?? TIPO_DESCRIPCION_DEMO.RESTAURANTE_DEFAULT;
  return fn(nombre, pueblo);
}

// Stats demo según el tipo de negocio cuando no hay datos reales
function getStatsDemo(tipo: string): { value: string; label: string }[] {
  switch (tipo) {
    case 'HOTEL':
      return [
        { value: '4.8', label: 'Valoración huéspedes' },
        { value: '24/7', label: 'Atención personalizada' },
        { value: '100%', label: 'Recomendado por socios' },
      ];
    case 'CASA_RURAL':
      return [
        { value: '4.9', label: 'Valoración huéspedes' },
        { value: '5+', label: 'Años cuidando del entorno' },
        { value: '100%', label: 'Producto local' },
      ];
    case 'RESTAURANTE':
    case 'BAR':
    case 'BODEGA':
      return [
        { value: '4.7', label: 'Valoración Google' },
        { value: 'Km0', label: 'Producto de proximidad' },
        { value: '100%', label: 'Cocina de temporada' },
      ];
    default:
      return [
        { value: '4.8', label: 'Valoración clientes' },
        { value: '100%', label: 'Recomendado por socios' },
        { value: 'Premium', label: 'Club LPMBE' },
      ];
  }
}

// Ofertas demo cuando el negocio no tiene aún sus ofertas configuradas
function getOfertasDemo(tipo: string): OfertaPublic[] {
  if (tipo === 'HOTEL' || tipo === 'CASA_RURAL') {
    return [
      {
        id: -1,
        tipoOferta: 'REGALO',
        titulo: 'Botella de cava de bienvenida',
        descripcion: 'Te recibimos con una botella de cava local en la habitación al hacer el check-in.',
        descuentoPorcentaje: null,
        valorFijoCents: null,
        condicionTexto: 'Para socios del Club LPMBE en estancias de mínimo 2 noches.',
        destacada: true,
      },
      {
        id: -2,
        tipoOferta: 'DESCUENTO',
        titulo: '10% en estancias largas',
        descripcion: 'Disfruta de un 10% de descuento en reservas de 3 noches o más.',
        descuentoPorcentaje: 10,
        valorFijoCents: null,
        condicionTexto: 'Aplicable a la tarifa flexible y no acumulable con otras promociones.',
        destacada: true,
      },
      {
        id: -3,
        tipoOferta: 'EXPERIENCIA',
        titulo: 'Late check-out hasta las 14:00',
        descripcion: 'Disfruta de la habitación hasta las 14:00 sin coste adicional.',
        descuentoPorcentaje: null,
        valorFijoCents: null,
        condicionTexto: 'Sujeto a disponibilidad. Solicítalo al hacer la reserva.',
        destacada: true,
      },
    ];
  }
  return [
    {
      id: -1,
      tipoOferta: 'BEBIDA',
      titulo: 'Copa de vino de la casa de bienvenida',
      descripcion: 'Te invitamos a una copa de nuestro vino de la casa al inicio de la comida.',
      descuentoPorcentaje: null,
      valorFijoCents: null,
      condicionTexto: 'Para socios del Club LPMBE. Una copa por persona.',
      destacada: true,
    },
    {
      id: -2,
      tipoOferta: 'DESCUENTO',
      titulo: '10% en menú degustación',
      descripcion: 'Descuento exclusivo para socios en nuestro menú degustación de temporada.',
      descuentoPorcentaje: 10,
      valorFijoCents: null,
      condicionTexto: 'Reserva previa obligatoria. No acumulable con otras ofertas.',
      destacada: true,
    },
    {
      id: -3,
      tipoOferta: 'EXPERIENCIA',
      titulo: 'Cata de vinos guiada',
      descripcion: 'Disfruta de una cata privada con nuestro sumiller para descubrir vinos de la zona.',
      descuentoPorcentaje: null,
      valorFijoCents: null,
      condicionTexto: 'Bajo reserva con 48h de antelación. Mínimo 2 personas.',
      destacada: true,
    },
  ];
}

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

  const ofertasReales = (recurso.ofertas ?? []).filter((o) => o.destacada || (recurso.ofertas ?? []).length <= 3);
  const ofertas: OfertaPublic[] = ofertasReales.length > 0 ? ofertasReales : getOfertasDemo(recurso.tipo);

  // Stats: usa datos reales (rating Google, puntos Club, % descuento socios).
  // Si no hay ninguno, mostramos placeholders coherentes con el tipo de negocio
  // para que la sección "Sobre nosotros" tenga peso visual estilo V0.
  const statsReales: { value: string; label: string }[] = [];
  if (recurso.ratingVerificado?.rating != null) {
    statsReales.push({
      value: recurso.ratingVerificado.rating.toFixed(1),
      label: `Valoración Google${recurso.ratingVerificado.reviews ? ` (${recurso.ratingVerificado.reviews} reseñas)` : ''}`,
    });
  }
  if (recurso.puntosClub != null && recurso.puntosClub > 0) {
    statsReales.push({
      value: String(recurso.puntosClub),
      label: 'Puntos Club LPMBE por visita',
    });
  }
  if (recurso.descuentoPorcentaje != null && recurso.descuentoPorcentaje > 0) {
    statsReales.push({
      value: `${recurso.descuentoPorcentaje}%`,
      label: 'Descuento exclusivo socios',
    });
  }
  const stats = statsReales.length === 3 ? statsReales : getStatsDemo(recurso.tipo);

  // Descripción demo si el negocio no la tiene aún configurada
  const descripcion = recurso.descripcion?.trim()
    ? recurso.descripcion
    : getDescripcionDemo(recurso.tipo, recurso.nombre, recurso.pueblo?.nombre);

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

      <PremiumDescription
        descripcion={descripcion}
        secondaryImage={images[1]?.url ?? images[0]?.url}
        nombre={recurso.nombre}
        stats={stats}
        t={t}
      />


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
