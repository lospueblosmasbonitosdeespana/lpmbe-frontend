import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import AuthNavLink from "./AuthNavLink";
import CartIndicatorWrapper from "../tienda/CartIndicatorWrapper";
import { LocaleSwitcher } from "./LocaleSwitcher";
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

type HeaderProps = { locale: string };

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations("nav");
  const settings = await fetchSiteSettings();

  // Determinar qué mostrar según activeLogo
  // En dark mode usamos el mismo logo blanco que el footer (logoVariantUrl) si existe
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
    if (settings.logoVariantUrl) {
      // Dos logos: normal en claro, variante blanca en dark (mismo que footer)
      logoContent = (
        <>
          <img
            src={settings.logoUrl}
            alt={settings.logoAlt}
            className="dark:hidden"
            style={{
              height: '96px',
              maxHeight: '96px',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
          <img
            src={settings.logoVariantUrl}
            alt={settings.logoAlt}
            className="hidden dark:block"
            style={{
              height: '96px',
              maxHeight: '96px',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </>
      );
    } else {
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
    }
  } else {
    // Fallback: texto
    logoContent = (
      <span className="text-base font-semibold">{settings.brandName}</span>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm dark:bg-card dark:border-b dark:border-border dark:shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="block text-foreground dark:text-white">
          {logoContent}
        </Link>

        <div className="hidden md:block">
          <MegaMenu />
        </div>

        <div className="flex items-center gap-3 md:gap-4 text-foreground">
          <LocaleSwitcher currentLocale={locale} variant="header" />
          <MobileMenu />
          <CartIndicatorWrapper />
          <Link href="/contacto" className="text-sm font-medium hover:underline">
            {t("contact")}
          </Link>
          <AuthNavLink />
        </div>
      </div>
    </header>
  );
}
