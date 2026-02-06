"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  Cloud,
  AlertTriangle,
  Newspaper,
  MapPin,
  ChevronDown,
  Sparkles,
  Map,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/app/components/ui/container";
import { Section } from "@/app/components/ui/section";
import { Title, Muted } from "@/app/components/ui/typography";
import { Button } from "@/app/components/ui/button";

/* ----- TYPES ----- */
export interface NotificationItem {
  id: string | number;
  date: string;
  title: string;
  type: "noticia" | "semaforo" | "alerta" | "meteo";
  href: string;
  /** Mensaje público (ej. para semáforos: motivo público del cambio) */
  message?: string;
}

export interface CategoryCard {
  slug: string;
  name: string;
  image: string;
  href: string;
}

export interface RouteCard {
  slug: string;
  name: string;
  image: string;
  href: string;
}

export interface VillageCard {
  slug: string;
  name: string;
  province: string;
  image: string;
  href: string;
}

export interface NewsItem {
  id: string | number;
  title: string;
  type: string;
  href: string;
  image?: string;
  date?: string;
}

export interface HomeVideoItem {
  id: number;
  titulo: string;
  url: string;
  tipo?: string;
  thumbnail?: string | null;
}

interface HomePageProps {
  heroSlides?: Array<{ image: string; alt?: string }>;
  heroIntervalMs?: number;
  heroTitle?: string;
  heroSubtitle?: string;
  notifications?: NotificationItem[];
  categories?: CategoryCard[];
  routes?: RouteCard[];
  villages?: VillageCard[];
  news?: NewsItem[];
  videos?: HomeVideoItem[];
  mapPreviewImage?: string;
  shopBannerImage?: string;
}

/* ----- HERO SECTION ----- */
function HeroSection({
  heroSlides = [],
  heroIntervalMs = 4000,
  heroTitle,
  heroSubtitle,
}: {
  heroSlides?: Array<{ image: string; alt?: string }>;
  heroIntervalMs?: number;
  heroTitle?: string;
  heroSubtitle?: string;
}) {
  const visibleSlides = heroSlides.filter((s) => s?.image?.trim()).slice(0, 4);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= visibleSlides.length && visibleSlides.length > 0) {
      setActiveIndex(0);
    }
  }, [visibleSlides.length, activeIndex]);

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleSlides.length);
    }, heroIntervalMs);
    return () => clearInterval(timer);
  }, [visibleSlides.length, heroIntervalMs]);

  return (
    <section className="relative h-[75vh] min-h-[550px] max-h-[800px] overflow-hidden">
      <div className="absolute inset-0">
        {visibleSlides.map((slide, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              idx === activeIndex ? "opacity-100 z-0" : "opacity-0 z-[-1]"
            )}
          >
            <Image
              src={slide.image}
              alt={slide.alt || "Los Pueblos Más Bonitos de España"}
              fill
              priority={idx === 0}
              className="object-cover"
            />
          </div>
        ))}
        {visibleSlides.length === 0 && (
          <Image
            src="/hero/1.jpg"
            alt="Los Pueblos Más Bonitos de España"
            fill
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 z-[1]" />
      </div>

      <Container className="relative z-10 h-full flex flex-col justify-end pb-28">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-medium mb-5 w-fit">
          <Sparkles className="h-3 w-3" />
          126 pueblos certificados
        </div>

        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-medium tracking-tight mb-4 text-balance max-w-4xl leading-[1.1]">
          {heroTitle || "Los Pueblos Más Bonitos de España"}
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl leading-relaxed">
          {heroSubtitle || "Descubre la esencia de nuestros pueblos"}
        </p>

        <div className="flex flex-wrap gap-4">
          <Button asChild size="lg" className="rounded-full px-6 shadow-lg">
            <Link href="/pueblos">
              Explorar pueblos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
          >
            <Link href="/meteo">
              <Cloud className="mr-2 h-4 w-4" /> Meteo
            </Link>
          </Button>
        </div>
      </Container>

      {/* Decorative bottom curve - pointer-events-none para no bloquear clics en botones */}
      <div className="absolute -bottom-1 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto">
          <path
            d="M0 60V30C240 0 480 0 720 15C960 30 1200 45 1440 30V60H0Z"
            className="fill-background"
          />
        </svg>
      </div>
    </section>
  );
}

