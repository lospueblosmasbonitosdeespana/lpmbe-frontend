import SelloCmsPage from '@/app/_components/ui/SelloCmsPage';
import type { SelloPage } from '@/lib/cms/sello';

export const dynamic = 'force-dynamic';

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_SOCIOS`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function SociosPage() {
  const page = await getPage();

  const titulo = page?.titulo ?? 'Socios y colaboradores';
  const subtitle = page?.subtitle;
  const heroUrl = page?.heroUrl;
  const contenido = page?.contenido ?? '';

  return (
    <SelloCmsPage
      titulo={titulo}
      subtitle={subtitle}
      heroUrl={heroUrl}
      contenido={contenido}
      breadcrumbs={[
        { label: 'El sello', href: '/el-sello' },
        { label: 'Socios' },
      ]}
    />
  );
}
