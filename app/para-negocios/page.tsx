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
import PlanCTAButton from "./PlanCTAButton";

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
const P = PLAN_FEATURES.PREMIUM;

type Feature = { text: string; free: boolean; prem: boolean };

const FEATURES: Feature[] = [
  { text: "Aparición en listados del Club",                      free: true,                          prem: true },
  { text: "Validación QR de socios en el local",                 free: F.qrValidationEnabled,         prem: P.qrValidationEnabled },
  { text: "Oferta/descuento para socios del Club",               free: F.clubOfferEnabled,            prem: P.clubOfferEnabled },
  { text: "1 foto del negocio",                                  free: F.maxPhotos >= 1,              prem: P.maxPhotos >= 1 },
  { text: "Mapa con ubicación y «Cómo llegar»",                  free: F.publicMapVisible,            prem: P.publicMapVisible },
  { text: "Teléfono, email y web visibles",                      free: F.publicPhoneVisible,          prem: P.publicPhoneVisible },
  { text: `Galería de hasta ${P.maxPhotos} fotos`,               free: false,                         prem: true },
  { text: "Horarios públicos detallados",                        free: F.publicScheduleVisible,       prem: P.publicScheduleVisible },
  { text: "Botón WhatsApp directo",                              free: F.publicWhatsappVisible,       prem: P.publicWhatsappVisible },
  { text: "Servicios con iconos (WiFi, parking, mascotas…)",     free: F.serviceHighlightsEnabled,    prem: P.serviceHighlightsEnabled },
  { text: "Badge dorado «Premium Club LPMBE»",                   free: false,                         prem: P.premiumBadgeEnabled },
  { text: "Traducción automática a 7 idiomas",                   free: F.translationEnabled,          prem: P.translationEnabled },
  { text: "Ofertas destacadas con diseño premium",               free: F.featuredOffersEnabled,       prem: P.featuredOffersEnabled },
  { text: "Landing personalizada del negocio",                   free: F.customLandingEnabled,        prem: P.customLandingEnabled },
  { text: "Botón de reserva (Booking, TheFork, web propia)",     free: F.bookingLinkEnabled,          prem: P.bookingLinkEnabled },
  { text: "Links a tus redes sociales",                          free: F.socialLinksEnabled,           prem: P.socialLinksEnabled },
  { text: "Posición destacada (primero en listados)",            free: false,                         prem: P.listingPriority === 'HIGH' },
  { text: "La IA del Club te recomienda primero a los socios",   free: F.iaRecommendationBoost,       prem: P.iaRecommendationBoost },
  { text: "Story/mes en el highlight «Ventajas Club»",           free: false,                         prem: P.monthlyStoryIncluded > 0 },
  { text: "Mención en post editorial mensual del pueblo",        free: false,                         prem: P.monthlyEditorialMention > 0 },
  { text: "Estadísticas avanzadas (gráficos, conversión)",       free: false,                         prem: P.statsLevel === 'ADVANCED' },
  { text: "Placa física «Premium Club LPMBE»",                   free: F.physicalPlaqueIncluded,      prem: P.physicalPlaqueIncluded },
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

      {/* Pricing cards — 2 planes para negocios en la red */}
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-center text-2xl font-bold text-foreground mb-2">
          Planes para negocios en pueblos de la red
        </h2>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
          Si tu negocio está en uno de nuestros más de 100 pueblos, elige el plan
          que mejor se adapte. Cancela cuando quieras.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
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

          {/* PREMIUM */}
          <div className="flex flex-col rounded-2xl border-2 border-amber-400 bg-card p-6 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white">
              Recomendado
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">Premium Club LPMBE</h3>
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
                Todo lo que tu negocio necesita: galería, landing propia, posición destacada, IA, badge dorado, placa física y mucho más.
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
              <PlanCTAButton plan="PREMIUM" variant="amber" />
            </div>
          </div>
        </div>

        {/* Nota IVA */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Precios sin IVA. Pago mensual o anual con descuento. Cancela cuando quieras.
        </p>

        {/* RRSS section — incluido + extras con precios reales */}
        <div className="mt-20" id="rrss">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Servicios de Redes Sociales LPMBE
            </h2>
            <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
              Más de 350.000 seguidores en Instagram y Facebook cualificados, interesados
              en turismo rural. Una audiencia que tu negocio no puede conseguir solo.
            </p>
          </div>

          {/* Lo que va dentro de los planes */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Incluido en tu plan
            </h3>
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">Premium Club LPMBE</p>
              <p className="mt-1 text-xs text-amber-900/80">
                {P.monthlyEditorialMention} mención editorial mensual + {P.monthlyStoryIncluded} story/mes en el highlight permanente «Ventajas Club».
              </p>
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
