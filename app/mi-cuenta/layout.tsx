import MiCuentaBreadcrumbs from "./components/MiCuentaBreadcrumbs";
import { Container } from "@/app/components/ui/container";

export default function MiCuentaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-background py-4">
        <Container>
          <MiCuentaBreadcrumbs />
        </Container>
      </section>
      {children}
    </main>
  );
}
