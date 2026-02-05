export default function ContactoLoading() {
  return (
    <main className="min-h-[50vh]">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 rounded bg-muted" />
          <div className="h-6 w-full max-w-xl rounded bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
