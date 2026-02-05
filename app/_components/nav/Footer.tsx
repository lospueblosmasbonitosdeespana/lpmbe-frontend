import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";

const RRSS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/lospueblosmasbonitosdeespana/",
    icon: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/lospueblosmasbonitosdeespana/",
    icon: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
  {
    label: "Twitter",
    href: "https://twitter.com/lospueblosbonitos",
    icon: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@lospueblosmasbonitosdeespana",
    icon: (
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    ),
  },
];

type SiteSettings = {
  brandName: string;
  activeLogo: "default" | "variant" | "text";
  logoUrl: string | null;
  logoAlt: string;
  logoVariantUrl: string | null;
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "http";
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/public/site-settings`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Settings not available");
    return res.json();
  } catch {
    return {
      brandName: "LPBME",
      activeLogo: "text",
      logoUrl: null,
      logoAlt: "Los Pueblos Más Bonitos de España",
      logoVariantUrl: null,
    };
  }
}

export async function Footer() {
  const settings = await fetchSiteSettings();

  const logoUrl =
    settings.activeLogo === "variant" && settings.logoVariantUrl
      ? settings.logoVariantUrl
      : settings.activeLogo === "default" && settings.logoUrl
        ? settings.logoUrl
        : null;

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Brand + Logo */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-6 block">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={settings.logoAlt}
                  width={180}
                  height={72}
                  className="h-16 w-auto object-contain"
                  unoptimized={logoUrl.startsWith("http")}
                />
              ) : (
                <span className="font-serif text-xl font-medium text-background">
                  {settings.brandName}
                </span>
              )}
            </Link>
            <p className="text-sm leading-relaxed text-background/70">
              Asociación dedicada a preservar y promover el patrimonio rural de
              España desde 2011.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h4 className="mb-4 text-sm font-medium tracking-wide text-background">
              Explorar
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/pueblos"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  Todos los pueblos
                </Link>
              </li>
              <li>
                <Link
                  href="/multiexperiencias"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  Multiexperiencias
                </Link>
              </li>
              <li>
                <Link
                  href="/rutas"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  Rutas
                </Link>
              </li>
              <li>
                <Link
                  href="https://maps.lospueblosmasbonitosdeespana.org/es/pueblos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  Mapa interactivo
                </Link>
              </li>
            </ul>
          </div>

          {/* El sello */}
          <div>
            <h4 className="mb-4 text-sm font-medium tracking-wide text-background">
              El sello
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/el-sello"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  El Sello
                </Link>
              </li>
              <li>
                <Link
                  href="/el-sello/como-se-obtiene"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  ¿Cómo se obtiene?
                </Link>
              </li>
              <li>
                <Link
                  href="/el-sello/quienes-somos"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link
                  href="/el-sello/unete"
                  className="text-sm text-background/70 transition-colors hover:text-background"
                >
                  Únete
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto + RRSS */}
          <div>
            <h4 className="mb-4 text-sm font-medium tracking-wide text-background">
              Contacto
            </h4>
            <ul className="space-y-3">
              <li className="text-sm text-background/70">
                <a
                  href="mailto:info@lospueblosmasbonitosdeespana.org"
                  className="hover:text-background"
                >
                  info@lospueblosmasbonitosdeespana.org
                </a>
              </li>
            </ul>

            <div className="mt-6 flex gap-4">
              {RRSS.map((r) => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-background/70 transition-colors hover:text-background"
                  aria-label={r.label}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    {r.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-background/20 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-background/60">
              © {new Date().getFullYear()} Los Pueblos Más Bonitos de España.
              Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacidad"
                className="text-sm text-background/60 transition-colors hover:text-background"
              >
                Privacidad
              </Link>
              <Link
                href="/aviso-legal"
                className="text-sm text-background/60 transition-colors hover:text-background"
              >
                Aviso Legal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
