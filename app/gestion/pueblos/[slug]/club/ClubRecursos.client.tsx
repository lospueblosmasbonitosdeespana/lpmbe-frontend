'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HorariosEditor, { HorarioDia, CierreEspecial } from '@/app/_components/editor/HorariosEditor';
import MapLocationPicker from '@/app/components/MapLocationPicker';

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
  };
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
  comboItems?: ComboItem[];
  precios?: RecursoPrecio[];
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
  const [creando, setCreando] = useState(false);

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
  // Combo
  const [editEsCombo, setEditEsCombo] = useState(false);
  const [editComboComponentesIds, setEditComboComponentesIds] = useState<number[]>([]);
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
    setEditEsCombo(r.esCombo === true);
    setEditComboComponentesIds((r.comboItems ?? []).map((c) => c.componente.id));
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
    setEditEsCombo(false);
    setEditComboComponentesIds([]);
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

    if (editEsCombo && editComboComponentesIds.length < 2) {
      setError('Un combo debe incluir al menos 2 recursos componentes.');
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
        // Combo
        esCombo: editEsCombo,
        comboComponentesIds: editEsCombo ? editComboComponentesIds : [],
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

      {/* Form nuevo recurso */}
      {!showForm ? (
        <div className="mt-6">
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
      ) : (
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

          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium mb-1">Más opciones tras crear</p>
            <p className="text-xs leading-relaxed">
              Una vez guardado, pulsa <strong>Editar</strong> en el recurso para activar:
              🎁 <strong>Regalo del Club</strong> (combinable con el descuento %),
              🔗 <strong>Combo</strong> (agrupa varios recursos con un único QR) y
              💶 <strong>Precios por tramo de edad o público</strong> (Adulto, Niños, Jubilados…).
            </p>
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

      {/* Lista de recursos */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando recursos...</div>
        ) : recursos.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay recursos todavía.</div>
        ) : (
          recursos.map((r) => (
            <div key={r.id} className="p-4 border rounded space-y-2">
              {editandoId === r.id ? (
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

                  {/* 🎁 Regalo del Club */}
                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>🎁</span>
                        <h4 className="text-sm font-semibold text-amber-900">Regalo del Club</h4>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-amber-900">
                        <input
                          type="checkbox"
                          checked={editRegaloActivo}
                          onChange={(e) => setEditRegaloActivo(e.target.checked)}
                          disabled={guardando}
                        />
                        Activar regalo
                      </label>
                    </div>
                    <p className="text-xs text-amber-800">
                      Se mostrará a los socios junto al descuento (puede combinarse). Déjalo desactivado si este recurso no ofrece regalo.
                    </p>
                    {editRegaloActivo && (
                      <>
                        <div>
                          <label className="block text-xs text-amber-900 mb-1">Título *</label>
                          <input
                            type="text"
                            value={editRegaloTitulo}
                            onChange={(e) => setEditRegaloTitulo(e.target.value)}
                            disabled={guardando}
                            placeholder="Ej. Postre de la casa de regalo"
                            className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-amber-900 mb-1">Descripción</label>
                          <textarea
                            value={editRegaloDescripcion}
                            onChange={(e) => setEditRegaloDescripcion(e.target.value)}
                            disabled={guardando}
                            rows={2}
                            className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-amber-900 mb-1">URL de la foto</label>
                          <input
                            type="url"
                            value={editRegaloFotoUrl}
                            onChange={(e) => setEditRegaloFotoUrl(e.target.value)}
                            disabled={guardando}
                            placeholder="https://…"
                            className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-amber-900 mb-1">Condiciones (opcional)</label>
                          <textarea
                            value={editRegaloCondiciones}
                            onChange={(e) => setEditRegaloCondiciones(e.target.value)}
                            disabled={guardando}
                            rows={2}
                            placeholder="Ej. Uno por mesa · Solo en horario de comida"
                            className="w-full px-3 py-2 border rounded text-sm disabled:opacity-50"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Combo */}
                  <div className="rounded-lg border-2 border-purple-300 bg-purple-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>🔗</span>
                        <h4 className="text-sm font-semibold text-purple-900">Combo (agrupa varios recursos)</h4>
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm text-purple-900">
                        <input
                          type="checkbox"
                          checked={editEsCombo}
                          onChange={(e) => setEditEsCombo(e.target.checked)}
                          disabled={guardando}
                        />
                        Es un combo
                      </label>
                    </div>
                    <p className="text-xs text-purple-800">
                      Un combo agrupa 2 o más recursos del pueblo bajo un único QR y precio. Al validar el combo, se marcan como visitados todos los componentes. Los componentes no pueden ser a su vez otros combos.
                    </p>
                    {editEsCombo && (
                      <div className="max-h-64 overflow-y-auto rounded border bg-white p-2">
                        {recursos.filter((x) => x.id !== r.id && !x.esCombo).length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No hay otros recursos disponibles en este pueblo para añadir al combo.</p>
                        ) : (
                          recursos
                            .filter((x) => x.id !== r.id && !x.esCombo)
                            .map((x) => {
                              const checked = editComboComponentesIds.includes(x.id);
                              return (
                                <label key={x.id} className="flex items-center gap-2 py-1 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      setEditComboComponentesIds((prev) =>
                                        e.target.checked
                                          ? [...prev, x.id]
                                          : prev.filter((id) => id !== x.id),
                                      );
                                    }}
                                    disabled={guardando}
                                  />
                                  <span className="font-medium">{x.nombre}</span>
                                  <span className="text-muted-foreground">· {x.tipo || '—'}</span>
                                </label>
                              );
                            })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Precios por tramo */}
                  <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden>💶</span>
                        <h4 className="text-sm font-semibold text-slate-800">Precios por tramo de edad o público</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setEditPrecios((prev) => [
                            ...prev,
                            { etiqueta: '', edadMin: null, edadMax: null, precioCents: 0, aplicaDescuentoClub: true, orden: prev.length },
                          ])
                        }
                        disabled={guardando}
                        className="px-3 py-1 text-xs border rounded bg-white hover:bg-muted/30 disabled:opacity-50"
                      >
                        + Añadir tramo
                      </button>
                    </div>
                    <p className="text-xs text-slate-600">
                      Si añades tramos, sustituirán al precio único para los socios del Club. El descuento solo se aplica en los tramos donde marques "Aplica descuento Club".
                    </p>

                    {editPrecios.length === 0 ? (
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
                            {editPrecios.map((p, i) => (
                              <tr key={i} className="border-t">
                                <td className="py-1 pr-2">
                                  <input
                                    type="text"
                                    value={p.etiqueta}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setEditPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, etiqueta: val } : q)));
                                    }}
                                    disabled={guardando}
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
                                      setEditPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, edadMin: v === '' ? null : Number(v) } : q)));
                                    }}
                                    disabled={guardando}
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
                                      setEditPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, edadMax: v === '' ? null : Number(v) } : q)));
                                    }}
                                    disabled={guardando}
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
                                      setEditPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, precioCents: cents } : q)));
                                    }}
                                    disabled={guardando}
                                    className="w-full px-2 py-1 border rounded text-sm disabled:opacity-50 font-mono"
                                  />
                                </td>
                                <td className="py-1 pr-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={p.aplicaDescuentoClub}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setEditPrecios((prev) => prev.map((q, j) => (j === i ? { ...q, aplicaDescuentoClub: checked } : q)));
                                    }}
                                    disabled={guardando}
                                  />
                                </td>
                                <td className="py-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditPrecios((prev) => prev.filter((_, j) => j !== i))}
                                    disabled={guardando}
                                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                    title="Eliminar tramo"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
                            🎁 Regalo
                          </span>
                        )}
                        {r.esCombo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-50 text-purple-700 border border-purple-200">
                            🔗 Combo ({r.comboItems?.length ?? 0})
                          </span>
                        )}
                        {(r.precios?.length ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-700 border border-slate-300">
                            💶 {r.precios!.length} tramo{r.precios!.length > 1 ? 's' : ''}
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
                    <button type="button" onClick={() => handleIniciarEdicion(r)} className="px-3 py-1 text-sm border rounded hover:bg-muted/30">
                      Editar
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
