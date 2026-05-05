import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';

type PageRow = {
  url: string;
  label: string;
  source: string;
  triggerNew: string;
  category: string;
};

const PAGES: PageRow[] = [
  // ── Home y generales ──
  {
    url: '/',
    label: 'Home',
    source: 'Gestión > Asociación > Configuración del Home (banners, bloques, vídeos).',
    triggerNew: 'Se actualiza desde el panel de Home.',
    category: 'general',
  },
  {
    url: '/pueblos',
    label: 'Listado de pueblos',
    source: 'Tabla Pueblo en la BD. Cada pueblo con certificación activa y publicado=true aparece aquí.',
    triggerNew: 'Cuando se certifica un nuevo pueblo en Gestión > Pueblos y se marca como publicado.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]',
    label: 'Ficha de pueblo',
    source: 'Tabla Pueblo + PuebloHighlight + PuntoServicio + fotos + meteo (Open-Meteo API). El slug viene del nombre normalizado del pueblo.',
    triggerNew: 'Automática al publicar un pueblo. El alcalde gestiona destacados, servicios y fotos desde su panel (/gestion/pueblos/[slug]).',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/categoria/[cat]/[page]',
    label: 'Páginas de categoría (pueblo)',
    source: 'Tabla PaginaPueblo vinculada al pueblo. Categorías: patrimonio, cultura, naturaleza, en familia, petfriendly, gastronomía.',
    triggerNew: 'El alcalde crea páginas desde Gestión > Pueblos > [pueblo] > Páginas.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/actualidad',
    label: 'Actualidad del pueblo',
    source: 'Tabla Contenido filtrada por puebloId. Noticias y eventos del pueblo.',
    triggerNew: 'El alcalde publica noticias/eventos desde su panel.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/videos/[id]',
    label: 'Vídeos del pueblo',
    source: 'Tabla VideoPueblo. URLs de YouTube/R2.',
    triggerNew: 'El alcalde sube vídeos desde Gestión > Pueblos > [pueblo] > Vídeos.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/multiexperiencias',
    label: 'Multiexperiencias del pueblo',
    source: 'Tabla Multiexperiencia filtrada por puebloId. Paradas con fotos y textos.',
    triggerNew: 'La asociación crea multiexperiencias (rutas) desde Gestión > Asociación > Rutas.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/pois/[poi]',
    label: 'Punto de interés (POI)',
    source: 'Tabla PuntoInteres. Coordenadas, fotos y descripción.',
    triggerNew: 'El alcalde añade POIs desde el mapa de su pueblo.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/webcam',
    label: 'Webcam del pueblo',
    source: 'Tabla Webcam vinculada al pueblo. URL embed.',
    triggerNew: 'Se configura desde Gestión > Pueblos > [pueblo] > Webcam.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/alertas',
    label: 'Alertas del pueblo',
    source: 'Tabla Alerta filtrada por puebloId (meteo, inundación, etc.).',
    triggerNew: 'Automáticas por el cron de meteo (si caudal > umbral, nieve extrema…). También alertas manuales desde Gestión > Alertas.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/[slug]/club/[negocio]',
    label: 'Negocios Club del pueblo',
    source: 'Tabla Negocio con descuento Club activo, filtrada por puebloId.',
    triggerNew: 'Se crea desde Gestión > Asociación > Negocios.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/comunidades/[slug]',
    label: 'Pueblos por comunidad',
    source: 'Agrupación automática por el campo comunidad de la tabla Pueblo.',
    triggerNew: 'Automática al publicar un pueblo. No requiere acción.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/provincias',
    label: 'Pueblos por provincia',
    source: 'Agrupación automática por el campo provincia de la tabla Pueblo.',
    triggerNew: 'Automática al publicar un pueblo.',
    category: 'pueblos',
  },
  {
    url: '/pueblos/ultimas-incorporaciones',
    label: 'Últimas incorporaciones',
    source: 'Pueblos ordenados por fecha de certificación (más recientes primero).',
    triggerNew: 'Automática al certificar un nuevo pueblo.',
    category: 'pueblos',
  },

  // ── Descubre (colecciones temáticas) ──
  {
    url: '/descubre',
    label: 'Descubre — Índice',
    source: 'API /public/descubre. Las colecciones están definidas en backend/src/descubre/descubre.collections.ts.',
    triggerNew: 'Se añade una nueva colección editando descubre.collections.ts en el backend (desarrollo).',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-con-castillo',
    label: '🏰 Pueblos con castillo',
    source: 'PuebloHighlight con etiqueta "CASTILLO". Los alcaldes marcan este destacado desde su panel.',
    triggerNew: 'Un pueblo aparece aquí cuando su alcalde añade el highlight "CASTILLO" en Gestión > Pueblos > [pueblo] > Patrimonio y Tradición.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-a-mas-de-mil-metros',
    label: '⛰️ Pueblos a más de 1.000 m',
    source: 'PuebloHighlight con etiqueta "ALTITUD" y valor numérico ≥ 1000.',
    triggerNew: 'Automático si el highlight ALTITUD del pueblo tiene valor ≥ 1000.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-costeros',
    label: '🌊 Pueblos costeros',
    source: 'Lista fija de 14 IDs definida en backend/src/common/constants.ts (PUEBLOS_COSTEROS_IDS). No se genera automáticamente.',
    triggerNew: 'Solo si se añade manualmente el ID del nuevo pueblo costero en el código (constants.ts).',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-amurallados',
    label: '🧱 Pueblos amurallados',
    source: 'PuebloHighlight con etiqueta "MURALLAS".',
    triggerNew: 'Alcalde marca highlight "MURALLAS" en Patrimonio y Tradición.',
    category: 'descubre',
  },
  {
    url: '/descubre/los-pueblos-mas-pequenos',
    label: '🏘️ Los pueblos más pequeños',
    source: 'PuebloHighlight con etiqueta "HABITANTES" y valor numérico ≤ 100.',
    triggerNew: 'Automático si el highlight HABITANTES del pueblo indica ≤ 100.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-en-islas',
    label: '🏝️ Pueblos en islas',
    source: 'Pueblos cuya comunidad es "Islas Baleares" o "Canarias".',
    triggerNew: 'Automático al publicar un pueblo de esas comunidades.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-con-area-de-autocaravanas',
    label: '🚐 Pueblos con autocaravanas',
    source: 'PuntoServicio con tipo "CARAVANAS" asociado al pueblo.',
    triggerNew: 'Alcalde añade un punto de servicio tipo "CARAVANAS" desde su panel.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-con-cargador-electrico',
    label: '⚡ Pueblos con cargador EV',
    source: 'PuntoServicio con tipo "COCHE_ELECTRICO" asociado al pueblo.',
    triggerNew: 'Alcalde añade un punto de servicio tipo "COCHE_ELECTRICO".',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-para-familias',
    label: '👨‍👩‍👧‍👦 Pueblos para familias',
    source: 'PuntoServicio con tipo "PARQUE_INFANTIL" asociado al pueblo.',
    triggerNew: 'Alcalde añade un punto de servicio tipo "PARQUE_INFANTIL".',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-con-nieve-fresca',
    label: '❄️ Pueblos con nieve fresca',
    source: 'Datos meteo en tiempo real (Open-Meteo API). Nieve real acumulada en las últimas 24h (acumulados.nieve24hCm > 0.1 cm).',
    triggerNew: 'Totalmente automático. Cambia cada hora con datos reales, no previsión.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-mas-frescos-hoy',
    label: '🌬️ Los más frescos hoy',
    source: 'Datos meteo en tiempo real. Top 15 por temperatura más baja.',
    triggerNew: 'Totalmente automático. Se actualiza con el cron meteorológico.',
    category: 'descubre',
  },
  {
    url: '/descubre/pueblos-con-mejor-tiempo-hoy',
    label: '☀️ Mejor tiempo hoy',
    source: 'Datos meteo combinados (sol, poca lluvia, temperatura agradable). Top 15.',
    triggerNew: 'Totalmente automático.',
    category: 'descubre',
  },

  // ── Meteo ──
  {
    url: '/meteo',
    label: 'Meteorología',
    source: 'API /public/meteo/aggregate. Datos de Open-Meteo: temperatura, viento, UV, humedad, nieve, sensación térmica. Marine API solo para pueblos costeros. Flood API para crecidas.',
    triggerNew: 'Automático para todos los pueblos publicados. Cron cada hora en el backend.',
    category: 'meteo',
  },

  // ── Experiencias / Categorías SEO ──
  {
    url: '/experiencias',
    label: 'Experiencias',
    source: 'Tabla Experiencia (categorías temáticas globales). Se crean desde Gestión > Asociación.',
    triggerNew: 'Se crea una nueva experiencia desde el backend o Gestión.',
    category: 'experiencias',
  },
  {
    url: '/cultura/[pueblo]',
    label: 'Cultura (por pueblo)',
    source: 'PaginaPueblo de tipo "cultura" del pueblo.',
    triggerNew: 'Alcalde crea páginas de tipo cultura.',
    category: 'experiencias',
  },
  {
    url: '/naturaleza/[pueblo]',
    label: 'Naturaleza (por pueblo)',
    source: 'PaginaPueblo de tipo "naturaleza" del pueblo.',
    triggerNew: 'Alcalde crea páginas de tipo naturaleza.',
    category: 'experiencias',
  },
  {
    url: '/que-comer/[pueblo]',
    label: 'Qué comer (por pueblo)',
    source: 'PaginaPueblo de tipo "gastronomía" del pueblo.',
    triggerNew: 'Alcalde crea páginas de gastronomía.',
    category: 'experiencias',
  },
  {
    url: '/patrimonio/[pueblo]',
    label: 'Patrimonio (por pueblo)',
    source: 'PaginaPueblo de tipo "patrimonio" del pueblo.',
    triggerNew: 'Alcalde crea páginas de patrimonio.',
    category: 'experiencias',
  },
  {
    url: '/en-familia/[pueblo]',
    label: 'En familia (por pueblo)',
    source: 'PaginaPueblo de tipo "en familia".',
    triggerNew: 'Alcalde crea páginas de tipo "en familia".',
    category: 'experiencias',
  },
  {
    url: '/petfriendly/[pueblo]',
    label: 'Petfriendly (por pueblo)',
    source: 'PaginaPueblo de tipo "petfriendly".',
    triggerNew: 'Alcalde crea páginas de tipo "petfriendly".',
    category: 'experiencias',
  },

  // ── Negocios ──
  {
    url: '/donde-dormir/[pueblo]',
    label: 'Dónde dormir (por pueblo)',
    source: 'Tabla Negocio con tipo alojamiento, filtrada por puebloId.',
    triggerNew: 'Se crea desde Gestión > Asociación > Negocios.',
    category: 'negocios',
  },
  {
    url: '/donde-comer/[pueblo]',
    label: 'Dónde comer (por pueblo)',
    source: 'Tabla Negocio con tipo restauración, filtrada por puebloId.',
    triggerNew: 'Se crea desde Gestión > Asociación > Negocios.',
    category: 'negocios',
  },
  {
    url: '/donde-comprar/[pueblo]',
    label: 'Dónde comprar (por pueblo)',
    source: 'Tabla Negocio con tipo comercio, filtrada por puebloId.',
    triggerNew: 'Se crea desde Gestión > Asociación > Negocios.',
    category: 'negocios',
  },

  // ── Actualidad ──
  {
    url: '/actualidad',
    label: 'Actualidad (global)',
    source: 'Tabla Contenido (noticias, eventos, artículos) a nivel nacional.',
    triggerNew: 'Se publica desde Gestión > Asociación > Contenidos o Noticias.',
    category: 'actualidad',
  },
  {
    url: '/noticias/[slug]',
    label: 'Detalle de noticia',
    source: 'Tabla Contenido por slug. Incluye SEO, fotos y traducción.',
    triggerNew: 'Se publica desde Gestión > Asociación > Noticias.',
    category: 'actualidad',
  },
  {
    url: '/eventos/[slug]',
    label: 'Detalle de evento',
    source: 'Tabla Contenido de tipo evento, por slug.',
    triggerNew: 'Se publica desde Gestión > Asociación > Contenidos (tipo evento).',
    category: 'actualidad',
  },

  // ── Campañas estacionales ──
  {
    url: '/planifica/semana-santa',
    label: 'Semana Santa',
    source: 'Tabla CampañaSemanaSnata (config + días + pueblos). Estado activo/inactivo desde Gestión > Asociación > Semana Santa.',
    triggerNew: 'Se configura año, días y se abren inscripciones para alcaldes desde Gestión.',
    category: 'campañas',
  },
  {
    url: '/planifica/navidad',
    label: 'Navidad',
    source: 'Configuración de campaña Navidad. Mercadillos, belenes, cabalgatas.',
    triggerNew: 'Se configura desde Gestión > Asociación > Navidad.',
    category: 'campañas',
  },
  {
    url: '/noche-romantica',
    label: 'La Noche Romántica',
    source: 'Configuración global + pueblos participantes.',
    triggerNew: 'Se configura desde Gestión > Asociación > Noche Romántica.',
    category: 'campañas',
  },

  // ── Rutas ──
  {
    url: '/rutas',
    label: 'Rutas',
    source: 'Tabla Multiexperiencia global (no vinculada a un solo pueblo).',
    triggerNew: 'Se crea desde Gestión > Asociación > Rutas.',
    category: 'rutas',
  },
  {
    url: '/rutas/[slug]',
    label: 'Detalle de ruta',
    source: 'Multiexperiencia por slug con paradas ordenadas.',
    triggerNew: 'Se crea desde Gestión > Asociación > Rutas.',
    category: 'rutas',
  },

  // ── El Sello ──
  {
    url: '/el-sello',
    label: 'El Sello (inicio)',
    source: 'CMS interno: tabla SelloSeccion. Se edita desde Gestión > Asociación > El Sello.',
    triggerNew: 'Edición directa desde el CMS del Sello.',
    category: 'sello',
  },
  {
    url: '/el-sello/socios/[slug]',
    label: 'Socios internacionales',
    source: 'Tabla SelloSocio.',
    triggerNew: 'Se añaden socios desde Gestión > Asociación > El Sello > Socios.',
    category: 'sello',
  },

  // ── Tienda ──
  {
    url: '/tienda',
    label: 'Tienda',
    source: 'Tabla Producto (publicados). Stripe para pagos.',
    triggerNew: 'Se crea producto desde Gestión > Asociación > Tienda > Productos.',
    category: 'tienda',
  },
  {
    url: '/tienda/[slug]',
    label: 'Detalle de producto',
    source: 'Tabla Producto por slug.',
    triggerNew: 'Se publica producto desde la tienda de gestión.',
    category: 'tienda',
  },

  // ── Club ──
  {
    url: '/club',
    label: 'Club de Amigos',
    source: 'Configuración del club + tabla Usuario (socios activos).',
    triggerNew: 'Se configura desde Gestión > Asociación > Club.',
    category: 'club',
  },
  {
    url: '/para-negocios',
    label: 'Planes para negocios',
    source: 'Página estática con los planes (Gratuito, Recomendado, Premium, Selection). Plan features definidos en lib/plan-features.ts (frontend) y common/constants.ts (backend).',
    triggerNew: 'Se edita directamente en el código (plan-features.ts). Los precios de Stripe se configuran en el backend.',
    category: 'club',
  },

  // ── Selection ──
  {
    url: '/selection',
    label: 'Club LPMBE Selection — Listado',
    source: 'Tabla RecursoTuristico con planNegocio=SELECTION y activo=true. API /public/recursos/selection. Incluye filtros por tipo y búsqueda.',
    triggerNew: 'Cuando un negocio se activa con plan Selection desde Gestión > Asociación > Negocios.',
    category: 'selection',
  },
  {
    url: '/selection/[slug]',
    label: 'Detalle de negocio Selection',
    source: 'Tabla RecursoTuristico por slug, con imagenes, ofertas, servicios, socialLinks. API /public/recursos/[slug]. Siempre traducido (7 idiomas).',
    triggerNew: 'Automática al activar un negocio con plan Selection.',
    category: 'selection',
  },
  {
    url: '/selection/candidatura',
    label: 'Formulario de candidatura Selection',
    source: 'Formulario público → tabla SelectionCandidatura. Envía email al admin + guarda en BD. Traducido (7 idiomas).',
    triggerNew: 'Página fija. Los envíos se gestionan desde Gestión > Asociación > Selection.',
    category: 'selection',
  },
  {
    url: '/negocio/[slug]',
    label: 'Landing personalizada de negocio',
    source: 'Tabla RecursoTuristico con campo landingConfig (JSON). Headline, subtítulo, CTA, hero, tema visual. Solo para planes Premium/Selection con customLandingEnabled.',
    triggerNew: 'El negocio configura su landing desde Gestión > Negocios > [negocio] > Landing personalizada. Incluye subida de imagen hero a R2.',
    category: 'selection',
  },

  // ── Recursos turísticos ──
  {
    url: '/recursos',
    label: 'Recursos turísticos',
    source: 'Tabla RecursoTuristico. Castillos, monasterios, etc.',
    triggerNew: 'Se crean desde Gestión > Asociación > Recursos turísticos.',
    category: 'recursos',
  },

  // ── Webcams ──
  {
    url: '/webcams',
    label: 'Webcams en directo',
    source: 'Tabla Webcam. Todas las webcams de pueblos con señal activa.',
    triggerNew: 'Cuando un pueblo configura su webcam, aparece aquí.',
    category: 'general',
  },

  // ── Mapa ──
  {
    url: '/mapa',
    label: 'Mapa interactivo',
    source: 'Coordenadas de la tabla Pueblo + marcadores de POIs.',
    triggerNew: 'Automático al publicar un pueblo con coordenadas.',
    category: 'general',
  },

  // ── Alertas ──
  {
    url: '/alertas',
    label: 'Alertas (global)',
    source: 'Tabla Alerta. Alertas meteo automáticas + manuales.',
    triggerNew: 'Automáticas por cron (Flood, nieve) o manuales desde Gestión > Alertas.',
    category: 'general',
  },

  // ── Notificaciones ──
  {
    url: '/notificaciones',
    label: 'Centro de notificaciones',
    source: 'Tabla Notificacion. Fin de semana, campañas, Planifica.',
    triggerNew: 'Automáticas por cron (jueves) + manuales desde Gestión.',
    category: 'general',
  },

  // ── App ──
  {
    url: '/app',
    label: 'Página de la App',
    source: 'Página estática con enlaces a App Store y Google Play. QR de descarga.',
    triggerNew: 'Se edita directamente en el código.',
    category: 'general',
  },

  // ── Prensa ──
  {
    url: '/prensa',
    label: 'Prensa y medios',
    source: 'Tabla PressRelease + PressMention. Comunicados, menciones en medios y kit de prensa.',
    triggerNew: 'Se publican desde Gestión > Asociación > Prensa y medios.',
    category: 'actualidad',
  },

  // ── Newsletter ──
  {
    url: '/newsletter',
    label: 'Suscripción newsletter',
    source: 'Formulario público → tabla NewsletterSubscriber.',
    triggerNew: 'Página fija.',
    category: 'general',
  },

  // ── Planifica (nuevas) ──
  {
    url: '/planifica/fin-de-semana',
    label: 'Planifica: Fin de semana',
    source: 'Notificación de fin de semana: eventos, meteo y sugerencias por región (Norte, Sur, Este, Centro). Cron del jueves.',
    triggerNew: 'Automático cada jueves. Se basa en eventos y meteo del fin de semana.',
    category: 'campañas',
  },
  {
    url: '/planifica/fin-de-semana/pueblo/[slug]',
    label: 'Planifica: Pueblo este fin de semana',
    source: 'Detalle de un pueblo con sus eventos y meteo del fin de semana.',
    triggerNew: 'Automático cada jueves.',
    category: 'campañas',
  },
  {
    url: '/planifica/crea-mi-ruta',
    label: 'Planifica: Crea mi ruta',
    source: 'Herramienta interactiva para crear rutas personalizadas entre pueblos. Sin BD, todo en cliente.',
    triggerNew: 'Página fija.',
    category: 'campañas',
  },
  {
    url: '/planifica/mis-rutas',
    label: 'Planifica: Mis rutas guardadas',
    source: 'Rutas guardadas en localStorage del usuario.',
    triggerNew: 'Página fija.',
    category: 'campañas',
  },

  // ── Redes sociales ──
  {
    url: '/redes-sociales',
    label: 'Redes sociales',
    source: 'Página estática con enlaces a Instagram, Facebook, X, YouTube.',
    triggerNew: 'Se edita directamente en el código.',
    category: 'general',
  },

  // ── Validador QR ──
  {
    url: '/validador/[recursoId]',
    label: 'Validador QR de recurso',
    source: 'Tabla RecursoTuristico por código QR. Permite a socios del Club validar visitas.',
    triggerNew: 'Automático al crear un negocio con código QR.',
    category: 'club',
  },

  // ── Cupones ──
  {
    url: '/cupones',
    label: 'Cupones activos',
    source: 'Tabla Cupon. Cupones de descuento para la tienda.',
    triggerNew: 'Se crean desde Gestión > Asociación > Tienda > Cupones.',
    category: 'tienda',
  },

  // ── Páginas de gestión relevantes ──
  {
    url: '/gestion/asociacion/selection',
    label: '[GESTIÓN] Admin candidaturas Selection',
    source: 'Tabla SelectionCandidatura. Listado con filtro por estado (Pendiente, En revisión, Aprobada, Rechazada). Al cambiar estado se envía email al solicitante.',
    triggerNew: 'Se reciben candidaturas desde /selection/candidatura.',
    category: 'selection',
  },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  general:       { label: 'General',               color: 'text-slate-700 dark:text-slate-300',   bg: 'bg-slate-100 dark:bg-slate-800' },
  pueblos:       { label: 'Pueblos',               color: 'text-amber-700 dark:text-amber-300',   bg: 'bg-amber-50 dark:bg-amber-950/40' },
  descubre:      { label: 'Descubre (colecciones)', color: 'text-sky-700 dark:text-sky-300',      bg: 'bg-sky-50 dark:bg-sky-950/40' },
  meteo:         { label: 'Meteorología',           color: 'text-cyan-700 dark:text-cyan-300',     bg: 'bg-cyan-50 dark:bg-cyan-950/40' },
  experiencias:  { label: 'Experiencias / Categorías', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  negocios:      { label: 'Negocios',              color: 'text-teal-700 dark:text-teal-300',     bg: 'bg-teal-50 dark:bg-teal-950/40' },
  selection:     { label: 'Selection (negocios premium)', color: 'text-amber-800 dark:text-amber-200', bg: 'bg-gradient-to-r from-amber-50 to-slate-50 dark:from-amber-950/40 dark:to-slate-950/40' },
  actualidad:    { label: 'Actualidad',             color: 'text-rose-700 dark:text-rose-300',     bg: 'bg-rose-50 dark:bg-rose-950/40' },
  campañas:      { label: 'Campañas / Planifica',   color: 'text-fuchsia-700 dark:text-fuchsia-300', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40' },
  rutas:         { label: 'Rutas',                  color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-950/40' },
  sello:         { label: 'El Sello',               color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-950/40' },
  tienda:        { label: 'Tienda',                 color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  club:          { label: 'Club',                   color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
  recursos:      { label: 'Recursos turísticos',    color: 'text-stone-700 dark:text-stone-300',   bg: 'bg-stone-100 dark:bg-stone-800' },
};

function groupByCategory(pages: PageRow[]) {
  const groups: Record<string, PageRow[]> = {};
  for (const p of pages) {
    (groups[p.category] ??= []).push(p);
  }
  return groups;
}

export default async function MapaPaginasPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  const grouped = groupByCategory(PAGES);

  return (
    <GestionAsociacionSubpageShell
      title="Mapa de páginas y datos"
      subtitle="Referencia completa: cada página pública, de dónde salen los datos y qué tiene que pasar para que un pueblo o contenido aparezca."
      heroIcon={
        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h4m6 14h4a2 2 0 002-2V5a2 2 0 00-2-2h-4m-6 0v18m6-18v18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
      maxWidthClass="max-w-7xl"
    >
      {/* Legend */}
      <div className="mb-8 rounded-xl border border-border/60 bg-muted/30 p-4 dark:bg-muted/15">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground/70">Leyenda de colores</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <span key={key} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.bg} ${meta.color}`}>
              {meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mb-8 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-800/40 dark:bg-amber-950/25">
        <p className="text-sm font-medium leading-relaxed text-amber-900 dark:text-amber-100">
          <strong>¿Se añade un pueblo nuevo?</strong> Al certificarlo y publicarlo, aparecerá automáticamente en el listado general, mapa, meteo y comunidades.
          Para que salga en las colecciones de <em>Descubre</em>, el alcalde debe completar sus <strong>highlights</strong> (castillo, altitud, murallas, habitantes)
          y sus <strong>puntos de servicio</strong> (autocaravanas, cargador eléctrico, parque infantil) desde su panel de gestión.
          Las colecciones de <em>meteo en tiempo real</em> son totalmente automáticas.
        </p>
      </div>

      {/* Tables by category */}
      {Object.entries(grouped).map(([cat, rows]) => {
        const meta = CATEGORY_META[cat] ?? CATEGORY_META.general;
        return (
          <section key={cat} className="mb-10">
            <div className="mb-3 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-xs text-muted-foreground">{rows.length} página{rows.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="overflow-hidden rounded-xl border border-border/60 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/40 dark:bg-muted/20">
                      <th className="px-4 py-3 text-left font-bold text-foreground/80">Página</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground/80">URL</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground/80">Origen de los datos</th>
                      <th className="px-4 py-3 text-left font-bold text-foreground/80">¿Cuándo aparece / se actualiza?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={row.url} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/15 dark:bg-muted/8'}>
                        <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{row.label}</td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono text-foreground/70 dark:bg-muted/30">
                            {row.url}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-foreground/80 leading-relaxed">{row.source}</td>
                        <td className="px-4 py-3 text-foreground/70 leading-relaxed">{row.triggerNew}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}

      {/* Summary */}
      <div className="mt-6 rounded-xl border border-border/60 bg-muted/25 p-5 dark:bg-muted/10">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground/70">Resumen rápido</h2>
        <ul className="space-y-2 text-sm text-foreground/80">
          <li><strong>Automáticas por publicar pueblo:</strong> listado, ficha, mapa, meteo, comunidades, provincias, últimas incorporaciones.</li>
          <li><strong>Dependen del alcalde:</strong> páginas de categoría, vídeos, POIs, webcam, highlights (castillo, murallas…), servicios (autocaravanas, cargador…).</li>
          <li><strong>Dependen de la asociación:</strong> noticias, eventos, rutas, experiencias, negocios, campañas, recursos turísticos, tienda, club, candidaturas Selection.</li>
          <li><strong>Dependen del negocio:</strong> landing personalizada (/negocio/[slug]), fotos, servicios, redes sociales, ofertas. Solo planes Premium/Selection.</li>
          <li><strong>Totalmente automáticas (meteo):</strong> nieve hoy, más frescos, mejor tiempo, alertas flood.</li>
          <li><strong>Traducción (i18n):</strong> Selection siempre traducido (7 idiomas). Negocios FREE no se traducen; desde Recomendado sí. La UI de /selection y /candidatura están traducidas.</li>
          <li><strong>Requieren código:</strong> añadir un pueblo costero a la Marine API (constants.ts), crear nueva colección en Descubre (descubre.collections.ts), precios Stripe (negocio-plan.service.ts).</li>
        </ul>
      </div>
    </GestionAsociacionSubpageShell>
  );
}
