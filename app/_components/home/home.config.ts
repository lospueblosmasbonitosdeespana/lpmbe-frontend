export const homeConfig = {
  hero: {
    title: "Los Pueblos Más Bonitos de España",
    subtitle: "Descubre, planifica y explora.",
    slides: [
      { image: "/hero/1.jpg", alt: "Slide 1", hidden: false },
      { image: "/hero/2.jpg", alt: "Slide 2", hidden: false },
      { image: "/hero/3.jpg", alt: "Slide 3", hidden: false },
    ],
    intervalMs: 6000,
  },
  notificaciones: {
    title: "Centro de notificaciones",
    tabs: [
      { key: "NACIONAL", label: "Noticias" },
      { key: "SEMAFORO", label: "Semáforos" },
      { key: "ALERTA", label: "Alertas" },
      { key: "METEO", label: "Meteo" },
    ] as const,
    limit: 5,
    allHref: "/notificaciones",
  },
  themes: [
    {
      key: "gastronomia",
      title: "Gastronomía",
      // ✅ Estas imágenes se gestionan desde el panel de admin (HomeConfigForm)
      // Temporalmente usar placeholder hasta que se configure desde admin
      image: "/themes/gastronomia.jpg",
      href: "/pueblos?tema=gastronomia",
    },
    {
      key: "naturaleza",
      title: "Naturaleza",
      image: "/themes/naturaleza.jpg",
      href: "/pueblos?tema=naturaleza",
    },
    {
      key: "patrimonio",
      title: "Patrimonio",
      image: "/themes/patrimonio.jpg",
      href: "/pueblos?tema=patrimonio",
    },
    {
      key: "familia",
      title: "En familia",
      image: "/themes/familia.jpg",
      href: "/pueblos?tema=familia",
    },
  ],
} as const;

