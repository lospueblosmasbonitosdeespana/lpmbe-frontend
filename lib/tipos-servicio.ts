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
  | 'AUTOBUS';

export interface TipoServicioConfig {
  tipo: TipoServicio;
  etiqueta: string;
  color: string;      // color de fondo del marcador
  emoji: string;      // emoji de respaldo para texto
  svg: string;        // SVG inline para el marcador Leaflet
}

export const TIPOS_SERVICIO: TipoServicioConfig[] = [
  {
    tipo: 'LAVABO',
    etiqueta: 'Lavabos públicos',
    color: '#2563eb',
    emoji: '🚻',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M5.5 22v-7.5H4V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5.5H18.5V22H17v-6.5h-4V22H5.5zm-1.25-13A1.25 1.25 0 1 1 5.5 7.75 1.25 1.25 0 0 1 4.25 9zm15.5 0a1.25 1.25 0 1 1 1.25-1.25A1.25 1.25 0 0 1 19.75 9zM6.5 22v-6.5H5v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5h-1.5V22zM9 7a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 9 7zm6 0a1.5 1.5 0 1 1 1.5-1.5A1.5 1.5 0 0 1 15 7z"/>
    </svg>`,
  },
  {
    tipo: 'PARKING',
    etiqueta: 'Aparcamiento',
    color: '#1d4ed8',
    emoji: '🅿️',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M6 2h8a6 6 0 0 1 0 12H10v8H6V2zm4 4v4h4a2 2 0 0 0 0-4h-4z"/>
    </svg>`,
  },
  {
    tipo: 'TURISMO',
    etiqueta: 'Oficina de turismo',
    color: '#0891b2',
    emoji: 'ℹ️',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
    </svg>`,
  },
  {
    tipo: 'PIPICAN',
    etiqueta: 'Pipicán',
    color: '#16a34a',
    emoji: '🐕',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M4.5 11.5A1.5 1.5 0 0 1 6 10h1.5l1-3H15l.5 2H18a2 2 0 0 1 2 2v2.5a1.5 1.5 0 0 1-1.5 1.5H18v1a1 1 0 0 1-2 0v-1h-8v1a1 1 0 0 1-2 0v-1h-.5A1.5 1.5 0 0 1 4 13.5v-1.5A.5.5 0 0 1 4.5 11.5zM7 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
    </svg>`,
  },
  {
    tipo: 'CARAVANAS',
    etiqueta: 'Área de caravanas',
    color: '#7c3aed',
    emoji: '🚐',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M3 13V9a2 2 0 0 1 2-2h12l3 4v3h-1.17a2.5 2.5 0 0 1-4.66 0H7.83a2.5 2.5 0 0 1-4.66 0H2v-1h1zm2.5 2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 10v2h13v-1.5L16 9H5v1z"/>
    </svg>`,
  },
  {
    tipo: 'BANCO',
    etiqueta: 'Banco / Cajero',
    color: '#b45309',
    emoji: '🏦',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M2 10h20v2H2v-2zm0 4h2v4H2v-4zm4 0h2v4H6v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4zM12 2L2 8h20L12 2zm0 2.2L18.6 8H5.4L12 4.2zM2 20h20v2H2v-2z"/>
    </svg>`,
  },
  {
    tipo: 'FARMACIA',
    etiqueta: 'Farmacia',
    color: '#16a34a',
    emoji: '💊',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M11 3v7H4v2h7v7h2v-7h7v-2h-7V3h-2z"/>
    </svg>`,
  },
  {
    tipo: 'GASOLINERA',
    etiqueta: 'Gasolinera',
    color: '#dc2626',
    emoji: '⛽',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M20 11V7l-2-2-1.4 1.4 1.4 1.4V11a2 2 0 0 0-2 2v5a1 1 0 0 0 2 0v-5h1v5a1 1 0 0 0 2 0v-5a2 2 0 0 0-1-1.73zM15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 7H5V5h10v5z"/>
    </svg>`,
  },
  {
    tipo: 'SUPERMERCADO',
    etiqueta: 'Supermercado',
    color: '#ea580c',
    emoji: '🛒',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.83 6l-.94-2H1V2h5l.94 2H20a1 1 0 0 1 .97 1.24L19 12H7L5.83 6z"/>
    </svg>`,
  },
  {
    tipo: 'HOSPITAL',
    etiqueta: 'Centro de salud / Hospital',
    color: '#dc2626',
    emoji: '🏥',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
    </svg>`,
  },
  {
    tipo: 'TAXI',
    etiqueta: 'Parada de taxi',
    color: '#ca8a04',
    emoji: '🚕',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5zm-8-4H9v2h2v-2zm4 0h-2v2h2v-2z"/>
    </svg>`,
  },
  {
    tipo: 'AUTOBUS',
    etiqueta: 'Parada de autobús',
    color: '#0284c7',
    emoji: '🚌',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
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
