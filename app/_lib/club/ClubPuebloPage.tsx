/**
 * Componente Server reutilizable para páginas de club (donde-comer, donde-dormir, donde-comprar)
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  uniqueH1ForLocale,
} from "@/lib/seo";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Eyebrow } from "@/app/components/ui/typography";
import {
  CLUB_PAGE_LABELS,
  CLUB_PAGE_DESCRIPTIONS,
  NEGOCIO_TIPO_BY_SLUG,
  getNegociosByPuebloSlug,
  slugToTitle,
  type NegocioPublic,
  type NegocioTipo,
} from "@/app/_lib/club/club-helpers";

interface ClubPageProps {
  slug: "donde-comer" | "donde-dormir" | "donde-comprar";
  puebloSlug: string;
  locale: string;
}

function NegocioCard({ negocio, locale, routeSlug, puebloSlug }: { negocio: NegocioPublic; locale: string; routeSlug: string; puebloSlug: string }) {
  const mainImage = negocio.imagenes?.[0]?.url ?? negocio.fotoUrl;
  const href = negocio.slug ? `/${routeSlug}/${puebloSlug}/${negocio.slug}` : undefined;

  const inner = (
    <>
      {mainImage && (
        <div className="aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainImage} alt={negocio.nombre} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-serif text-lg font-medium text-foreground">{negocio.nombre}</h2>
          {negocio.cerradoTemporal && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              {locale === "es" ? "Cerrado temporalmente" : "Temporarily closed"}
            </span>
          )}
        </div>
        {negocio.descripcion && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{negocio.descripcion}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          {negocio.telefono && (
            <span className="flex items-center gap-1">
              📞 {negocio.telefono}
            </span>
          )}
          {negocio.web && (
            <span className="flex items-center gap-1">
              🌐 Web
            </span>
          )}
        </div>
        {negocio.descuentoPorcentaje && negocio.descuentoPorcentaje > 0 && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
            {locale === "es" ? `${negocio.descuentoPorcentaje}% descuento socios` : `${negocio.descuentoPorcentaje}% member discount`}
          </div>
        )}
        {href && (
          <span className="mt-3 block text-xs font-medium text-primary">
            {locale === "es" ? "Ver detalle →" : "View details →"}
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        {inner}
      </Link>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {inner}
    </div>
  );
}

export async function ClubPuebloPage({ slug, puebloSlug, locale }: ClubPageProps) {
  const label = CLUB_PAGE_LABELS[slug]?.[locale] ?? CLUB_PAGE_LABELS[slug]?.es ?? slug;
  const tipos = NEGOCIO_TIPO_BY_SLUG[slug] ?? [];
  const tipo = tipos[0] as NegocioTipo | undefined;

  const { pueblo, negocios } = await getNegociosByPuebloSlug(puebloSlug, tipo, locale);
  const puebloNombre = pueblo?.nombre ?? slugToTitle(puebloSlug);

  if (!pueblo) return notFound();

  const descPlaceholder = CLUB_PAGE_DESCRIPTIONS[slug]?.[locale] ?? CLUB_PAGE_DESCRIPTIONS[slug]?.es ?? "";

  return (
    <main className="bg-background min-h-screen">
      <Section spacing="md">
        <Container>
          <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-2">/</span>
            <Link href={`/pueblos/${puebloSlug}`} className="hover:text-foreground">{puebloNombre}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{label}</span>
          </nav>

          <Eyebrow className="mb-3">{puebloNombre}</Eyebrow>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground mb-4">
            {uniqueH1ForLocale(label, locale)}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {locale === "es"
              ? `Encuentra los mejores ${descPlaceholder} de ${puebloNombre}.`
              : `Find the best ${descPlaceholder} in ${puebloNombre}.`}
          </p>

          {negocios.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {negocios.map((negocio) => (
                <NegocioCard key={negocio.id} negocio={negocio} locale={locale} routeSlug={slug} puebloSlug={puebloSlug} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
              <p className="text-muted-foreground">
                {locale === "es"
                  ? "Próximamente habrá establecimientos listados aquí."
                  : "Establishments will be listed here soon."}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {locale === "es"
                  ? "¿Eres propietario? Únete al Club."
                  : "Are you an owner? Join the Club."}
              </p>
              <Link
                href="/club"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {locale === "es" ? "Ver El Club" : "See the Club"}
              </Link>
            </div>
          )}

          <div className="mt-12 border-t border-border pt-8 text-center">
            <Link
              href={`/pueblos/${puebloSlug}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              ← {locale === "es" ? `Volver a ${puebloNombre}` : `Back to ${puebloNombre}`}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
