"use client";

import { useState } from "react";
import Link from "next/link";

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

const DIA_NOMBRES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type PlanNegocio = "FREE" | "RECOMENDADO" | "PREMIUM";

type Imagen = { id: number; url: string; alt: string | null; orden: number };

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  scope: string;
  slug: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  contacto?: string | null;
  fotoUrl?: string | null;
  horarios?: string | null;
  cerradoTemporal?: boolean;
  lat?: number | null;
  lng?: number | null;
  planNegocio?: PlanNegocio;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  imagenes?: Imagen[];
  horariosSemana?: Array<{
    diaSemana: number;
    abierto: boolean;
    horaAbre: string | null;
    horaCierra: string | null;
  }>;
  ofertas?: OfertaPublic[];
};

type OfertaPublic = {
  id: number;
  tipoOferta: string;
  titulo: string;
  descripcion?: string | null;
  descuentoPorcentaje?: number | null;
  valorFijoCents?: number | null;
  aplicaA?: string | null;
  condicionTexto?: string | null;
  importeMinimoCents?: number | null;
  minNoches?: number | null;
  minComensales?: number | null;
  destacada: boolean;
  vigenciaDesde?: string | null;
  vigenciaHasta?: string | null;
};

function GalleryViewer({ images, nombre }: { images: Imagen[]; nombre: string }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = images[selectedIdx];

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-muted">
        <img
          src={selected.url}
          alt={selected.alt ?? nombre}
          className="w-full max-h-[480px] object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Foto anterior"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <button
              onClick={() => setSelectedIdx((i) => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              aria-label="Foto siguiente"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {selectedIdx + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIdx(i)}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === selectedIdx
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt={img.alt ?? ""} className="h-16 w-16 object-cover sm:h-20 sm:w-20" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniMap({ lat, lng, nombre }: { lat: number; lng: number; nombre: string }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005},${lat - 0.003},${lng + 0.005},${lat + 0.003}&layer=mapnik&marker=${lat},${lng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-border">
        <iframe src={mapUrl} className="h-48 w-full" title={`Mapa de ${nombre}`} loading="lazy" />
      </div>
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11l19-9-9 19-2-8-8-2z" />
        </svg>
        Cómo llegar
      </a>
    </div>
  );
}

function PlanBadge({ plan }: { plan: PlanNegocio }) {
  if (plan === "FREE") return null;
  const isPremium = plan === "PREMIUM";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        isPremium
          ? "bg-amber-100 text-amber-800 border border-amber-300"
          : "bg-blue-100 text-blue-800 border border-blue-300"
      }`}
    >
      {isPremium && (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      )}
      {isPremium ? "Premium" : "Recomendado por LPMBE"}
    </span>
  );
}

const OFERTA_ICONS: Record<string, string> = {
  DESCUENTO_PORCENTAJE: "✂️",
  REGALO: "🎁",
  MENU_ESPECIAL: "🍽️",
  NOCHE_GRATIS: "🌙",
  UPGRADE: "⬆️",
  DOS_POR_UNO: "🔄",
  ENVIO_GRATIS: "📦",
  OTRO: "📌",
};

const APLICA_LABELS: Record<string, string> = {
  PERSONA: "por persona",
  HABITACION: "por habitación",
  MESA: "por mesa",
  RESERVA: "por reserva",
  COMPRA: "por compra",
  GRUPO: "por grupo",
};

/** Ventaja para mostrar al lado del %.
 * Prioridad:
 * 1) Oferta con título "detalle de bienvenida" (aunque no sea destacada)
 * 2) Oferta tipo regalo (aunque no sea destacada)
 * 3) Cualquier destacada útil
 */
function ofertaVentajaHeroLateral(ofertas: OfertaPublic[], pct: number | null | undefined): OfertaPublic | null {
  const bienvenida = ofertas.find(
    (o) =>
      (o.titulo ?? "").toLowerCase().includes("detalle de bienvenida") ||
      (o.titulo ?? "").toLowerCase().includes("bienvenida"),
  );
  if (bienvenida) return bienvenida;

  const regalo = ofertas.find((o) => o.tipoOferta === "REGALO");
  if (regalo) return regalo;

  const destacadas = ofertas.filter((o) => o.destacada);
  if (destacadas.length === 0) return null;

  const noSoloDescuentoIgual = destacadas.find(
    (o) =>
      o.tipoOferta !== "DESCUENTO_PORCENTAJE" ||
      (pct != null &&
        o.descuentoPorcentaje != null &&
        o.descuentoPorcentaje !== pct),
  );
  if (noSoloDescuentoIgual) return noSoloDescuentoIgual;
  if (destacadas.length >= 2) {
    return destacadas.find((o) => o.tipoOferta !== "DESCUENTO_PORCENTAJE") ?? destacadas[1];
  }
  return null;
}

function HeroVentajaClubCard({ oferta }: { oferta: OfertaPublic }) {
  const o = oferta;
  const tituloVisible =
    (o.titulo ?? "").toLowerCase().includes("detalle de bienvenida")
      ? `${o.titulo} Club de Amigos`
      : o.titulo;
  return (
    <div className="rounded-xl border-2 border-[#c45c48] bg-card p-3 shadow-sm ring-1 ring-[#c45c48]/35">
      <div>
        <div className="flex items-start gap-2">
          <span className="text-xl leading-none">{OFERTA_ICONS[o.tipoOferta] ?? "🎁"}</span>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-snug text-foreground">{tituloVisible}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {o.descuentoPorcentaje != null && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                  -{o.descuentoPorcentaje}%
                </span>
              )}
              {o.valorFijoCents != null && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                  {(o.valorFijoCents / 100).toFixed(2)}€ dto.
                </span>
              )}
              {o.tipoOferta === "REGALO" && !o.descuentoPorcentaje && !o.valorFijoCents && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  Gratis
                </span>
              )}
            </div>
            {o.aplicaA && (
              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                {APLICA_LABELS[o.aplicaA] ?? o.aplicaA}
              </p>
            )}
          </div>
        </div>
      </div>
      {o.condicionTexto && (
        <p className="mt-1 text-[11px] text-muted-foreground/80">{o.condicionTexto}</p>
      )}
      {o.descripcion && (
        <p className="mt-1 text-[11px] font-semibold italic text-[#c45c48]">{o.descripcion}</p>
      )}
    </div>
  );
}

function OfertaCard({ oferta }: { oferta: OfertaPublic }) {
  const o = oferta;
  const hasDate = o.vigenciaHasta;
  const dateLabel = hasDate
    ? `Hasta ${new Date(o.vigenciaHasta!).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`
    : null;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        o.destacada
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{OFERTA_ICONS[o.tipoOferta] ?? "📌"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{o.titulo}</span>
            {o.descuentoPorcentaje != null && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">
                -{o.descuentoPorcentaje}%
              </span>
            )}
            {o.valorFijoCents != null && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                {(o.valorFijoCents / 100).toFixed(2)}€ dto.
              </span>
            )}
            {o.tipoOferta === "REGALO" && !o.descuentoPorcentaje && !o.valorFijoCents && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                Gratis
              </span>
            )}
          </div>
          {o.aplicaA && (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {APLICA_LABELS[o.aplicaA] ?? o.aplicaA}
            </span>
          )}
          {o.condicionTexto && (
            <p className="mt-1 text-xs text-muted-foreground/80">{o.condicionTexto}</p>
          )}
          {o.descripcion && (
            <p className="mt-1 text-xs text-muted-foreground italic">{o.descripcion}</p>
          )}
          {dateLabel && (
            <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {dateLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NegocioDetail({
  recurso,
  puebloSlug,
  backHref,
  backLabel,
}: {
  recurso: Recurso;
  puebloSlug: string;
  backHref?: string;
  backLabel?: string;
}) {
  const plan: PlanNegocio = (recurso.planNegocio as PlanNegocio) || "FREE";
  const isNegocio = recurso.scope === "NEGOCIO";
  const isPaid = plan === "RECOMENDADO" || plan === "PREMIUM";
  // Decisión de producto: en básico también se muestran teléfono/email/web.
  const showContact = true;
  const showFullGallery = !isNegocio || isPaid;
  const showSchedule = !isNegocio || isPaid;

  const fotos: Imagen[] = recurso.imagenes && recurso.imagenes.length > 0
    ? recurso.imagenes
    : recurso.fotoUrl
      ? [{ id: 0, url: recurso.fotoUrl, alt: recurso.nombre, orden: 0 }]
      : [];

  const displayPhotos = showFullGallery ? fotos : fotos.slice(0, 1);

  const hasCoords = recurso.lat != null && recurso.lng != null;

  const ofertas = recurso.ofertas ?? [];
  const pctNum =
    recurso.descuentoPorcentaje != null && recurso.descuentoPorcentaje > 0
      ? recurso.descuentoPorcentaje
      : null;
  const ventajaLateralHero = ofertaVentajaHeroLateral(ofertas, pctNum);
  const idsEnHero = new Set<number>();
  if (ventajaLateralHero) idsEnHero.add(ventajaLateralHero.id);
  const ofertasResto = ofertas.filter((o) => !idsEnHero.has(o.id));
  return (
    <div className="space-y-8">
      {/* Gallery / Single photo */}
      {displayPhotos.length > 0 && (
        showFullGallery ? (
          <GalleryViewer images={displayPhotos} nombre={recurso.nombre} />
        ) : (
          <div className="overflow-hidden rounded-xl bg-muted">
            <img
              src={displayPhotos[0].url}
              alt={displayPhotos[0].alt ?? recurso.nombre}
              className="w-full max-h-[480px] object-cover"
            />
          </div>
        )
      )}

      {/* Title + badge + resumen Club */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl text-foreground">
              {recurso.nombre}
            </h1>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                {TIPO_LABELS[recurso.tipo] ?? recurso.tipo}
              </span>
              {recurso.pueblo && (
                <Link
                  href={`/pueblos/${recurso.pueblo.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  {recurso.pueblo.nombre}
                </Link>
              )}
              {isNegocio && <PlanBadge plan={plan} />}
            </div>
          </div>
          <div className="flex items-start gap-3 flex-wrap justify-end">
            {pctNum != null && (
              <div className="shrink-0 rounded-xl bg-primary px-5 py-3 text-center">
                <span className="block text-2xl font-bold text-primary-foreground">
                  {pctNum}%
                </span>
                <span className="block text-xs font-medium text-primary-foreground/80">
                  descuento Club
                </span>
              </div>
            )}
            {ventajaLateralHero && (
              <div className="w-full sm:w-[300px]">
                <HeroVentajaClubCard oferta={ventajaLateralHero} />
              </div>
            )}
          </div>
        </div>

        {recurso.cerradoTemporal && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-700">
            Este establecimiento está cerrado temporalmente.
          </div>
        )}
      </div>

      {/* CTA membresía Club */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            <strong>Estas ventajas son exclusivas para miembros del Club de Amigos.</strong>{" "}
            Hazte socio para disfrutarlas en este y en más establecimientos.
          </p>
          <Link
            href="/club"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Quiero hacerme socio
          </Link>
        </div>
      </div>

      {/* Description */}
      {recurso.descripcion && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Sobre este negocio
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
            {recurso.descripcion}
          </p>
        </div>
      )}

      {/* Ofertas para socios del Club (las mostradas arriba no se repiten) */}
      {ofertasResto.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {ventajaLateralHero ? "Más ofertas para socios del Club" : "Ofertas para socios del Club"}
          </h2>
          {ventajaLateralHero && (
            <p className="mb-3 text-xs text-muted-foreground">
              La ventaja destacada aparece junto al descuento resumen. Aquí tienes el resto de condiciones y promociones.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {ofertasResto.map((o) => (
              <OfertaCard key={o.id} oferta={o} />
            ))}
          </div>
        </div>
      )}

      {/* Schedule - only for paid plans or non-negocios */}
      {showSchedule && recurso.horariosSemana && recurso.horariosSemana.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Horarios</h2>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {recurso.horariosSemana.map((h) => (
              <div
                key={h.diaSemana}
                className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
                  h.abierto ? "bg-green-50 text-green-800" : "bg-gray-50 text-gray-400"
                }`}
              >
                <span className="font-medium">{DIA_NOMBRES[h.diaSemana]}</span>
                <span>
                  {h.abierto
                    ? h.horaAbre && h.horaCierra
                      ? `${h.horaAbre} – ${h.horaCierra}`
                      : "Abierto"
                    : "Cerrado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSchedule && recurso.horarios && !recurso.horariosSemana?.length && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Horarios</h2>
          <p className="text-sm text-muted-foreground">{recurso.horarios}</p>
        </div>
      )}

      {/* Contact info - only for paid plans */}
      {showContact && (recurso.telefono || recurso.email || recurso.web || recurso.contacto) && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Contacto</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recurso.telefono && (
              <a
                href={`tel:${recurso.telefono}`}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="font-medium">{recurso.telefono}</span>
              </a>
            )}
            {recurso.email && (
              <a
                href={`mailto:${recurso.email}`}
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="font-medium truncate">{recurso.email}</span>
              </a>
            )}
            {recurso.web && (
              <a
                href={recurso.web.startsWith("http") ? recurso.web : `https://${recurso.web}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted transition-colors"
              >
                <svg className="h-5 w-5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="font-medium truncate">Sitio web</span>
              </a>
            )}
            {recurso.contacto && (
              <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm">
                <svg className="h-5 w-5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="font-medium">{recurso.contacto}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map - visible for all plans (socios need to know where to go) */}
      {hasCoords && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Ubicación</h2>
          <MiniMap lat={recurso.lat!} lng={recurso.lng!} nombre={recurso.nombre} />
        </div>
      )}

      {/* Back link */}
      <div className="pt-2 text-sm">
        <Link
          href={backHref ?? `/pueblos/${puebloSlug}/club`}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          &larr; {backLabel ? `Volver a ${backLabel}` : "Volver al Club de Amigos"}
        </Link>
      </div>
    </div>
  );
}
