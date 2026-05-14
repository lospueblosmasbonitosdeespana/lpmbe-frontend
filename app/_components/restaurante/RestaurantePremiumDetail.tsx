import Link from 'next/link';
import { SOCIAL_NETWORKS, type PlanNegocio } from '@/lib/plan-features';
import RestauranteHeroSection from './RestauranteHeroSection';
import RestauranteChefSection from './RestauranteChefSection';
import RestauranteCuisinePhilosophy from './RestauranteCuisinePhilosophy';
import RestauranteMenusSection from './RestauranteMenusSection';
import RestauranteSignatureDishes from './RestauranteSignatureDishes';
import RestauranteAmbienteSection from './RestauranteAmbienteSection';
import RestauranteInfoPractica from './RestauranteInfoPractica';
import RestauranteReservaBanner from './RestauranteReservaBanner';
import RestauranteContactoUbicacion from './RestauranteContactoUbicacion';
import RestauranteOfertasSocios, { type OfertaPublic } from './RestauranteOfertasSocios';
import RestauranteSiguenosSection from './RestauranteSiguenosSection';
import RestauranteBecomeMember from './RestauranteBecomeMember';
import {
  getDemoHeroImages,
  getDemoChef,
  getDemoFilosofia,
  getDemoMenus,
  getDemoPlatos,
  getDemoAmbiente,
  getDemoInfoPractica,
  getDemoAcceso,
  type RestaurantePremiumLandingConfig,
} from './restaurante-demo-config';

type Imagen = { id: number; url: string; alt: string | null; orden: number };

export type RestaurantePremiumProps = {
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
    landingConfig?: RestaurantePremiumLandingConfig | null;
    fotoUrl?: string | null;
    cerradoTemporal?: boolean;
    lat?: number | null;
    lng?: number | null;
    localidad?: string | null;
    planNegocio?: PlanNegocio;
    imprescindible?: boolean;
    ratingVerificado?: { rating: number | null; reviews: number | null } | null;
    pueblo?: { id: number; nombre: string; slug: string; provincia?: string | null; comunidad?: string | null } | null;
    imagenes?: Imagen[];
    horariosSemana?: Array<{
      diaSemana: number;
      abierto: boolean;
      horaAbre: string | null;
      horaCierra: string | null;
    }>;
    ofertas?: OfertaPublic[];
    provincia?: string | null;
    comunidad?: string | null;
  };
  backHref: string;
  backLabel: string;
  translations: Record<string, string>;
};

const TIPO_LABELS: Record<string, string> = {
  RESTAURANTE: 'Restaurante',
  BAR: 'Bar / Cafetería',
  BODEGA: 'Bodega',
};

