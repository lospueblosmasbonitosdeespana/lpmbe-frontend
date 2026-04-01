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
import { getLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = "/para-negocios";
  return {
    title: seoTitle("Planes para Negocios — Club de Amigos"),
    description: seoDescription(
      "Haz crecer tu negocio con Los Pueblos Más Bonitos de España. Planes desde gratuito hasta Premium con galería, contacto visible, badge y landing personalizada."
    ),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: seoTitle("Planes para Negocios — Club de Amigos"),
      description: seoDescription(
        "Haz crecer tu negocio con Los Pueblos Más Bonitos de España. Planes desde gratuito hasta Premium con galería, contacto visible, badge y landing personalizada."
      ),
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
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

type Feature = { text: string; free: boolean; reco: boolean; prem: boolean };

const FEATURES: Feature[] = [
  { text: "Aparición en listados del Club", free: true, reco: true, prem: true },
  { text: "Validación QR de socios en la app", free: true, reco: true, prem: true },
  { text: "Oferta/descuento para socios del Club", free: true, reco: true, prem: true },
  { text: "1 foto del negocio", free: true, reco: true, prem: true },
  { text: "Mapa con ubicación y «Cómo llegar»", free: true, reco: true, prem: true },
  { text: "Galería completa de fotos (hasta 15)", free: false, reco: true, prem: true },
  { text: "Teléfono, email y web visibles", free: false, reco: true, prem: true },
  { text: "Horarios detallados", free: false, reco: true, prem: true },
  { text: "Botón WhatsApp directo", free: false, reco: true, prem: true },
  { text: "Badge «Recomendado por LPMBE»", free: false, reco: true, prem: true },
  { text: "Traducción automática a 7 idiomas", free: false, reco: true, prem: true },
  { text: "Estadísticas de visitas a tu perfil", free: false, reco: true, prem: true },
  { text: "Galería ampliada (hasta 30 fotos)", free: false, reco: false, prem: true },
  { text: "Landing completa personalizada", free: false, reco: false, prem: true },
  { text: "Servicios con iconos (WiFi, parking…)", free: false, reco: false, prem: true },
  { text: "Ofertas temporales destacadas", free: false, reco: false, prem: true },
  { text: "Botón de reserva / enlace a tu sistema", free: false, reco: false, prem: true },
  { text: "Links a tus redes sociales", free: false, reco: false, prem: true },
  { text: "Badge Premium dorado", free: false, reco: false, prem: true },
  { text: "Posición destacada en listados", free: false, reco: false, prem: true },
  { text: "1 publicación/mes en RRSS de LPMBE", free: false, reco: false, prem: true },
  { text: "Placa física «Recomendado por LPMBE»", free: false, reco: false, prem: true },
];

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
            Más de 100 pueblos, miles de socios del Club de Amigos y una marca
            reconocida internacionalmente. Tu negocio merece estar aquí.
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          {/* FREE */}
          <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Gratuito</h2>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">0 &euro;</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Aparece en el Club de Amigos y empieza a recibir socios.
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
                Ya incluido
              </span>
            </div>
          </div>

          {/* RECOMENDADO */}
          <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
              Más popular
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">Recomendado</h2>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">desde X &euro;</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu negocio visible al completo con galería, contacto y badge.
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
                href="/contacto"
                className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Activar plan
              </Link>
              <Link
                href="/contacto"
                className="block w-full rounded-lg border border-border px-4 py-2 text-center text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Contactar para más info
              </Link>
            </div>
          </div>

          {/* PREMIUM */}
          <div className="flex flex-col rounded-2xl border border-amber-300 bg-card p-6 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">Premium</h2>
                <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold text-foreground">desde X &euro;</span>
                <span className="text-sm text-muted-foreground">/mes</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Tu landing completa, badge dorado, placa física y presencia en RRSS.
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
                href="/contacto"
                className="block w-full rounded-lg bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                Activar Premium
              </Link>
              <Link
                href="/contacto"
                className="block w-full rounded-lg border border-border px-4 py-2 text-center text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                Contactar para más info
              </Link>
            </div>
          </div>
        </div>

        {/* RRSS section */}
        <div className="mt-16 rounded-2xl border border-border bg-card p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Servicios de Redes Sociales
            </h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              Publica en las redes sociales de Los Pueblos Más Bonitos de España
              y llega a miles de seguidores interesados en turismo rural.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground">Incluido en Premium</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                1 publicación al mes en nuestras redes sociales (Instagram, Facebook).
                Incluida sin coste adicional con el plan Premium.
              </p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <h3 className="text-lg font-semibold text-foreground">Publicaciones adicionales</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                ¿Necesitas más visibilidad? Contrata publicaciones extra: stories,
                posts, reels y colaboraciones. Disponible para cualquier plan.
              </p>
              <Link
                href="/contacto"
                className="mt-4 inline-block rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                Solicitar presupuesto
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
                Los Pueblos Más Bonitos de España es una marca institucional
                con presencia en más de 100 pueblos y reconocimiento internacional.
              </p>
            </div>
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground">Audiencia cualificada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Nuestros socios del Club de Amigos son viajeros que buscan
                activamente experiencias en pueblos bonitos. Clientes listos para comprar.
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
