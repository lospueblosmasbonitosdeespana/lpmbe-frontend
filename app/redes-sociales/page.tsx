import Link from "next/link";
import type { Metadata } from "next";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import {
  Display,
  Title,
  Lead,
  Body,
  Eyebrow,
  Caption,
} from "@/app/components/ui/typography";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Redes sociales | Los Pueblos Más Bonitos de España",
  description:
    "Síguenos en Instagram, Facebook, X, TikTok y YouTube. Colaboraciones con creadores de contenido e influencers. Únete a nuestra comunidad.",
};

const EMAIL_RRSS = "socialmedia@lospueblosmasbonitosdeespana.org";

const REDES = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/lospueblosmbe/",
    description: "Fotos, Stories y Reels de nuestros pueblos",
    bg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    icon: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162z" />
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/lospueblosmasbonitos/",
    description: "Eventos, noticias y comunidad",
    bg: "bg-[#1877F2]",
    icon: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
  {
    name: "X",
    href: "https://x.com/lospueblosmbe",
    description: "Actualidad y conversación",
    bg: "bg-foreground",
    icon: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@lospueblosmbe",
    description: "Videos cortos y tendencias",
    bg: "bg-foreground",
    icon: (
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@lospueblosmasbonitos",
    description: "Reportajes, rutas y documentales",
    bg: "bg-[#FF0000]",
    icon: (
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
];

export default function RedesSocialesPage() {

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Redes sociales" }]} />
        </Container>
      </Section>

      {/* Hero */}
      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Eyebrow className="mb-3">Comunidad</Eyebrow>
              <Display className="mb-4">Redes sociales</Display>
              <Lead className="mb-10 max-w-2xl text-muted-foreground">
                Síguenos en nuestras redes. Fotos, actualidad, eventos y la mejor
                inspiración para descubrir los pueblos más bonitos de España.
              </Lead>
            </div>
          </Container>
        </div>
      </Section>

      {/* Enlaces a redes */}
      <Section spacing="lg" background="default">
        <Container>
          <h2 className="mb-8 font-serif text-2xl font-medium">
            Nuestras redes
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REDES.map((r) => (
              <a
                key={r.name}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                )}
              >
                <div
                  className={cn(
                    "mb-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white",
                    r.bg
                  )}
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {r.icon}
                  </svg>
                </div>
                <h3 className="mb-1 font-serif text-lg font-medium text-foreground group-hover:text-primary">
                  {r.name}
                </h3>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                  Visitar {r.name}
                  <svg
                    className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </Container>
      </Section>

      {/* Colaboraciones */}
      <Section spacing="lg" background="muted">
        <Container>
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-sm lg:p-12">
            <Eyebrow className="mb-3">Colaboraciones</Eyebrow>
            <Title as="h2" className="mb-4">
              ¿Eres creador de contenido o influencer?
            </Title>
            <Body className="mb-6 text-muted-foreground">
              Nos encanta colaborar con quienes comparten nuestra pasión por el
              patrimonio rural de España. Si te interesa trabajar con nosotros —
              menciones, takeovers, contenido conjunto o visitas a nuestros
              pueblos — estaremos encantados de conocerte.
            </Body>
            <Link
              href={`mailto:${EMAIL_RRSS}?subject=Colaboración RRSS - Los Pueblos Más Bonitos de España`}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-6 py-3 font-medium text-primary transition-colors hover:bg-primary/15 hover:border-primary/40"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Escríbenos a {EMAIL_RRSS}
            </Link>
          </div>
        </Container>
      </Section>

      {/* Hashtag */}
      <Section spacing="lg" background="default">
        <Container>
          <div className="rounded-xl border border-dashed border-border bg-muted/50 px-6 py-10 text-center lg:px-12 lg:py-14">
            <Caption className="mb-2">Comparte con</Caption>
            <p className="font-mono text-2xl font-bold text-primary sm:text-3xl">
              #LosPueblosMasBonitos
            </p>
            <p className="mt-3 max-w-xl mx-auto text-sm text-muted-foreground">
              Etiquétanos en tus fotos y publicaciones. Nos encanta ver cómo
              descubres nuestros pueblos.
            </p>
          </div>
        </Container>
      </Section>
    </main>
  );
}
