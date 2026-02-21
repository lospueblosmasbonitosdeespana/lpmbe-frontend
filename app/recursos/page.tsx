import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { Container } from "@/app/components/ui/container";
import { Section } from "@/app/components/ui/section";
import { Title, Lead, Eyebrow } from "@/app/components/ui/typography";
import { getResourceLabel } from "@/lib/resource-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Recursos turísticos | Los Pueblos Más Bonitos de España",
  description:
    "Experiencias y lugares únicos que no te puedes perder cuando hagas rutas por nuestros pueblos. Los socios del Club de Amigos disfrutan de descuentos exclusivos.",
  openGraph: {
    title: "Recursos turísticos | Los Pueblos Más Bonitos de España",
    description:
      "Experiencias y lugares únicos que no te puedes perder cuando hagas rutas por nuestros pueblos. Los socios del Club de Amigos disfrutan de descuentos exclusivos.",
  },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function excerpt(text: string | null, maxLen = 120): string {
  if (!text) return "";
  const plain = stripHtml(text);
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen - 1).trimEnd() + "…";
}

type RecursoListItem = {
  id: number;
  nombre: string;
  slug: string | null;
  tipo: string;
  scope: string;
  descripcion: string | null;
  fotoUrl: string | null;
  provincia: string | null;
  comunidad: string | null;
  descuentoPorcentaje: number | null;
  cerradoTemporal: boolean;
  pueblo?: { id: number; nombre: string; slug: string } | null;
};

async function getRecursos(): Promise<RecursoListItem[]> {
  const apiUrl = getApiUrl();
  const res = await fetch(
    `${apiUrl}/public/recursos?scope=ASOCIACION`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function RecursoCard({
  r,
  cerradoTemporalLabel,
}: {
  r: RecursoListItem;
  cerradoTemporalLabel: string;
}) {
  const photoUrl = r.fotoUrl?.trim() || null;
  const slug = r.slug || `recurso-${r.id}`;
  const provCom = [r.provincia, r.comunidad].filter(Boolean).join(", ");

  return (
    <Link
      href={`/recursos/${encodeURIComponent(slug)}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt={r.nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-10 w-10 text-primary/50"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}
        <div className="absolute right-2 top-2 flex flex-wrap gap-1">
          {r.cerradoTemporal && (
            <span className="rounded bg-amber-500/90 px-2 py-0.5 text-xs font-medium text-white">
              {cerradoTemporalLabel}
            </span>
          )}
          {r.descuentoPorcentaje != null && r.descuentoPorcentaje > 0 && (
            <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              −{r.descuentoPorcentaje}% Club
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col px-4 py-3">
        <span className="mb-1 inline-block w-fit rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {getResourceLabel(r.tipo)}
        </span>
        <h3 className="font-display text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary">
          {r.nombre}
        </h3>
        {provCom && (
          <p className="mt-1 text-sm text-muted-foreground">{provCom}</p>
        )}
        {r.descripcion && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {excerpt(r.descripcion)}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState({
  noRecursos,
  noRecursosHint,
}: {
  noRecursos: string;
  noRecursosHint: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-8 py-16 text-center">
      <p className="text-muted-foreground">{noRecursos}</p>
      <p className="mt-2 text-sm text-muted-foreground">{noRecursosHint}</p>
    </div>
  );
}

export default async function RecursosPage() {
  const t = await getTranslations("recursos");
  const recursos = await getRecursos();

  return (
    <main className="bg-background">
      <Section spacing="md">
        <Container>
          <div className="mb-8 md:mb-10">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <Title as="h1" size="2xl" className="mt-2">
              {t("title")}
            </Title>
            <Lead className="mt-4 max-w-2xl text-muted-foreground">
              {t("description")}
            </Lead>
          </div>

          {recursos.length === 0 ? (
            <EmptyState
              noRecursos={t("noRecursos")}
              noRecursosHint={t("noRecursosHint")}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recursos.map((r) => (
                <RecursoCard
                  key={r.id}
                  r={r}
                  cerradoTemporalLabel={t("cerradoTemporal")}
                />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}
