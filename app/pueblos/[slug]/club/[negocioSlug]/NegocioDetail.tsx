"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { getPlanFeatures, type PlanNegocio, SERVICIOS_DISPONIBLES, SOCIAL_NETWORKS } from "@/lib/plan-features";

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
  whatsapp?: string | null;
  bookingUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  servicios?: string[] | null;
  contacto?: string | null;
  fotoUrl?: string | null;
  horarios?: string | null;
  cerradoTemporal?: boolean;
  lat?: number | null;
  lng?: number | null;
  localidad?: string | null;
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
  const f = getPlanFeatures(plan);
  if (!f.recommendedBadgeEnabled && !f.premiumBadgeEnabled && !f.selectionBadgeEnabled) return null;
  const isSelection = f.selectionBadgeEnabled;
  const isPremium = f.premiumBadgeEnabled;
  const label = isSelection
    ? "Club LPMBE Selection"
    : isPremium
      ? "Premium Club LPMBE"
      : "Club LPMBE";
  const badgeClass = isSelection
    ? "bg-gradient-to-r from-slate-900 to-slate-700 text-white border border-slate-500"
    : isPremium
      ? "bg-amber-100 text-amber-800 border border-amber-300"
      : "bg-blue-100 text-blue-800 border border-blue-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
      {(isPremium || isSelection) && (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      )}
      {label}
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

  const trackContactClick = useCallback((eventName: string) => {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventCategory: "negocio_contact",
        eventLabel: String(recurso.id),
        path: typeof window !== "undefined" ? window.location.pathname : "",
      }),
    }).catch(() => {});
  }, [recurso.id]);
  const features = getPlanFeatures(plan);
  const showContact = !isNegocio || features.publicPhoneVisible || features.publicEmailVisible || features.publicWebVisible;
  const showFullGallery = !isNegocio || features.maxPhotos > 1;
  const showSchedule = !isNegocio || features.publicScheduleVisible;

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

      {/* Services / amenities icons */}
      {recurso.servicios && recurso.servicios.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Servicios</h2>
          <div className="flex flex-wrap gap-3">
            {recurso.servicios.map((sKey) => {
              const srv = SERVICIOS_DISPONIBLES.find((s) => s.key === sKey);
              if (!srv) return null;
              return (
                <span
                  key={sKey}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <ServicioIcon icon={srv.icon} />
                  {srv.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Contact info + WhatsApp + Booking */}
      {showContact && (recurso.telefono || recurso.email || recurso.web || recurso.contacto || recurso.whatsapp || recurso.bookingUrl) && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Contacto</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recurso.whatsapp && (
              <a
                href={`https://wa.me/${recurso.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContactClick("click_whatsapp")}
                className="flex items-center gap-3 rounded-lg border-2 border-green-200 bg-green-50 px-4 py-3 text-sm hover:bg-green-100 transition-colors"
              >
                <svg className="h-5 w-5 shrink-0 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="font-medium text-green-800">WhatsApp</span>
              </a>
            )}
            {recurso.telefono && (
              <a
                href={`tel:${recurso.telefono}`}
                onClick={() => trackContactClick("click_phone")}
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
                onClick={() => trackContactClick("click_email")}
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
                onClick={() => trackContactClick("click_web")}
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
            {recurso.bookingUrl && (
              <a
                href={recurso.bookingUrl.startsWith("http") ? recurso.bookingUrl : `https://${recurso.bookingUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContactClick("click_booking")}
                className="flex items-center gap-3 rounded-lg border-2 border-blue-200 bg-blue-50 px-4 py-3 text-sm hover:bg-blue-100 transition-colors"
              >
                <svg className="h-5 w-5 shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
                <span className="font-medium text-blue-800">Reservar</span>
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

      {/* Social links */}
      {recurso.socialLinks && Object.keys(recurso.socialLinks).filter((k) => recurso.socialLinks![k]).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Síguenos</h2>
          <div className="flex flex-wrap gap-3">
            {SOCIAL_NETWORKS.map((sn) => {
              const url = recurso.socialLinks?.[sn.key];
              if (!url) return null;
              return (
                <a
                  key={sn.key}
                  href={url.startsWith("http") ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackContactClick(`click_social_${sn.key}`)}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <SocialIcon network={sn.key} />
                  {sn.label}
                </a>
              );
            })}
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

function ServicioIcon({ icon }: { icon: string }) {
  const cls = "h-4 w-4";
  switch (icon) {
    case "wifi":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" /></svg>;
    case "parking":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><text x="8" y="17" fontSize="14" fill="currentColor" stroke="none" fontWeight="bold">P</text></svg>;
    case "pool":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 20c2-1 4 1 6 0s4-1 6 0 4 1 6 0" /><path d="M2 16c2-1 4 1 6 0s4-1 6 0 4 1 6 0" /><path d="M8 4v8m8-8v8" /><path d="M8 8h8" /></svg>;
    case "ac":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 16a4 4 0 1 0 8 0" /><path d="M12 2v4m-6 2 2 2m10-2-2 2" /></svg>;
    case "terraza":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2 2 8h20L12 2Z" /><path d="M4 8v14m16-14v14" /><path d="M2 22h20" /></svg>;
    case "jardin":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22V10" /><path d="M7 10c0-2.8 2.2-5 5-5s5 2.2 5 5" /><path d="M4 14c0-2.2 1.8-4 4-4m8 0c2.2 0 4 1.8 4 4" /></svg>;
    case "mascotas":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="6" r="2" /><circle cx="16" cy="6" r="2" /><circle cx="5" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><path d="M12 22c-2 0-6-4-6-8 0-2 2-4 6-4s6 2 6 4c0 4-4 8-6 8Z" /></svg>;
    case "accesible":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="4" r="1.5" /><path d="M10 22a6 6 0 1 1 6-6" /><path d="M12 8v6l4 2" /></svg>;
    case "desayuno":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 8h1a4 4 0 0 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" /><path d="M6 2v3m4-3v3m4-3v3" /></svg>;
    case "spa":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22c4-2 8-6 8-12C16 4 12 2 12 2S8 4 4 10c0 6 4 10 8 12Z" /></svg>;
    case "chimenea":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 22V10l4-6 4 6v12" /><path d="M4 22h16" /><path d="M10 16a2 2 0 0 1 4 0v6h-4z" /></svg>;
    case "cocina":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="10" width="18" height="12" rx="2" /><path d="M3 14h18" /><circle cx="8" cy="5" r="1" /><circle cx="16" cy="5" r="1" /></svg>;
    case "lavadora":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="2" width="18" height="20" rx="2" /><circle cx="12" cy="14" r="4" /><circle cx="12" cy="14" r="1" /><circle cx="7" cy="5" r="1" /></svg>;
    case "tv":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2" /><path d="m17 2-5 5-5-5" /></svg>;
    case "calefaccion":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 20V4m4 16V4m4 16V4m4 16V4" /><path d="M2 22h20" /><path d="M2 2h20" /></svg>;
    default:
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  }
}

function SocialIcon({ network }: { network: string }) {
  const cls = "h-4 w-4";
  switch (network) {
    case "instagram":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>;
    case "facebook":
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
    case "tiktok":
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78c.27 0 .54.04.8.1V9a6.33 6.33 0 1 0 5.46 6.28V9.84a8.18 8.18 0 0 0 4.78 1.53V8.05a4.84 4.84 0 0 1-.94-1.36z" /></svg>;
    case "twitter":
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
    case "youtube":
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
    case "tripadvisor":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="7" cy="14" r="3" /><circle cx="17" cy="14" r="3" /><path d="M3 11c0-4 4-7 9-7s9 3 9 7" /><circle cx="7" cy="14" r="1" /><circle cx="17" cy="14" r="1" /></svg>;
    case "google":
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>;
    default:
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  }
}
