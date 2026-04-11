export type TipoServicio =
  | 'LAVABO'
  | 'PARKING'
  | 'TURISMO'
  | 'PIPICAN'
  | 'CARAVANAS'
  | 'BANCO'
  | 'FARMACIA'
  | 'GASOLINERA'
  | 'SUPERMERCADO'
  | 'HOSPITAL'
  | 'TAXI'
  | 'AUTOBUS'
  | 'COCHE_ELECTRICO'
  | 'COCHE_ELECTRICO_ULTRA'
  | 'ALQUILER_BICI'
  | 'FUENTE'
  | 'POLICIA'
  | 'TREN'
  | 'PICNIC'
  | 'BANO_NATURAL'
  | 'PLAYA'
  | 'PARQUE_INFANTIL'
  | 'DESFIBRILADOR';

export interface TipoServicioConfig {
  tipo: TipoServicio;
  etiqueta: string;   // etiqueta en español (fallback y gestión)
  i18nKey: string;    // clave dentro de pueblo.serviciosVisitante.tipos.*
  color: string;      // color de fondo del marcador
  emoji: string;      // emoji de respaldo para texto
  svg: string;        // SVG inline para el marcador Leaflet
}

export const TIPOS_SERVICIO: TipoServicioConfig[] = [
  {
    tipo: 'LAVABO',
    etiqueta: 'Lavabos públicos',
    i18nKey: 'LAVABO',
    color: '#2563eb',
    emoji: '🚻',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M5.5 22v-7.5H4V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5.5H18.5V22H17v-6.5h-4V22H5.5zm-1.25-13A1.25 1.25 0 1 1 5.5 7.75 1.25 1.25 0 0 1 4.25 9zm15.5 0a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 19.75 9zM6.5 22v-6.5H5v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5h-1.5V22zM9 7a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 7zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 7z"/>
    </svg>`,
  },
  {
    tipo: 'PARKING',
    etiqueta: 'Aparcamiento',
    i18nKey: 'PARKING',
    color: '#1d4ed8',
    emoji: '🅿️',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M6 2h8a6 6 0 0 1 0 12H10v8H6V2zm4 4v4h4a2 2 0 0 0 0-4h-4z"/>
    </svg>`,
  },
  {
    tipo: 'TURISMO',
    etiqueta: 'Oficina de turismo',
    i18nKey: 'TURISMO',
    color: '#0891b2',
    emoji: 'ℹ️',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>`,
  },
  {
    tipo: 'PIPICAN',
    etiqueta: 'Pipicán',
    i18nKey: 'PIPICAN',
    color: '#16a34a',
    emoji: '🐕',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M4.5 11.5A1.5 1.5 0 0 1 6 10h1.5l1-3H15l.5 2H18a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 1-1.5 1.5H18v1a1 1 0 0 1-2 0v-1h-8v1a1 1 0 0 1-2 0v-1h-.5A1.5 1.5 0 0 1 4 13.5v-1.5A.5.5 0 0 1 4.5 11.5zM7 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    </svg>`,
  },
  {
    tipo: 'CARAVANAS',
    etiqueta: 'Área de caravanas',
    i18nKey: 'CARAVANAS',
    color: '#7c3aed',
    emoji: '🚐',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M3 13V9a2 2 0 0 1 2-2h12l3 4v3h-1.17a2.5 2.5 0 0 1-4.66 0H7.83a2.5 2.5 0 0 1-4.66 0H2v-1h1zm2.5 2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 10v2h13v-1.5L16 9H5v1z"/>
    </svg>`,
  },
  {
    tipo: 'BANCO',
    etiqueta: 'Banco / Cajero',
    i18nKey: 'BANCO',
    color: '#b45309',
    emoji: '🏦',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M2 10h20v2H2v-2zm0 4h2v4H2v-4zm4 0h2v4H6v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4zM12 2L2 8h20L12 2zm0 2.2L18.6 8H5.4L12 4.2zM2 20h20v2H2v-2z"/>
    </svg>`,
  },
  {
    tipo: 'FARMACIA',
    etiqueta: 'Farmacia',
    i18nKey: 'FARMACIA',
    color: '#16a34a',
    emoji: '💊',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M11 3v7H4v2h7v7h2v-7h7v-2h-7V3h-2z"/>
    </svg>`,
  },
  {
    tipo: 'GASOLINERA',
    etiqueta: 'Gasolinera',
    i18nKey: 'GASOLINERA',
    color: '#dc2626',
    emoji: '⛽',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M20 11V7l-2-2-1.4 1.4 1.4 1.4V11a2 2 0 0 0-2 2v5a1 1 0 0 0 2 0v-5h1v5a1 1 0 0 0 2 0v-5a2 2 0 0 0-1-1.73zM15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 7H5V5h10v5z"/>
    </svg>`,
  },
  {
    tipo: 'SUPERMERCADO',
    etiqueta: 'Supermercado',
    i18nKey: 'SUPERMERCADO',
    color: '#ea580c',
    emoji: '🛒',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.83 6l-.94-2H1V2h5l.94 2H20a1 1 0 0 1 .97 1.24L19 12H7L5.83 6z"/>
    </svg>`,
  },
  {
    tipo: 'HOSPITAL',
    etiqueta: 'Centro de salud / Hospital',
    i18nKey: 'HOSPITAL',
    color: '#dc2626',
    emoji: '🏥',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    </svg>`,
  },
  {
    tipo: 'TAXI',
    etiqueta: 'Parada de taxi',
    i18nKey: 'TAXI',
    color: '#ca8a04',
    emoji: '🚕',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5zm-8-4H9v2h2v-2zm4 0h-2v2h2v-2z"/>
    </svg>`,
  },
  {
    tipo: 'AUTOBUS',
    etiqueta: 'Parada de autobús',
    i18nKey: 'AUTOBUS',
    color: '#0284c7',
    emoji: '🚌',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
    </svg>`,
  },
  {
    tipo: 'COCHE_ELECTRICO',
    etiqueta: 'Carga vehículo eléctrico',
    i18nKey: 'COCHE_ELECTRICO',
    color: '#16a34a',
    emoji: '⚡',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M20 11V7l-2-2h-2V3H8v2H6L4 7v9h2a2 2 0 0 0 4 0h4a2 2 0 0 0 4 0h2v-3l-2-2zM6 8.5l1-1.5h10l1 1.5V11H6V8.5zM8 17a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm1-5H7v-1h10v1zm1.5-4l1 1H14v-1h4.5z"/>
      <path d="M11 2l-4 6h3v4l4-6h-3V2z"/>
    </svg>`,
  },
  {
    tipo: 'COCHE_ELECTRICO_ULTRA',
    etiqueta: 'Cargador ultra-rápido (150+ kW)',
    i18nKey: 'COCHE_ELECTRICO_ULTRA',
    color: '#059669',
    emoji: '⚡',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M11 2l-4 6h3v4l4-6h-3V2z"/>
      <path d="M7 15l-3 5h3v2l3-5H7v-2z"/>
      <path d="M17 15l-3 5h3v2l3-5h-3v-2z"/>
    </svg>`,
  },
  {
    tipo: 'ALQUILER_BICI',
    etiqueta: 'Alquiler de bicicletas',
    i18nKey: 'ALQUILER_BICI',
    color: '#d97706',
    emoji: '🚲',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.4-.4-.9-.6-1.4-.6s-1 .2-1.3.6L7.8 8.4C7.4 8.8 7 9.5 7 10c0 .6.2 1.2.6 1.6L11 15v5h2v-6l-3.2-3.2 2-2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>
    </svg>`,
  },
  {
    tipo: 'FUENTE',
    etiqueta: 'Fuente de agua potable',
    i18nKey: 'FUENTE',
    color: '#0ea5e9',
    emoji: '💧',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 2c-3.87 4.26-6 7.52-6 10a6 6 0 0 0 12 0c0-2.48-2.13-5.74-6-10zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5 0-1.77 1.28-3.96 4.5-8.02 3.22 4.07 4.5 6.26 4.5 8.02 0 2.49-2.01 4.5-4.5 4.5zm-2.5-4c.28 1.47 1.36 2.5 2.5 2.5V13c-.83 0-1.5-.89-1.5-2h-1z"/>
    </svg>`,
  },
  {
    tipo: 'POLICIA',
    etiqueta: 'Policía / Guardia Civil',
    i18nKey: 'POLICIA',
    color: '#1e40af',
    emoji: '👮',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5zm-1 5v2h2v-2h-2zm0 4v2h2v-2h-2z"/>
    </svg>`,
  },
  {
    tipo: 'TREN',
    etiqueta: 'Estación de tren',
    i18nKey: 'TREN',
    color: '#7c3aed',
    emoji: '🚆',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V8h12v3zm0-5H6V6h12v2z"/>
    </svg>`,
  },
  {
    tipo: 'PICNIC',
    etiqueta: 'Zona picnic / Merendero',
    i18nKey: 'PICNIC',
    color: '#65a30d',
    emoji: '🧺',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M2 13h20v-2H2v2zm4 4h12v-2H6v2zm-4-8h20V7H2v2zm11-6H4v2h5.46l-2.6 7H4v2h3.17L8.53 9H13V3zm5.2 0 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2L15.2 6l2.2-.8.8-2.2z"/>
    </svg>`,
  },
  {
    tipo: 'BANO_NATURAL',
    etiqueta: 'Zona Natural de Baño',
    i18nKey: 'BANO_NATURAL',
    color: '#0891b2',
    emoji: '🏊',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36s-.78.13-1.15.36C4.73 20.63 4.11 21 3 21v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64v2zM8.67 12l-1.41-1.41C6.35 9.68 6 8.86 6 8c0-1.87 1.52-3.39 3.39-3.39.86 0 1.68.35 2.28.95l.33.33.33-.33c.6-.6 1.42-.95 2.28-.95 1.87 0 3.39 1.52 3.39 3.39 0 .86-.35 1.68-.95 2.28L15.67 12l-1.41-1.41.66-.66c.25-.25.39-.59.39-.93 0-.73-.59-1.32-1.32-1.32-.35 0-.68.14-.93.39L12 10.13 10.94 9.07c-.25-.25-.58-.39-.93-.39-.73 0-1.32.59-1.32 1.32 0 .35.14.68.39.93l.67.66-1.08 1.41z"/>
    </svg>`,
  },
  {
    tipo: 'PLAYA',
    etiqueta: 'Playa',
    i18nKey: 'PLAYA',
    color: '#f59e0b',
    emoji: '🏖️',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M13.127 14.56l1.43-1.43 6.44 6.44-1.43 1.43zM17.42 8.83l2.86-2.86c-3.95-3.95-10.35-3.96-14.3 0L8.84 7.73c2.86-2.86 7.73-2.84 10.58.1zM14.56 11.7l2.86-2.86c-2.13-2.13-5.29-2.84-8.08-2.14l2.29 2.29c1.08-.01 2.17.41 2.93 1.17v.01c.01 0 .01.02 0 .03v-.5zm-8.04-.82L3.65 8.01C2.95 10.8 3.66 13.96 5.79 16.1l2.86-2.86c-.76-.76-1.18-1.85-1.13-2.36z"/>
      <path d="M6.07 17.51C4.42 15.86 3.68 13.63 3.96 11.47L1.1 8.61C-.49 12.77.48 17.64 3.69 20.85l1.43-1.43-.01-.01 2.86-2.86-.01-.01 1.43-1.43c-1.22-.01-2.43-.47-3.32-1.6z"/>
    </svg>`,
  },
  {
    tipo: 'PARQUE_INFANTIL',
    etiqueta: 'Parque infantil',
    i18nKey: 'PARQUE_INFANTIL',
    color: '#ec4899',
    emoji: '🎠',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M11 2v4.07A7.98 7.98 0 0 0 4.07 13H2v2h2.07C4.56 18.39 7.61 21 11 21.93V22h2v-.07A8.001 8.001 0 0 0 19.93 15H22v-2h-2.07A7.98 7.98 0 0 0 13 6.07V2h-2zm1 6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm-1 2v2.54l-2.5 2.5-1.41-1.41L10 11.21V10h2zm2 0h-1v2h1V10z"/>
    </svg>`,
  },
  {
    tipo: 'DESFIBRILADOR',
    etiqueta: 'Desfibrilador',
    i18nKey: 'DESFIBRILADOR',
    color: '#dc2626',
    emoji: '❤️',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-3v3h-1l-2-4-1.5 3H8v-2H6v-2h2V9h1l2 4 1.5-3H13V8h2v2h2v2z"/>
    </svg>`,
  },
];

export function getTipoServicioConfig(tipo: string): TipoServicioConfig | undefined {
  return TIPOS_SERVICIO.find((t) => t.tipo === tipo);
}

export const DIAS_SEMANA = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number]['key'];

export type HorarioServicio = Partial<Record<DiaSemana, string | null>>;
