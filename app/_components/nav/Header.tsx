import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import AuthNavLink from "./AuthNavLink";
import CartIndicatorWrapper from "../tienda/CartIndicatorWrapper";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { headers } from "next/headers";
import { getApiUrl } from "@/lib/api";
import { getNavConfig } from "./nav.config";

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

async function fetchCampaignVisibility(): Promise<{ showNocheRomantica: boolean; showSemanaSanta: boolean }> {
  const apiBase = getApiUrl();
  try {
    const [nrRes, ssRes] = await Promise.all([
      fetch(`${apiBase}/noche-romantica/config`, { cache: "no-store" }),
      fetch(`${apiBase}/semana-santa/config`, { cache: "no-store" }),
    ]);

    const [nrConfig, ssConfig] = await Promise.all([
      nrRes.ok ? nrRes.json() : null,
      ssRes.ok ? ssRes.json() : null,
    ]);

    return {
      showNocheRomantica: !!nrConfig?.activo,
      showSemanaSanta: !!ssConfig?.activo,
    };
  } catch {
    return {
      showNocheRomantica: true,
      showSemanaSanta: false,
    };
  }
}

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations("nav");
  const settings = await fetchSiteSettings();
  const campaignVisibility = await fetchCampaignVisibility();
  const navItems = getNavConfig(campaignVisibility);

  // Determinar qué mostrar según activeLogo
  // En dark mode usamos el mismo logo blanco que el footer (logoVariantUrl) si existe
  let logoContent: React.ReactNode;

  const logoClassName = "h-16 md:h-[96px] w-auto object-contain shrink-0";

  if (settings.activeLogo === 'text') {
    logoContent = (
      <span className="text-base font-semibold">{settings.brandName}</span>
    );
  } else if (settings.activeLogo === 'variant' && settings.logoVariantUrl) {
    logoContent = (
      <img
        src={settings.logoVariantUrl}
        alt={settings.logoAlt}
        className={logoClassName}
      />
    );
  } else if (settings.activeLogo === 'default' && settings.logoUrl) {
    if (settings.logoVariantUrl) {
      logoContent = (
        <>
          <img
            src={settings.logoUrl}
            alt={settings.logoAlt}
            className={`${logoClassName} dark:hidden`}
          />
          <img
            src={settings.logoVariantUrl}
            alt={settings.logoAlt}
            className={`${logoClassName} hidden dark:block`}
          />
        </>
      );
    } else {
      logoContent = (
        <img
          src={settings.logoUrl}
          alt={settings.logoAlt}
          className={logoClassName}
        />
      );
    }
  } else {
    logoContent = (
      <span className="text-base font-semibold">{settings.brandName}</span>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm dark:bg-card dark:border-b dark:border-border dark:shadow-none">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-5">
        <Link href="/" className="block flex-shrink-0 text-foreground dark:text-white" aria-label="Inicio">
          {logoContent}
          <span className="sr-only">Los Pueblos Más Bonitos de España - Inicio</span>
        </Link>

        <div className="hidden md:block">
          <MegaMenu items={navItems} />
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-foreground">
          <LocaleSwitcher currentLocale={locale} variant="header" />
          <MobileMenu items={navItems} />
          <CartIndicatorWrapper />
          <Link href="/contacto" className="hidden md:inline text-sm font-medium hover:underline">
            {t("contact")}
          </Link>
          <div className="hidden md:inline">
            <AuthNavLink />
          </div>
        </div>
      </div>
    </header>
  );
}
