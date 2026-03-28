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

function LockedSection({ title, message, ctaHref }: { title: string; message: string; ctaHref: string }) {
  return (
    <div className="relative rounded-xl border border-dashed border-border bg-muted/30 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <Link
            href={ctaHref}
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ver planes
          </Link>
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
  const isFree = isNegocio && plan === "FREE";
  const isRecomendado = plan === "RECOMENDADO";
  const isPremium = plan === "PREMIUM";
  const showContact = !isNegocio || isRecomendado || isPremium;
  const showFullGallery = !isNegocio || isRecomendado || isPremium;
  const showSchedule = !isNegocio || isRecomendado || isPremium;

  const fotos: Imagen[] = recurso.imagenes && recurso.imagenes.length > 0
    ? recurso.imagenes
    : recurso.fotoUrl
      ? [{ id: 0, url: recurso.fotoUrl, alt: recurso.nombre, orden: 0 }]
      : [];

  const displayPhotos = showFullGallery ? fotos : fotos.slice(0, 1);

  const hasCoords = recurso.lat != null && recurso.lng != null;

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
            {fotos.length > 1 && (
              <div className="bg-muted/80 px-4 py-2 text-center text-xs text-muted-foreground">
                +{fotos.length - 1} fotos disponibles con el perfil completo
              </div>
            )}
          </div>
        )
      )}

      {/* Title + badge + plan badge */}
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
          {recurso.descuentoPorcentaje != null && recurso.descuentoPorcentaje > 0 && (
            <div className="shrink-0 rounded-xl bg-primary px-5 py-3 text-center">
              <span className="block text-2xl font-bold text-primary-foreground">
                {recurso.descuentoPorcentaje}%
              </span>
              <span className="block text-xs font-medium text-primary-foreground/80">
                descuento Club
              </span>
            </div>
          )}
        </div>

        {recurso.cerradoTemporal && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-medium text-amber-700">
            Este establecimiento está cerrado temporalmente.
          </div>
        )}
      </div>

      {/* Description */}
      {recurso.descripcion && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Qué ofrece a los socios del Club
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line">
            {recurso.descripcion}
          </p>
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

      {/* Locked contact for FREE negocios */}
      {isFree && (recurso.telefono || recurso.email || recurso.web) && (
        <LockedSection
          title="Datos de contacto"
          message="El teléfono, email y web de este negocio están disponibles en perfiles con plan Recomendado o superior."
          ctaHref="/para-negocios"
        />
      )}

      {/* Locked schedule for FREE negocios */}
      {isFree && recurso.horariosSemana && recurso.horariosSemana.length > 0 && (
        <LockedSection
          title="Horarios detallados"
          message="Los horarios de apertura están disponibles en perfiles con plan Recomendado o superior."
          ctaHref="/para-negocios"
        />
      )}

      {/* Map - visible for all plans (socios need to know where to go) */}
      {hasCoords && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Ubicación</h2>
          <MiniMap lat={recurso.lat!} lng={recurso.lng!} nombre={recurso.nombre} />
        </div>
      )}

      {/* CTA for upgrade */}
      {isNegocio && isFree && (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            ¿Eres el responsable de este negocio?
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Activa tu perfil completo: galería de fotos, datos de contacto visibles,
            horarios, badge de recomendación y mucho más.
          </p>
          <Link
            href="/para-negocios"
            className="mt-4 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ver planes para negocios
          </Link>
        </div>
      )}

      {isNegocio && isRecomendado && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 text-center">
          <p className="text-sm text-blue-800">
            Pasa al plan <strong>Premium</strong> para tu landing completa, badge dorado,
            posición destacada y publicación en nuestras redes sociales.
          </p>
          <Link
            href="/para-negocios"
            className="mt-3 inline-block rounded-lg border border-blue-300 bg-white px-5 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 transition-colors"
          >
            Descubrir Premium
          </Link>
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
