import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Star, Lock, Tag, Users, Sparkles } from "lucide-react";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Headline } from "@/app/components/ui/typography";
import JsonLd from "@/app/components/seo/JsonLd";
import { getResourceLabel } from "@/lib/resource-types";

type RecursoLimited = {
  id: number;
  slug: string | null;
  nombre: string;
  tipo: string;
  scope: string;
  visibilidad: "PUBLICO" | "SOLO_CLUB" | "OCULTO";
  requiereClub: true;
  fotoUrl: string | null;
  descripcion: string | null;
  provincia: string | null;
  comunidad: string | null;
  localidad: string | null;
  pueblo: { id: number; nombre: string; slug: string } | null;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
  cerradoTemporal: boolean;
  activo: boolean;
};

type ClubLandingI18n = {
  home: string;
  resources: string;
  backToResources: string;
  inCountry: string;
  imprescindibleLabel: string;
  // Landing-specific
  lockBadge: string;
  heading: string;
  subheading: string;
  benefitsTitle: string;
  benefit1Title: string;
  benefit1Desc: string;
  benefit2Title: string;
  benefit2Desc: string;
  benefit3Title: string;
  benefit3Desc: string;
  cta: string;
  alreadyMember: string;
  loginCta: string;
};

const LANDING_I18N: Record<string, ClubLandingI18n> = {
  es: {
    home: "Inicio",
    resources: "Recursos turísticos",
    backToResources: "Volver a Recursos",
    inCountry: "España",
    imprescindibleLabel: "Imprescindible",
    lockBadge: "Recurso del Club",
    heading: "Este recurso es exclusivo para socios del Club",
    subheading:
      "Únete al Club de los Pueblos más Bonitos de España y accede a toda la información, condiciones especiales y beneficios.",
    benefitsTitle: "¿Qué te ofrece ser socio?",
    benefit1Title: "Acceso completo",
    benefit1Desc:
      "Toda la información de los recursos turísticos: precios, horarios, contacto, ubicación exacta y más.",
    benefit2Title: "Descuentos y regalos",
    benefit2Desc:
      "Beneficios exclusivos en cada recurso: descuentos, regalos y experiencias diseñadas para socios.",
    benefit3Title: "Apoya los pueblos",
    benefit3Desc:
      "Tu cuota sostiene la red de los Pueblos más Bonitos de España y su patrimonio rural.",
    cta: "Únete al Club",
    alreadyMember: "¿Ya eres socio?",
    loginCta: "Inicia sesión",
  },
  en: {
    home: "Home",
    resources: "Tourist resources",
    backToResources: "Back to Resources",
    inCountry: "Spain",
    imprescindibleLabel: "Must-see",
    lockBadge: "Club resource",
    heading: "This resource is exclusive to Club members",
    subheading:
      "Join the Club of the Most Beautiful Villages of Spain and unlock full information, special conditions and benefits.",
    benefitsTitle: "What does membership offer?",
    benefit1Title: "Full access",
    benefit1Desc:
      "Complete information of every tourist resource: prices, opening hours, contact details, precise location and more.",
    benefit2Title: "Discounts and gifts",
    benefit2Desc:
      "Exclusive benefits at every resource: discounts, gifts and experiences designed for members.",
    benefit3Title: "Support the villages",
    benefit3Desc:
      "Your membership supports the network of the Most Beautiful Villages of Spain and their rural heritage.",
    cta: "Join the Club",
    alreadyMember: "Already a member?",
    loginCta: "Sign in",
  },
  fr: {
    home: "Accueil",
    resources: "Ressources touristiques",
    backToResources: "Retour aux ressources",
    inCountry: "Espagne",
    imprescindibleLabel: "Incontournable",
    lockBadge: "Ressource du Club",
    heading: "Cette ressource est réservée aux membres du Club",
    subheading:
      "Rejoignez le Club des Plus Beaux Villages d'Espagne et accédez à toutes les informations, conditions spéciales et avantages.",
    benefitsTitle: "Que vous offre l'adhésion ?",
    benefit1Title: "Accès complet",
    benefit1Desc:
      "Toutes les informations des ressources touristiques : prix, horaires, contact, emplacement exact et plus.",
    benefit2Title: "Réductions et cadeaux",
    benefit2Desc:
      "Avantages exclusifs sur chaque ressource : réductions, cadeaux et expériences pour les membres.",
    benefit3Title: "Soutenez les villages",
    benefit3Desc:
      "Votre cotisation soutient le réseau des Plus Beaux Villages d'Espagne et leur patrimoine rural.",
    cta: "Rejoindre le Club",
    alreadyMember: "Déjà membre ?",
    loginCta: "Se connecter",
  },
  de: {
    home: "Startseite",
    resources: "Touristische Ressourcen",
    backToResources: "Zurück zu Ressourcen",
    inCountry: "Spanien",
    imprescindibleLabel: "Sehenswert",
    lockBadge: "Club-Ressource",
    heading: "Diese Ressource ist exklusiv für Clubmitglieder",
    subheading:
      "Tritt dem Club der Schönsten Dörfer Spaniens bei und erhalte vollen Zugriff auf Informationen, Sonderkonditionen und Vorteile.",
    benefitsTitle: "Was bietet die Mitgliedschaft?",
    benefit1Title: "Voller Zugriff",
    benefit1Desc:
      "Alle Informationen zu den Ressourcen: Preise, Öffnungszeiten, Kontakt, exakter Standort und mehr.",
    benefit2Title: "Rabatte und Geschenke",
    benefit2Desc:
      "Exklusive Vorteile an jeder Ressource: Rabatte, Geschenke und Erlebnisse für Mitglieder.",
    benefit3Title: "Unterstütze die Dörfer",
    benefit3Desc:
      "Dein Beitrag unterstützt das Netzwerk der Schönsten Dörfer Spaniens und ihr ländliches Erbe.",
    cta: "Dem Club beitreten",
    alreadyMember: "Schon Mitglied?",
    loginCta: "Anmelden",
  },
  pt: {
    home: "Início",
    resources: "Recursos turísticos",
    backToResources: "Voltar aos recursos",
    inCountry: "Espanha",
    imprescindibleLabel: "Imperdível",
    lockBadge: "Recurso do Clube",
    heading: "Este recurso é exclusivo para sócios do Clube",
    subheading:
      "Junta-te ao Clube das Aldeias Mais Bonitas de Espanha e acede a toda a informação, condições especiais e benefícios.",
    benefitsTitle: "O que oferece ser sócio?",
    benefit1Title: "Acesso completo",
    benefit1Desc:
      "Toda a informação dos recursos turísticos: preços, horários, contacto, localização exata e mais.",
    benefit2Title: "Descontos e ofertas",
    benefit2Desc:
      "Benefícios exclusivos em cada recurso: descontos, ofertas e experiências para sócios.",
    benefit3Title: "Apoia as aldeias",
    benefit3Desc:
      "A tua quota sustenta a rede das Aldeias Mais Bonitas de Espanha e o seu património rural.",
    cta: "Junta-te ao Clube",
    alreadyMember: "Já és sócio?",
    loginCta: "Inicia sessão",
  },
  it: {
    home: "Home",
    resources: "Risorse turistiche",
    backToResources: "Torna alle risorse",
    inCountry: "Spagna",
    imprescindibleLabel: "Imperdibile",
    lockBadge: "Risorsa del Club",
    heading: "Questa risorsa è riservata ai soci del Club",
    subheading:
      "Unisciti al Club dei Borghi più belli di Spagna e accedi a tutte le informazioni, condizioni speciali e vantaggi.",
    benefitsTitle: "Cosa offre l'iscrizione?",
    benefit1Title: "Accesso completo",
    benefit1Desc:
      "Tutte le informazioni delle risorse: prezzi, orari, contatti, ubicazione esatta e altro.",
    benefit2Title: "Sconti e regali",
    benefit2Desc:
      "Vantaggi esclusivi in ogni risorsa: sconti, regali ed esperienze per i soci.",
    benefit3Title: "Sostieni i borghi",
    benefit3Desc:
      "La tua quota sostiene la rete dei Borghi più belli di Spagna e il loro patrimonio rurale.",
    cta: "Unisciti al Club",
    alreadyMember: "Sei già socio?",
    loginCta: "Accedi",
  },
  ca: {
    home: "Inici",
    resources: "Recursos turístics",
    backToResources: "Tornar a recursos",
    inCountry: "Espanya",
    imprescindibleLabel: "Imprescindible",
    lockBadge: "Recurs del Club",
    heading: "Aquest recurs és exclusiu per a socis del Club",
    subheading:
      "Uneix-te al Club dels Pobles més Bonics d'Espanya i accedeix a tota la informació, condicions especials i avantatges.",
    benefitsTitle: "Què t'ofereix ser soci?",
    benefit1Title: "Accés complet",
    benefit1Desc:
      "Tota la informació dels recursos turístics: preus, horaris, contacte, ubicació exacta i més.",
    benefit2Title: "Descomptes i regals",
    benefit2Desc:
      "Avantatges exclusius en cada recurs: descomptes, regals i experiències per a socis.",
    benefit3Title: "Recolza els pobles",
    benefit3Desc:
      "La teva quota sosté la xarxa dels Pobles més Bonics d'Espanya i el seu patrimoni rural.",
    cta: "Uneix-te al Club",
    alreadyMember: "Ja ets soci?",
    loginCta: "Inicia sessió",
  },
};

