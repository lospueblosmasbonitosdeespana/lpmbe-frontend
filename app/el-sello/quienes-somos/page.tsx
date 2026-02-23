import Link from 'next/link';
import SafeHtml from '@/app/_components/ui/SafeHtml';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import {
  Display,
  Lead,
  Headline,
  Body,
} from '@/app/components/ui/typography';
import { CONTENIDO_QUIENES_SOMOS } from '@/lib/cms/sello-content';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getPageContent(): Promise<{ titulo?: string; subtitle?: string; contenido?: string } | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/sello/SELLO_QUIENES_SOMOS`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function QuienesSomosPage() {
  const t = await getTranslations('sello');
  const page = await getPageContent();
  const titulo = page?.titulo ?? t('aboutTitle');
  const subtitle = page?.subtitle ?? t('aboutEyebrow');
  const raw = page?.contenido?.trim() ?? '';
  // Usar contenido del CMS si tiene contenido real (no placeholder mínimo)
  const isMinimalContent = raw.length < 200 || raw.startsWith('# ');
  const contenido = raw && !isMinimalContent ? raw : CONTENIDO_QUIENES_SOMOS;

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('breadcrumbHome')}
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">/</span>
              </li>
              <li>
                <Link
                  href="/el-sello"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('breadcrumbSello')}
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">/</span>
              </li>
              <li>
                <span className="text-foreground">{t('breadcrumbWhoWeAre')}</span>
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-medium uppercase tracking-widest text-primary">
                {subtitle}
              </span>
            </div>

            <Display className="mb-6">{titulo}</Display>

            <Lead className="text-muted-foreground dark:text-foreground/90">
              {t('whoLead')}
            </Lead>
          </div>
        </Container>
      </Section>

      <Section spacing="lg" background="default">
        <Container>
          <div className="prose prose-gray dark:prose-invert prose-lg max-w-none text-foreground [&_p]:text-foreground/90 [&_li]:text-foreground/90 prose-headings:font-serif prose-headings:tracking-tight prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            <SafeHtml html={contenido} />
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section spacing="md" background="muted">
        <Container size="md">
          <div className="flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="h-8 w-8 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1">
              <Headline as="h3" className="mb-2">
                {t('whoCtaTitle')}
              </Headline>
              <Body size="sm" className="text-muted-foreground dark:text-foreground/90">
                {t('whoCtaBody')}
              </Body>
            </div>
            <Link
              href="/el-sello/unete"
              className="shrink-0 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('requestInfo')}
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
