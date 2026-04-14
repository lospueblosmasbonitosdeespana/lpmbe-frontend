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

type CampaignNavOptions = {
  showNocheRomantica: boolean;
  showSemanaSanta: boolean;
  showNavidad: boolean;
};

export function getNavConfig(options?: Partial<CampaignNavOptions>): NavItem[] {
  const settings: CampaignNavOptions = {
    showNocheRomantica: options?.showNocheRomantica ?? true,
    showSemanaSanta: options?.showSemanaSanta ?? true,
    showNavidad: options?.showNavidad ?? false,
  };

  const planificaLinks: NavLink[] = [
    { labelKey: "createRoute", href: "/planifica/crea-mi-ruta" },
    { labelKey: "weekend", href: "/planifica/fin-de-semana" },
    ...(settings.showSemanaSanta ? [{ labelKey: "semanaSanta", href: "/planifica/semana-santa" }] : []),
    ...(settings.showNavidad ? [{ labelKey: "navidad", href: "/planifica/navidad" }] : []),
    { labelKey: "pirineos", href: "/rutas/mas-bonitos-de-los-pirineos" },
    ...(settings.showNocheRomantica ? [{ labelKey: "nocheRomantica", href: "/noche-romantica" }] : []),
  ];

  return [
  {
    type: "mega",
    labelKey: "pueblos",
    labelNs: "tabs",
    columns: [
      {
        titleKey: "explore",
        links: [
          { labelKey: "seeAll", href: "/pueblos" },
          { labelKey: "explorar", href: "/explorar" },
          { labelKey: "interactiveMap", href: "/mapa" },
          { labelKey: "webcams", href: "/webcams" },
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
          { labelKey: "descubreCollections", href: "/descubre" },
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
          { labelKey: "appPage", href: "/app" },
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
          { labelKey: "patrimonio", href: "/experiencias/patrimonio" },
        ],
      },
      {
        titleKey: "planifica",
        links: planificaLinks,
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
          { labelKey: "alertas", href: "/alertas" },
          { labelKey: "meteo", href: "/meteo" },
        ],
      },
      {
        titleKey: "content",
        links: [
          { labelKey: "noticias", href: "/noticias" },
          { labelKey: "eventos", href: "/eventos" },
          { labelKey: "articulos", href: "/articulos" },
          { labelKey: "prensa", href: "/prensa" },
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
}

export const navConfig: NavItem[] = getNavConfig();
