import { cookies, headers } from 'next/headers';
import ReactMarkdown from 'react-markdown';
import { getApiUrl } from '@/lib/api';
import BackButton from '@/app/c/[slug]/BackButton';
import ShareButton from '@/app/components/ShareButton';

const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function isHtml(content: string): boolean {
  return content.trimStart().startsWith('<') && /<[a-z][\s\S]*>/i.test(content);
}

async function resolveLocale(): Promise<SupportedLocale> {
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

type StaticPageData = { key: string; titulo: string; contenido: string | null };

async function fetchStaticPage(key: string, lang: string): Promise<StaticPageData | null> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/public/static-pages/${key}?lang=${lang}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.titulo) return null;
  return { key: data.key, titulo: data.titulo, contenido: data.contenido ?? null };
}

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
    title: 'Application mobile « Les Plus Beaux Villages d\u2019Espagne » – Utilisation de la position',
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LegalPage({
  staticKey,
  slug,
  showLocationBlock = false,
}: {
  staticKey: string;
  slug: string;
  showLocationBlock?: boolean;
}) {
  const lang = await resolveLocale();
  const page = await fetchStaticPage(staticKey, lang);
  const titulo = page?.titulo ?? slug;
  const body = page?.contenido ?? '';
  const t = PRIVACY_LOCATION_BLOCK[lang];

  return (
    <main className="px-5 py-10 md:py-[40px]">
      <article>
        <div className="max-w-[720px] mx-auto px-5">
          <header className="mb-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight m-0 text-foreground flex-1 min-w-0">
                {titulo}
              </h1>
              <ShareButton url={`/${slug}`} title={titulo} variant="button" />
            </div>
          </header>

          {body && (
            <div className="prose-contenido text-base leading-relaxed text-foreground">
              {isHtml(body) ? (
                <div dangerouslySetInnerHTML={{ __html: body }} />
              ) : (
                <ReactMarkdown>{body}</ReactMarkdown>
              )}
            </div>
          )}

          {showLocationBlock && (
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
