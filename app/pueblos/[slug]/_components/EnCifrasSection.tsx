type Highlight = {
  orden: number;
  valor: string;
  etiqueta: string;
};

type Props = {
  highlights: Highlight[];
};

export default function EnCifrasSection({ highlights }: Props) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <section
      className="py-12"
      style={{ backgroundColor: "var(--color-bg-section)" }}
    >
      <div className="mx-auto max-w-4xl px-4">
        <p className="text-sm font-medium uppercase tracking-wider text-amber-700/90">
          En cifras
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-gray-900 md:text-3xl">
          Patrimonio y Tradición
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-6 md:gap-8">
          {highlights.slice(0, 4).map((h) => (
            <div
              key={h.orden}
              className="rounded-lg bg-white/80 p-4 shadow-sm"
            >
              <p className="text-2xl font-bold text-gray-900 md:text-3xl">
                {h.valor}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                {h.etiqueta}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
