import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import Breadcrumbs from "@/app/_components/ui/Breadcrumbs";
import { Section } from "@/app/components/ui/section";
import { Container } from "@/app/components/ui/container";
import { Display, Lead } from "@/app/components/ui/typography";

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string | null;
  comunidad?: string | null;
};

async function getPueblos(): Promise<Pueblo[]> {
  const res = await fetch(`${getApiUrl()}/pueblos`, { next: { revalidate: 300 } });
  if (!res.ok) return [];
  return res.json();
}

function normalize(s: string) {
  return s.trim();
}

export default async function ProvinciasPage() {
  const pueblos = await getPueblos();

  const provincias = Array.from(
    new Set(
      pueblos
        .map((p) => p.provincia)
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .map(normalize)
    )
  ).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <main>
      <Section spacing="none" background="default">
        <Container className="pt-4">
          <Breadcrumbs items={[{ label: "Pueblos", href: "/pueblos" }, { label: "Por provincia" }]} />
        </Container>
      </Section>

      <Section spacing="none" background="default">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted via-muted/50 to-background" />
          <Container className="relative">
            <div className="flex flex-col items-center pb-12 pt-8 text-center lg:pb-16 lg:pt-12">
              <Display className="mb-4">Por provincia</Display>
              <Lead className="mb-10 max-w-2xl text-muted-foreground">
                Elige una provincia para ver sus pueblos.
              </Lead>
            </div>
          </Container>
        </div>
      </Section>

      <Section spacing="lg" background="default">
        <Container>
          {provincias.length === 0 ? (
            <p className="text-center text-muted-foreground">No hay provincias disponibles.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {provincias.map((p) => (
                <Link
                  key={p}
                  href={`/pueblos?provincia=${encodeURIComponent(p)}`}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <div>
                    <div className="font-semibold text-foreground group-hover:text-primary">{p}</div>
                    <div className="mt-1 text-sm text-muted-foreground">Ver pueblos</div>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </main>
  );
}

