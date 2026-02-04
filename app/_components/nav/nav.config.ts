export type NavLink = {
  label: string;
  href: string;
};

export type NavColumn = {
  title: string;
  links: NavLink[];
};

export type NavItem =
  | {
      type: "link";
      label: string;
      href: string;
    }
  | {
      type: "mega";
      label: string;
      columns: NavColumn[];
    };

export const navConfig: NavItem[] = [
  {
    type: "mega",
    label: "Pueblos",
    columns: [
      {
        title: "Explorar",
        links: [
          { label: "Ver todos", href: "/pueblos" },
          { label: "Mapa interactivo", href: "https://maps.lospueblosmasbonitosdeespana.org/es/pueblos" },
        ],
      },
      {
        title: "Por territorio",
        links: [
          { label: "Por comunidad", href: "/pueblos/comunidades" },
          { label: "Por provincia", href: "/pueblos/provincias" },
        ],
      },
      {
        title: "Popular",
        links: [
          { label: "Destacados", href: "/pueblos?filtro=destacados" },
          { label: "Últimas incorporaciones", href: "/pueblos?filtro=nuevos" },
        ],
      },
    ],
  },
  {
    type: "mega",
    label: "Experiencias",
    columns: [
      {
        title: "Ideas de viaje",
        links: [
          { label: "Multiexperiencias", href: "/multiexperiencias" },
          { label: "Rutas", href: "/rutas" },
        ],
      },
      {
        title: "Temáticas",
        links: [
          { label: "Gastronomía", href: "/experiencias/gastronomia" },
          { label: "Naturaleza", href: "/experiencias/naturaleza" },
          { label: "Cultura", href: "/experiencias/cultura" },
          { label: "En familia", href: "/experiencias/en-familia" },
          { label: "Petfriendly", href: "/experiencias/petfriendly" },
        ],
      },
      {
        title: "Planifica",
        links: [
          { label: "Fin de semana", href: "/pueblos?tema=findesemana" },
          { label: "Escapadas", href: "/pueblos?tema=escapadas" },
        ],
      },
    ],
  },
  {
    type: "mega",
    label: "Actualidad",
    columns: [
      {
        title: "Centro de notificaciones",
        links: [
          { label: "Ver notificaciones", href: "/notificaciones" },
          { label: "Cambios de semáforo", href: "/notificaciones?tipo=SEMAFORO" },
          { label: "Alertas", href: "/notificaciones?tipo=ALERTA" },
          { label: "Meteo", href: "/meteo" },
        ],
      },
      {
        title: "Contenido",
        links: [
          { label: "Noticias", href: "/noticias" },
          { label: "Agenda", href: "/agenda" },
          { label: "Artículos", href: "/articulos" },
        ],
      },
    ],
  },
  {
    type: "mega",
    label: "El sello",
    columns: [
      {
        title: "El sello",
        links: [
          { label: "El Sello", href: "/el-sello" },
          { label: "¿Cómo se obtiene el sello?", href: "/el-sello/como-se-obtiene" },
          { label: "Quiénes somos", href: "/el-sello/quienes-somos" },
          { label: "Socios", href: "/el-sello/socios" },
          { label: "El sello en el mundo", href: "/el-sello/internacional" },
          { label: "Únete", href: "/el-sello/unete" },
        ],
      },
    ],
  },
  {
    type: "link",
    label: "Tienda",
    href: "/tienda",
  },
];

