import SafeHtml from './SafeHtml';
import Breadcrumbs from './Breadcrumbs';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type SelloCmsPageProps = {
  titulo: string;
  subtitle?: string | null;
  heroUrl?: string | null;
  contenido: string;
  breadcrumbs: BreadcrumbItem[];
  children?: React.ReactNode;
};

export default function SelloCmsPage({
  titulo,
  subtitle,
  heroUrl,
  contenido,
  breadcrumbs,
  children,
}: SelloCmsPageProps) {
  return (
    <main className="font-sans mx-auto max-w-5xl px-6 py-12">
      <Breadcrumbs items={breadcrumbs} />

      {heroUrl && heroUrl.trim() && (
        <div className="mb-8 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroUrl.trim()}
            alt={titulo}
            className="w-full h-auto max-h-96 object-cover"
          />
        </div>
      )}

      <h1 className="font-display text-4xl font-semibold mb-6">{titulo}</h1>

      {subtitle && (
        <p className="font-sans text-xl text-gray-600 mb-8">{subtitle}</p>
      )}

      {contenido && (
        <div className="mb-12">
          <SafeHtml html={contenido} />
        </div>
      )}

      {children}
    </main>
  );
}
