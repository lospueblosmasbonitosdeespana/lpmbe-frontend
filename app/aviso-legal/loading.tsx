export default function AvisoLegalLoading() {
  return (
    <main className="min-h-[50vh]">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-48 rounded bg-muted" />
          <div className="h-6 w-full max-w-2xl rounded bg-muted" />
          <div className="space-y-4">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 max-w-sm rounded bg-muted" />
          </div>
        </div>
      </div>
    </main>
  );
}
