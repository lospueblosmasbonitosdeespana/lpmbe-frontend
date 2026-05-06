import Link from "next/link";
import type { Metadata } from "next";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";
import { getLocale, getTranslations } from "next-intl/server";
import {
  PLAN_FEATURES,
  PLAN_PRICES_MONTHLY,
  PLAN_PRICES_YEARLY,
  PRODUCTOS_RRSS_SUELTOS,
} from "@/lib/plan-features";

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const path = "/para-negocios";
  const title = seoTitle(tSeo("paraNegociosTitle"));
  const description = seoDescription(tSeo("paraNegociosDesc"));
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
    robots: { index: true, follow: true },
  };
}

const CHECK = (
  <svg className="h-5 w-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LOCK = (
  <svg className="h-5 w-5 shrink-0 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const F = PLAN_FEATURES.FREE;
const R = PLAN_FEATURES.RECOMENDADO;
const P = PLAN_FEATURES.PREMIUM;
const S = PLAN_FEATURES.SELECTION;

type Feature = { text: string; free: boolean; reco: boolean; prem: boolean };

const FEATURES: Feature[] = [
  { text: "Aparición en listados del Club",                      free: true,                          reco: true,                                                  prem: true },
  { text: "Validación QR de socios en el local",                 free: F.qrValidationEnabled,         reco: R.qrValidationEnabled,                                 prem: P.qrValidationEnabled },
  { text: "Oferta/descuento para socios del Club",               free: F.clubOfferEnabled,            reco: R.clubOfferEnabled,                                    prem: P.clubOfferEnabled },
  { text: "1 foto del negocio",                                  free: F.maxPhotos >= 1,              reco: R.maxPhotos >= 1,                                      prem: P.maxPhotos >= 1 },
  { text: "Mapa con ubicación y «Cómo llegar»",                  free: F.publicMapVisible,            reco: R.publicMapVisible,                                    prem: P.publicMapVisible },
  { text: "Teléfono, email y web visibles",                      free: F.publicPhoneVisible,          reco: R.publicPhoneVisible,                                  prem: P.publicPhoneVisible },
  { text: `Galería de fotos (hasta ${R.maxPhotos})`,             free: F.maxPhotos >= R.maxPhotos,    reco: true,                                                  prem: true },
  { text: "Horarios públicos detallados",                        free: F.publicScheduleVisible,       reco: R.publicScheduleVisible,                               prem: P.publicScheduleVisible },
  { text: "Botón WhatsApp directo",                              free: F.publicWhatsappVisible,       reco: R.publicWhatsappVisible,                               prem: P.publicWhatsappVisible },
  { text: "Servicios con iconos (WiFi, parking, mascotas…)",     free: F.serviceHighlightsEnabled,    reco: R.serviceHighlightsEnabled,                            prem: P.serviceHighlightsEnabled },
  { text: "Badge «Club LPMBE»",                                  free: F.recommendedBadgeEnabled,     reco: R.recommendedBadgeEnabled,                             prem: R.recommendedBadgeEnabled || P.premiumBadgeEnabled },
  { text: "Traducción automática a 7 idiomas",                   free: F.translationEnabled,          reco: R.translationEnabled,                                  prem: P.translationEnabled },
  { text: "Estadísticas básicas (visitas, clics)",               free: F.statsLevel !== 'NONE',       reco: R.statsLevel !== 'NONE',                               prem: P.statsLevel !== 'NONE' },
  { text: "Story/mes en el highlight «Ventajas Club»",           free: F.monthlyStoryIncluded > 0,    reco: R.monthlyStoryIncluded > 0,                            prem: P.monthlyStoryIncluded > 0 },
  { text: `Galería ampliada (hasta ${P.maxPhotos} fotos)`,       free: F.maxPhotos >= P.maxPhotos,    reco: R.maxPhotos >= P.maxPhotos,                            prem: true },
  { text: "Landing personalizada del negocio",                   free: F.customLandingEnabled,        reco: R.customLandingEnabled,                                prem: P.customLandingEnabled },
  { text: "Botón de reserva (Booking, TheFork, web propia)",     free: F.bookingLinkEnabled,          reco: R.bookingLinkEnabled,                                  prem: P.bookingLinkEnabled },
  { text: "Links a tus redes sociales",                          free: F.socialLinksEnabled,          reco: R.socialLinksEnabled,                                  prem: P.socialLinksEnabled },
  { text: "Ofertas destacadas con diseño premium",               free: F.featuredOffersEnabled,       reco: R.featuredOffersEnabled,                               prem: P.featuredOffersEnabled },
  { text: "Estadísticas avanzadas (gráficos, conversión)",       free: F.statsLevel === 'ADVANCED',   reco: R.statsLevel === 'ADVANCED',                           prem: P.statsLevel === 'ADVANCED' },
  { text: "Badge dorado «Premium Club LPMBE»",                   free: F.premiumBadgeEnabled,         reco: R.premiumBadgeEnabled,                                 prem: P.premiumBadgeEnabled },
  { text: "Posición destacada (primero en listados)",            free: F.listingPriority === 'HIGH',  reco: R.listingPriority === 'HIGH',                          prem: P.listingPriority === 'HIGH' },
  { text: "La IA del Club te recomienda primero a los socios",   free: F.iaRecommendationBoost,       reco: R.iaRecommendationBoost,                               prem: P.iaRecommendationBoost },
  { text: "Mención en post editorial mensual del pueblo",        free: F.monthlyEditorialMention > 0, reco: R.monthlyEditorialMention > 0,                         prem: P.monthlyEditorialMention > 0 },
  { text: "Placa física «Premium Club LPMBE»",                   free: F.physicalPlaqueIncluded,      reco: R.physicalPlaqueIncluded,                              prem: P.physicalPlaqueIncluded },
];

const SELECTION_FEATURES = [
  `Hasta ${S.maxPhotos} fotografías profesionales`,
  "Landing completamente personalizada",
  `${S.monthlyEditorialMention} menciones editoriales/mes en RRSS de LPMBE`,
  `${S.monthlyStoryIncluded} stories/mes en el highlight «Ventajas Club»`,
  "Presencia destacada en la guía oficial",
  "Co-branding con la marca LPMBE",
  "Badge «Club LPMBE Selection»",
  "Placa física premium grabada",
  "Traducción automática a 7 idiomas",
  "Estadísticas avanzadas de visitas y conversión",
  "Sistema de reservas integrado",
  "Sección propia en lpmbe.com/selection",
  "Atención y soporte personalizado",
];

function fmtEuros(n: number | null): string {
  if (n == null) return "Consultar";
  return `${n} €`;
}

export default async function ParaNegociosPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl text-foreground">
            Haz crecer tu negocio con nosotros
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Más de 100 pueblos certificados, miles de socios del Club y una marca
            reconocida internacionalmente. Tu negocio merece estar aquí.
          </p>
        </div>
      </div>

      {/* Pricing cards — 3 planes para negocios en la red */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-foreground mb-2">
          Planes para negocios en pueblos de la red
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Si tu negocio está en uno de nuestros más de 100 pueblos, elige el plan
          que mejor se adapte. Cancela cuando quieras.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {/* FREE */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Gratuito</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">0 €</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Aparece en el Club y empieza a recibir socios. Sin coste, sin compromiso.
              </p>
            </div>
            <ul className="flex-1 space-y-3 text-sm">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2">
                  {f.free ? CHECK : LOCK}
                  <span className={f.free ? "text-foreground" : "text-muted-foreground/50"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border">
              <span className="block w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">
                Ya incluido al estar en la red
              </span>
            </div>
          </div>

          {/* RECOMENDADO */}
          <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
              Más popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">Recomendado</h3>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">{fmtEuros(PLAN_PRICES_MONTHLY.RECOMENDADO)}</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                o {fmtEuros(PLAN_PRICES_YEARLY.RECOMENDADO)}/año (≈ 2 meses gratis)
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu negocio visible al completo: galería, horarios, WhatsApp, badge y stats.
              </p>
            </div>
            <ul className="flex-1 space-y-3 text-sm">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2">
                  {f.reco ? CHECK : LOCK}
                  <span className={f.reco ? "text-foreground" : "text-muted-foreground/50"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <Link
                href="/contacto?asunto=plan_recomendado"
                className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Quiero el plan Recomendado
              </Link>
            </div>
          </div>

          {/* PREMIUM */}
          <div className="flex flex-col rounded-2xl border border-amber-300 bg-card p-6 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">Premium</h3>
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">{fmtEuros(PLAN_PRICES_MONTHLY.PREMIUM)}</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                o {fmtEuros(PLAN_PRICES_YEARLY.PREMIUM)}/año (≈ 2 meses gratis)
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu landing propia, IA del Club que te recomienda, posición destacada y placa física.
              </p>
            </div>
            <ul className="flex-1 space-y-3 text-sm">
              {FEATURES.map((f) => (
                <li key={f.text} className="flex items-start gap-2">
                  {f.prem ? CHECK : LOCK}
                  <span className={f.prem ? "text-foreground" : "text-muted-foreground/50"}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <Link
                href="/contacto?asunto=plan_premium"
                className="block w-full rounded-lg bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Quiero el plan Premium
              </Link>
            </div>
          </div>
        </div>

        {/* Nota IVA */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Precios sin IVA. Pago mensual o anual con descuento. Cancela cuando quieras.
        </p>

        {/* ─── SELECTION ─── */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="relative rounded-3xl border border-slate-600 p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="h-8 w-8 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <h2 className="text-3xl font-bold text-white">Club LPMBE Selection</h2>
                </div>
                <p className="text-lg text-slate-300 max-w-xl">
                  Para establecimientos excepcionales en cualquier punto de España.
                  Hoteles con encanto, restaurantes de autor, experiencias únicas.
                </p>
                <p className="mt-3 text-sm text-slate-400">
                  Un programa exclusivo por invitación o candidatura para negocios que
                  representan lo mejor del turismo rural y la gastronomía española,
                  estén o no en un pueblo de la red.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {SELECTION_FEATURES.map((feat) => (
                    <div key={feat} className="flex items-start gap-2">
                      <svg className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-sm text-slate-200">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-slate-600 bg-slate-800/80 p-6 md:w-80">
                <div className="text-center mb-6">
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Precio anual</p>
                  <p className="mt-2 text-3xl font-bold text-white">Consultar</p>
                  <p className="mt-1 text-xs text-slate-500">Acceso por invitación o candidatura</p>
                </div>
                <Link
                  href="/selection"
                  className="block w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-center text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
                >
                  Descubrir Selection
                </Link>
                <Link
                  href="/selection/candidatura"
                  className="mt-3 block w-full rounded-lg border border-slate-500 px-4 py-2.5 text-center text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Presentar candidatura
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RRSS section — incluido + extras con precios reales */}
        <div className="mt-20" id="rrss">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Servicios de Redes Sociales LPMBE
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Más de 240.000 seguidores cualificados interesados en turismo rural.
              Una audiencia que tu negocio no puede conseguir solo.
            </p>
          </div>

          {/* Lo que va dentro de los planes */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Incluido en tu plan
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-bold text-foreground">Recomendado</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {R.monthlyStoryIncluded} story/mes en el highlight permanente «Ventajas Club».
                </p>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900">Premium</p>
                <p className="mt-1 text-xs text-amber-900/80">
                  {P.monthlyEditorialMention} mención editorial mensual + {P.monthlyStoryIncluded} story en el highlight del Club.
                </p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-sm font-bold text-amber-300">Selection</p>
                <p className="mt-1 text-xs text-slate-300">
                  {S.monthlyEditorialMention} menciones editoriales + {S.monthlyStoryIncluded} stories al mes.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Las menciones se publican dentro de contenido editorial sobre el pueblo
              (donde tu negocio aparece como parte de la experiencia, no como anuncio).
              Esto protege la línea editorial y maximiza el alcance orgánico.
            </p>
          </div>

          {/* Productos sueltos con precios reales */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Publicaciones adicionales (cualquier plan)
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Compra publicaciones extra cuando quieras destacar una promoción, un
              evento o un lanzamiento. Sujetas a aprobación editorial para mantener
              la calidad de nuestras cuentas.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {PRODUCTOS_RRSS_SUELTOS.map((p) => (
                <div key={p.tipo} className="rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="text-base font-semibold text-foreground">{p.label}</h4>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">
                        {p.precioMax ? `${p.precio}–${p.precioMax} €` : `${p.precio} €`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{p.descripcion}</p>
                  {p.requiereAprobacion && (
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      Requiere aprobación editorial
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-4">
              <p className="text-sm text-foreground">
                <strong>¿Necesitas un pack o una campaña conjunta?</strong> Hablamos
                contigo para diseñar la mejor estrategia.
              </p>
              <Link
                href="/contacto?asunto=rrss_publicacion_suelta"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors text-center"
              >
                Pedir presupuesto
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ / Trust */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-foreground">¿Por qué estar con nosotros?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground">Marca reconocida</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Los Pueblos Más Bonitos de España es una marca institucional con
                presencia en más de 100 pueblos y reconocimiento internacional.
              </p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground">Audiencia cualificada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Nuestros socios del Club son viajeros que buscan activamente
                experiencias en pueblos bonitos. Clientes listos para reservar.
              </p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground">7 idiomas automáticos</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu perfil se traduce automáticamente a español, inglés, francés,
                alemán, portugués, italiano y catalán. Turismo internacional sin esfuerzo.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
          <h2 className="text-xl font-bold text-foreground">
            ¿Tienes dudas? Hablemos.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Nuestro equipo te asesorará sobre qué plan se adapta mejor a tu negocio.
            Sin compromiso.
          </p>
          <Link
            href="/contacto"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Contactar
          </Link>
        </div>
      </div>
    </main>
  );
}
