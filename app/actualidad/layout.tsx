import type { Metadata } from "next";
import { getCanonicalUrl, getLocaleAlternates, SITE_NAME } from "@/lib/seo";

const TITLE = `Actualidad | ${SITE_NAME}`;
const DESCRIPTION =
  "Noticias, eventos y artículos sobre los pueblos más bonitos de España. Actualidad de la red y de nuestros pueblos.";

export async function generateMetadata(): Promise<Metadata> {
  const path = "/actualidad";
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: getCanonicalUrl(path),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: getCanonicalUrl(path),
    },
  };
}

export default function ActualidadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
