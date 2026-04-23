'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HorariosEditor, { HorarioDia, CierreEspecial } from '@/app/_components/editor/HorariosEditor';
import MapLocationPicker from '@/app/components/MapLocationPicker';
import { Gift, Layers, Euro, Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { uploadImageToR2 } from '@/src/lib/uploadHelper';

type RecursoPrecio = {
  id?: number;
  etiqueta: string;
  edadMin?: number | null;
  edadMax?: number | null;
  precioCents: number;
  aplicaDescuentoClub: boolean;
  orden?: number;
};

type ComboItem = {
  orden: number;
  componente: {
    id: number;
    nombre: string;
    tipo: string;
    fotoUrl?: string | null;
    precioCents?: number | null;
  };
};

type PerteneceACombo = {
  id: number;
  nombre: string;
  slug?: string | null;
  fotoUrl?: string | null;
};

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  activo: boolean;
  esExterno?: boolean;
  codigoQr: string;
  puebloId: number;
  maxAdultos: number;
  maxMenores: number;
  edadMaxMenor: number;
  lat?: number | null;
  lng?: number | null;
  horariosSemana?: HorarioDia[];
  cierresEspeciales?: CierreEspecial[];
  // Extras Club
  regaloActivo?: boolean;
  regaloTitulo?: string | null;
  regaloDescripcion?: string | null;
  regaloFotoUrl?: string | null;
  regaloCondiciones?: string | null;
  esCombo?: boolean;
  comboHighlight?: string | null;
  comboDescripcion?: string | null;
  comboCondiciones?: string | null;
  comboItems?: ComboItem[];
  perteneceACombos?: PerteneceACombo[];
  soloEnCombo?: boolean;
  precios?: RecursoPrecio[];
  ahorroCombo?: {
    sumaComponentesCents: number;
    ahorroCents: number;
    ahorroPorcentaje: number;
  } | null;
};

function formatCondiciones(r: Recurso): string {
  const adultos = r.maxAdultos ?? 1;
  const menores = r.maxMenores ?? 0;
  const edad = r.edadMaxMenor ?? 12;
  if (adultos === 1 && menores === 0) return 'Solo titular';
  let txt = `${adultos} adulto${adultos > 1 ? 's' : ''}`;
  if (menores > 0) txt += ` + ${menores} menor${menores > 1 ? 'es' : ''} (hasta ${edad} años)`;
  return txt;
}

function parseApiError(data: any, fallback: string): string {
  if (!data) return fallback;
  if (Array.isArray(data.message)) return data.message.join('. ');
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string' && data.error !== 'Bad Request') return data.error;
  return fallback;
}

interface Props {
  puebloId: number;
  slug: string;
  puebloLat: number | null;
  puebloLng: number | null;
}

