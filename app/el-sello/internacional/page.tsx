import Link from "next/link";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import {
  Display,
  Headline,
  Lead,
  Title,
  Body,
} from "@/app/components/ui/typography";
import type { SelloPage } from "@/lib/cms/sello";

export const dynamic = "force-dynamic";

/* ===== ICONS ===== */
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}

const countries = [
  { flag: "🇫🇷", country: "Francia", associationName: "Les Plus Beaux Villages de France", description: "Desde 1982. La asociación pionera que dio origen a la red mundial.", websiteUrl: "https://www.les-plus-beaux-villages-de-france.org" },
  { flag: "🇧🇪", country: "Valonia (Bélgica)", associationName: "Les Plus Beaux Villages de Wallonie", description: "Desde 1994. Los pueblos con más encanto de la región francófona belga.", websiteUrl: "https://www.beauxvillages.be" },
  { flag: "🇮🇹", country: "Italia", associationName: "I Borghi più belli d'Italia", description: "Desde 2001. Una de las redes más extensas con cientos de pueblos certificados.", websiteUrl: "https://borghipiubelliditalia.it" },
  { flag: "🇯🇵", country: "Japón", associationName: "The Most Beautiful Villages in Japan", description: "Desde 2005. La extensión de la red en Asia.", websiteUrl: "https://utsukushii-mura.jp" },
  { flag: "🇪🇸", country: "España", associationName: "Los Pueblos Más Bonitos de España", description: "Formamos parte de la red desde nuestros inicios.", websiteUrl: "https://www.lospueblosmasbonitos.org" },
  { flag: "🇨🇦", country: "Canadá (Quebec)", associationName: "Les Plus Beaux Villages du Québec", description: "Desde 1998. Los pueblos más bonitos de la provincia canadiense.", websiteUrl: "https://www.plusbeauxvillages.ca" },
  { flag: "🇨🇭", country: "Suiza", associationName: "Les Plus Beaux Villages de Suisse", description: "Desde 2015. Municipios pintorescos de Suiza y Liechtenstein.", websiteUrl: "https://swissvillages.org/?lang=fr" },
];

const observers: { flag: string; name: string; websiteUrl?: string }[] = [
  { flag: "🇱🇧", name: "Líbano", websiteUrl: "https://www.pbvliban.org/fr/" },
  { flag: "🇷🇺", name: "Rusia", websiteUrl: "https://eng.krasaderevni.ru" },
  { flag: "🇨🇳", name: "China", websiteUrl: "http://www.zmxzchina.com/index.html" },
  { flag: "🇧🇦", name: "Bosnia-Herzegovina", websiteUrl: "https://mbv.ba/en/about-mbv-initiative/" },
  { flag: "🇩🇪", name: "Alemania", websiteUrl: "https://www.schoenste-doerfer.de" },
];

async function getPage(): Promise<SelloPage | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/public/cms/sello/SELLO_INTERNACIONAL`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function InternacionalPage() {
  const page = await getPage();
  const titulo = page?.titulo ?? "Red Internacional";
  const subtitle = page?.subtitle;

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li><Link href="/" className="text-muted-foreground transition-colors hover:text-primary">Inicio</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><Link href="/el-sello" className="text-muted-foreground transition-colors hover:text-primary">El sello</Link></li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="text-foreground">El sello en el mundo</span></li>
            </ol>
          </nav>

          <div className="mb-8 flex items-start gap-4">
            <div className="hidden rounded-xl bg-primary/10 p-3 text-primary sm:block">
              <GlobeIcon className="h-8 w-8" />
            </div>
            <div>
              <Display className="mb-2 text-balance">{titulo}</Display>
              <Lead className="text-muted-foreground">{subtitle ?? "Les plus Beaux Villages de la Terre"}</Lead>
            </div>
          </div>
        </Container>
      </Section>

      <Section spacing="sm" background="default">
        <Container>
          <div className="max-w-4xl">
            <Headline className="mb-6 text-primary">Les Plus Beaux Villages de la Terre</Headline>
            <Body size="lg" className="mb-6 text-muted-foreground">
              Formamos parte de la red internacional <strong className="text-foreground">Les Plus Beaux Villages de la Terre</strong>, que agrupa a las asociaciones nacionales de los pueblos más bonitos del mundo y promueve el intercambio de experiencias, la calidad turística y la preservación del patrimonio.
            </Body>
            <Body size="lg" className="text-muted-foreground">
              Actualmente, la red cuenta con <strong className="text-foreground">{countries.length} países miembros oficiales</strong>:
            </Body>
          </div>
        </Container>
      </Section>

      <Section spacing="md" background="default">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {countries.map((c, i) => (
              <article key={i} className="group relative h-full overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">{c.flag}</span>
                  <Title as="h3" className="text-lg">{c.country}</Title>
                </div>
                <div className="mb-4">
                  <span className="font-semibold text-foreground">{c.associationName}</span>
                  <span className="text-muted-foreground"> — {c.description}</span>
                </div>
                <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                  Web oficial
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="lg" background="muted">
        <Container>
          <div className="max-w-4xl">
            <Headline className="mb-6">Países observadores</Headline>
            <Body size="lg" className="mb-8 text-muted-foreground">
              Además, varios países participan como <strong className="text-foreground">miembros observadores</strong>, en proceso de incorporación a la red:
            </Body>
            <ul className="space-y-3">
              {observers.map((o, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-lg shadow-sm">{o.flag}</span>
                  <span className="font-medium">{o.name}</span>
                  {o.websiteUrl && (
                    <a href={o.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80">
                      Web oficial
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>
    </main>
  );
}
