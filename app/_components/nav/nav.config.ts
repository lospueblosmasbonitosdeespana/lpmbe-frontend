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
          { label: "Mapa interactivo", href: "/mapa" },
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
          { label: "Multiexperiencias", href: "/experiencias" },
          { label: "Rutas", href: "/rutas" },
        ],
      },
      {
        title: "Temáticas",
        links: [
          { label: "Gastronomía", href: "/pueblos?tema=gastronomia" },
          { label: "Naturaleza", href: "/pueblos?tema=naturaleza" },
          { label: "Cultura", href: "/pueblos?tema=cultura" },
          { label: "En familia", href: "/pueblos?tema=familia" },
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
        ],
      },
      {
        title: "Contenido",
        links: [
          { label: "Noticias", href: "/noticias" },
          { label: "Agenda", href: "/agenda" },
        ],
      },
    ],
  },
  {
    type: "link",
    label: "El sello",
    href: "/el-sello",
  },
];

