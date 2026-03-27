import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  seoDescription,
  seoTitle,
  slugDisambiguatorForTitle,
  titleLocaleSuffix,
  type SupportedLocale,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const locSuf = titleLocaleSuffix(locale);
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/club`;
  const slugDis = slugDisambiguatorForTitle(slug);
  return {
    title: seoTitle(`Club de Amigos · ${name}${slugDis}${locSuf}`),
    description: seoDescription(
      `Descubre todo lo que ${name} ofrece a los socios del Club de Amigos: descuentos, experiencias, restaurantes, hoteles y más.${locSuf}`
    ),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
  };
}

const TIPO_LABELS: Record<string, string> = {
  HOTEL: "Hotel",
  CASA_RURAL: "Casa rural",
  RESTAURANTE: "Restaurante",
  BAR: "Bar / Cafetería",
  COMERCIO: "Comercio",
  TIENDA_ARTESANIA: "Tienda de artesanía",
  BODEGA: "Bodega",
  EXPERIENCIA: "Experiencia",
  OTRO: "Otro",
};

const SCOPE_LABELS: Record<string, string> = {
  PUEBLO: "Recursos turísticos",
  NEGOCIO: "Negocios colaboradores",
};

type Recurso = {
  id: number;
  nombre: string;
  slug: string;
  tipo: string;
  scope: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  contacto?: string | null;
  fotoUrl?: string | null;
  horarios?: string | null;
  cerradoTemporal?: boolean;
  imagenes?: Array<{ id: number; url: string; alt: string | null; orden: number }>;
  horariosSemana?: Array<{
    diaSemana: number;
    abierto: boolean;
    horaAbre: string | null;
    horaCierra: string | null;
  }>;
};

const DIA_NOMBRES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function RecursoCard({ r, puebloSlug }: { r: Recurso; puebloSlug: string }) {
  const fotos = r.imagenes && r.imagenes.length > 0 ? r.imagenes : null;
  const mainImage = fotos?.[0]?.url ?? r.fotoUrl;
  const detailHref = `/pueblos/${puebloSlug}/club/${r.slug}`;

  return (
    <Link href={detailHref} className="block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md group">
      {/* Image gallery or main photo */}
      {mainImage && (
        <div className="relative">
          <img
            src={mainImage}
            alt={r.nombre}
            className="h-48 w-full object-cover"
          />
          {fotos && fotos.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1">
              {fotos.slice(1, 4).map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.alt ?? ""}
                  className="h-10 w-10 rounded border-2 border-white object-cover shadow-sm"
                />
              ))}
              {fotos.length > 4 && (
                <span className="flex h-10 w-10 items-center justify-center rounded border-2 border-white bg-black/60 text-xs font-semibold text-white shadow-sm">
                  +{fotos.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{r.nombre}</h3>
            <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {TIPO_LABELS[r.tipo] ?? r.tipo}
            </span>
          </div>
          {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
            <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">
              {r.descuentoPorcentaje}% dto.
            </span>
          )}
        </div>

        {r.cerradoTemporal && (
          <div className="mt-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-200">
            Cerrado temporalmente
          </div>
        )}

        {r.descripcion && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {r.descripcion}
          </p>
        )}

        {/* Horarios */}
        {r.horariosSemana && r.horariosSemana.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.horariosSemana.map((h) => (
              <span
                key={h.diaSemana}
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  h.abierto
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-400 line-through"
                }`}
              >
                {DIA_NOMBRES[h.diaSemana]}
                {h.abierto && h.horaAbre && h.horaCierra
                  ? ` ${h.horaAbre}–${h.horaCierra}`
                  : ""}
              </span>
            ))}
          </div>
        )}

        {r.horarios && !r.horariosSemana?.length && (
          <p className="mt-2 text-xs text-muted-foreground">{r.horarios}</p>
        )}

        {/* Contact info */}
        {(r.telefono || r.email || r.web) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
            {r.telefono && <span>Tel: {r.telefono}</span>}
            {r.email && <span>{r.email}</span>}
            {r.web && <span>Web</span>}
          </div>
        )}

        <span className="mt-3 inline-block text-xs font-medium text-primary group-hover:underline">
          Ver detalle &rarr;
        </span>
      </div>
    </Link>
  );
}

export default async function ClubPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const API_BASE = getApiUrl();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);

  if (!pueblo) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">Club de Amigos</h1>
          <p className="mt-2 text-muted-foreground">
            No se ha podido cargar la información del pueblo.
          </p>
          <Link href="/pueblos" className="mt-4 inline-block text-primary hover:underline">
            Volver a pueblos
          </Link>
        </div>
      </main>
    );
  }

  let recursos: Recurso[] = [];
  try {
    const res = await fetch(
      `${API_BASE}/public/recursos/pueblo/${pueblo.id}?lang=${locale}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      recursos = await res.json();
    }
  } catch {}

  const recursosPueblo = recursos.filter((r) => r.scope === "PUEBLO");
  const negocios = recursos.filter((r) => r.scope === "NEGOCIO");

  const breadcrumbs = [
    { label: "Inicio", href: "/" },
    { label: "Pueblos", href: "/pueblos" },
    { label: pueblo.nombre, href: `/pueblos/${pueblo.slug}` },
    { label: "Club de Amigos", href: `/pueblos/${pueblo.slug}/club` },
  ];

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Club de Amigos · {pueblo.nombre}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Todo lo que {pueblo.nombre} ofrece a los socios del Club de Amigos:
            descuentos, experiencias exclusivas, restaurantes, alojamientos y más.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
        {recursos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-lg text-muted-foreground">
              Todavía no hay ofertas del Club de Amigos disponibles en {pueblo.nombre}.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Vuelve pronto — estamos incorporando negocios y experiencias continuamente.
            </p>
            <Link
              href={`/pueblos/${pueblo.slug}`}
              className="mt-6 inline-block text-primary hover:underline font-medium"
            >
              Volver a {pueblo.nombre}
            </Link>
          </div>
        ) : (
          <>
            {/* Recursos turísticos del pueblo */}
            {recursosPueblo.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {SCOPE_LABELS.PUEBLO}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Museos, monumentos, parques y otros espacios del pueblo con ventajas para socios del Club.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {recursosPueblo.map((r) => (
                    <RecursoCard key={r.id} r={r} puebloSlug={pueblo.slug} />
                  ))}
                </div>
              </section>
            )}

            {/* Negocios colaboradores */}
            {negocios.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  {SCOPE_LABELS.NEGOCIO}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Hoteles, restaurantes, comercios y otros negocios de {pueblo.nombre} que ofrecen
                  ventajas exclusivas a los socios del Club de Amigos.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  {negocios.map((r) => (
                    <RecursoCard key={r.id} r={r} puebloSlug={pueblo.slug} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <div className="pt-4 text-sm">
          <Link
            href={`/pueblos/${pueblo.slug}`}
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            &larr; Volver a {pueblo.nombre}
          </Link>
        </div>
      </div>
    </main>
  );
}
