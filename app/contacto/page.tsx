import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import BackButton from '@/app/c/[slug]/BackButton';
import ShareButton from '@/app/components/ShareButton';
import ContactForm from './ContactForm';
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  type SupportedLocale,
} from '@/lib/seo';

export const revalidate = 60;
const CONTACTO_EMAIL = 'asociacion@lospueblosmasbonitosdeespana.org';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations('seo');
  const path = '/contacto';
  const title = seoTitle(t('contactTitle'));
  const description = t('contactDescription');
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

export default async function ContactoPage() {
  const t = await getTranslations('contact');
  return (
    <main className="px-5 py-10 md:py-[40px]">
      <article>
        <div className="max-w-[720px] mx-auto px-5">
          <header className="mb-10">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold leading-tight m-0 text-foreground flex-1 min-w-0">
                {t('title')}
              </h1>
              <ShareButton url="/contacto" title={t('title')} variant="button" />
            </div>
          </header>

          <div className="space-y-8 text-base leading-relaxed text-foreground">
            <p className="text-muted-foreground">
              {t('intro')}
            </p>

            <section className="rounded-xl border border-border bg-muted/20 p-6 space-y-4">
              <h2 className="text-xl font-semibold m-0">{t('contactData')}</h2>
              <ul className="list-none p-0 m-0 space-y-2">
                <li>
                  <strong className="text-foreground">{t('email')}:</strong>{' '}
                  <a href={`mailto:${CONTACTO_EMAIL}`} className="text-primary hover:underline">
                    {CONTACTO_EMAIL}
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">{t('phone')}:</strong>{' '}
                  <a href="tel:+34937133366" className="text-primary hover:underline">
                    937 133 366
                  </a>
                </li>
                <li>
                  <strong className="text-foreground">{t('address')}:</strong>{' '}
                  Calle Romani, 21. 08213 Polinya (Barcelona)
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 m-0">{t('sendMessage')}</h2>
              <ContactForm defaultEmail={CONTACTO_EMAIL} />
            </section>
          </div>

          <div className="mt-14 pt-6 border-t border-border">
            <BackButton label={t('back')} />
          </div>
        </div>
      </article>
    </main>
  );
}
