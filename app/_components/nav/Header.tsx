import Link from "next/link";
import { MegaMenu } from "./MegaMenu";
import AuthNavLink from "./AuthNavLink";
import CartIndicator from "../tienda/CartIndicator";
import { headers } from "next/headers";

type SiteSettings = {
  brandName: string;
  activeLogo: 'default' | 'variant' | 'text';
  logoUrl: string | null;
  logoAlt: string;
  logoVariantUrl: string | null;
};

async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const h = await headers();
    const host = h.get('host');
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const baseUrl = `${proto}://${host}`;

    const res = await fetch(`${baseUrl}/api/public/site-settings`, {
      cache: 'no-store',
    });

    if (!res.ok) throw new Error('Settings not available');
    return res.json();
  } catch {
    // Fallback
    return {
      brandName: 'LPBME',
      activeLogo: 'text',
      logoUrl: null,
      logoAlt: 'Los Pueblos Más Bonitos de España',
      logoVariantUrl: null,
    };
  }
}

export async function Header() {
  const settings = await fetchSiteSettings();

  // Determinar qué mostrar según activeLogo
  let logoContent: React.ReactNode;

  if (settings.activeLogo === 'text') {
    logoContent = (
      <span className="text-base font-semibold">{settings.brandName}</span>
    );
  } else if (settings.activeLogo === 'variant' && settings.logoVariantUrl) {
    logoContent = (
      <img
        src={settings.logoVariantUrl}
        alt={settings.logoAlt}
        style={{
          height: '96px',
          maxHeight: '96px',
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    );
  } else if (settings.activeLogo === 'default' && settings.logoUrl) {
    logoContent = (
      <img
        src={settings.logoUrl}
        alt={settings.logoAlt}
        style={{
          height: '96px',
          maxHeight: '96px',
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    );
  } else {
    // Fallback: texto
    logoContent = (
      <span className="text-base font-semibold">{settings.brandName}</span>
    );
  }

  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="block">
          {logoContent}
        </Link>

        <div className="hidden md:block">
          <MegaMenu />
        </div>

        <div className="flex items-center gap-4">
          <CartIndicator />
          <Link href="/contacto" className="text-sm font-medium hover:underline">
            Contacto
          </Link>
          <AuthNavLink />
        </div>
      </div>
    </header>
  );
}
