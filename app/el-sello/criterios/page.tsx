import Link from 'next/link';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import {
  Display,
  Lead,
  Headline,
  Body,
  Title,
} from '@/app/components/ui/typography';

export const dynamic = 'force-dynamic';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getCartaCalidad(): Promise<{ titulo: string; url: string } | null> {
  try {
    const res = await fetch(
      `${API_BASE}/public/cms/documentos?type=CARTA_CALIDAD`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const doc = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return doc ? { titulo: doc.titulo, url: doc.url } : null;
  } catch {
    return null;
  }
}

function CriteriaCard({
  icon,
  title,
  description,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <Title as="h3" className="mb-2">
        {title}
      </Title>
      <Body size="sm" className="mb-4 text-muted-foreground">
        {description}
      </Body>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const CRITERIA = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Requisitos de admisión',
    description: 'Criterios obligatorios que todo municipio debe cumplir.',
    items: [
      'Población máxima de 15.000 habitantes (hasta +10% bajo validación de la Comisión de Calidad). Criterio eliminatorio.',
      'Patrimonio arquitectónico o natural certificado por documento en poder del ayuntamiento.',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
      </svg>
    ),
    title: 'Calidad urbanística',
    description: 'Coherencia y accesibilidad del tejido urbano.',
    items: [
      'Calidad del acceso al pueblo',
      'Homogeneidad y dimensión de la masa construida',
      'Diversidad de rutas',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M12 2L2 7h20L12 2z" />
        <path d="M2 17h20" />
      </svg>
    ),
    title: 'Calidad arquitectónica',
    description: 'Armonía y conservación del patrimonio edificado.',
    items: [
      'Armonía de edificios, materiales, fachadas y tejados',
      'Homogeneidad de ventanas, puertas y colores',
      'Presencia de elementos decorativos simbólicos',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Valorización',
    description: 'Política activa de mejora y cuidado del patrimonio.',
    items: [
      'Cerrado a coches en casco antiguo (permanente o temporal)',
      'Aparcamiento organizado y tratamiento de líneas aéreas',
      'Renovación de fachadas, iluminación y espacios públicos',
      'Cuidado de zonas verdes y flores',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Desarrollo y promoción',
    description: 'Infraestructura turística y oferta de servicios.',
    items: [
      'Conocimiento del número de turistas',
      'Oferta de alojamiento, restauración y actividades',
      'Punto de información, visitas guiadas y señalización',
      'Guías o documentos promocionales',
    ],
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      </svg>
    ),
    title: 'Animación',
    description: 'Vida cultural y eventos que dinamizan el pueblo.',
    items: [
      'Espacios para actos festivos (cubiertos o al aire libre)',
      'Organización de eventos originales y de calidad',
      'Manifestaciones permanentes o temporales',
    ],
  },
];

export default async function CriteriosPage() {
  const cartaDoc = await getCartaCalidad();

  return (
    <main>
      <Section spacing="md" background="default">
        <Container>
          <nav className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                  Inicio
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li>
                <Link href="/el-sello" className="text-muted-foreground transition-colors hover:text-foreground">
                  El sello
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li>
                <Link href="/el-sello/como-se-obtiene" className="text-muted-foreground transition-colors hover:text-foreground">
                  ¿Cómo se obtiene?
                </Link>
              </li>
              <li><span className="text-muted-foreground/50">/</span></li>
              <li><span className="font-medium text-foreground">Criterios</span></li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-12 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-medium uppercase tracking-widest text-primary">
                Qué valoramos
              </span>
            </div>

            <Display className="mb-2 text-balance">Criterios de evaluación</Display>

            <Lead className="mb-8 max-w-3xl text-muted-foreground">
              Resumen de los criterios recogidos en nuestra{' '}
              <strong className="text-foreground">Carta de Calidad</strong>. Todo
              municipio candidato debe satisfacer estos requisitos para obtener
              el sello de Los Pueblos Más Bonitos de España.
            </Lead>
          </div>
        </Container>
      </Section>

      <Section spacing="md" background="muted">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CRITERIA.map((c, i) => (
              <CriteriaCard key={i} {...c} />
            ))}
          </div>
        </Container>
      </Section>

      <Section spacing="md" background="default">
        <Container size="md">
          <div className="rounded-xl border border-border bg-card p-8">
            <Headline as="h3" className="mb-4">
              La Carta de Calidad
            </Headline>
            <Body className="mb-4 text-muted-foreground">
              Todos los criterios detallados, el procedimiento de instrucción, los
              modos de utilización de la marca y las obligaciones de los pueblos
              miembros están recogidos en la{' '}
              <strong className="text-foreground">Carta de Calidad</strong>, el
              documento oficial que rige la asociación.
            </Body>
            <div className="flex flex-wrap gap-4">
              {cartaDoc ? (
                <a
                  href={cartaDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  {cartaDoc.titulo}
                </a>
              ) : (
                <Link
                  href="/el-sello#documentacion"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Ver documentación
                </Link>
              )}
              <Link
                href="/el-sello/proceso"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 font-medium transition-colors hover:bg-muted"
              >
                Ver proceso de selección
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
