import { cookies, headers } from 'next/headers';
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from './BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';
import { getBaseUrl, getCanonicalUrl, getLocaleAlternates, getOGLocale, seoDescription, seoTitle } from '@/lib/seo';
import { autoLinkUrls, injectImgAlt } from '@/app/_lib/html';
import SmartCoverImage from '@/app/components/SmartCoverImage';
import JsonLd from '@/app/components/seo/JsonLd';
import ContenidoImageCarousel from '@/app/components/ContenidoImageCarousel';
import SafeHtml from '@/app/_components/ui/SafeHtml';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Textos del bloque "Uso de ubicación en la app" para la política de privacidad (6 idiomas) */
const PRIVACY_LOCATION_BLOCK: Record<SupportedLocale, { title: string; intro: string; foreground: string; background: string; closing: string }> = {
  es: {
    title: 'Aplicación móvil «Pueblos Más Bonitos de España» – Uso de ubicación',
    intro: 'La aplicación móvil oficial de Los Pueblos Más Bonitos de España (en Google Play y App Store) utiliza datos de ubicación con las siguientes finalidades:',
    foreground: 'Ubicación en primer plano: para mostrar los pueblos más cercanos a tu posición, calcular distancias y rutas, y mejorar la experiencia en mapas y búsquedas. Esta funcionalidad se usa mientras la aplicación está en uso.',
    background: 'Ubicación en segundo plano (opcional): si el usuario activa expresamente esta opción en Ajustes de la app, la aplicación puede usar la ubicación en segundo plano para detectar cuándo te encuentras cerca de un pueblo de la red (a menos de 2 km). En ese caso, la app te muestra una notificación de bienvenida y registra la visita y los puntos asociados en tu cuenta. El usuario puede desactivar esta función en cualquier momento desde el perfil en la app.',
    closing: 'Los datos de ubicación no se comparten con terceros para fines publicitarios. Se utilizan únicamente para las funcionalidades descritas y para el correcto funcionamiento del pasaporte digital de visitas y del sistema de puntos. El usuario puede revocar los permisos de ubicación desde la configuración de su dispositivo.',
  },
  en: {
    title: 'Mobile app «Pueblos Más Bonitos de España» – Use of location',
    intro: 'The official mobile app of Los Pueblos Más Bonitos de España (on Google Play and App Store) uses location data for the following purposes:',
    foreground: 'Foreground location: to show the villages closest to your position, calculate distances and routes, and improve the experience on maps and search. This functionality is used while the app is in use.',
    background: 'Background location (optional): if the user expressly enables this option in the app Settings, the app may use background location to detect when you are near a village in the network (within 2 km). In that case, the app shows you a welcome notification and records the visit and associated points in your account. The user can disable this feature at any time from the profile in the app.',
    closing: 'Location data is not shared with third parties for advertising purposes. It is used only for the described functionalities and for the proper operation of the digital visit passport and the points system. The user can revoke location permissions from their device settings.',
  },
  fr: {
    title: 'Application mobile « Les Plus Beaux Villages d’Espagne » – Utilisation de la position',
    intro: "L'application mobile officielle des Plus Beaux Villages d'Espagne (sur Google Play et l'App Store) utilise les données de localisation aux fins suivantes :",
    foreground: "Localisation au premier plan : pour afficher les villages les plus proches de votre position, calculer les distances et itinéraires, et améliorer l'expérience sur les cartes et la recherche. Cette fonctionnalité est utilisée lorsque l'application est ouverte.",
    background: "Localisation en arrière-plan (optionnelle) : si l'utilisateur active explicitement cette option dans les Paramètres de l'application, l'application peut utiliser la localisation en arrière-plan pour détecter lorsque vous vous trouvez à proximité d'un village du réseau (moins de 2 km). Dans ce cas, l'application vous affiche une notification de bienvenue et enregistre la visite et les points associés sur votre compte. L'utilisateur peut désactiver cette fonction à tout moment depuis le profil dans l'application.",
    closing: "Les données de localisation ne sont pas partagées avec des tiers à des fins publicitaires. Elles sont utilisées uniquement pour les fonctionnalités décrites et pour le bon fonctionnement du passeport numérique des visites et du système de points. L'utilisateur peut révoquer les autorisations de localisation dans les paramètres de son appareil.",
  },
  de: {
    title: 'Mobile App «Die Schönsten Dörfer Spaniens» – Nutzung des Standorts',
    intro: 'Die offizielle Mobile App von Los Pueblos Más Bonitos de España (bei Google Play und im App Store) nutzt Standortdaten für folgende Zwecke:',
    foreground: 'Standort im Vordergrund: um die nächsten Dörfer anzuzeigen, Entfernungen und Routen zu berechnen und die Nutzung von Karten und Suche zu verbessern. Diese Funktion wird genutzt, während die App geöffnet ist.',
    background: 'Standort im Hintergrund (optional): Wenn der Nutzer diese Option ausdrücklich in den App-Einstellungen aktiviert, kann die App den Standort im Hintergrund nutzen, um zu erkennen, wann Sie sich in der Nähe eines Dorfes des Netzwerks befinden (unter 2 km). In diesem Fall zeigt die App eine Willkommensbenachrichtigung an und erfasst den Besuch und die zugehörigen Punkte in Ihrem Konto. Der Nutzer kann diese Funktion jederzeit im Profil in der App deaktivieren.',
    closing: 'Standortdaten werden nicht zu Werbezwecken an Dritte weitergegeben. Sie werden nur für die beschriebenen Funktionen sowie für den digitalen Besucherausweis und das Punktesystem verwendet. Der Nutzer kann die Standortberechtigungen in den Geräteeinstellungen widerrufen.',
  },
  pt: {
    title: 'Aplicação móvel «Pueblos Más Bonitos de España» – Uso da localização',
    intro: 'A aplicação móvel oficial de Los Pueblos Más Bonitos de España (na Google Play e na App Store) utiliza dados de localização para as seguintes finalidades:',
    foreground: 'Localização em primeiro plano: para mostrar as aldeias mais próximas da sua posição, calcular distâncias e rotas e melhorar a experiência em mapas e pesquisas. Esta funcionalidade é utilizada enquanto a aplicação está em uso.',
    background: 'Localização em segundo plano (opcional): se o utilizador ativar expressamente esta opção nas Definições da aplicação, a aplicação pode utilizar a localização em segundo plano para detetar quando se encontra perto de uma aldeia da rede (a menos de 2 km). Nesse caso, a aplicação mostra uma notificação de boas-vindas e regista a visita e os pontos associados na sua conta. O utilizador pode desativar esta função a qualquer momento a partir do perfil na aplicação.',
    closing: 'Os dados de localização não são partilhados com terceiros para fins publicitários. São utilizados apenas para as funcionalidades descritas e para o correto funcionamento do passaporte digital de visitas e do sistema de pontos. O utilizador pode revogar as permissões de localização nas definições do dispositivo.',
  },
  it: {
    title: 'App mobile «I Borghi Più Belli di Spagna» – Uso della posizione',
    intro: "L'app ufficiale de I Borghi Più Belli di Spagna (su Google Play e App Store) utilizza i dati di posizione per le seguenti finalità:",
    foreground: "Posizione in primo piano: per mostrare i borghi più vicini alla tua posizione, calcolare distanze e itinerari e migliorare l'esperienza su mappe e ricerche. Questa funzionalità viene utilizzata mentre l'app è in uso.",
    background: "Posizione in secondo piano (opzionale): se l'utente attiva espressamente questa opzione nelle Impostazioni dell'app, l'app può utilizzare la posizione in secondo piano per rilevare quando ti trovi nelle vicinanze di un borgo della rete (a meno di 2 km). In tal caso, l'app mostra una notifica di benvenuto e registra la visita e i punti associati sul tuo account. L'utente può disattivare questa funzione in qualsiasi momento dal profilo nell'app.",
    closing: "I dati di posizione non vengono condivisi con terzi per finalità pubblicitarie. Sono utilizzati solo per le funzionalità descritte e per il corretto funzionamento del passaporto digitale delle visite e del sistema di punti. L'utente può revocare i permessi di posizione dalle impostazioni del dispositivo.",
  },
  ca: {
    title: 'App mòbil «Pobles Més Bonics d\'Espanya» – Ús de la ubicació',
    intro: 'L\'aplicació mòbil oficial de Los Pueblos Más Bonitos de España (a Google Play i App Store) utilitza dades d\'ubicació per a les finalitats següents:',
    foreground: 'Ubicació en primer pla: per mostrar els pobles més propers a la vostra posició, calcular distàncies i rutes i millorar l\'experiència en mapes i cerques. Aquesta funcionalitat s\'utilitza mentre l\'aplicació està en ús.',
    background: 'Ubicació en segon pla (opcional): si l\'usuari activa expressament aquesta opció a Configuració de l\'app, l\'aplicació pot utilitzar la ubicació en segon pla per detectar quan us trobeu a prop d\'un poble de la xarxa (a menys de 2 km). En aquest cas, l\'app mostra una notificació de benvinguda i registra la visita i els punts associats al vostre compte. L\'usuari pot desactivar aquesta funció en qualsevol moment des del perfil a l\'app.',
    closing: 'Les dades d\'ubicació no es comparteixen amb tercers per a finalitats publicitàries. S\'utilitzen només per a les funcionalitats descrites i per al correcte funcionament del passaport digital de visites i del sistema de punts. L\'usuari pot revocar els permisos d\'ubicació des de la configuració del dispositiu.',
  },
};

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Slug de página legal -> key de StaticPage (traducidas con DeepL en backend) */
const STATIC_SLUG_TO_KEY: Record<string, string> = {
  contacto: 'CONTACTO',
  privacidad: 'PRIVACIDAD',
  'aviso-legal': 'AVISO_LEGAL',
  cookies: 'COOKIES',
};

