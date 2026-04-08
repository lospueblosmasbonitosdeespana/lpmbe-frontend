"use client";

import Link from "next/link";
import { SERVICIOS_DISPONIBLES, SOCIAL_NETWORKS } from "@/lib/plan-features";

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  slug: string;
  descripcion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  bookingUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  servicios?: string[] | null;
  landingConfig?: Record<string, any> | null;
  planNegocio?: string;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  imagenes?: Array<{ id: number; url: string; alt: string | null; orden: number }>;
  ofertas?: Array<{
    id: number;
    tipoOferta: string;
    titulo: string;
    descripcion?: string | null;
    descuentoPorcentaje?: number | null;
    valorFijoCents?: number | null;
    destacada: boolean;
  }>;
};

const THEME_STYLES: Record<string, { bg: string; heroText: string; accent: string }> = {
  classic: { bg: "bg-white", heroText: "text-white", accent: "bg-primary text-primary-foreground" },
  dark: { bg: "bg-slate-900", heroText: "text-white", accent: "bg-amber-500 text-slate-900" },
  nature: { bg: "bg-stone-50", heroText: "text-white", accent: "bg-emerald-600 text-white" },
  elegant: { bg: "bg-neutral-50", heroText: "text-white", accent: "bg-slate-800 text-white" },
};

export function NegocioLanding({ recurso }: { recurso: Recurso }) {
  const config = recurso.landingConfig ?? {};
  const theme = THEME_STYLES[config.theme] ?? THEME_STYLES.classic;
  const heroImage = config.heroImageUrl ?? recurso.imagenes?.[0]?.url ?? null;
  const headline = config.headline ?? recurso.nombre;
  const subheadline = config.subheadline ?? recurso.descripcion ?? "";
  const ctaText = config.ctaText ?? "Reservar ahora";
  const ctaUrl = config.ctaUrl ?? recurso.bookingUrl ?? recurso.web ?? "#contacto";
  const location = recurso.localidad ?? recurso.pueblo?.nombre ?? recurso.provincia ?? "";

  return (
    <main className={`min-h-screen ${theme.bg}`}>
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-end">
        {heroImage && (
          <img
            src={heroImage}
            alt={recurso.nombre}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-5xl px-4 pb-12 pt-32">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Club LPMBE {recurso.planNegocio === "SELECTION" ? "Selection" : "Premium"}
            </span>
            {location && (
              <span className="text-white/80 text-xs">{location}</span>
            )}
          </div>
          <h1 className={`text-3xl sm:text-5xl font-bold ${theme.heroText} max-w-3xl leading-tight`}>
            {headline}
          </h1>
          {subheadline && (
            <p className="mt-3 text-lg text-white/90 max-w-2xl leading-relaxed">
              {subheadline}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={ctaUrl.startsWith("http") || ctaUrl.startsWith("#") ? ctaUrl : `https://${ctaUrl}`}
              target={ctaUrl.startsWith("#") ? undefined : "_blank"}
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold shadow-lg transition-transform hover:scale-105 ${theme.accent}`}
            >
              {ctaText}
            </a>
            {recurso.whatsapp && (
              <a
                href={`https://wa.me/${recurso.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-5 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Gallery */}
      {recurso.imagenes && recurso.imagenes.length > 1 && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {recurso.imagenes.slice(1, 7).map((img) => (
              <div key={img.id} className="aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  src={img.url}
                  alt={img.alt ?? recurso.nombre}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {recurso.servicios && recurso.servicios.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Servicios</h2>
          <div className="flex flex-wrap gap-3">
            {recurso.servicios.map((sKey) => {
              const srv = SERVICIOS_DISPONIBLES.find((s) => s.key === sKey);
              if (!srv) return null;
              return (
                <span
                  key={sKey}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground"
                >
                  {srv.label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Offers */}
      {recurso.ofertas && recurso.ofertas.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Ofertas para socios del Club</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {recurso.ofertas.map((o) => (
              <div
                key={o.id}
                className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5"
              >
                <span className="block text-sm font-bold text-foreground">{o.titulo}</span>
                {o.descripcion && (
                  <p className="mt-1 text-sm text-muted-foreground">{o.descripcion}</p>
                )}
                <div className="mt-2 flex gap-2">
                  {o.descuentoPorcentaje != null && o.descuentoPorcentaje > 0 && (
                    <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      {o.descuentoPorcentaje}% dto.
                    </span>
                  )}
                  {o.valorFijoCents != null && o.valorFijoCents > 0 && (
                    <span className="rounded bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                      {(o.valorFijoCents / 100).toFixed(2)} € regalo
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contacto" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-xl font-semibold mb-4">Contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recurso.telefono && (
            <a
              href={`tel:${recurso.telefono}`}
              className="flex items-center gap-3 rounded-xl border border-border px-5 py-4 text-sm hover:bg-muted transition-colors"
            >
              <span className="text-lg">📞</span>
              <span className="font-medium">{recurso.telefono}</span>
            </a>
          )}
          {recurso.email && (
            <a
              href={`mailto:${recurso.email}`}
              className="flex items-center gap-3 rounded-xl border border-border px-5 py-4 text-sm hover:bg-muted transition-colors"
            >
              <span className="text-lg">✉️</span>
              <span className="font-medium truncate">{recurso.email}</span>
            </a>
          )}
          {recurso.web && (
            <a
              href={recurso.web.startsWith("http") ? recurso.web : `https://${recurso.web}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border px-5 py-4 text-sm hover:bg-muted transition-colors"
            >
              <span className="text-lg">🌐</span>
              <span className="font-medium truncate">Sitio web</span>
            </a>
          )}
          {recurso.bookingUrl && (
            <a
              href={recurso.bookingUrl.startsWith("http") ? recurso.bookingUrl : `https://${recurso.bookingUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border-2 border-blue-300 bg-blue-50 px-5 py-4 text-sm hover:bg-blue-100 transition-colors"
            >
              <span className="text-lg">📅</span>
              <span className="font-bold text-blue-800">Reservar</span>
            </a>
          )}
        </div>

        {/* Social links */}
        {recurso.socialLinks && Object.values(recurso.socialLinks).some(Boolean) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {SOCIAL_NETWORKS.map((sn) => {
              const url = recurso.socialLinks?.[sn.key];
              if (!url) return null;
              return (
                <a
                  key={sn.key}
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {sn.label}
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer / back */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground hover:underline">
            Los Pueblos Más Bonitos de España
          </Link>
          <Link
            href={recurso.pueblo ? `/pueblos/${recurso.pueblo.slug}/club/${recurso.slug}` : `/selection/${recurso.slug}`}
            className="hover:text-foreground hover:underline"
          >
            Ver ficha completa →
          </Link>
        </div>
      </footer>
    </main>
  );
}
