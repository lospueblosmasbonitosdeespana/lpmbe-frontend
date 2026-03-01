import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import BackButton from './BackButton';
import ShareButton from '@/app/components/ShareButton';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';
import { getApiUrl } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates } from '@/lib/seo';
import SmartCoverImage from '@/app/components/SmartCoverImage';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
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
};

function isHtmlContent(content: string): boolean {
  const trimmed = content.trimStart();
  return trimmed.startsWith('<') && /<[a-z][\s\S]*>/i.test(trimmed);
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenidoMd?: string;
  coverUrl?: string;
  tipo: string;
  estado: string;
  publishedAt?: string;
  createdAt?: string;
  fechaInicio?: string;
  fechaFin?: string;
};

async function fetchContenido(slug: string): Promise<Contenido | null> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  const lang = locale && SUPPORTED_LOCALES.includes(locale as SupportedLocale) ? locale : 'es';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/contenidos/${slug}?lang=${lang}`, {
    cache: 'no-store',
    headers: { 'Accept-Language': lang },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const contenido = await fetchContenido(slug);

  if (!contenido) {
    return {
      title: 'Contenido no encontrado | Los Pueblos Más Bonitos de España',
    };
  }

  // Generar descripción: resumen o primeros 160 chars del markdown
  let description = contenido.resumen ?? '';
  if (!description && contenido.contenidoMd) {
    const plainText = contenido.contenidoMd
      .replace(/[#*\[\]()]/g, '') // Quitar símbolos markdown
      .replace(/\n+/g, ' ')
      .trim();
    description = plainText.slice(0, 160);
    if (plainText.length > 160) description += '...';
  }

  const path = `/c/${slug}`;
  return {
    title: `${contenido.titulo} | Los Pueblos Más Bonitos de España`,
    description: description || undefined,
    alternates: {
      canonical: getCanonicalUrl(path),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: contenido.titulo,
      description: description || undefined,
      url: getCanonicalUrl(path),
      images: contenido.coverUrl ? [{ url: contenido.coverUrl }] : [],
    },
    twitter: {
      card: contenido.coverUrl ? 'summary_large_image' : 'summary',
      title: contenido.titulo,
      description: description || undefined,
    },
  };
}

export default async function ContenidoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contenido = await fetchContenido(slug);

  if (!contenido) {
    notFound();
  }

  // Leer locale para formateo de fechas
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'es';

  // Determinar fecha de publicación
  const fechaPublicacion = contenido.publishedAt ?? contenido.createdAt;
  const fechaPublicacionFormateada = fechaPublicacion ? formatDateTimeEs(fechaPublicacion, locale) : '';

  // Formatear fechas del evento si es EVENTO
  const esEvento = contenido.tipo === 'EVENTO';
  const fechaInicioEvento = esEvento ? contenido.fechaInicio : null;

  // Texto del badge según tipo
  const tipoBadge: Record<string, string> = {
    EVENTO: 'Evento',
    NOTICIA: 'Noticia',
    ARTICULO: 'Artículo',
    PAGINA: 'Página',
  };

  return (
    <main className="px-5 py-10 md:py-[40px]">
      <article>
        {contenido.coverUrl && contenido.coverUrl.trim() && (
          <SmartCoverImage src={contenido.coverUrl.trim()} alt={contenido.titulo} />
        )}

        <div className="max-w-[720px] mx-auto px-5">
          <header className="mb-10">
            <div className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
              {tipoBadge[contenido.tipo] || contenido.tipo}
            </div>

            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight m-0 text-foreground flex-1 min-w-0">
                {contenido.titulo}
              </h1>
              <ShareButton url={`/c/${slug}`} title={contenido.titulo} variant="button" />
            </div>

            {fechaPublicacionFormateada && (
              <p className="text-sm text-muted-foreground mt-2">
                {fechaPublicacionFormateada}
              </p>
            )}

            {esEvento && fechaInicioEvento && (
              <p className="text-base text-foreground mt-4 font-medium py-3 px-4 bg-primary/10 dark:bg-primary/20 border-l-4 border-primary rounded-r">
                <strong>Evento:</strong> {formatEventoRangeEs(fechaInicioEvento, contenido.fechaFin, locale)}
              </p>
            )}
          </header>

          {contenido.contenidoMd && (
            <div className="prose-contenido text-base leading-relaxed text-foreground">
              {isHtmlContent(contenido.contenidoMd) ? (
                <div dangerouslySetInnerHTML={{ __html: contenido.contenidoMd }} />
              ) : (
                <ReactMarkdown>{contenido.contenidoMd}</ReactMarkdown>
              )}
            </div>
          )}

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