type StaticPageData = {
  key: string;
  titulo: string;
  contenido: string | null;
};

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenidoMd?: string;
  coverUrl?: string;
  galleryUrls?: string[];
  tipo: string;
  estado: string;
  publishedAt?: string;
  createdAt?: string;
  fechaInicio?: string;
  fechaFin?: string;
  pueblo?: { nombre: string; slug?: string; provincia?: string; comunidad?: string } | null;
};

/**
 * Resuelve el idioma: prioridad a getLocale() de next-intl (sincronizado con el selector de idioma de la UI).
 * Si no está en SUPPORTED_LOCALES, fallback a ?lang= o 'es'.
 */
async function resolveLocale(langParam?: string): Promise<SupportedLocale> {
  const nextIntlLocale = await getLocale();
  if (nextIntlLocale && SUPPORTED_LOCALES.includes(nextIntlLocale as SupportedLocale)) {
    return nextIntlLocale as SupportedLocale;
  }
  if (langParam && SUPPORTED_LOCALES.includes(langParam as SupportedLocale)) {
    return langParam as SupportedLocale;
  }
  const h = await headers();
  const headerLocale = h.get('x-next-locale');
  if (headerLocale && SUPPORTED_LOCALES.includes(headerLocale as SupportedLocale)) {
    return headerLocale as SupportedLocale;
  }
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
    return cookieLocale as SupportedLocale;
  }
  return 'es';
}