export default function RestaurantePremiumDetail({ recurso, backHref, backLabel, translations }: RestaurantePremiumProps) {
  const t = (key: string) => translations[key] ?? key;
  const tipoLabel = TIPO_LABELS[recurso.tipo] ?? 'Restaurante';
  const lc = recurso.landingConfig ?? {};
  const puebloNombre = recurso.pueblo?.nombre;
  const provincia = recurso.pueblo?.provincia ?? recurso.provincia ?? null;
  const comunidad = recurso.pueblo?.comunidad ?? recurso.comunidad ?? null;

  // Imágenes: si el recurso tiene imágenes propias usamos esas; si no, demos.
  const imagesReales = recurso.imagenes?.length
    ? [...recurso.imagenes].sort((a, b) => a.orden - b.orden)
    : recurso.fotoUrl
      ? [{ id: 0, url: recurso.fotoUrl, alt: recurso.nombre, orden: 0 }]
      : [];
  const images = imagesReales.length > 0 ? imagesReales : getDemoHeroImages();

  // Tagline + badges
  const tagline = lc.tagline ?? recurso.descripcion?.split(/[.\n]/)[0]?.trim() ?? 'Cocina con alma, producto con historia';
  const badges = lc.badges ?? [];

  // Ubicación extra para el hero (ej. "Cocina de autor · Pirineo Aragonés")
  const ubicacionExtraComputed = [tipoLabel === 'Restaurante' ? null : tipoLabel, comunidad].filter(Boolean).join(' · ');
  const ubicacionExtra = lc.ubicacionExtra ?? (ubicacionExtraComputed || null);

  // Chef + filosofía + menús + platos + ambiente: demo si falta
  const chef = lc.chef ?? getDemoChef();
  const filosofia = lc.filosofia ?? getDemoFilosofia();
  const menus = lc.menus ?? getDemoMenus();
  const platos = lc.platos ?? getDemoPlatos();
  const ambiente = lc.ambiente ?? getDemoAmbiente();
  const infoPractica = lc.infoPractica ?? getDemoInfoPractica();
  const acceso = lc.acceso ?? getDemoAcceso(puebloNombre);

  // Ofertas: reales destacadas si existen, si no demo
  const ofertasReales = (recurso.ofertas ?? []).filter((o) => o.destacada || (recurso.ofertas ?? []).length <= 3);
  const ofertasDemo: OfertaPublic[] = [
    {
      id: -1,
      tipoOferta: 'BEBIDA',
      titulo: 'Copa de cava de bienvenida',
      descripcion: 'Recibe a tu llegada una copa de cava artesano de bodegas locales, solo por ser socio del Club LPMBE.',
      destacada: true,
    },
    {
      id: -2,
      tipoOferta: 'DESCUENTO',
      titulo: '10% en menú degustación',
      descripcion: 'Descuento exclusivo del 10% aplicable al menú degustación y al menú maridaje en cualquier visita.',
      descuentoPorcentaje: 10,
      destacada: false,
    },
    {
      id: -3,
      tipoOferta: 'EXPERIENCIA',
      titulo: 'Cata de vinos privada',
      descripcion: 'Acceso preferente a sesiones privadas de cata en nuestra bodega. Capacidad limitada a 8 socios por sesión.',
      condicionTexto: 'Bajo reserva con 48 h de antelación',
      destacada: false,
    },
  ];
  const ofertas = ofertasReales.length > 0 ? ofertasReales : ofertasDemo;

  // Redes sociales
  const socialLinks = recurso.socialLinks
    ? Object.entries(recurso.socialLinks)
        .filter(([, url]) => !!url)
        .map(([key, url]) => {
          const net = SOCIAL_NETWORKS.find((n) => n.key === key);
          return { key, url: url as string, label: net?.label ?? key };
        })
    : [];

  // Dirección (líneas) para tarjeta de contacto
  const direccionLineas = [
    puebloNombre,
    [provincia, comunidad].filter(Boolean).join(', '),
    'España',
  ].filter(Boolean) as string[];

  // Cards de acceso
  const accessCards: { icon: 'car' | 'bus' | 'accessibility'; title: string; text: string }[] = [];
  if (acceso?.aparcamiento) accessCards.push({ icon: 'car', title: t('parking'), text: acceso.aparcamiento });
  if (acceso?.transportePublico) accessCards.push({ icon: 'bus', title: t('publicTransport'), text: acceso.transportePublico });
  if (acceso?.accesibilidad) accessCards.push({ icon: 'accessibility', title: t('accessibility'), text: acceso.accesibilidad });

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

      <RestauranteHeroSection
        images={images}
        nombre={recurso.nombre}
        tipoLabel={tipoLabel}
        tagline={tagline}
        badges={badges}
        pueblo={recurso.pueblo ?? null}
        ubicacionExtra={ubicacionExtra}
        imprescindible={recurso.imprescindible}
        ratingVerificado={recurso.ratingVerificado}
        cerradoTemporal={recurso.cerradoTemporal}
        labels={{
          noPhotos: t('noPhotos'),
          prevImage: t('prevImage'),
          nextImage: t('nextImage'),
          goToSlide: t('goToSlide'),
          imprescindible: t('imprescindible'),
          cerradoTemporal: t('cerradoTemporal'),
          reviews: t('reviews'),
        }}
      />

      {chef && (
        <RestauranteChefSection
          eyebrow={chef.eyebrow ?? t('chefEyebrow')}
          nombre={chef.nombre}
          fotoUrl={chef.fotoUrl ?? '/restaurante-demo/chef.jpg'}
          fotoAlt={`${chef.nombre} – ${recurso.nombre}`}
          bio={chef.bio}
          stats={chef.stats}
        />
      )}

      {filosofia && (
        <RestauranteCuisinePhilosophy
          eyebrow={filosofia.eyebrow ?? t('philosophyEyebrow')}
          title={filosofia.title ?? t('philosophyTitle')}
          pillars={filosofia.pillars}
        />
      )}

      {menus && (
        <RestauranteMenusSection
          eyebrow={menus.eyebrow ?? t('menusEyebrow')}
          title={menus.title ?? t('menusTitle')}
          items={menus.items}
          reservarLabel={t('reservar')}
          bookingUrl={recurso.bookingUrl}
          telefono={recurso.telefono}
        />
      )}

      {platos && (
        <RestauranteSignatureDishes
          eyebrow={platos.eyebrow ?? t('platosEyebrow')}
          title={platos.title ?? t('platosTitle')}
          dishes={platos.items}
        />
      )}

      {ambiente && <RestauranteAmbienteSection blocks={ambiente.blocks} />}

      <RestauranteInfoPractica
        eyebrow={t('infoEyebrow')}
        title={t('infoTitle')}
        aforo={infoPractica?.aforo}
        tipoServicio={infoPractica?.tipoServicio}
        tiempoMedio={infoPractica?.tiempoMedio}
        politicaNinos={infoPractica?.politicaNinos}
        politicaMascotas={infoPractica?.politicaMascotas}
        dietas={infoPractica?.dietas}
        notaReserva={infoPractica?.notaReserva}
        horariosSemana={recurso.horariosSemana}
        hoursLabel={t('hoursLabel')}
        closedLabel={t('closed')}
        dietasLabel={t('dietasLabel')}
        noteLabel={t('noteLabel')}
      />

      <RestauranteReservaBanner
        eyebrow={t('reservaEyebrow')}
        title={t('reservaTitle')}
        reservarOnlineLabel={t('reservarOnline')}
        llamarLabel={t('llamar')}
        whatsappLabel="WhatsApp"
        cancelacionTexto={lc.cancelacionTexto ?? t('cancelacionTexto')}
        bookingUrl={recurso.bookingUrl}
        telefono={recurso.telefono}
        whatsapp={recurso.whatsapp}
      />

      {recurso.lat != null && recurso.lng != null && (
        <RestauranteContactoUbicacion
          eyebrow={t('encuentranos')}
          title={t('contactoUbicacionTitle')}
          nombre={recurso.nombre}
          direccionLineas={direccionLineas}
          telefono={recurso.telefono}
          email={recurso.email}
          lat={recurso.lat}
          lng={recurso.lng}
          comoLlegarLabel={t('getDirections')}
          accessCards={accessCards}
        />
      )}

      <RestauranteOfertasSocios
        eyebrow={t('ofertasEyebrow')}
        title={t('ofertasTitle')}
        ofertas={ofertas}
        destacadaLabel={t('featured')}
        nuevaLabel={t('nuevaLabel')}
        forMembersLabel={t('forMembers')}
      />

      {socialLinks.length > 0 && (
        <RestauranteSiguenosSection eyebrow={t('siguenosEyebrow')} socialLinks={socialLinks} />
      )}

      <RestauranteBecomeMember
        eyebrow={t('clubEyebrow')}
        title={t('becomeMemberTitle')}
        description={t('becomeMemberDescription')}
        joinNowLabel={t('joinNow')}
        learnMoreLabel={t('learnMore')}
      />
    </main>
  );
}
