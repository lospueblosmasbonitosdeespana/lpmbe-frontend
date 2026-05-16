import { getResourceColor, getResourceSvg } from '@/lib/resource-types';
import { getTipoServicioConfig } from '@/lib/tipos-servicio';

type Leaflet = typeof import('leaflet');

/** Pin gota + SVG — mismo criterio que ParadasMap / MapaServiciosVisitante */
export function createServicioVisitanteDivIcon(L: Leaflet, tipo: string) {
  const cfg = getTipoServicioConfig(tipo);
  if (!cfg) return undefined;
  return L.divIcon({
    className: '',
    html: `<div style="
        background: ${cfg.color};
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
          ${cfg.svg}
        </div>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
}

/** Círculo con icono de recurso — ParadasMap */
export function createResourceTipoDivIcon(L: Leaflet, tipo: string) {
  const color = getResourceColor(tipo);
  const svgPath = getResourceSvg(tipo);
  return L.divIcon({
    className: '',
    html: `<div style="
        background: ${color};
        color: white;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      "><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export type NumberedMarkerTone = 'burgundy' | 'grey' | 'editing' | 'teal';

const NUMBERED_STYLES: Record<
  NumberedMarkerTone,
  { background: string; ring?: string }
> = {
  burgundy: {
    background: 'linear-gradient(135deg, #5a1520 0%, #7A1C1C 100%)',
  },
  grey: {
    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
  },
  editing: {
    background: 'linear-gradient(135deg, #5a1520 0%, #7A1C1C 100%)',
    ring: '0 0 0 3px #ca8a04, 0 2px 8px rgba(0,0,0,0.3)',
  },
  teal: {
    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
  },
};

/** Numeración en círculo — estilo mapa público de paradas / POIs */
export function createNumberedParadaDivIcon(L: Leaflet, num: number, tone: NumberedMarkerTone = 'burgundy') {
  const { background, ring } = NUMBERED_STYLES[tone];
  const boxShadow = ring ?? '0 2px 8px rgba(0,0,0,0.3)';
  return L.divIcon({
    className: 'lpmbe-numbered-marker',
    html: `<div style="
        background: ${background};
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        border: 2.5px solid white;
        box-shadow: ${boxShadow};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">${num}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

/** Pin de negocio genérico — gota dorada con silueta de tienda */
export function createNegocioDivIcon(L: Leaflet) {
  return L.divIcon({
    className: '',
    html: `<div style="
        background: oklch(0.45 0.10 50);
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg style="transform:rotate(45deg)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  });
}

/** Mapea colores legacy del MapLocationPicker a tonos del mapa público */
export function numberedToneFromLegacyColor(color?: string): NumberedMarkerTone {
  const c = (color ?? 'blue').toLowerCase();
  if (c === 'gold') return 'editing';
  if (c === 'grey') return 'grey';
  if (c === 'green') return 'teal';
  return 'burgundy';
}