async function fetchStaticPage(key: string, lang: string): Promise<StaticPageData | null> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/static-pages/${key}?lang=${lang}`, {
    cache: 'no-store',
    headers: { 'Accept-Language': lang },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.titulo) return null;
  return { key: data.key, titulo: data.titulo, contenido: data.contenido ?? null };
}

async function fetchContenido(slug: string, lang: string): Promise<Contenido | null> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/contenidos/${slug}?lang=${lang}`, {
    cache: 'no-store',
    headers: { 'Accept-Language': lang },
  });

  if (!res.ok) return null;
  return res.json();
}

/** Para slugs legales, intenta static-pages (DeepL); si no hay, usa contenido. */
async function fetchPageData(slug: string, lang: string): Promise<
  { type: 'static'; data: StaticPageData } | { type: 'contenido'; data: Contenido } | null
> {
  const staticKey = STATIC_SLUG_TO_KEY[slug];
  if (staticKey) {
    const staticPage = await fetchStaticPage(staticKey, lang);
    if (staticPage) return { type: 'static', data: staticPage };
  }
  const contenido = await fetchContenido(slug, lang);
  if (contenido) return { type: 'contenido', data: contenido };
  return null;
}

function plainDescription(htmlOrMd: string): string {
  const unescaped = htmlOrMd
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
  const plainText = unescaped
    .replace(/<[^>]+>/g, '')
    .replace(/[#*\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  const desc = plainText.slice(0, 160);
  return plainText.length > 160 ? `${desc}...` : desc;
}

const PUBLISHER_ORGANIZATION = {
  '@type': 'Organization',
  name: 'Los Pueblos Más Bonitos de España',
  url: 'https://lospueblosmasbonitosdeespana.org',
  logo: {
    '@type': 'ImageObject',
    url: 'https://lospueblosmasbonitosdeespana.org/images/logo-lpbme.png',
  },
} as const;

function buildLocationFromContenido(pueblo?: Contenido['pueblo']): Record<string, unknown> {
  if (pueblo?.nombre) {
    return {
      '@type': 'Place',
      name: pueblo.nombre,
      address: {
        '@type': 'PostalAddress',
        addressLocality: pueblo.nombre,
        ...(pueblo.provincia ? { addressRegion: pueblo.provincia } : {}),
        addressCountry: 'ES',
      },
    };
  }
  return {
    '@type': 'Place',
    name: 'España',
    address: { '@type': 'PostalAddress', addressCountry: 'ES' },
  };
}

function articleJsonLdFromContenido(contenido: Contenido, canonicalUrl: string): Record<string, unknown> {
  const datePublished = contenido.publishedAt ?? contenido.createdAt;
  const isEvent = contenido.tipo === 'EVENTO';

  if (isEvent) {
    const desc = contenido.resumen?.trim()
      || contenido.contenidoMd?.replace(/<[^>]+>/g, '').replace(/[#*`\[\]()]/g, '').replace(/\s+/g, ' ').trim().slice(0, 155)
      || undefined;
    const data: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: contenido.titulo,
      url: canonicalUrl,
      location: buildLocationFromContenido(contenido.pueblo),
      organizer: PUBLISHER_ORGANIZATION,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
    };
    if (contenido.fechaInicio) data.startDate = contenido.fechaInicio;
    if (contenido.fechaFin) data.endDate = contenido.fechaFin;
    if (desc) data.description = desc;
    if (contenido.coverUrl) data.image = contenido.coverUrl;
    data.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
    };
    return data;
  }

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: contenido.titulo,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    publisher: PUBLISHER_ORGANIZATION,
    author: PUBLISHER_ORGANIZATION,
  };
  if (datePublished) data.datePublished = datePublished;
  if (contenido.coverUrl) data.image = contenido.coverUrl;
  return data;
}

function articleJsonLdStatic(titulo: string, canonicalUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: titulo,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    publisher: PUBLISHER_ORGANIZATION,
    author: PUBLISHER_ORGANIZATION,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const lang = await resolveLocale(langParam);
  const page = await fetchPageData(slug, lang);

  if (!page) {
    return {
      title: 'Contenido no encontrado',
    };
  }

  const titulo = page.data.titulo;
  const rawDescription =
    page.type === 'contenido'
      ? (page.data.resumen ?? (page.data.contenidoMd ? plainDescription(page.data.contenidoMd) : ''))
      : page.type === 'static' && page.data.contenido
        ? plainDescription(page.data.contenido)
        : '';
  const description = rawDescription ? seoDescription(plainDescription(rawDescription), 155) : '';
  const coverUrl =
    page.type === 'contenido'
      ? (page.data.coverUrl || page.data.galleryUrls?.[0])
      : undefined;

  const path = `/c/${slug}`;
  return {
    title: seoTitle(titulo),
    description: description || undefined,
    robots: { index: true, follow: true },
    alternates: {
      canonical: getCanonicalUrl(path, lang),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: seoTitle(titulo),
      description: description || undefined,
      url: getCanonicalUrl(path, lang),
      locale: getOGLocale(lang),
      images: coverUrl ? [{ url: coverUrl }] : [],
    },
    twitter: {
      card: coverUrl ? 'summary_large_image' : 'summary',
      title: seoTitle(titulo),
      description: description || undefined,
    },
  };
}

export default async function ContenidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang: langParam } = await searchParams;
  const locale = await resolveLocale(langParam);
  const page = await fetchPageData(slug, locale);

  if (!page) {
    permanentRedirect('/actualidad');
  }

  // Páginas estáticas (contacto, privacidad, aviso-legal, cookies): traducidas con DeepL
  if (page.type === 'static') {
    const { titulo, contenido } = page.data;
    const body = contenido ?? '';
    const lang = locale as SupportedLocale;
    const t = PRIVACY_LOCATION_BLOCK[lang];

    return (
      <main className="px-5 py-10 md:py-[40px]">
        <JsonLd data={articleJsonLdStatic(titulo, `${getBaseUrl()}/c/${slug}`)} />
        <article>
          <div className="max-w-[720px] mx-auto px-5">
            <header className="mb-10">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold leading-tight m-0 text-foreground flex-1 min-w-0">
                  {titulo}
                </h1>
                <ShareButton url={`/c/${slug}`} title={titulo} variant="button" />
              </div>
            </header>

            {body && (
              <div className="prose-contenido text-base leading-relaxed text-foreground">
                {isHtmlContent(body) ? (
                  <div dangerouslySetInnerHTML={{ __html: injectImgAlt(body, titulo) }} />
                ) : (
                  <ReactMarkdown>{autoLinkUrls(body)}</ReactMarkdown>
                )}
              </div>
            )}

            {slug === 'privacidad' && (
              <section className="prose-contenido text-base leading-relaxed text-foreground mt-10 pt-8 border-t border-border">
                <h2 className="text-2xl font-semibold mb-4">{t.title}</h2>
                <p className="mb-4">{t.intro}</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t.foreground}</li>
                  <li>{t.background}</li>
                </ul>
                <p>{t.closing}</p>
              </section>
            )}

            <div className="mt-14 pt-6 border-t border-border">
              <BackButton />
            </div>
          </div>
        </article>
        <style>{`
          .prose-contenido p { margin-bottom: 20px; }
          .prose-contenido h2 { font-size: 24px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; }
          .prose-contenido h3 { font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; }
          .prose-contenido ul, .prose-contenido ol { margin-bottom: 20px; padding-left: 24px; }
          .prose-contenido li { margin-bottom: 8px; }
          .prose-contenido a { color: var(--primary); text-decoration: none; }
          .prose-contenido a:hover { text-decoration: underline; }
        `}</style>
      </main>
    );
  }

  // Contenido (noticias, eventos, páginas CMS) — titulo/contenidoMd ya vienen en el idioma pedido (API ?lang=)
  const contenido = page.data;
  const galleryUrls = Array.isArray(contenido.galleryUrls) ? contenido.galleryUrls : [];
  const headerImages = Array.from(
    new Set(
      [contenido.coverUrl, ...galleryUrls]
        .map((u) => (u || '').trim())
        .filter(Boolean)
        .slice(0, 10),
    ),
  );
  const fechaPublicacion = contenido.publishedAt ?? contenido.createdAt;
  const fechaPublicacionFormateada = fechaPublicacion ? formatDateTimeEs(fechaPublicacion, locale) : '';
  const esEvento = contenido.tipo === 'EVENTO';
  const fechaInicioEvento = esEvento ? contenido.fechaInicio : null;
  const tActualidad = await getTranslations('actualidad');
  const tipoBadgeKey: Record<string, string> = {
    NOTICIA: 'news',
    EVENTO: 'events',
    ARTICULO: 'articles',
    PAGINA: 'page',
  };
  const tipoBadgeLabel = tActualidad(tipoBadgeKey[contenido.tipo] ?? 'page');

  return (
    <main className="px-5 py-10 md:py-[40px]">
      <JsonLd data={articleJsonLdFromContenido(contenido, `${getBaseUrl()}/c/${slug}`)} />
      <article>
        {headerImages.length > 1 ? (
          <ContenidoImageCarousel images={headerImages} alt={contenido.titulo} />
        ) : (
          headerImages[0] && <SmartCoverImage src={headerImages[0]} alt={contenido.titulo} />
        )}

        <div className="max-w-[720px] mx-auto px-5">
          <header className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">
                {tipoBadgeLabel}
              </span>
              <ShareButton url={`/c/${slug}`} title={contenido.titulo} variant="button" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight m-0 text-foreground mb-3">
              {contenido.titulo}
            </h1>

            {fechaPublicacionFormateada && (
              <p className="text-sm text-muted-foreground mt-2">
                {fechaPublicacionFormateada}
              </p>
            )}

            {esEvento && fechaInicioEvento && (
              <p className="text-base text-foreground mt-4 font-medium py-3 px-4 bg-primary/10 dark:bg-primary/20 border-l-4 border-primary rounded-r">
                <strong>{tActualidad('eventLabel')}</strong> {formatEventoRangeEs(fechaInicioEvento, contenido.fechaFin, locale)}
              </p>
            )}
          </header>

          {contenido.contenidoMd ? (
            isHtmlContent(contenido.contenidoMd) ? (
              <SafeHtml
                html={contenido.contenidoMd}
                className="prose-contenido text-base leading-relaxed text-foreground"
                altFallback={contenido.titulo}
              />
            ) : (
              <div className="prose-contenido text-base leading-relaxed text-foreground">
                <ReactMarkdown>{autoLinkUrls(contenido.contenidoMd)}</ReactMarkdown>
              </div>
            )
          ) : contenido.resumen ? (
            isHtmlContent(contenido.resumen) ? (
              <SafeHtml
                html={contenido.resumen}
                className="prose-contenido text-base leading-relaxed text-foreground"
                altFallback={contenido.titulo}
              />
            ) : (
              <div className="prose-contenido text-base leading-relaxed text-foreground">
                <ReactMarkdown>{autoLinkUrls(contenido.resumen)}</ReactMarkdown>
              </div>
            )
          ) : null}

          {slug === 'privacidad' && (() => {
            const lang = (SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'es') as SupportedLocale;
            const t = PRIVACY_LOCATION_BLOCK[lang];
            return (
              <section className="prose-contenido text-base leading-relaxed text-foreground mt-10 pt-8 border-t border-border">
                <h2 className="text-2xl font-semibold mb-4">{t.title}</h2>
                <p className="mb-4">{t.intro}</p>
                <ul className="list-disc pl-6 mb-4 space-y-2">
                  <li>{t.foreground}</li>
                  <li>{t.background}</li>
                </ul>
                <p>{t.closing}</p>
              </section>
            );
          })()}

          <div className="mt-14 pt-6 border-t border-border">
            <BackButton />
          </div>
        </div>
      </article>

      <style>{`
        .link-volver {
          font-size: 14px;
          text-decoration: none;
          color: var(--muted-foreground);
        }
        .link-volver:hover { text-decoration: underline; }

        .prose-contenido p { margin-bottom: 20px; }
        .prose-contenido h2 {
          font-size: 24px;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
        }
        .prose-contenido h3 {
          font-size: 20px;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }
        .prose-contenido ul, .prose-contenido ol {
          margin-bottom: 20px;
          padding-left: 24px;
        }
        .prose-contenido li { margin-bottom: 8px; }
        .prose-contenido img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 24px 0;
        }
        .prose-contenido blockquote {
          border-left: 3px solid var(--border);
          padding-left: 16px;
          margin: 24px 0;
          color: var(--muted-foreground);
          font-style: italic;
        }
        .prose-contenido code {
          background-color: var(--muted);
          color: var(--foreground);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 14px;
        }
        .prose-contenido pre {
          background-color: var(--muted);
          color: var(--foreground);
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 24px 0;
        }
        .prose-contenido a {
          color: var(--primary);
          text-decoration: none;
        }
        .prose-contenido a:hover { text-decoration: underline; }
      `}</style>
    </main>
  );
}
