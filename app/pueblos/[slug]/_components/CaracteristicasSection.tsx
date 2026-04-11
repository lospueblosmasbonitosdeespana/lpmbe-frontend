import { TagIcon } from "@/lib/tag-icon-map";

type Caracteristica = {
  id: number;
  nivel: string | null;
  siglo: string | null;
  visitable: boolean | null;
  cantidad: number | null;
  tag: {
    tag: string;
    categoria: string;
    nombre_i18n: Record<string, string>;
    icono: string;
    color: string;
  };
};

const SECTION_TITLES: Record<string, string> = {
  es: "Qué encontrarás aquí",
  en: "What you'll find here",
  fr: "Ce que vous trouverez ici",
  de: "Was Sie hier finden",
  pt: "O que vai encontrar aqui",
  it: "Cosa troverai qui",
  ca: "Què trobaràs aquí",
};

const VISITABLE_LABELS: Record<string, string> = {
  es: "Visitable",
  en: "Open to visitors",
  fr: "Visitable",
  de: "Besuchbar",
  pt: "Visitável",
  it: "Visitabile",
  ca: "Visitable",
};

export function CaracteristicasSection({
  items,
  locale,
}: {
  items: Caracteristica[];
  locale: string;
}) {
  if (items.length === 0) return null;

  const title = SECTION_TITLES[locale] ?? SECTION_TITLES.es;
  const visitableLabel = VISITABLE_LABELS[locale] ?? VISITABLE_LABELS.es;

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h2 className="font-serif text-xl font-bold text-[#3d2c1e] dark:text-neutral-100 mb-5">
        {title}
      </h2>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => {
          const nombre = c.tag.nombre_i18n?.[locale] ?? c.tag.nombre_i18n?.es ?? c.tag.tag;
          const extras: string[] = [];
          if (c.cantidad && c.cantidad > 1) extras.push(`×${c.cantidad}`);
          if (c.nivel) extras.push(c.nivel.replace(/_/g, " ").toLowerCase());
          if (c.siglo) extras.push(c.siglo);
          if (c.visitable) extras.push(visitableLabel);

          return (
            <div
              key={c.id}
              className="flex items-start gap-2.5 rounded-xl border border-[#e2d5cb] bg-white px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${c.tag.color}18` }}
              >
                <TagIcon name={c.tag.icono} color={c.tag.color} size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#3d2c1e] leading-tight dark:text-neutral-100">
                  {nombre}
                </p>
                {extras.length > 0 && (
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {extras.join(" · ")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
