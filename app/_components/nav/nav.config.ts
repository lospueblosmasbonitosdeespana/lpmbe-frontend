export type NavLink = {
  labelKey: string;
  href: string;
};

export type NavColumn = {
  titleKey: string;
  links: NavLink[];
};

export type NavItem =
  | {
      type: "link";
      labelKey: string;
      labelNs: "nav";
      href: string;
    }
  | {
      type: "mega";
      labelKey: string;
      labelNs: "tabs" | "nav";
      columns: NavColumn[];
    };

export const navConfig: NavItem[] = [
  {
    type: "mega",
    labelKey: "pueblos",
    labelNs: "tabs",
    columns: [
      {
        titleKey: "explore",
        links: [
          { labelKey: "seeAll", href: "/pueblos" },
          { labelKey: "interactiveMap", href: "/mapa" },
        ],
      },
      {
        titleKey: "byTerritory",
        links: [
          { labelKey: "byCommunity", href: "/pueblos/comunidades" },
          { labelKey: "byProvince", href: "/pueblos/provincias" },
        ],
      },
      {
        titleKey: "popular",
        links: [
          { labelKey: "createRoute", href: "/planifica/crea-mi-ruta" },
          { labelKey: "certificationsByYear", href: "/pueblos/ultimas-incorporaciones" },
        ],
      },
    ],
  },
  {
    type: "mega",
    labelKey: "multiexperiencias",
    labelNs: "tabs",
    columns: [
      {
        titleKey: "travelIdeas",
        links: [
          { labelKey: "multiexperiencias", href: "/multiexperiencias" },
          { labelKey: "rutas", href: "/rutas" },
          { labelKey: "recursosTuristicos", href: "/recursos" },
        ],
      },
      {
        titleKey: "thematics",
        links: [
          { labelKey: "gastronomia", href: "/experiencias/gastronomia" },
          { labelKey: "nature", href: "/experiencias/naturaleza" },
          { labelKey: "culture", href: "/experiencias/cultura" },
          { labelKey: "family", href: "/experiencias/en-familia" },
          { labelKey: "petfriendly", href: "/experiencias/petfriendly" },
        ],
      },
      {
        titleKey: "planifica",
        links: [
          { labelKey: "createRoute", href: "/planifica/crea-mi-ruta" },
          { labelKey: "misRutas", href: "/planifica/mis-rutas" },
          { labelKey: "weekend", href: "/planifica/fin-de-semana" },
          { labelKey: "pirineos", href: "/rutas/mas-bonitos-de-los-pirineos" },
          { labelKey: "nocheRomantica", href: "/noche-romantica" },
        ],
      },
    ],
  },
  {
    type: "mega",
    labelKey: "actualidad",
    labelNs: "nav",
    columns: [
      {
        titleKey: "notifCenter",
        links: [
          { labelKey: "viewNotifs", href: "/notificaciones" },
          { labelKey: "semaforoChanges", href: "/notificaciones?tipo=SEMAFORO" },
          { labelKey: "alertas", href: "/notificaciones?tipo=ALERTA" },
          { labelKey: "meteo", href: "/meteo" },
        ],
      },
      {
        titleKey: "content",
        links: [
          { labelKey: "noticias", href: "/noticias" },
          { labelKey: "agenda", href: "/agenda" },
          { labelKey: "articulos", href: "/articulos" },
        ],
      },
    ],
  },
  {
    type: "mega",
    labelKey: "elSello",
    labelNs: "nav",
    columns: [
      {
        titleKey: "elSello",
        links: [
          { labelKey: "elSello", href: "/el-sello" },
          { labelKey: "howToGet", href: "/el-sello/como-se-obtiene" },
          { labelKey: "whoWeAre", href: "/el-sello/quienes-somos" },
          { labelKey: "socios", href: "/el-sello/socios" },
          { labelKey: "selloWorld", href: "/el-sello/internacional" },
          { labelKey: "unete", href: "/el-sello/unete" },
        ],
      },
    ],
  },
  {
    type: "link",
    labelKey: "tienda",
    labelNs: "nav",
    href: "/tienda",
  },
];