export default function ClubRecursos({ puebloId, slug, puebloLat, puebloLng }: Props) {
  const router = useRouter();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form nuevo recurso
  const [showForm, setShowForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevoDescuento, setNuevoDescuento] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoActivo, setNuevoActivo] = useState(true);
  const [nuevoEsExterno, setNuevoEsExterno] = useState(false);
  const [nuevoMaxAdultos, setNuevoMaxAdultos] = useState('1');
  const [nuevoMaxMenores, setNuevoMaxMenores] = useState('0');
  const [nuevoEdadMaxMenor, setNuevoEdadMaxMenor] = useState('12');
  const [nuevoLat, setNuevoLat] = useState('');
  const [nuevoLng, setNuevoLng] = useState('');
  // Extras del recurso nuevo (regalo / combo / precios por tramo)
  const [nuevoRegaloActivo, setNuevoRegaloActivo] = useState(false);
  const [nuevoRegaloTitulo, setNuevoRegaloTitulo] = useState('');
  const [nuevoRegaloDescripcion, setNuevoRegaloDescripcion] = useState('');
  const [nuevoRegaloFotoUrl, setNuevoRegaloFotoUrl] = useState('');
  const [nuevoRegaloCondiciones, setNuevoRegaloCondiciones] = useState('');
  const [nuevoSoloEnCombo, setNuevoSoloEnCombo] = useState(false);
  const [nuevoPrecios, setNuevoPrecios] = useState<RecursoPrecio[]>([]);
  const [creando, setCreando] = useState(false);

  // Form nuevo combo (dedicado, separado del recurso normal)
  const [showComboForm, setShowComboForm] = useState(false);
  const [comboNombre, setComboNombre] = useState('');
  const [comboHighlight, setComboHighlight] = useState('');
  const [comboDescripcion, setComboDescripcion] = useState('');
  const [comboCondiciones, setComboCondiciones] = useState('');
  const [comboPrecio, setComboPrecio] = useState('');
  const [comboDescuento, setComboDescuento] = useState('');
  const [comboMaxAdultos, setComboMaxAdultos] = useState('1');
  const [comboMaxMenores, setComboMaxMenores] = useState('0');
  const [comboEdadMaxMenor, setComboEdadMaxMenor] = useState('12');
  const [comboActivo, setComboActivo] = useState(true);
  const [comboComponentesIds, setComboComponentesIds] = useState<number[]>([]);
  const [comboRegaloActivo, setComboRegaloActivo] = useState(false);
  const [comboRegaloTitulo, setComboRegaloTitulo] = useState('');
  const [comboRegaloDescripcion, setComboRegaloDescripcion] = useState('');
  const [comboRegaloFotoUrl, setComboRegaloFotoUrl] = useState('');
  const [comboRegaloCondiciones, setComboRegaloCondiciones] = useState('');
  const [comboPrecios, setComboPrecios] = useState<RecursoPrecio[]>([]);
  const [creandoCombo, setCreandoCombo] = useState(false);

  // Edición de combo
  const [editandoComboId, setEditandoComboId] = useState<number | null>(null);
  const [editComboNombre, setEditComboNombre] = useState('');
  const [editComboHighlight, setEditComboHighlight] = useState('');
  const [editComboDescripcion, setEditComboDescripcion] = useState('');
  const [editComboCondiciones, setEditComboCondiciones] = useState('');
  const [editComboPrecio, setEditComboPrecio] = useState('');
  const [editComboDescuento, setEditComboDescuento] = useState('');
  const [editComboMaxAdultos, setEditComboMaxAdultos] = useState('1');
  const [editComboMaxMenores, setEditComboMaxMenores] = useState('0');
  const [editComboEdadMaxMenor, setEditComboEdadMaxMenor] = useState('12');
  const [editComboActivo, setEditComboActivo] = useState(true);
  const [editComboComponentesIds, setEditComboComponentesIds] = useState<number[]>([]);
  const [editComboRegaloActivo, setEditComboRegaloActivo] = useState(false);
  const [editComboRegaloTitulo, setEditComboRegaloTitulo] = useState('');
  const [editComboRegaloDescripcion, setEditComboRegaloDescripcion] = useState('');
  const [editComboRegaloFotoUrl, setEditComboRegaloFotoUrl] = useState('');
  const [editComboRegaloCondiciones, setEditComboRegaloCondiciones] = useState('');
  const [editComboPrecios, setEditComboPrecios] = useState<RecursoPrecio[]>([]);
  const [guardandoCombo, setGuardandoCombo] = useState(false);

  // Edición
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editDescuento, setEditDescuento] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editActivo, setEditActivo] = useState(false);
  const [editEsExterno, setEditEsExterno] = useState(false);
  const [editMaxAdultos, setEditMaxAdultos] = useState('1');
  const [editMaxMenores, setEditMaxMenores] = useState('0');
  const [editEdadMaxMenor, setEditEdadMaxMenor] = useState('12');
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [editHorariosSemana, setEditHorariosSemana] = useState<HorarioDia[]>([]);
  const [editCierresEspeciales, setEditCierresEspeciales] = useState<CierreEspecial[]>([]);
  // Regalo
  const [editRegaloActivo, setEditRegaloActivo] = useState(false);
  const [editRegaloTitulo, setEditRegaloTitulo] = useState('');
  const [editRegaloDescripcion, setEditRegaloDescripcion] = useState('');
  const [editRegaloFotoUrl, setEditRegaloFotoUrl] = useState('');
  const [editRegaloCondiciones, setEditRegaloCondiciones] = useState('');
  // Solo en combo
  const [editSoloEnCombo, setEditSoloEnCombo] = useState(false);
  // Precios por tramo
  const [editPrecios, setEditPrecios] = useState<RecursoPrecio[]>([]);
  const [guardando, setGuardando] = useState(false);

  const mapCenter: [number, number] =
    puebloLat != null && puebloLng != null ? [puebloLat, puebloLng] : [40.4168, -3.7038];
  const mapZoom = puebloLat != null ? 14 : 6;

  const existingMarkers = recursos
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      lat: r.lat!,
      lng: r.lng!,
      label: r.nombre,
      color: r.activo ? 'blue' : 'grey',
    }));

  // Selected position for create form
  const nuevoSelectedPosition = (() => {
    if (!nuevoLat || !nuevoLng) return null;
    const lat = Number(nuevoLat);
    const lng = Number(nuevoLng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return { lat, lng };
  })();

  // Selected position for edit form
  const editSelectedPosition = (() => {
    if (!editLat || !editLng) return null;
    const lat = Number(editLat);
    const lng = Number(editLng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return { lat, lng };
  })();

  const handleNuevoMapSelect = useCallback((lat: number, lng: number) => {
    if (lat === 0 && lng === 0) {
      setNuevoLat('');
      setNuevoLng('');
    } else {
      setNuevoLat((Math.round(lat * 1e6) / 1e6).toString());
      setNuevoLng((Math.round(lng * 1e6) / 1e6).toString());
    }
  }, []);

  const handleEditMapSelect = useCallback((lat: number, lng: number) => {
    if (lat === 0 && lng === 0) {
      setEditLat('');
      setEditLng('');
    } else {
      setEditLat((Math.round(lat * 1e6) / 1e6).toString());
      setEditLng((Math.round(lng * 1e6) / 1e6).toString());
    }
  }, []);

  async function loadRecursos() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/club/recursos/pueblo/${puebloId}`);

      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }

      if (res.status === 502) {
        const errorData = await res.json().catch(() => null);
        if (errorData?.error === 'upstream_fetch_failed') {
          setError(`No se pudo conectar al backend. Verifica que el servidor esté ejecutándose.`);
        } else {
          setError('El backend no está disponible.');
        }
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error cargando recursos'));
        return;
      }

      const data = await res.json();
      setRecursos(Array.isArray(data) ? data : data.items || []);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecursos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puebloId]);

  function resetNuevoForm() {
    setNuevoNombre('');
    setNuevoTipo('');
    setNuevoDescuento('');
    setNuevoPrecio('');
    setNuevoActivo(true);
    setNuevoEsExterno(false);
    setNuevoMaxAdultos('1');
    setNuevoMaxMenores('0');
    setNuevoEdadMaxMenor('12');
    setNuevoLat('');
    setNuevoLng('');
    setNuevoRegaloActivo(false);
    setNuevoRegaloTitulo('');
    setNuevoRegaloDescripcion('');
    setNuevoRegaloFotoUrl('');
    setNuevoRegaloCondiciones('');
    setNuevoSoloEnCombo(false);
    setNuevoPrecios([]);
  }

  function resetComboForm() {
    setComboNombre('');
    setComboHighlight('');
    setComboDescripcion('');
    setComboCondiciones('');
    setComboPrecio('');
    setComboDescuento('');
    setComboMaxAdultos('1');
    setComboMaxMenores('0');
    setComboEdadMaxMenor('12');
    setComboActivo(true);
    setComboComponentesIds([]);
    setComboRegaloActivo(false);
    setComboRegaloTitulo('');
    setComboRegaloDescripcion('');
    setComboRegaloFotoUrl('');
    setComboRegaloCondiciones('');
    setComboPrecios([]);
  }

  async function handleCrear() {
    if (!nuevoNombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!nuevoTipo.trim()) {
      setError('El tipo es obligatorio (ej. Museo, Restaurante, Hotel…)');
      return;
    }

    if (nuevoDescuento && (isNaN(Number(nuevoDescuento)) || Number(nuevoDescuento) < 0 || Number(nuevoDescuento) > 100)) {
      setError('El descuento debe ser un número entre 0 y 100');
      return;
    }

    if (nuevoPrecio && (isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) < 0)) {
      setError('El precio debe ser un número positivo');
      return;
    }

    if (!nuevoLat || !nuevoLng) {
      setError('Es obligatorio geolocalizar el recurso. Usa el mapa o el buscador para fijar la ubicación.');
      return;
    }

    if (nuevoRegaloActivo && !nuevoRegaloTitulo.trim()) {
      setError('Si activas el regalo del Club, el título es obligatorio.');
      return;
    }

    for (const p of nuevoPrecios) {
      if (!p.etiqueta.trim()) {
        setError('Cada tramo de precio debe tener una etiqueta (ej. "Adulto").');
        return;
      }
      if (!Number.isFinite(p.precioCents) || p.precioCents < 0) {
        setError('Los precios por tramo deben ser números positivos.');
        return;
      }
    }

    setCreando(true);
    setError(null);

    try {
      const body: any = {
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo.trim() || null,
        activo: nuevoActivo,
        esExterno: nuevoEsExterno,
        maxAdultos: Math.max(1, Number(nuevoMaxAdultos) || 1),
        maxMenores: Math.max(0, Number(nuevoMaxMenores) || 0),
        edadMaxMenor: Math.max(0, Number(nuevoEdadMaxMenor) || 12),
        lat: Number(nuevoLat),
        lng: Number(nuevoLng),
        regaloActivo: nuevoRegaloActivo,
        regaloTitulo: nuevoRegaloActivo ? nuevoRegaloTitulo.trim() || null : null,
        regaloDescripcion: nuevoRegaloActivo ? nuevoRegaloDescripcion.trim() || null : null,
        regaloFotoUrl: nuevoRegaloActivo ? nuevoRegaloFotoUrl.trim() || null : null,
        regaloCondiciones: nuevoRegaloActivo ? nuevoRegaloCondiciones.trim() || null : null,
        esCombo: false,
        soloEnCombo: nuevoSoloEnCombo,
        precios: nuevoPrecios.map((p, idx) => ({
          etiqueta: p.etiqueta.trim(),
          edadMin: p.edadMin ?? null,
          edadMax: p.edadMax ?? null,
          precioCents: Math.round(p.precioCents),
          aplicaDescuentoClub: p.aplicaDescuentoClub,
          orden: idx,
        })),
      };

      if (nuevoDescuento) {
        body.descuentoPorcentaje = Number(nuevoDescuento);
      }

      if (nuevoPrecio !== '') {
        body.precioCents = Math.round(Number(nuevoPrecio) * 100);
      }

      const res = await fetch(`/api/club/recursos/pueblo/${puebloId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error creando recurso'));
        return;
      }

      resetNuevoForm();
      setShowForm(false);
      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setCreando(false);
    }
  }

  function handleIniciarEdicion(r: Recurso) {
    setEditandoId(r.id);
    setEditNombre(r.nombre);
    setEditTipo(r.tipo || '');
    setEditDescuento(r.descuentoPorcentaje?.toString() || '');
    setEditPrecio(r.precioCents ? (r.precioCents / 100).toString() : '');
    setEditActivo(r.activo);
    setEditEsExterno(r.esExterno === true);
    setEditMaxAdultos(String(r.maxAdultos ?? 1));
    setEditMaxMenores(String(r.maxMenores ?? 0));
    setEditEdadMaxMenor(String(r.edadMaxMenor ?? 12));
    setEditLat(r.lat != null ? String(r.lat) : '');
    setEditLng(r.lng != null ? String(r.lng) : '');
    setEditHorariosSemana(r.horariosSemana ?? []);
    setEditCierresEspeciales(r.cierresEspeciales ?? []);
    setEditRegaloActivo(r.regaloActivo === true);
    setEditRegaloTitulo(r.regaloTitulo ?? '');
    setEditRegaloDescripcion(r.regaloDescripcion ?? '');
    setEditRegaloFotoUrl(r.regaloFotoUrl ?? '');
    setEditRegaloCondiciones(r.regaloCondiciones ?? '');
    setEditSoloEnCombo(r.soloEnCombo === true);
    setEditPrecios(
      (r.precios ?? []).map((p) => ({
        id: p.id,
        etiqueta: p.etiqueta,
        edadMin: p.edadMin ?? null,
        edadMax: p.edadMax ?? null,
        precioCents: p.precioCents,
        aplicaDescuentoClub: p.aplicaDescuentoClub,
        orden: p.orden,
      })),
    );
  }

  function handleCancelarEdicion() {
    setEditandoId(null);
    setEditNombre('');
    setEditTipo('');
    setEditDescuento('');
    setEditPrecio('');
    setEditActivo(false);
    setEditEsExterno(false);
    setEditLat('');
    setEditLng('');
    setEditRegaloActivo(false);
    setEditRegaloTitulo('');
    setEditRegaloDescripcion('');
    setEditRegaloFotoUrl('');
    setEditRegaloCondiciones('');
    setEditSoloEnCombo(false);
    setEditPrecios([]);
  }

  async function handleGuardar(id: number) {
    if (!editNombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    if (!editTipo.trim()) {
      setError('El tipo es obligatorio (ej. Museo, Restaurante, Hotel…)');
      return;
    }

    if (editDescuento && (isNaN(Number(editDescuento)) || Number(editDescuento) < 0 || Number(editDescuento) > 100)) {
      setError('El descuento debe ser un número entre 0 y 100');
      return;
    }

    if (editPrecio && (isNaN(Number(editPrecio)) || Number(editPrecio) < 0)) {
      setError('El precio debe ser un número positivo');
      return;
    }

    if (!editLat || !editLng) {
      setError('Es obligatorio geolocalizar el recurso. Usa el mapa o el buscador para fijar la ubicación.');
      return;
    }

    for (const p of editPrecios) {
      if (!p.etiqueta?.trim()) {
        setError('Todas las filas de precio necesitan una etiqueta (p. ej. "Adulto").');
        return;
      }
      if (!Number.isFinite(p.precioCents) || p.precioCents < 0) {
        setError(`Precio inválido para "${p.etiqueta}".`);
        return;
      }
    }

    setGuardando(true);
    setError(null);

    try {
      const body: any = {
        nombre: editNombre.trim(),
        tipo: editTipo.trim() || null,
        activo: editActivo,
        esExterno: editEsExterno,
        maxAdultos: Math.max(1, Number(editMaxAdultos) || 1),
        maxMenores: Math.max(0, Number(editMaxMenores) || 0),
        edadMaxMenor: Math.max(0, Number(editEdadMaxMenor) || 12),
        lat: Number(editLat),
        lng: Number(editLng),
        horariosSemana: editHorariosSemana.map(({ diaSemana, abierto, horaAbre, horaCierra }) => ({ diaSemana, abierto, horaAbre, horaCierra })),
        cierresEspeciales: editCierresEspeciales.map(({ fecha, motivo }) => ({ fecha, motivo })),
        // Regalo del Club
        regaloActivo: editRegaloActivo,
        regaloTitulo: editRegaloActivo ? editRegaloTitulo.trim() || null : null,
        regaloDescripcion: editRegaloActivo ? editRegaloDescripcion.trim() || null : null,
        regaloFotoUrl: editRegaloActivo ? editRegaloFotoUrl.trim() || null : null,
        regaloCondiciones: editRegaloActivo ? editRegaloCondiciones.trim() || null : null,
        // Solo en combo
        soloEnCombo: editSoloEnCombo,
        // Precios por tramo
        precios: editPrecios.map((p, i) => ({
          etiqueta: p.etiqueta.trim(),
          edadMin: p.edadMin ?? null,
          edadMax: p.edadMax ?? null,
          precioCents: Math.max(0, Math.round(p.precioCents)),
          aplicaDescuentoClub: p.aplicaDescuentoClub,
          orden: i,
        })),
      };

      if (editDescuento) {
        body.descuentoPorcentaje = Number(editDescuento);
      } else {
        body.descuentoPorcentaje = null;
      }

      if (editPrecio !== '') {
        body.precioCents = Math.round(Number(editPrecio) * 100);
      } else {
        body.precioCents = null;
      }

      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error guardando recurso'));
        return;
      }

      handleCancelarEdicion();
      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setGuardando(false);
    }
  }

  // ─── Crear / editar COMBOS (dedicado, separado del recurso normal) ───
  async function handleCrearCombo() {
    if (!comboNombre.trim()) {
      setError('El título del combo es obligatorio (ej. "Combo de Museos de Calaceite").');
      return;
    }
    if (comboComponentesIds.length < 2) {
      setError('Un combo debe incluir al menos 2 recursos.');
      return;
    }
    if (comboPrecio && (isNaN(Number(comboPrecio)) || Number(comboPrecio) < 0)) {
      setError('El precio del combo debe ser un número positivo.');
      return;
    }
    if (comboDescuento && (isNaN(Number(comboDescuento)) || Number(comboDescuento) < 0 || Number(comboDescuento) > 100)) {
      setError('El descuento Club debe ser un número entre 0 y 100.');
      return;
    }
    if (comboRegaloActivo && !comboRegaloTitulo.trim()) {
      setError('Si activas el regalo del Club en el combo, el título es obligatorio.');
      return;
    }
    for (const p of comboPrecios) {
      if (!p.etiqueta.trim()) {
        setError('Cada tramo de precio del combo debe tener una etiqueta (ej. "Adulto").');
        return;
      }
      if (!Number.isFinite(p.precioCents) || p.precioCents < 0) {
        setError('Los precios por tramo del combo deben ser números positivos.');
        return;
      }
    }

    setCreandoCombo(true);
    setError(null);

    try {
      const body: any = {
        nombre: comboNombre.trim(),
        tipo: 'Combo turístico',
        activo: comboActivo,
        esExterno: false,
        maxAdultos: Math.max(1, Number(comboMaxAdultos) || 1),
        maxMenores: Math.max(0, Number(comboMaxMenores) || 0),
        edadMaxMenor: Math.max(0, Number(comboEdadMaxMenor) || 12),
        // El combo se ubica en el centro del pueblo (no necesita mapa propio)
        lat: puebloLat ?? 40.4168,
        lng: puebloLng ?? -3.7038,
        regaloActivo: comboRegaloActivo,
        regaloTitulo: comboRegaloActivo ? comboRegaloTitulo.trim() || null : null,
        regaloDescripcion: comboRegaloActivo ? comboRegaloDescripcion.trim() || null : null,
        regaloFotoUrl: comboRegaloActivo ? comboRegaloFotoUrl.trim() || null : null,
        regaloCondiciones: comboRegaloActivo ? comboRegaloCondiciones.trim() || null : null,
        esCombo: true,
        comboComponentesIds: comboComponentesIds,
        comboHighlight: comboHighlight.trim() || null,
        comboDescripcion: comboDescripcion.trim() || null,
        comboCondiciones: comboCondiciones.trim() || null,
        soloEnCombo: false,
        precios: comboPrecios.map((p, idx) => ({
          etiqueta: p.etiqueta.trim(),
          edadMin: p.edadMin ?? null,
          edadMax: p.edadMax ?? null,
          precioCents: Math.max(0, Math.round(p.precioCents)),
          aplicaDescuentoClub: p.aplicaDescuentoClub,
          orden: idx,
        })),
      };
      if (comboDescuento) body.descuentoPorcentaje = Number(comboDescuento);
      if (comboPrecio !== '') body.precioCents = Math.round(Number(comboPrecio) * 100);

      const res = await fetch(`/api/club/recursos/pueblo/${puebloId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error creando combo'));
        return;
      }
      resetComboForm();
      setShowComboForm(false);
      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setCreandoCombo(false);
    }
  }

  function handleIniciarEdicionCombo(r: Recurso) {
    setEditandoComboId(r.id);
    setEditComboNombre(r.nombre);
    setEditComboHighlight(r.comboHighlight ?? '');
    setEditComboDescripcion(r.comboDescripcion ?? '');
    setEditComboCondiciones(r.comboCondiciones ?? '');
    setEditComboPrecio(r.precioCents != null ? (r.precioCents / 100).toString() : '');
    setEditComboDescuento(r.descuentoPorcentaje?.toString() || '');
    setEditComboMaxAdultos(String(r.maxAdultos ?? 1));
    setEditComboMaxMenores(String(r.maxMenores ?? 0));
    setEditComboEdadMaxMenor(String(r.edadMaxMenor ?? 12));
    setEditComboActivo(r.activo);
    setEditComboComponentesIds((r.comboItems ?? []).map((c) => c.componente.id));
    setEditComboRegaloActivo(r.regaloActivo === true);
    setEditComboRegaloTitulo(r.regaloTitulo ?? '');
    setEditComboRegaloDescripcion(r.regaloDescripcion ?? '');
    setEditComboRegaloFotoUrl(r.regaloFotoUrl ?? '');
    setEditComboRegaloCondiciones(r.regaloCondiciones ?? '');
    setEditComboPrecios(
      (r.precios ?? []).map((p) => ({
        id: p.id,
        etiqueta: p.etiqueta,
        edadMin: p.edadMin ?? null,
        edadMax: p.edadMax ?? null,
        precioCents: p.precioCents,
        aplicaDescuentoClub: p.aplicaDescuentoClub,
        orden: p.orden,
      })),
    );
  }

  function handleCancelarEdicionCombo() {
    setEditandoComboId(null);
    setEditComboRegaloActivo(false);
    setEditComboRegaloTitulo('');
    setEditComboRegaloDescripcion('');
    setEditComboRegaloFotoUrl('');
    setEditComboRegaloCondiciones('');
    setEditComboPrecios([]);
  }

  async function handleGuardarCombo(id: number) {
    if (!editComboNombre.trim()) {
      setError('El título del combo es obligatorio.');
      return;
    }
    if (editComboComponentesIds.length < 2) {
      setError('Un combo debe incluir al menos 2 recursos.');
      return;
    }
    if (editComboPrecio && (isNaN(Number(editComboPrecio)) || Number(editComboPrecio) < 0)) {
      setError('El precio del combo debe ser un número positivo.');
      return;
    }
    if (editComboRegaloActivo && !editComboRegaloTitulo.trim()) {
      setError('Si activas el regalo del Club en el combo, el título es obligatorio.');
      return;
    }
    for (const p of editComboPrecios) {
      if (!p.etiqueta?.trim()) {
        setError('Todas las filas de precio del combo necesitan una etiqueta.');
        return;
      }
      if (!Number.isFinite(p.precioCents) || p.precioCents < 0) {
        setError(`Precio inválido para "${p.etiqueta}" en el combo.`);
        return;
      }
    }

    setGuardandoCombo(true);
    setError(null);

    try {
      const body: any = {
        nombre: editComboNombre.trim(),
        activo: editComboActivo,
        maxAdultos: Math.max(1, Number(editComboMaxAdultos) || 1),
        maxMenores: Math.max(0, Number(editComboMaxMenores) || 0),
        edadMaxMenor: Math.max(0, Number(editComboEdadMaxMenor) || 12),
        esCombo: true,
        comboComponentesIds: editComboComponentesIds,
        comboHighlight: editComboHighlight.trim() || null,
        comboDescripcion: editComboDescripcion.trim() || null,
        comboCondiciones: editComboCondiciones.trim() || null,
        regaloActivo: editComboRegaloActivo,
        regaloTitulo: editComboRegaloActivo ? editComboRegaloTitulo.trim() || null : null,
        regaloDescripcion: editComboRegaloActivo ? editComboRegaloDescripcion.trim() || null : null,
        regaloFotoUrl: editComboRegaloActivo ? editComboRegaloFotoUrl.trim() || null : null,
        regaloCondiciones: editComboRegaloActivo ? editComboRegaloCondiciones.trim() || null : null,
        precios: editComboPrecios.map((p, i) => ({
          etiqueta: p.etiqueta.trim(),
          edadMin: p.edadMin ?? null,
          edadMax: p.edadMax ?? null,
          precioCents: Math.max(0, Math.round(p.precioCents)),
          aplicaDescuentoClub: p.aplicaDescuentoClub,
          orden: i,
        })),
      };
      body.descuentoPorcentaje = editComboDescuento ? Number(editComboDescuento) : null;
      body.precioCents = editComboPrecio !== '' ? Math.round(Number(editComboPrecio) * 100) : null;

      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error guardando combo'));
        return;
      }
      handleCancelarEdicionCombo();
      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setGuardandoCombo(false);
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;

    setError(null);

    try {
      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error eliminando recurso'));
        return;
      }

      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  }

  async function handleToggleActivo(id: number, activo: boolean) {
    setError(null);

    try {
      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !activo }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(parseApiError(errorData, 'Error actualizando recurso'));
        return;
      }

      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  }

  const sinGeolocalizar = recursos.filter((r) => r.lat == null || r.lng == null);

  const TIPO_OPTIONS = (
    <>
      <option value="">— Selecciona un tipo —</option>
      <option value="Museo">Museo</option>
      <option value="Castillo">Castillo</option>
      <option value="Iglesia / Ermita">Iglesia / Ermita</option>
      <option value="Monumento">Monumento</option>
      <option value="Yacimiento arqueológico">Yacimiento arqueológico</option>
      <option value="Centro de interpretación">Centro de interpretación</option>
      <option value="Palacio / Casa señorial">Palacio / Casa señorial</option>
      <option value="Torre / Muralla">Torre / Muralla</option>
      <option value="Puente histórico">Puente histórico</option>
      <option value="Molino / Molino de agua">Molino / Molino de agua</option>
      <option value="Convento / Monasterio">Convento / Monasterio</option>
      <option value="Parque natural / Espacio natural">Parque natural / Espacio natural</option>
      <option value="Mirador">Mirador</option>
      <option value="Ruta de senderismo">Ruta de senderismo</option>
      <option value="Oficina de turismo">Oficina de turismo</option>
      <option value="Otro">Otro</option>
    </>
  );

  function GestionSelector({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(false)}
          disabled={disabled}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            !value
              ? 'bg-green-50 border-green-300 text-green-700 font-medium'
              : 'bg-white border-border text-muted-foreground hover:bg-muted/30'
          }`}
        >
          Municipal (pueblo)
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          disabled={disabled}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            value
              ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
              : 'bg-white border-border text-muted-foreground hover:bg-muted/30'
          }`}
        >
          Externo (colaborador)
        </button>
      </div>
    );
  }

  function CondicionesEditor({
    adultos, menores, edad,
    setAdultos, setMenores, setEdad,
    disabled,
  }: {
    adultos: string; menores: string; edad: string;
    setAdultos: (v: string) => void; setMenores: (v: string) => void; setEdad: (v: string) => void;
    disabled: boolean;
  }) {
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-2">
        <label className="block text-sm font-medium text-blue-800">Condiciones del descuento</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-blue-600 mb-1">Máx. adultos</label>
            <input type="number" min="1" value={adultos} onChange={(e) => setAdultos(e.target.value)} disabled={disabled} className="w-full px-2 py-1.5 border rounded text-sm disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-xs text-blue-600 mb-1">Máx. menores</label>
            <input type="number" min="0" value={menores} onChange={(e) => setMenores(e.target.value)} disabled={disabled} className="w-full px-2 py-1.5 border rounded text-sm disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-xs text-blue-600 mb-1">Edad máx. menor</label>
            <input type="number" min="0" value={edad} onChange={(e) => setEdad(e.target.value)} disabled={disabled} className="w-full px-2 py-1.5 border rounded text-sm disabled:opacity-50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mt-4 p-3 border rounded text-sm text-red-600 bg-red-50">
          {error}
        </div>
      )}

      {/* Warning: recursos sin geolocalizar */}
      {sinGeolocalizar.length > 0 && !loading && (
        <div className="mt-4 p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <strong>Atención:</strong> {sinGeolocalizar.length === 1 ? 'Hay 1 recurso' : `Hay ${sinGeolocalizar.length} recursos`} sin geolocalizar.
          Todos los recursos turísticos deben tener ubicación para que aparezcan correctamente en el mapa público.
          <ul className="mt-1 ml-4 list-disc">
            {sinGeolocalizar.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => handleIniciarEdicion(r)}
                  className="text-amber-800 underline hover:text-amber-950 font-medium"
                >
                  {r.nombre}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botones: nuevo recurso + nuevo combo */}
      {!showForm && !showComboForm && (
        <div className="mt-6 space-y-3">
          <div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white bg-green-600 rounded-xl shadow-md hover:bg-green-700 hover:shadow-lg active:scale-95 transition-all duration-150"
            >
              <span className="text-xl leading-none">+</span>
              <span>Añadir nuevo recurso turístico</span>
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Añade museos, castillos, monumentos y otros atractivos de tu municipio</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowComboForm(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold text-white rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
            >
              <Layers className="h-5 w-5" aria-hidden />
              <span>Crear un combo de recursos</span>
              <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-white/25 text-white">
                Recomendado
              </span>
            </button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Agrupa varios recursos bajo un único precio, un QR y un código de 6 dígitos. Ideal para aumentar las visitas cruzadas.
            </p>
          </div>
        </div>
      )}

      {/* Form nuevo recurso */}
      {showForm && (
        <div className="mt-6 p-4 border rounded-lg space-y-4">
          <h2 className="font-medium text-lg">Nuevo recurso</h2>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Nombre *</label>
            <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} disabled={creando} className="w-full px-3 py-2 border rounded disabled:opacity-50" />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">Tipo *</label>
            <select value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} disabled={creando} className="w-full px-3 py-2 border rounded disabled:opacity-50 bg-white">
              {TIPO_OPTIONS}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Gestión del recurso</label>
            <GestionSelector value={nuevoEsExterno} onChange={setNuevoEsExterno} disabled={creando} />
          </div>

          <div className="flex items-end gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Descuento (%)</label>
              <input type="number" min="0" max="100" value={nuevoDescuento} onChange={(e) => setNuevoDescuento(e.target.value)} disabled={creando} className="w-24 px-3 py-2 border rounded disabled:opacity-50" />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1">Precio (€)</label>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setNuevoPrecio('0')}
                  disabled={creando}
                  className={`px-3 py-2 text-sm rounded border transition-colors whitespace-nowrap ${
                    nuevoPrecio === '0'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                      : 'bg-white border-border text-muted-foreground hover:bg-muted/30'
                  } disabled:opacity-50`}
                >
                  Gratuito
                </button>
                <input type="number" min="0" step="0.01" value={nuevoPrecio} onChange={(e) => setNuevoPrecio(e.target.value)} disabled={creando} className="flex-1 px-3 py-2 border rounded disabled:opacity-50" placeholder="0.00" />
              </div>
            </div>
          </div>

          <CondicionesEditor
            adultos={nuevoMaxAdultos} menores={nuevoMaxMenores} edad={nuevoEdadMaxMenor}
            setAdultos={setNuevoMaxAdultos} setMenores={setNuevoMaxMenores} setEdad={setNuevoEdadMaxMenor}
            disabled={creando}
          />

          <div className="flex items-center gap-2">
            <input type="checkbox" checked={nuevoActivo} onChange={(e) => setNuevoActivo(e.target.checked)} disabled={creando} className="disabled:opacity-50" />
            <label className="text-sm text-muted-foreground">Activo</label>
          </div>

          <ExtrasEditor
            disabled={creando}
            regaloActivo={nuevoRegaloActivo}
            setRegaloActivo={setNuevoRegaloActivo}
            regaloTitulo={nuevoRegaloTitulo}
            setRegaloTitulo={setNuevoRegaloTitulo}
            regaloDescripcion={nuevoRegaloDescripcion}
            setRegaloDescripcion={setNuevoRegaloDescripcion}
            regaloFotoUrl={nuevoRegaloFotoUrl}
            setRegaloFotoUrl={setNuevoRegaloFotoUrl}
            regaloCondiciones={nuevoRegaloCondiciones}
            setRegaloCondiciones={setNuevoRegaloCondiciones}
            soloEnCombo={nuevoSoloEnCombo}
            setSoloEnCombo={setNuevoSoloEnCombo}
            precios={nuevoPrecios}
            setPrecios={setNuevoPrecios}
          />

          {/* Geolocalización */}
          <div className="rounded-lg border-2 border-emerald-300 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-emerald-800">Ubicación en el mapa *</h3>
            </div>
            <p className="text-xs text-emerald-700">Busca el lugar en el buscador, haz clic en el mapa o arrastra el marcador rojo para fijar la ubicación exacta.</p>
            <MapLocationPicker
              center={nuevoSelectedPosition ? [nuevoSelectedPosition.lat, nuevoSelectedPosition.lng] : mapCenter}
              zoom={nuevoSelectedPosition ? 16 : mapZoom}
              existingMarkers={existingMarkers}
              selectedPosition={nuevoSelectedPosition}
              onLocationSelect={handleNuevoMapSelect}
              height="300px"
              searchPlaceholder="Buscar lugar (ej: Castillo de Ainsa)…"
              activeHint="Haz clic en el mapa para ubicar el recurso"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Latitud</label>
                <input type="number" step="any" value={nuevoLat} onChange={(e) => setNuevoLat(e.target.value)} disabled={creando} className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50 font-mono" placeholder="42.4177" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Longitud</label>
                <input type="number" step="any" value={nuevoLng} onChange={(e) => setNuevoLng(e.target.value)} disabled={creando} className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50 font-mono" placeholder="0.1393" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleCrear} disabled={creando || !nuevoNombre.trim() || !nuevoTipo.trim()} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50">
              {creando ? 'Creando…' : 'Crear recurso'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetNuevoForm(); }} disabled={creando} className="px-4 py-2 text-sm border rounded hover:bg-muted/30 disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Form nuevo combo */}
      {showComboForm && (
        <ComboForm
          mode="create"
          disabled={creandoCombo}
          nombre={comboNombre} setNombre={setComboNombre}
          highlight={comboHighlight} setHighlight={setComboHighlight}
          descripcion={comboDescripcion} setDescripcion={setComboDescripcion}
          condiciones={comboCondiciones} setCondiciones={setComboCondiciones}
          precio={comboPrecio} setPrecio={setComboPrecio}
          descuento={comboDescuento} setDescuento={setComboDescuento}
          maxAdultos={comboMaxAdultos} setMaxAdultos={setComboMaxAdultos}
          maxMenores={comboMaxMenores} setMaxMenores={setComboMaxMenores}
          edadMaxMenor={comboEdadMaxMenor} setEdadMaxMenor={setComboEdadMaxMenor}
          activo={comboActivo} setActivo={setComboActivo}
          componentesIds={comboComponentesIds} setComponentesIds={setComboComponentesIds}
          regaloActivo={comboRegaloActivo} setRegaloActivo={setComboRegaloActivo}
          regaloTitulo={comboRegaloTitulo} setRegaloTitulo={setComboRegaloTitulo}
          regaloDescripcion={comboRegaloDescripcion} setRegaloDescripcion={setComboRegaloDescripcion}
          regaloFotoUrl={comboRegaloFotoUrl} setRegaloFotoUrl={setComboRegaloFotoUrl}
          regaloCondiciones={comboRegaloCondiciones} setRegaloCondiciones={setComboRegaloCondiciones}
          precios={comboPrecios} setPrecios={setComboPrecios}
          recursosDelPueblo={recursos}
          recursoActualId={null}
          onSubmit={handleCrearCombo}
          onCancel={() => { setShowComboForm(false); resetComboForm(); }}
          submitting={creandoCombo}
        />
      )}

      {/* Lista de recursos */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando recursos...</div>
        ) : recursos.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay recursos todavía.</div>
        ) : (
          recursos.map((r) => (
            <div
              key={r.id}
              className={`p-4 border rounded space-y-2 ${
                r.esCombo ? 'border-purple-300 bg-gradient-to-br from-purple-50/40 to-fuchsia-50/40' : ''
              }`}
            >
              {editandoComboId === r.id ? (
                <ComboForm
                  mode="edit"
                  disabled={guardandoCombo}
                  nombre={editComboNombre} setNombre={setEditComboNombre}
                  highlight={editComboHighlight} setHighlight={setEditComboHighlight}
                  descripcion={editComboDescripcion} setDescripcion={setEditComboDescripcion}
                  condiciones={editComboCondiciones} setCondiciones={setEditComboCondiciones}
                  precio={editComboPrecio} setPrecio={setEditComboPrecio}
                  descuento={editComboDescuento} setDescuento={setEditComboDescuento}
                  maxAdultos={editComboMaxAdultos} setMaxAdultos={setEditComboMaxAdultos}
                  maxMenores={editComboMaxMenores} setMaxMenores={setEditComboMaxMenores}
                  edadMaxMenor={editComboEdadMaxMenor} setEdadMaxMenor={setEditComboEdadMaxMenor}
                  activo={editComboActivo} setActivo={setEditComboActivo}
                  componentesIds={editComboComponentesIds} setComponentesIds={setEditComboComponentesIds}
                  regaloActivo={editComboRegaloActivo} setRegaloActivo={setEditComboRegaloActivo}
                  regaloTitulo={editComboRegaloTitulo} setRegaloTitulo={setEditComboRegaloTitulo}
                  regaloDescripcion={editComboRegaloDescripcion} setRegaloDescripcion={setEditComboRegaloDescripcion}
                  regaloFotoUrl={editComboRegaloFotoUrl} setRegaloFotoUrl={setEditComboRegaloFotoUrl}
                  regaloCondiciones={editComboRegaloCondiciones} setRegaloCondiciones={setEditComboRegaloCondiciones}
                  precios={editComboPrecios} setPrecios={setEditComboPrecios}
                  recursosDelPueblo={recursos}
                  recursoActualId={r.id}
                  onSubmit={() => handleGuardarCombo(r.id)}
                  onCancel={handleCancelarEdicionCombo}
                  submitting={guardandoCombo}
                />
              ) : editandoId === r.id ? (
                <>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Nombre *</label>
                    <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} disabled={guardando} className="w-full px-3 py-2 border rounded disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Tipo *</label>
                    <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)} disabled={guardando} className="w-full px-3 py-2 border rounded disabled:opacity-50 bg-white">
                      {TIPO_OPTIONS}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Gestión del recurso</label>
                    <GestionSelector value={editEsExterno} onChange={setEditEsExterno} disabled={guardando} />
                  </div>
                  <div className="flex items-end gap-4">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Descuento (%)</label>
                      <input type="number" min="0" max="100" value={editDescuento} onChange={(e) => setEditDescuento(e.target.value)} disabled={guardando} className="w-24 px-3 py-2 border rounded disabled:opacity-50" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-muted-foreground mb-1">Precio (€)</label>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => setEditPrecio('0')}
                          disabled={guardando}
                          className={`px-3 py-2 text-sm rounded border transition-colors whitespace-nowrap ${
                            editPrecio === '0'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-medium'
                              : 'bg-white border-border text-muted-foreground hover:bg-muted/30'
                          } disabled:opacity-50`}
                        >
                          Gratuito
                        </button>
                        <input type="number" min="0" step="0.01" value={editPrecio} onChange={(e) => setEditPrecio(e.target.value)} disabled={guardando} className="flex-1 px-3 py-2 border rounded disabled:opacity-50" placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  <CondicionesEditor
                    adultos={editMaxAdultos} menores={editMaxMenores} edad={editEdadMaxMenor}
                    setAdultos={setEditMaxAdultos} setMenores={setEditMaxMenores} setEdad={setEditEdadMaxMenor}
                    disabled={guardando}
                  />

                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={editActivo} onChange={(e) => setEditActivo(e.target.checked)} disabled={guardando} className="disabled:opacity-50" />
                    <label className="text-sm text-muted-foreground">Activo</label>
                  </div>

                  <ExtrasEditor
                    disabled={guardando}
                    regaloActivo={editRegaloActivo}
                    setRegaloActivo={setEditRegaloActivo}
                    regaloTitulo={editRegaloTitulo}
                    setRegaloTitulo={setEditRegaloTitulo}
                    regaloDescripcion={editRegaloDescripcion}
                    setRegaloDescripcion={setEditRegaloDescripcion}
                    regaloFotoUrl={editRegaloFotoUrl}
                    setRegaloFotoUrl={setEditRegaloFotoUrl}
                    regaloCondiciones={editRegaloCondiciones}
                    setRegaloCondiciones={setEditRegaloCondiciones}
                    soloEnCombo={editSoloEnCombo}
                    setSoloEnCombo={setEditSoloEnCombo}
                    precios={editPrecios}
                    setPrecios={setEditPrecios}
                  />

                  {/* Geolocalización (edición) */}
                  <div className={`rounded-lg border-2 p-4 space-y-3 ${editLat && editLng ? 'border-emerald-300 bg-emerald-50/50' : 'border-red-300 bg-red-50/50'}`}>
                    <div className="flex items-center gap-2">
                      <svg className={`h-5 w-5 ${editLat && editLng ? 'text-emerald-700' : 'text-red-700'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h3 className={`text-sm font-semibold ${editLat && editLng ? 'text-emerald-800' : 'text-red-800'}`}>
                        Ubicación en el mapa *
                        {!editLat || !editLng ? ' — Sin geolocalizar' : ''}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Busca el lugar, haz clic en el mapa o arrastra el marcador rojo.</p>
                    <MapLocationPicker
                      center={editSelectedPosition ? [editSelectedPosition.lat, editSelectedPosition.lng] : mapCenter}
                      zoom={editSelectedPosition ? 16 : mapZoom}
                      existingMarkers={existingMarkers}
                      selectedPosition={editSelectedPosition}
                      onLocationSelect={handleEditMapSelect}
                      height="300px"
                      searchPlaceholder="Buscar lugar (ej: Castillo de Ainsa)…"
                      activeHint={`Haz clic en el mapa para ${editSelectedPosition ? 'cambiar' : 'fijar'} la ubicación`}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Latitud</label>
                        <input type="number" step="any" value={editLat} onChange={(e) => setEditLat(e.target.value)} disabled={guardando} className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50 font-mono" placeholder="42.4177" />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Longitud</label>
                        <input type="number" step="any" value={editLng} onChange={(e) => setEditLng(e.target.value)} disabled={guardando} className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50 font-mono" placeholder="0.1393" />
                      </div>
                    </div>
                  </div>

                  {/* Horarios y cierres especiales */}
                  <div className="rounded-lg border border-border bg-muted/30/60 p-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Horarios y cierres especiales</h4>
                    <HorariosEditor
                      horariosSemana={editHorariosSemana}
                      cierresEspeciales={editCierresEspeciales}
                      onChange={(h, c) => { setEditHorariosSemana(h); setEditCierresEspeciales(c); }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleGuardar(r.id)} disabled={guardando || !editNombre.trim()} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50">
                      {guardando ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button type="button" onClick={handleCancelarEdicion} disabled={guardando} className="px-4 py-2 text-sm border rounded hover:bg-muted/30 disabled:opacity-50">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{r.nombre}</span>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            r.esExterno
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {r.esExterno ? 'Externo' : 'Municipal'}
                        </span>
                        {r.lat != null && r.lng != null ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Geolocalizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-700 border border-red-200">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Sin ubicación
                          </span>
                        )}
                        {r.regaloActivo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <Gift className="h-3 w-3" aria-hidden />
                            Regalo
                          </span>
                        )}
                        {r.esCombo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700 border border-purple-200">
                            <Layers className="h-3 w-3" aria-hidden />
                            Combo ({r.comboItems?.length ?? 0})
                          </span>
                        )}
                        {(r.perteneceACombos?.length ?? 0) > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200"
                            title={`Incluido en: ${r.perteneceACombos!.map((c) => c.nombre).join(', ')}`}
                          >
                            <Layers className="h-3 w-3" aria-hidden />
                            {r.perteneceACombos!.length === 1
                              ? `Parte del combo «${r.perteneceACombos![0].nombre}»`
                              : `Parte de ${r.perteneceACombos!.length} combos`}
                          </span>
                        )}
                        {r.soloEnCombo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 border border-purple-300">
                            <Layers className="h-3 w-3" aria-hidden />
                            Solo en combo
                          </span>
                        )}
                        {(r.precios?.length ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700 border border-slate-300">
                            <Euro className="h-3 w-3" aria-hidden />
                            {r.precios!.length} tramo{r.precios!.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">Tipo: {r.tipo || '—'}</div>
                      <div className="text-sm text-muted-foreground">
                        Precio: {r.precioCents !== null && r.precioCents !== undefined ? (r.precioCents === 0 ? <span className="text-emerald-600 font-medium">Gratuito</span> : `${(r.precioCents / 100).toFixed(2)} €`) : '—'}
                      </div>
                      {r.descuentoPorcentaje && r.precioCents && (
                        <div className="text-sm text-green-600 font-medium">
                          Con descuento: {((r.precioCents / 100) * (1 - r.descuentoPorcentaje / 100)).toFixed(2)} €
                        </div>
                      )}
                      {r.esCombo && r.ahorroCombo && (
                        <div
                          data-testid="combo-ahorro"
                          data-build="ahorro-v2"
                          className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-emerald-800 font-semibold">
                              Ahorro del combo:{' '}
                              {(r.ahorroCombo.ahorroCents / 100).toFixed(2)} €
                              {' '}
                              <span className="inline-flex items-center rounded-full bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 ml-1">
                                −{r.ahorroCombo.ahorroPorcentaje}%
                              </span>
                            </span>
                          </div>
                          <div className="text-xs text-emerald-700/90 mt-0.5">
                            Por separado costaría{' '}
                            <span className="line-through">
                              {(r.ahorroCombo.sumaComponentesCents / 100).toFixed(2)} €
                            </span>
                            {r.precioCents ? (
                              <>
                                {' '}
                                · En combo:{' '}
                                <strong>{(r.precioCents / 100).toFixed(2)} €</strong>
                              </>
                            ) : null}
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Descuento: {r.descuentoPorcentaje !== null && r.descuentoPorcentaje !== undefined ? `${r.descuentoPorcentaje}%` : '—'}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">
                        Condiciones: {formatCondiciones(r)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Activo: <strong>{r.activo ? 'Sí' : 'No'}</strong>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono mt-1 break-all">
                        QR: {r.codigoQr}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => (r.esCombo ? handleIniciarEdicionCombo(r) : handleIniciarEdicion(r))}
                      className={`px-3 py-1 text-sm border rounded hover:bg-muted/30 ${
                        r.esCombo ? 'border-purple-300 text-purple-700 hover:bg-purple-50' : ''
                      }`}
                    >
                      {r.esCombo ? 'Editar combo' : 'Editar'}
                    </button>
                    <button type="button" onClick={() => handleToggleActivo(r.id, r.activo)} className="px-3 py-1 text-sm border rounded hover:bg-muted/30">
                      {r.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" onClick={() => handleEliminar(r.id)} className="px-3 py-1 text-sm border rounded hover:bg-muted/30">
                      Eliminar
                    </button>
                    {r.activo && (
                      <a href={`/validador/${r.id}`} target="_blank" rel="noreferrer" className="px-3 py-1 text-sm border rounded hover:bg-muted/30 inline-block text-center">
                        Validador
                      </a>
                    )}
                    <a href={`/gestion/asociacion/club/metricas/${puebloId}`} className="px-3 py-1 text-sm border rounded hover:bg-blue-50 text-blue-600 border-blue-200 inline-block text-center">
                      Métricas
                    </a>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

type ExtrasEditorProps = {
  disabled?: boolean;
  regaloActivo: boolean;
  setRegaloActivo: (v: boolean) => void;
  regaloTitulo: string;
  setRegaloTitulo: (v: string) => void;
  regaloDescripcion: string;
  setRegaloDescripcion: (v: string) => void;
  regaloFotoUrl: string;
  setRegaloFotoUrl: (v: string) => void;
  regaloCondiciones: string;
  setRegaloCondiciones: (v: string) => void;
  soloEnCombo: boolean;
  setSoloEnCombo: (v: boolean) => void;
  precios: RecursoPrecio[];
  setPrecios: React.Dispatch<React.SetStateAction<RecursoPrecio[]>>;
};

function ExtrasEditor({
  disabled,
  regaloActivo, setRegaloActivo,
  regaloTitulo, setRegaloTitulo,
  regaloDescripcion, setRegaloDescripcion,
  regaloFotoUrl, setRegaloFotoUrl,
  regaloCondiciones, setRegaloCondiciones,
  soloEnCombo, setSoloEnCombo,
  precios, setPrecios,
}: ExtrasEditorProps) {
  return (
    <>
      {/* Regalo del Club */}
      <div className="rounded-lg border-2 border-amber-300 bg-amber-50/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-700" aria-hidden />
            <h4 className="text-sm font-semibold text-amber-900">Regalo del Club</h4>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={regaloActivo}
              onChange={(e) => setRegaloActivo(e.target.checked)}
              disabled={disabled}
            />
            Activar regalo
          </label>
        </div>
        <p className="text-xs text-amber-800">
          Regalo que recibe el socio del Club al visitar el recurso. Puede combinarse con el descuento. Déjalo desactivado si no ofreces regalo.
        </p>
        {regaloActivo && (
          <>
            <div>
              <label className="block text-xs text-amber-900 mb-1">Título del regalo *</label>
              <input
                type="text"
                value={regaloTitulo}
                onChange={(e) => setRegaloTitulo(e.target.value)}
                disabled={disabled}
                placeholder="Ej. Llavero del pueblo · Calendario · Imán · Postal"
                className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-amber-900 mb-1">Descripción</label>
              <textarea
                value={regaloDescripcion}
                onChange={(e) => setRegaloDescripcion(e.target.value)}
                disabled={disabled}
                rows={2}
                placeholder="Ej. Llavero artesanal con el escudo del pueblo"
                className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
              />
            </div>
            <RegaloFotoUploader
              regaloFotoUrl={regaloFotoUrl}
              setRegaloFotoUrl={setRegaloFotoUrl}
              disabled={disabled}
            />
            <div>
              <label className="block text-xs text-amber-900 mb-1">Condiciones (opcional)</label>
              <textarea
                value={regaloCondiciones}
                onChange={(e) => setRegaloCondiciones(e.target.value)}
                disabled={disabled}
                rows={2}
                placeholder="Ej. Uno por socio · Hasta agotar existencias"
                className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
              />
            </div>
          </>
        )}
      </div>

      {/* Solo en combo */}
      <div className="rounded-lg border-2 border-purple-200 bg-purple-50/60 p-3 space-y-2">
        <label className="flex items-start gap-2 text-sm text-purple-900 cursor-pointer">
          <input
            type="checkbox"
            checked={soloEnCombo}
            onChange={(e) => setSoloEnCombo(e.target.checked)}
            disabled={disabled}
            className="mt-0.5"
          />
          <div>
            <div className="font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-700" aria-hidden />
              Este recurso solo se vende dentro de un combo
            </div>
            <p className="text-xs text-purple-800 mt-0.5">
              Márcalo si este recurso no se vende de forma individual, solo como parte de uno o varios combos. Su precio no aparecerá como compra separada, pero seguirá siendo validable con el QR del combo al que pertenezca.
            </p>
          </div>
        </label>
      </div>

      {/* Precios por tramo */}
      <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-slate-700" aria-hidden />
            <h4 className="text-sm font-semibold text-slate-800">Precios por tramo de edad o público</h4>
          </div>
          <button
            type="button"
            onClick={() =>
              setPrecios((prev) => [
                ...prev,
                { etiqueta: '', edadMin: null, edadMax: null, precioCents: 0, aplicaDescuentoClub: true, orden: prev.length },
              ])
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs border rounded bg-white hover:bg-muted/30 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Añadir tramo
          </button>
        </div>
        <p className="text-xs text-slate-600">
          Si añades tramos, sustituirán al precio único para los socios del Club. El descuento solo se aplica en los tramos donde marques &quot;Aplica descuento Club&quot;.
        </p>

        {precios.length === 0 ? (
          <p className="text-xs italic text-slate-500">No hay tramos definidos. Se usará el precio único.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="text-slate-700">
                <tr>
                  <th className="text-left font-medium pb-1">Etiqueta</th>
                  <th className="text-left font-medium pb-1 w-20">Edad min</th>
                  <th className="text-left font-medium pb-1 w-20">Edad max</th>
                  <th className="text-left font-medium pb-1 w-24">Precio (€)</th>
                  <th className="text-left font-medium pb-1 w-28">Descuento Club</th>
                  <th className="pb-1 w-10" />
                </tr>
              </thead>
              <tbody>
                {precios.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        value={p.etiqueta}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, etiqueta: val } : q)));
                        }}
                        disabled={disabled}
                        placeholder="Adulto / Niño / Jubilado"
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min="0"
                        value={p.edadMin ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, edadMin: v === '' ? null : Number(v) } : q)));
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min="0"
                        value={p.edadMax ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, edadMax: v === '' ? null : Number(v) } : q)));
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(p.precioCents / 100).toString()}
                        onChange={(e) => {
                          const euros = Number(e.target.value);
                          const cents = Number.isFinite(euros) ? Math.round(euros * 100) : 0;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, precioCents: cents } : q)));
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50 font-mono"
                      />
                    </td>
                    <td className="py-1 pr-2 text-center">
                      <input
                        type="checkbox"
                        checked={p.aplicaDescuentoClub}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, aplicaDescuentoClub: checked } : q)));
                        }}
                        disabled={disabled}
                      />
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => setPrecios((prev) => prev.filter((_, j) => j !== i))}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 inline-flex items-center"
                        title="Eliminar tramo"
                        aria-label="Eliminar tramo"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function RegaloFotoUploader({
  regaloFotoUrl,
  setRegaloFotoUrl,
  disabled,
}: {
  regaloFotoUrl: string;
  setRegaloFotoUrl: (v: string) => void;
  disabled?: boolean;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }
    setError(null);
    setSubiendo(true);
    try {
      const { url } = await uploadImageToR2(file, 'regalos-club');
      setRegaloFotoUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Error subiendo la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div>
      <label className="block text-xs text-amber-900 mb-1">Foto del regalo (opcional)</label>
      <p className="text-[11px] text-amber-800 mb-2">
        Sube una foto del regalo (llavero, calendario, imán, etc.). Se guarda automáticamente en nuestro almacenamiento seguro.
      </p>

      {regaloFotoUrl ? (
        <div className="flex items-start gap-3 p-2 border rounded bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={regaloFotoUrl}
            alt="Regalo"
            className="h-24 w-24 object-cover rounded border"
          />
          <div className="flex-1 flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs border rounded bg-white hover:bg-muted/30 cursor-pointer w-fit">
              <Upload className="h-3.5 w-3.5" aria-hidden />
              {subiendo ? 'Subiendo…' : 'Cambiar foto'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || subiendo}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => setRegaloFotoUrl('')}
              disabled={disabled || subiendo}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border rounded bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 w-fit"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Quitar foto
            </button>
          </div>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border-2 border-dashed rounded bg-white hover:bg-muted/30 cursor-pointer w-full justify-center text-amber-900">
          {subiendo ? (
            <>
              <ImageIcon className="h-4 w-4" aria-hidden />
              Subiendo…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden />
              Subir foto del regalo
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled || subiendo}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

type ComboFormProps = {
  mode: 'create' | 'edit';
  disabled?: boolean;
  nombre: string; setNombre: (v: string) => void;
  highlight: string; setHighlight: (v: string) => void;
  descripcion: string; setDescripcion: (v: string) => void;
  condiciones: string; setCondiciones: (v: string) => void;
  precio: string; setPrecio: (v: string) => void;
  descuento: string; setDescuento: (v: string) => void;
  maxAdultos: string; setMaxAdultos: (v: string) => void;
  maxMenores: string; setMaxMenores: (v: string) => void;
  edadMaxMenor: string; setEdadMaxMenor: (v: string) => void;
  activo: boolean; setActivo: (v: boolean) => void;
  componentesIds: number[];
  setComponentesIds: React.Dispatch<React.SetStateAction<number[]>>;
  // Regalo del Club para el combo
  regaloActivo: boolean; setRegaloActivo: (v: boolean) => void;
  regaloTitulo: string; setRegaloTitulo: (v: string) => void;
  regaloDescripcion: string; setRegaloDescripcion: (v: string) => void;
  regaloFotoUrl: string; setRegaloFotoUrl: (v: string) => void;
  regaloCondiciones: string; setRegaloCondiciones: (v: string) => void;
  // Precios por tramo del combo
  precios: RecursoPrecio[];
  setPrecios: React.Dispatch<React.SetStateAction<RecursoPrecio[]>>;
  recursosDelPueblo: Recurso[];
  recursoActualId: number | null;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
};

function ComboForm({
  mode, disabled,
  nombre, setNombre,
  highlight, setHighlight,
  descripcion, setDescripcion,
  condiciones, setCondiciones,
  precio, setPrecio,
  descuento, setDescuento,
  maxAdultos, setMaxAdultos,
  maxMenores, setMaxMenores,
  edadMaxMenor, setEdadMaxMenor,
  activo, setActivo,
  componentesIds, setComponentesIds,
  regaloActivo, setRegaloActivo,
  regaloTitulo, setRegaloTitulo,
  regaloDescripcion, setRegaloDescripcion,
  regaloFotoUrl, setRegaloFotoUrl,
  regaloCondiciones, setRegaloCondiciones,
  precios, setPrecios,
  recursosDelPueblo, recursoActualId,
  onSubmit, onCancel, submitting,
}: ComboFormProps) {
  const componentesCandidatos = recursosDelPueblo.filter(
    (x) => x.id !== recursoActualId && !x.esCombo,
  );
  const precioNum = Number(precio);
  const hayPrecio = precio !== '' && !isNaN(precioNum) && precioNum >= 0;

  // Cálculo del ahorro del combo en vivo (para vender bien el combo en el preview)
  const sumaComponentesCents = componentesIds.reduce((acc, id) => {
    const r = recursosDelPueblo.find((x) => x.id === id);
    return acc + (r?.precioCents ?? 0);
  }, 0);
  const sumaComponentesEur = sumaComponentesCents / 100;
  const ahorroEur = hayPrecio && precioNum > 0 ? sumaComponentesEur - precioNum : 0;
  const hayAhorro = sumaComponentesCents > 0 && ahorroEur > 0;
  const ahorroPorcentaje = hayAhorro
    ? Math.max(0, Math.min(100, Math.round((ahorroEur / sumaComponentesEur) * 100)))
    : 0;

  return (
    <div className="mt-6 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 p-5 space-y-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white">
            <Layers className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="font-bold text-lg text-purple-900">
              {mode === 'create' ? 'Crear un combo de recursos' : 'Editar combo'}
            </h2>
            <p className="text-xs text-purple-800">
              Agrupa varios recursos bajo un único QR, un código de 6 dígitos y un único precio.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white/70 border border-purple-200 p-3 text-xs text-purple-900 leading-relaxed">
        <p className="font-semibold mb-1">¿Cómo funciona?</p>
        <p>
          El visitante paga <strong>una sola vez</strong> y puede visitar todos los recursos del combo en el mismo día.
          Al validar el QR (o el código de 6 dígitos) en cualquiera de los recursos incluidos, todos quedan marcados como pagados automáticamente.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-900 mb-1">
          Título del combo *
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={disabled}
          maxLength={80}
          placeholder="Ej. Combo de Museos de Calaceite"
          className="w-full px-3 py-2 border border-purple-200 rounded text-sm bg-white disabled:opacity-50"
        />
        <p className="text-[11px] text-muted-foreground mt-1">
          Vendible y descriptivo. Ejemplos: «Combo de Museos», «Pase del casco histórico», «Ruta de los 3 miradores».
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-900 mb-1">
          Claim comercial <span className="text-muted-foreground font-normal">(opcional, destaca el ahorro)</span>
        </label>
        <input
          type="text"
          value={highlight}
          onChange={(e) => setHighlight(e.target.value)}
          disabled={disabled}
          maxLength={80}
          placeholder="Ej. ¡Ahorra 5 € visitando los 3 museos con una sola entrada!"
          className="w-full px-3 py-2 border border-purple-200 rounded text-sm bg-white disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-900 mb-1">
          Descripción del combo <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Ej. Con esta entrada única visita los 3 museos del casco histórico y recorre la historia del pueblo. Válido todo el día; puedes empezar por donde prefieras."
          className="w-full px-3 py-2 border border-purple-200 rounded text-sm bg-white disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-purple-900 mb-1">Precio del combo (€) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            disabled={disabled}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-purple-200 rounded text-sm bg-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-900 mb-1">Descuento Club (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            disabled={disabled}
            placeholder="0"
            className="w-full px-3 py-2 border border-purple-200 rounded text-sm bg-white disabled:opacity-50"
          />
          <p className="text-[11px] text-muted-foreground mt-1">Se aplica al precio del combo para socios.</p>
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-purple-900 pb-2">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              disabled={disabled}
            />
            Combo activo (visible públicamente)
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-purple-200 bg-white p-3 space-y-2">
        <label className="block text-sm font-medium text-purple-900">Condiciones del descuento Club</label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] text-purple-700 mb-1">Máx. adultos</label>
            <input type="number" min="1" value={maxAdultos} onChange={(e) => setMaxAdultos(e.target.value)} disabled={disabled} className="w-full px-2 py-1.5 border rounded text-sm disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-[11px] text-purple-700 mb-1">Máx. menores</label>
            <input type="number" min="0" value={maxMenores} onChange={(e) => setMaxMenores(e.target.value)} disabled={disabled} className="w-full px-2 py-1.5 border rounded text-sm disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-[11px] text-purple-700 mb-1">Edad máx. menor</label>
            <input type="number" min="0" value={edadMaxMenor} onChange={(e) => setEdadMaxMenor(e.target.value)} disabled={disabled} className="w-full px-2 py-1.5 border rounded text-sm disabled:opacity-50" />
          </div>
        </div>
      </div>

      {/* Regalo del Club para el combo */}
      <div className="rounded-lg border-2 border-amber-300 bg-amber-50/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-700" aria-hidden />
            <h4 className="text-sm font-semibold text-amber-900">Regalo del Club para el combo</h4>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-amber-900">
            <input
              type="checkbox"
              checked={regaloActivo}
              onChange={(e) => setRegaloActivo(e.target.checked)}
              disabled={disabled}
            />
            Activar regalo
          </label>
        </div>
        <p className="text-xs text-amber-800">
          Regalo adicional que recibe el socio al comprar este combo (ej. llavero, calendario, postal). Se entrega al validar el QR o el código del combo en el primer recurso visitado.
        </p>
        {regaloActivo && (
          <>
            <div>
              <label className="block text-xs text-amber-900 mb-1">Título del regalo *</label>
              <input
                type="text"
                value={regaloTitulo}
                onChange={(e) => setRegaloTitulo(e.target.value)}
                disabled={disabled}
                placeholder="Ej. Llavero del pueblo · Calendario · Imán · Postal"
                className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-amber-900 mb-1">Descripción</label>
              <textarea
                value={regaloDescripcion}
                onChange={(e) => setRegaloDescripcion(e.target.value)}
                disabled={disabled}
                rows={2}
                placeholder="Ej. Llavero artesanal con el escudo del pueblo"
                className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
              />
            </div>
            <RegaloFotoUploader
              regaloFotoUrl={regaloFotoUrl}
              setRegaloFotoUrl={setRegaloFotoUrl}
              disabled={disabled}
            />
            <div>
              <label className="block text-xs text-amber-900 mb-1">Condiciones (opcional)</label>
              <textarea
                value={regaloCondiciones}
                onChange={(e) => setRegaloCondiciones(e.target.value)}
                disabled={disabled}
                rows={2}
                placeholder="Ej. Uno por socio · Hasta agotar existencias"
                className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
              />
            </div>
          </>
        )}
      </div>

      {/* Precios por tramo del combo */}
      <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-slate-700" aria-hidden />
            <h4 className="text-sm font-semibold text-slate-800">Precios del combo por tramo de edad o público</h4>
          </div>
          <button
            type="button"
            onClick={() =>
              setPrecios((prev) => [
                ...prev,
                { etiqueta: '', edadMin: null, edadMax: null, precioCents: 0, aplicaDescuentoClub: true, orden: prev.length },
              ])
            }
            disabled={disabled}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs border rounded bg-white hover:bg-muted/30 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Añadir tramo
          </button>
        </div>
        <p className="text-xs text-slate-600">
          Si añades tramos, sustituirán al precio único del combo. El descuento Club solo se aplica en los tramos donde marques &quot;Aplica descuento Club&quot;. Útil para ofrecer precios distintos a menores, jubilados, familia, etc.
        </p>

        {precios.length === 0 ? (
          <p className="text-xs italic text-slate-500">No hay tramos definidos. Se usará el precio único del combo.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead className="text-slate-700">
                <tr>
                  <th className="text-left font-medium pb-1">Etiqueta</th>
                  <th className="text-left font-medium pb-1 w-20">Edad min</th>
                  <th className="text-left font-medium pb-1 w-20">Edad max</th>
                  <th className="text-left font-medium pb-1 w-24">Precio (€)</th>
                  <th className="text-left font-medium pb-1 w-28">Descuento Club</th>
                  <th className="pb-1 w-10" />
                </tr>
              </thead>
              <tbody>
                {precios.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        value={p.etiqueta}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, etiqueta: val } : q)));
                        }}
                        disabled={disabled}
                        placeholder="Adulto / Niño / Jubilado / Familia"
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min="0"
                        value={p.edadMin ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, edadMin: v === '' ? null : Number(v) } : q)));
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min="0"
                        value={p.edadMax ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, edadMax: v === '' ? null : Number(v) } : q)));
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(p.precioCents / 100).toString()}
                        onChange={(e) => {
                          const euros = Number(e.target.value);
                          const cents = Number.isFinite(euros) ? Math.round(euros * 100) : 0;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, precioCents: cents } : q)));
                        }}
                        disabled={disabled}
                        className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50 font-mono"
                      />
                    </td>
                    <td className="py-1 pr-2 text-center">
                      <input
                        type="checkbox"
                        checked={p.aplicaDescuentoClub}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, aplicaDescuentoClub: checked } : q)));
                        }}
                        disabled={disabled}
                      />
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        onClick={() => setPrecios((prev) => prev.filter((_, j) => j !== i))}
                        disabled={disabled}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 inline-flex items-center"
                        title="Eliminar tramo"
                        aria-label="Eliminar tramo"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-900 mb-1">
          Recursos incluidos en el combo *
        </label>
        <div className="max-h-72 overflow-y-auto rounded border border-purple-200 bg-white p-2">
          {componentesCandidatos.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No hay otros recursos disponibles en este pueblo. Crea primero los recursos turísticos y luego vuelve a crear el combo.
            </p>
          ) : (
            componentesCandidatos.map((x) => {
              const checked = componentesIds.includes(x.id);
              return (
                <label
                  key={x.id}
                  className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer ${
                    checked ? 'bg-purple-100' : 'hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setComponentesIds((prev) =>
                        e.target.checked ? [...prev, x.id] : prev.filter((id) => id !== x.id),
                      );
                    }}
                    disabled={disabled}
                  />
                  <span className="font-medium">{x.nombre}</span>
                  <span className="text-muted-foreground text-xs">· {x.tipo || '—'}</span>
                  {x.soloEnCombo && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                      solo en combo
                    </span>
                  )}
                  {typeof x.precioCents === 'number' && x.precioCents > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {(x.precioCents / 100).toFixed(2)} €
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Selecciona al menos 2 recursos. Los combos no pueden contener otros combos.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-900 mb-1">
          Condiciones de uso <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={condiciones}
          onChange={(e) => setCondiciones(e.target.value)}
          disabled={disabled}
          maxLength={140}
          placeholder="Ej. Válido todo el día · 1 uso por persona · No reembolsable"
          className="w-full px-3 py-2 border border-purple-200 rounded text-sm bg-white disabled:opacity-50"
        />
      </div>

      {/* Preview */}
      <div className="rounded-lg border-2 border-dashed border-purple-400 bg-white p-4">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-purple-700 mb-2">
          Así verá el combo el visitante
        </p>
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white flex-shrink-0">
            <Layers className="h-7 w-7" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-base text-slate-900 leading-tight">
              {nombre.trim() || 'Título del combo'}
            </h5>
            {highlight.trim() && (
              <p className="text-sm text-purple-700 font-medium mt-0.5">{highlight}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {componentesIds.length > 0
                ? `Incluye ${componentesIds.length} recurso${componentesIds.length > 1 ? 's' : ''}`
                : 'Añade componentes al combo'}
              {hayPrecio && hayAhorro ? (
                <>
                  {' · '}
                  <span className="text-muted-foreground line-through">
                    {sumaComponentesEur.toFixed(2)} €
                  </span>
                  <span className="ml-1.5 font-bold text-emerald-700">
                    {precioNum.toFixed(2)} €
                  </span>
                </>
              ) : (
                hayPrecio && ` · ${precioNum.toFixed(2)} €`
              )}
              {descuento && Number(descuento) > 0 && ` · −${descuento}% socios`}
            </p>
            {descripcion.trim() && (
              <p className="text-xs text-slate-700 mt-2 line-clamp-3">{descripcion}</p>
            )}
            {condiciones.trim() && (
              <p className="text-[11px] text-muted-foreground italic mt-1">{condiciones}</p>
            )}
          </div>
        </div>

        {/* Badge vendible de ahorro (solo si realmente hay ahorro) */}
        {hayAhorro && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-extrabold">
              −{ahorroPorcentaje}%
            </div>
            <div className="text-sm leading-tight">
              <div className="font-bold text-emerald-900">
                Ahorras {ahorroEur.toFixed(2)} € con el combo
              </div>
              <div className="text-[11px] text-emerald-800">
                Sumados sueltos: {sumaComponentesEur.toFixed(2)} € · Precio combo: {precioNum.toFixed(2)} €
              </div>
            </div>
          </div>
        )}

        {/* Aviso si aún falta información para calcular el ahorro */}
        {!hayAhorro && componentesIds.length >= 2 && hayPrecio && sumaComponentesCents === 0 && (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            Para que el visitante vea el ahorro, asegúrate de que cada recurso del combo tenga su precio individual configurado.
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || !nombre.trim() || componentesIds.length < 2 || !hayPrecio}
          className="px-4 py-2 text-sm font-semibold text-white rounded hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' }}
        >
          {submitting ? (mode === 'create' ? 'Creando combo…' : 'Guardando combo…') : (mode === 'create' ? 'Crear combo' : 'Guardar combo')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 text-sm border rounded hover:bg-muted/30 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