/* ----- COLLAPSIBLE NOTIFICATION CENTER ----- */
function NotificationCenter({
  notifications = [],
}: {
  notifications: NotificationItem[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "noticias" | "semaforos" | "alertas" | "meteo"
  >("noticias");

  const tabs = [
    { id: "noticias", label: "Noticias", icon: Newspaper },
    { id: "semaforos", label: "Semáforos", icon: AlertTriangle },
    { id: "alertas", label: "Alertas", icon: Bell },
    { id: "meteo", label: "Meteo", icon: Cloud },
  ] as const;

  const filteredNotifications = notifications.filter((n) =>
    activeTab === "noticias"
      ? n.type === "noticia"
      : activeTab === "semaforos"
        ? n.type === "semaforo"
        : activeTab === "alertas"
          ? n.type === "alerta"
          : n.type === "meteo"
  );

  const notificationCount = notifications.length;

  return (
    <div className="relative z-10 -mt-8">
      <Container>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center justify-between gap-4 px-5 py-3 bg-card/95 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300",
              isOpen
                ? "rounded-t-2xl border-b-0"
                : "rounded-2xl hover:shadow-2xl"
            )}
          >
            <div className="flex-1" aria-hidden />
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <Bell className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm">
                Centro de notificaciones
              </span>
              {notificationCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                  {notificationCount}
                </span>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-300",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </button>

          <div
            className={cn(
              "rounded-b-2xl border border-t-0 border-border/50 bg-card/95 backdrop-blur-md shadow-xl overflow-hidden transition-all duration-300",
              isOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0 border-0"
            )}
          >
            <div className="flex items-center gap-1 p-2 bg-muted/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="max-h-[200px] overflow-y-auto divide-y divide-border/50">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-primary/5 transition-colors group"
                  >
                    <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 w-12 font-medium">
                      {item.date}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </p>
                      {item.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.message}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all flex-shrink-0 mt-0.5" />
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              )}
            </div>

            <div className="px-5 py-3 bg-muted/20 border-t border-border/50">
              <Link
                href="/notificaciones"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Ver todas las notificaciones <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

/* ----- IDEAS PARA TU VIAJE ----- */
function IdeasSection({ categories = [] }: { categories: CategoryCard[] }) {
  if (categories.length === 0) return null;

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="text-center mb-10">
          <Title as="h2" size="2xl" className="mb-3">
            Descubre{" "}
            <span className="text-primary">nuestros viajes temáticos</span>
          </Title>
          <Muted className="text-base max-w-2xl mx-auto">
            Los pueblos según tus deseos. En familia, para escapadas
            gastronómicas, para descubrir la naturaleza o el patrimonio -
            encuentra tu experiencia ideal.
          </Muted>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-6 md:overflow-visible scrollbar-hide">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={cat.href}
              className="group flex-shrink-0 w-[160px] md:w-auto"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-all duration-500">
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      Sin imagen
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Title
                    as="h3"
                    size="sm"
                    className="text-white font-semibold text-center"
                  >
                    {cat.name}
                  </Title>
                </div>
              </div>
              <p className="text-center text-xs text-primary font-medium group-hover:underline">
                Para saber más
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/experiencias">
              Ver todas las temáticas <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ----- PUEBLOS DESTACADOS ----- */
function PueblosDestacadosSection({
  villages = [],
}: {
  villages: VillageCard[];
}) {
  if (villages.length === 0) return null;

  const featured = villages.slice(0, 4);

  return (
    <Section spacing="lg" background="muted">
      <Container>
        <div className="text-center mb-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">
            Destacados del momento
          </p>
        </div>
        <div className="text-center mb-10">
          <Title as="h2" size="2xl">
            Los pueblos que no te puedes perder
          </Title>
          <Muted className="mt-3 max-w-2xl mx-auto">
            Os proponemos descubrir los pueblos más bonitos de España.
          </Muted>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((village) => (
            <Link
              key={village.slug}
              href={village.href}
              className="group text-center"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-all duration-500">
                {village.image ? (
                  <Image
                    src={village.image}
                    alt={village.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      Sin imagen
                    </span>
                  </div>
                )}
              </div>
              <Title
                as="h3"
                size="base"
                className="font-semibold mb-1 group-hover:text-primary transition-colors"
              >
                {village.name}
              </Title>
              <Muted className="text-sm">{village.province}</Muted>
              <p className="text-primary text-sm font-medium mt-2 group-hover:underline">
                Descubrir <ArrowRight className="inline h-3 w-3 ml-1" />
              </p>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild className="rounded-full">
            <Link href="/pueblos">
              Ver todos los pueblos <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ----- RUTAS ----- */
function RutasSection({ routes = [] }: { routes: RouteCard[] }) {
  if (routes.length === 0) return null;

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text content */}
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Itinerarios
            </p>
            <Title as="h2" size="2xl" className="mb-4">
              Descubre nuestras rutas
            </Title>
            <Muted className="text-base mb-8">
              Itinerarios diseñados para recorrer los pueblos más bonitos de
              España. Desde los Pirineos hasta Andalucía, encuentra tu ruta
              perfecta.
            </Muted>

            <ul className="space-y-4">
              {routes.slice(0, 4).map((route) => (
                <li key={route.slug}>
                  <Link
                    href={route.href}
                    className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                      {route.image ? (
                        <Image
                          src={route.image}
                          alt={route.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Title
                        as="h3"
                        size="sm"
                        className="font-semibold group-hover:text-primary transition-colors truncate"
                      >
                        {route.name}
                      </Title>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link
                href="/rutas"
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
              >
                Ver todas las rutas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Right - Featured image */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
            {routes[0]?.image ? (
              <Image
                src={routes[0].image}
                alt="Rutas destacadas"
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="text-white/80 text-sm mb-2">Ruta destacada</p>
              <Title as="h3" size="lg" className="text-white">
                {routes[0]?.name}
              </Title>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ----- ACTUALIDAD ----- */
function ActualidadSection({ news = [] }: { news: NewsItem[] }) {
  if (news.length === 0) return null;

  return (
    <Section spacing="lg" background="muted">
      <Container>
        <div className="text-center mb-10">
          <Title as="h2" size="2xl" className="uppercase tracking-wide mb-3">
            Nuestras Actualidades
          </Title>
          <Muted className="text-base max-w-2xl mx-auto">
            Un nuevo pueblo certificado, un evento, la salida de la última
            edición de la guía oficial... Os lo contamos todo aquí.
          </Muted>
        </div>

        {/* News layout */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left - Large news card */}
          {news[0] && (
            <Link href={news[0].href} className="group">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 shadow-lg">
                {news[0].image ? (
                  <Image
                    src={news[0].image}
                    alt={news[0].title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex items-start gap-4">
                <div className="text-center flex-shrink-0">
                  <span className="block text-3xl font-light text-primary">
                    01
                  </span>
                  <span className="text-sm text-muted-foreground">Feb</span>
                </div>
                <p className="text-base font-medium group-hover:text-primary transition-colors line-clamp-3">
                  {news[0].title}
                </p>
              </div>
            </Link>
          )}

          {/* Right - Stacked news */}
          <div className="space-y-8">
            {news.slice(1, 3).map((item, index) => (
              <Link key={item.id} href={item.href} className="group block">
                <div className="flex items-start gap-4 mb-3">
                  <div className="text-center flex-shrink-0">
                    <span className="block text-2xl font-light text-primary">
                      {String(5 + index * 5).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-muted-foreground">Feb</span>
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2 pt-1">
                    {item.title}
                  </p>
                </div>
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-md">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <Newspaper className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/notificaciones"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Ver todo <span className="w-8 h-px bg-primary" />
          </Link>
        </div>
      </Container>
    </Section>
  );
}

/* ----- MAPA INTERACTIVO ----- */
function MapaSection({ mapPreviewImage }: { mapPreviewImage?: string }) {
  return (
    <Section spacing="md" background="default">
      <Container>
        <div className="relative rounded-2xl overflow-hidden">
          <div className="relative h-[280px] md:h-[320px]">
            <Image
              src={mapPreviewImage || "/mapa_espana_pueblos.png"}
              alt="Mapa interactivo de España"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <Title as="h2" size="2xl" className="text-white uppercase tracking-wide mb-6">
              Mapa Interactivo
            </Title>
            <Muted className="text-white/80 mb-6">
              Descubre todos los pueblos sobre el mapa y planifica tu próxima
              escapada.
            </Muted>
            <Button asChild size="lg" className="rounded-full bg-primary hover:bg-primary/90">
              <Link href="https://maps.lospueblosmasbonitosdeespana.org/es/pueblos">
                Descubrir nuestros pueblos
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ----- VIDEOS ASOCIACIÓN ----- */
function VideosAsociacionSection({ videos }: { videos: Array<{ id: number; titulo: string; url: string; tipo?: string; thumbnail?: string | null }> }) {
  if (!videos || videos.length === 0) return null;

  function getEmbedUrl(url: string): string {
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    if (url.includes("/embed/")) return url;
    return url;
  }

  const isR2 = (v: { tipo?: string }) => (v.tipo ?? "").toUpperCase() === "R2";

  return (
    <Section spacing="md" background="muted">
      <Container>
        <Title as="h2" size="xl" className="mb-6">
          Videos de la asociación
        </Title>
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
          {videos.slice(0, 2).map((v) => (
            <div key={v.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-video w-full bg-muted">
                {isR2(v) ? (
                  <video
                    src={v.url}
                    title={v.titulo}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                ) : (
                  <iframe
                    src={getEmbedUrl(v.url)}
                    title={v.titulo}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold">{v.titulo}</h3>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link
              href="https://www.youtube.com/@lospueblosmasbonitos"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver más en YouTube
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}

/* ----- LA TIENDA ----- */
function TiendaBanner({ shopBannerImage }: { shopBannerImage?: string }) {
  return (
    <Section spacing="lg" background="muted">
      <Container>
        <div className="relative rounded-3xl overflow-hidden">
          <div className="relative aspect-[21/9] md:aspect-[3/1]">
            <Image
              src={shopBannerImage || "/hero/2.jpg"}
              alt="La Tienda"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
          </div>

          <div className="absolute inset-0 flex items-center justify-between p-8 md:p-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium mb-3">
                <Store className="h-3 w-3" />
                Tienda oficial
              </div>
              <Title as="h2" size="2xl" className="text-white mb-2">
                La Tienda
              </Title>
              <p className="text-white/80 max-w-md">
                Guías oficiales, mapas, merchandising y productos exclusivos.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="rounded-full hidden md:inline-flex"
            >
              <Link href="/tienda">
                Visita nuestra tienda <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ----- FINAL CTA ----- */
function FinalCTA() {
  const links = [
    {
      label: "Ver todos los pueblos",
      description: "Listado completo",
      href: "/pueblos",
      icon: MapPin,
    },
    {
      label: "Centro de notificaciones",
      description: "Noticias y avisos",
      href: "/notificaciones",
      icon: Bell,
    },
    {
      label: "Mapa interactivo",
      description: "Explorar por ubicación",
      href: "https://maps.lospueblosmasbonitosdeespana.org/es/pueblos",
      icon: Map,
    },
  ];

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-sm border border-border">
          <Title as="h2" size="xl" className="mb-2">
            Empieza a planificar tu próxima escapada
          </Title>
          <Muted className="mb-8">
            Explora los pueblos, consulta la actualidad y descubre el mapa
            interactivo.
          </Muted>

          <div className="grid md:grid-cols-3 gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-sm flex items-center gap-1">
                    {link.label} <ArrowRight className="h-3 w-3" />
                  </span>
                  <span className="text-xs opacity-70">{link.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ----- SOCIAL MEDIA SECTION ----- */
function SocialMediaSection() {
  const socialLinks = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/stories/lospueblosmbe/",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
        </svg>
      ),
      bg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/lospueblosmasbonitos/",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      bg: "bg-[#1877F2]",
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@lospueblosmbe",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
      bg: "bg-black",
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@lospueblosmasbonitos",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      bg: "bg-[#FF0000]",
    },
    {
      name: "X",
      href: "https://x.com/lospueblosmbe",
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      bg: "bg-black",
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <Container className="relative z-10">
        <div className="text-center mb-10">
          <p className="text-white/70 text-sm uppercase tracking-wider mb-2">
            Síguenos en redes
          </p>
          <Title as="h2" size="2xl" className="text-white mb-4">
            Únete a nuestra comunidad
          </Title>
          <p className="text-white/80 max-w-xl mx-auto">
            Fotos, actualidad, eventos... Compartimos todo contigo en nuestras
            redes sociales.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
          {socialLinks.map((social) => (
            <a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-3 transition-all duration-300 hover:scale-110"
            >
              <div
                className={cn(
                  "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all group-hover:shadow-2xl group-hover:rotate-3",
                  social.bg
                )}
              >
                {social.icon}
              </div>
              <span className="font-medium text-white text-sm">
                {social.name}
              </span>
            </a>
          ))}
        </div>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-5 py-3">
            <span className="text-white/90 text-sm">Comparte con</span>
            <span className="px-4 py-1.5 bg-white text-primary font-bold rounded-full text-sm">
              #LosPueblosMasBonitos
            </span>
          </div>
        </div>

        <NewsletterSubscribeBlock />
      </Container>
    </section>
  );
}

/* ----- NEWSLETTER SUBSCRIBE (dentro de SocialMediaSection) ----- */
function NewsletterSubscribeBlock() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), origen: "home" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="border-t border-white/20 pt-12">
      <div className="text-center mb-6">
        <Title as="h3" size="lg" className="text-white mb-2">
          Suscríbete a nuestra newsletter
        </Title>
        <p className="text-white/80 text-sm max-w-md mx-auto">
          Recibe novedades, eventos y contenidos exclusivos en tu correo.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        {status === "success" ? (
          <p className="text-white/90 text-sm font-medium">
            ¡Gracias! Revisa tu email para confirmar la suscripción.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu email"
              required
              disabled={status === "loading"}
              className="flex-1 rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 disabled:opacity-70"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/90 disabled:opacity-70"
            >
              {status === "loading" ? "Enviando..." : "Suscribirme"}
            </button>
          </form>
        )}
        {status === "error" && (
          <p className="text-white/80 text-sm">Ha ocurrido un error. Inténtalo de nuevo.</p>
        )}
        <Link
          href="/newsletter"
          className="text-white/90 text-sm font-medium hover:text-white underline underline-offset-2"
        >
          Últimas newsletters →
        </Link>
      </div>
    </div>
  );
}

/* ----- MAIN COMPONENT ----- */
export function HomePageNew({
  heroSlides = [],
  heroIntervalMs = 4000,
  heroTitle,
  heroSubtitle,
  notifications = [],
  categories = [],
  routes = [],
  villages = [],
  news = [],
  videos = [],
  mapPreviewImage,
  shopBannerImage,
}: HomePageProps) {
  return (
    <div className="min-h-screen">
      <HeroSection
        heroSlides={heroSlides}
        heroIntervalMs={heroIntervalMs}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
      />
      <NotificationCenter notifications={notifications} />
      <IdeasSection categories={categories} />
      <PueblosDestacadosSection villages={villages} />
      <RutasSection routes={routes} />
      <ActualidadSection news={news} />
      <TiendaBanner shopBannerImage={shopBannerImage} />
      <MapaSection mapPreviewImage={mapPreviewImage} />
      <VideosAsociacionSection videos={videos} />
      <FinalCTA />
      <SocialMediaSection />
    </div>
  );
}
