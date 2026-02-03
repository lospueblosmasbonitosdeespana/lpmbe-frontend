"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Grid } from "@/app/components/ui/grid";
import { Display, Headline, Lead, Body, Eyebrow, Title } from "@/app/components/ui/typography";
import { ProductCard, type ProductCardData } from "@/app/_components/tienda/ProductCard";
import { cn } from "@/lib/utils";

/* ===========================================
   SHOP HERO WITH SEARCH
   =========================================== */

interface ShopHeroProps {
  onSearchChange: (query: string) => void;
}

function ShopHero({ onSearchChange }: ShopHeroProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    // Búsqueda en tiempo real
    onSearchChange(newQuery);
  };

  return (
    <Section spacing="none" className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <Container className="relative py-16 md:py-24">
        <div className="max-w-2xl">
          <Eyebrow className="mb-4">Tienda oficial</Eyebrow>
          <Display className="mb-6">Productos con alma de pueblo</Display>
          <Lead className="text-foreground/80">
            Descubre artesanía, gastronomía y cultura de los rincones más bellos de España. Cada compra apoya
            directamente a los artesanos locales.
          </Lead>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="mt-8 flex max-w-md">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Buscar productos..."
                className="w-full rounded-l-md border border-border bg-card py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              className="rounded-r-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Buscar
            </button>
          </form>
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   BENEFITS BAR
   =========================================== */

const benefits = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    title: "Envío gratuito",
    description: "En pedidos superiores a 50€",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Pago seguro",
    description: "Transacciones encriptadas",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    title: "Producto artesanal",
    description: "Hecho en España",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    title: "Origen certificado",
    description: "De los pueblos más bonitos",
  },
];

function BenefitsBar() {
  return (
    <Section spacing="sm" background="muted">
      <Container>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 text-primary">{benefit.icon}</div>
              <div>
                <p className="text-sm font-semibold text-foreground">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   FEATURED BANNER
   =========================================== */

interface FeaturedBannerProps {
  title: string;
  description: string;
  cta: string;
  href: string;
  align?: "left" | "right";
}

function FeaturedBanner({ title, description, cta, href, align = "left" }: FeaturedBannerProps) {
  return (
    <Link href={href} className="group block">
      <div
        className={cn(
          "relative flex min-h-[320px] overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10",
          align === "right" && "flex-row-reverse"
        )}
      >
        {/* Content */}
        <div className="flex w-full flex-col justify-center p-8 md:p-12">
          <Eyebrow className="mb-3">Destacado</Eyebrow>
          <Title as="h3" className="mb-3">
            {title}
          </Title>
          <Body className="mb-6 text-muted-foreground">{description}</Body>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
            {cta}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ===========================================
   NEWSLETTER CTA
   =========================================== */

function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("¡Gracias por suscribirte!");
        setEmail("");
      } else {
        const data = await response.json();
        setStatus("error");
        setMessage(data.error || "Error al suscribirse");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Error de conexión");
    }
  };

  return (
    <Section spacing="lg" background="primary" className="text-primary-foreground">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-4 text-primary-foreground/70">Newsletter</Eyebrow>
          <Headline as="h2" className="mb-4 text-primary-foreground">
            10% de descuento en tu primera compra
          </Headline>
          <Body className="mb-8 text-primary-foreground/80">
            Suscríbete a nuestra newsletter y recibe un código de descuento exclusivo, además de novedades sobre
            productos artesanales de los pueblos más bonitos.
          </Body>
          <form onSubmit={handleSubmit} className="flex justify-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Tu email"
              disabled={status === "loading"}
              className="w-full max-w-xs rounded-md border-0 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-md bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90 disabled:opacity-50"
            >
              {status === "loading" ? "..." : "Suscribirme"}
            </button>
          </form>
          {message && (
            <p
              className={cn(
                "mt-4 text-sm",
                status === "success" ? "text-primary-foreground" : "text-primary-foreground/70"
              )}
            >
              {message}
            </p>
          )}
        </div>
      </Container>
    </Section>
  );
}

/* ===========================================
   MAIN CLIENT COMPONENT
   =========================================== */

interface TiendaPageClientProps {
  allProducts: ProductCardData[];
  featuredProducts: ProductCardData[];
}

export function TiendaPageClient({ allProducts, featuredProducts }: TiendaPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrar productos
  const filteredProducts = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allProducts;

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="min-h-screen">
      {/* Hero with Search */}
      <ShopHero onSearchChange={setSearchQuery} />

      {/* Benefits */}
      <BenefitsBar />

      {/* Featured Products - Solo si NO hay búsqueda */}
      {!isSearching && featuredProducts.length > 0 && (
        <Section spacing="lg" background="card">
          <Container>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <Eyebrow className="mb-2">Selección especial</Eyebrow>
                <Headline as="h2">Productos destacados</Headline>
              </div>
            </div>
            <Grid columns={4} gap="md">
              {featuredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </Grid>
          </Container>
        </Section>
      )}

      {/* Banner 1 - Solo si NO hay búsqueda */}
      {!isSearching && (
        <Section spacing="lg">
          <Container>
            <FeaturedBanner
              title="Libro: Los Pueblos Más Bonitos de España"
              description="Un viaje fotográfico por los 126 pueblos que conforman nuestra asociación. Edición de coleccionista con más de 400 fotografías."
              cta="Descubrir libro"
              href="/tienda"
              align="left"
            />
          </Container>
        </Section>
      )}

      {/* All Products / Search Results */}
      <Section spacing="lg">
        <Container>
          <div className="mb-8">
            <Eyebrow className="mb-2">{isSearching ? "Resultados de búsqueda" : "Catálogo completo"}</Eyebrow>
            <Headline as="h2">{isSearching ? `"${searchQuery}"` : "Todos los productos"}</Headline>
            <Lead className="mt-2">
              {filteredProducts.length} {isSearching ? "productos encontrados" : "productos disponibles"}
            </Lead>
          </div>
          {filteredProducts.length > 0 ? (
            <Grid columns={4} gap="md">
              {filteredProducts.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </Grid>
          ) : (
            <div className="rounded-lg bg-muted p-8 text-center">
              <p className="text-muted-foreground">
                {isSearching
                  ? `No se encontraron productos que coincidan con "${searchQuery}"`
                  : "No hay productos disponibles"}
              </p>
            </div>
          )}
        </Container>
      </Section>

      {/* Banner 2 - Solo si NO hay búsqueda */}
      {!isSearching && (
        <Section spacing="lg" background="muted">
          <Container>
            <FeaturedBanner
              title="Colección Gastronomía"
              description="Los mejores productos de la tierra: aceites, mieles, embutidos y vinos de denominación de origen de nuestros pueblos."
              cta="Explorar colección"
              href="/tienda"
              align="right"
            />
          </Container>
        </Section>
      )}

      {/* Newsletter CTA */}
      <NewsletterCTA />
    </main>
  );
}
