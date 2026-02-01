export type CcaaConfig = {
  slug: string;
  name: string;
  flagSrc?: string; // Murcia sin bandera por ahora
};

export const CCAA: CcaaConfig[] = [
  { slug: "andalucia", name: "Andalucía", flagSrc: "/ccaa/Flag_of_Andalucia.png" },
  { slug: "aragon", name: "Aragón", flagSrc: "/ccaa/Bandera_Aragon_escudo.png" },
  { slug: "asturias", name: "Principado de Asturias", flagSrc: "/ccaa/Flag_of_Asturias.png" },
  { slug: "illes-balears", name: "Illes Balears", flagSrc: "/ccaa/Flag_of_the_Balearic_Islands.png" },
  { slug: "canarias", name: "Canarias", flagSrc: "/ccaa/Flag_of_the_Canary_Islands.png" },
  { slug: "cantabria", name: "Cantabria", flagSrc: "/ccaa/Flag_of_Cantabria.png" },
  { slug: "castilla-la-mancha", name: "Castilla-La Mancha", flagSrc: "/ccaa/Flag_of_Castile-La_Mancha.png" },
  { slug: "castilla-y-leon", name: "Castilla y León", flagSrc: "/ccaa/Flag_of_Castile_and_Leon.png" },
  { slug: "cataluna", name: "Cataluña", flagSrc: "/ccaa/Flag_of_Catalonia.png" },
  { slug: "comunidad-valenciana", name: "Comunidad Valenciana", flagSrc: "/ccaa/Flag_of_Valencian_Community.png" },
  {
    slug: "extremadura",
    name: "Extremadura",
    flagSrc: "/ccaa/Flag_of_Extremadura__Spain__with_coat_of_arms_.png",
  },
  { slug: "galicia", name: "Galicia", flagSrc: "/ccaa/Flag_of_Galicia.png" },
  { slug: "la-rioja", name: "La Rioja", flagSrc: "/ccaa/Flag_of_La_Rioja.png" },
  { slug: "madrid", name: "Comunidad de Madrid", flagSrc: "/ccaa/Flag_of_the_Community_of_Madrid.png" },
  { slug: "navarra", name: "Comunidad Foral de Navarra", flagSrc: "/ccaa/Bandera_de_Navarra.png" },
  { slug: "pais-vasco", name: "País Vasco", flagSrc: "/ccaa/Flag_of_the_Basque_Country.png" },

  // Murcia entra aunque esté vacía
  { slug: "murcia", name: "Región de Murcia", flagSrc: "/ccaa/Flag_of_the_Region_of_Murcia.svg" },
];

export function findCcaaBySlug(slug: string) {
  return CCAA.find((c) => c.slug === slug);
}

export function norm(s: string) {
  return s.trim().toLowerCase();
}

