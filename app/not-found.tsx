import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[1200px] px-6 py-16 bg-background text-center">
      <h1 className="text-5xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        La página que buscas no existe o ha sido trasladada.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-block px-6 py-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Ir al inicio
        </Link>
        <Link
          href="/pueblos"
          className="inline-block px-6 py-3 text-sm font-medium rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
        >
          Ver todos los pueblos
        </Link>
      </div>
    </main>
  );
}