export default function RecursoClubLandingView({
  recurso,
  locale,
  canonicalUrl,
  baseUrl,
}: {
  recurso: RecursoLimited;
  locale: string;
  canonicalUrl: string;
  baseUrl: string;
}) {
  const t = LANDING_I18N[locale] ?? LANDING_I18N.es;
  const heroImage = recurso.fotoUrl?.trim() || null;
  const tipoLabel = getResourceLabel(recurso.tipo);
  const provCom = [recurso.provincia, recurso.comunidad].filter(Boolean).join(" / ");

  const breadcrumbs = [
    { label: t.home, href: "/" },
    { label: t.resources, href: "/recursos" },
    { label: recurso.nombre, href: `/recursos/${recurso.slug ?? recurso.id}` },
  ];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: t.resources, item: `${baseUrl}/recursos` },
      { "@type": "ListItem", position: 3, name: recurso.nombre, item: canonicalUrl },
    ],
  };
  const recursoJsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: recurso.nombre,
    description: recurso.descripcion ?? undefined,
    url: canonicalUrl,
    image: heroImage || undefined,
    touristType: tipoLabel,
    address: {
      "@type": "PostalAddress",
      addressLocality: recurso.pueblo?.nombre ?? recurso.localidad ?? undefined,
      addressRegion: recurso.provincia ?? undefined,
      addressCountry: "ES",
    },
  };

  return (
    <main className="bg-background">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={recursoJsonLd} />

      {/* Breadcrumbs */}
      <div className="border-b border-border bg-card">
        <Container size="md">
          <div className="pb-2 pt-6">
            <nav aria-label="Breadcrumb" className="mb-2">
              <ol className="flex flex-wrap items-center gap-2 text-sm">
                {breadcrumbs.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Link href={item.href} className="text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                    {i < breadcrumbs.length - 1 && <span className="text-muted-foreground/50">/</span>}
                  </li>
                ))}
              </ol>
            </nav>
            <Link
              href="/recursos"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.backToResources}
            </Link>
          </div>
        </Container>
      </div>

      {/* Hero recurso */}
      <Section spacing="sm">
        <Container size="md">
          {heroImage && (
            <div className="relative mb-6 overflow-hidden rounded-xl bg-[#faf8f5]" style={{ maxHeight: 520 }}>
              <Image
                src={heroImage}
                alt={recurso.nombre}
                width={900}
                height={520}
                className="h-auto max-h-[520px] w-full object-contain"
                priority
                quality={85}
                unoptimized
              />
              {/* Badge candado superpuesto */}
              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-md">
                <Lock className="h-3.5 w-3.5" />
                {t.lockBadge}
              </div>
            </div>
          )}

          {provCom && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {provCom}
            </p>
          )}
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            {recurso.nombre}
          </h1>
          {recurso.imprescindible && (
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-amber-700/20 sm:text-sm"
                title={
                  recurso.ratingVerificado?.rating
                    ? `${t.imprescindibleLabel} · ★ ${recurso.ratingVerificado.rating}`
                    : t.imprescindibleLabel
                }
              >
                <Star className="h-4 w-4" fill="currentColor" />
                {t.imprescindibleLabel}
              </span>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {recurso.provincia && <span>{recurso.provincia}</span>}
            {recurso.comunidad && (
              <>
                <span aria-hidden="true">·</span>
                <span>{recurso.comunidad}</span>
              </>
            )}
            {recurso.tipo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                  {tipoLabel}
                </span>
              </>
            )}
          </div>
          {recurso.descripcion && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {recurso.descripcion}
            </p>
          )}
        </Container>
      </Section>

      {/* Bloque "Únete al Club" — el corazón de la landing */}
      <Section spacing="md" background="muted">
        <Container size="md">
          <div className="rounded-2xl border-2 border-primary/30 bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Lock className="h-6 w-6" />
              </div>
              <Headline as="h2" className="mb-3 text-2xl sm:text-3xl">
                {t.heading}
              </Headline>
              <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
                {t.subheading}
              </p>

              <div className="mt-7 grid w-full gap-4 text-left sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background px-5 py-4">
                  <Sparkles className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{t.benefit1Title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.benefit1Desc}</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-5 py-4">
                  <Tag className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{t.benefit2Title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.benefit2Desc}</p>
                </div>
                <div className="rounded-xl border border-border bg-background px-5 py-4">
                  <Users className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{t.benefit3Title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.benefit3Desc}</p>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/club"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 sm:text-base"
                >
                  <Star className="h-4 w-4" fill="currentColor" />
                  {t.cta}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {t.alreadyMember}{" "}
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(`/recursos/${recurso.slug ?? recurso.id}`)}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t.loginCta}
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
