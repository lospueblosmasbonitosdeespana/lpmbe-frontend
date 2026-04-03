'use client';

import { useCallback, useEffect, useState } from 'react';

type Oferta = {
  id: number;
  recursoId: number;
  tipoOferta: string;
  titulo: string;
  descripcion: string | null;
  descuentoPorcentaje: number | null;
  valorFijoCents: number | null;
  aplicaA: string | null;
  condicionTexto: string | null;
  importeMinimoCents: number | null;
  minNoches: number | null;
  minComensales: number | null;
  activo: boolean;
  destacada: boolean;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  orden: number;
};

type OfertaForm = {
  tipoOferta: string;
  titulo: string;
  descripcion: string;
  descuentoPorcentaje: string;
  valorFijoCents: string;
  aplicaA: string;
  condicionTexto: string;
  importeMinimoCents: string;
  minNoches: string;
  minComensales: string;
  destacada: boolean;
  vigenciaDesde: string;
  vigenciaHasta: string;
};

const EMPTY_FORM: OfertaForm = {
  tipoOferta: 'DESCUENTO_PORCENTAJE',
  titulo: '',
  descripcion: '',
  descuentoPorcentaje: '',
  valorFijoCents: '',
  aplicaA: '',
  condicionTexto: '',
  importeMinimoCents: '',
  minNoches: '',
  minComensales: '',
  destacada: false,
  vigenciaDesde: '',
  vigenciaHasta: '',
};

const TIPO_OFERTA_LABELS: Record<string, string> = {
  DESCUENTO_PORCENTAJE: 'Descuento %',
  REGALO: 'Regalo',
  MENU_ESPECIAL: 'Menú especial',
  NOCHE_GRATIS: 'Noche gratis',
  UPGRADE: 'Upgrade',
  DOS_POR_UNO: '2x1',
  ENVIO_GRATIS: 'Envío gratis',
  OTRO: 'Otro',
};

const TIPO_OFERTA_ICONS: Record<string, string> = {
  DESCUENTO_PORCENTAJE: '✂️',
  REGALO: '🎁',
  MENU_ESPECIAL: '🍽️',
  NOCHE_GRATIS: '🌙',
  UPGRADE: '⬆️',
  DOS_POR_UNO: '🔄',
  ENVIO_GRATIS: '📦',
  OTRO: '📌',
};

const APLICA_A_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  HOTEL: [
    { value: 'HABITACION', label: 'Por habitación' },
    { value: 'PERSONA', label: 'Por persona' },
    { value: 'RESERVA', label: 'Por reserva' },
  ],
  CASA_RURAL: [
    { value: 'HABITACION', label: 'Por habitación' },
    { value: 'PERSONA', label: 'Por persona' },
    { value: 'RESERVA', label: 'Por reserva' },
  ],
  RESTAURANTE: [
    { value: 'PERSONA', label: 'Por persona' },
    { value: 'MESA', label: 'Por mesa' },
  ],
  BAR: [
    { value: 'PERSONA', label: 'Por persona' },
    { value: 'MESA', label: 'Por mesa' },
  ],
  BODEGA: [
    { value: 'PERSONA', label: 'Por persona' },
    { value: 'GRUPO', label: 'Por grupo' },
  ],
  COMERCIO: [
    { value: 'COMPRA', label: 'Por compra' },
  ],
  TIENDA_ARTESANIA: [
    { value: 'COMPRA', label: 'Por compra' },
  ],
  EXPERIENCIA: [
    { value: 'PERSONA', label: 'Por persona' },
    { value: 'GRUPO', label: 'Por grupo' },
  ],
};

type Template = {
  tipoOferta: string;
  titulo: string;
  descuentoPorcentaje?: number;
  aplicaA?: string;
  condicionTexto?: string;
  minNoches?: number;
};

const TEMPLATES_BY_TIPO: Record<string, Template[]> = {
  HOTEL: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en alojamiento', descuentoPorcentaje: 10, aplicaA: 'HABITACION' },
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en desayuno', descuentoPorcentaje: 15, aplicaA: 'PERSONA' },
    { tipoOferta: 'NOCHE_GRATIS', titulo: '3ª noche gratis', aplicaA: 'HABITACION', condicionTexto: 'Estancia mínima de 2 noches', minNoches: 2 },
    { tipoOferta: 'REGALO', titulo: 'Late checkout gratuito', aplicaA: 'HABITACION' },
    { tipoOferta: 'UPGRADE', titulo: 'Upgrade de habitación', aplicaA: 'RESERVA', condicionTexto: 'Sujeto a disponibilidad' },
    { tipoOferta: 'REGALO', titulo: 'Detalle de bienvenida', aplicaA: 'HABITACION', condicionTexto: 'Cava o cesta de productos locales' },
  ],
  CASA_RURAL: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en estancia', descuentoPorcentaje: 10, aplicaA: 'RESERVA' },
    { tipoOferta: 'NOCHE_GRATIS', titulo: '3ª noche gratis', aplicaA: 'RESERVA', condicionTexto: 'Estancia mínima de 2 noches', minNoches: 2 },
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en desayuno', descuentoPorcentaje: 15, aplicaA: 'PERSONA' },
    { tipoOferta: 'REGALO', titulo: 'Cesta de bienvenida', aplicaA: 'RESERVA', condicionTexto: 'Productos locales del pueblo' },
  ],
  RESTAURANTE: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en menú del día', descuentoPorcentaje: 10, aplicaA: 'PERSONA' },
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en carta', descuentoPorcentaje: 10, aplicaA: 'MESA' },
    { tipoOferta: 'MENU_ESPECIAL', titulo: 'Menú especial para socios', aplicaA: 'PERSONA' },
    { tipoOferta: 'REGALO', titulo: 'Copa o postre de regalo', aplicaA: 'PERSONA' },
    { tipoOferta: 'REGALO', titulo: 'Café o infusión de regalo', aplicaA: 'PERSONA' },
  ],
  BAR: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en consumición', descuentoPorcentaje: 10, aplicaA: 'PERSONA' },
    { tipoOferta: 'REGALO', titulo: 'Tapa de cortesía', aplicaA: 'PERSONA' },
    { tipoOferta: 'DOS_POR_UNO', titulo: '2x1 en cañas', aplicaA: 'PERSONA' },
  ],
  BODEGA: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en visita guiada', descuentoPorcentaje: 15, aplicaA: 'PERSONA' },
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en vinos', descuentoPorcentaje: 10, aplicaA: 'COMPRA' },
    { tipoOferta: 'REGALO', titulo: 'Cata de cortesía', aplicaA: 'PERSONA' },
  ],
  COMERCIO: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento general', descuentoPorcentaje: 10, aplicaA: 'COMPRA' },
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en compras superiores a 50€', descuentoPorcentaje: 15, aplicaA: 'COMPRA' },
    { tipoOferta: 'REGALO', titulo: 'Regalo con compra', aplicaA: 'COMPRA' },
    { tipoOferta: 'ENVIO_GRATIS', titulo: 'Envío gratis', aplicaA: 'COMPRA' },
    { tipoOferta: 'DOS_POR_UNO', titulo: '2x1 en producto seleccionado', aplicaA: 'COMPRA' },
  ],
  TIENDA_ARTESANIA: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en artesanía', descuentoPorcentaje: 10, aplicaA: 'COMPRA' },
    { tipoOferta: 'REGALO', titulo: 'Detalle artesanal con la compra', aplicaA: 'COMPRA' },
    { tipoOferta: 'ENVIO_GRATIS', titulo: 'Envío gratis', aplicaA: 'COMPRA' },
  ],
  EXPERIENCIA: [
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento en experiencia', descuentoPorcentaje: 15, aplicaA: 'PERSONA' },
    { tipoOferta: 'DOS_POR_UNO', titulo: '2x1 / Acompañante gratis', aplicaA: 'PERSONA' },
    { tipoOferta: 'DESCUENTO_PORCENTAJE', titulo: 'Descuento para grupos', descuentoPorcentaje: 20, aplicaA: 'GRUPO' },
  ],
};

const APLICA_A_LABELS: Record<string, string> = {
  PERSONA: 'por persona',
  HABITACION: 'por habitación',
  MESA: 'por mesa',
  RESERVA: 'por reserva',
  COMPRA: 'por compra',
  GRUPO: 'por grupo',
};

function ofertaToForm(o: Oferta): OfertaForm {
  return {
    tipoOferta: o.tipoOferta,
    titulo: o.titulo,
    descripcion: o.descripcion ?? '',
    descuentoPorcentaje: o.descuentoPorcentaje != null ? String(o.descuentoPorcentaje) : '',
    valorFijoCents: o.valorFijoCents != null ? String(o.valorFijoCents / 100) : '',
    aplicaA: o.aplicaA ?? '',
    condicionTexto: o.condicionTexto ?? '',
    importeMinimoCents: o.importeMinimoCents != null ? String(o.importeMinimoCents / 100) : '',
    minNoches: o.minNoches != null ? String(o.minNoches) : '',
    minComensales: o.minComensales != null ? String(o.minComensales) : '',
    destacada: o.destacada,
    vigenciaDesde: o.vigenciaDesde ? o.vigenciaDesde.slice(0, 10) : '',
    vigenciaHasta: o.vigenciaHasta ? o.vigenciaHasta.slice(0, 10) : '',
  };
}

function templateToForm(t: Template): OfertaForm {
  return {
    ...EMPTY_FORM,
    tipoOferta: t.tipoOferta,
    titulo: t.titulo,
    descuentoPorcentaje: t.descuentoPorcentaje != null ? String(t.descuentoPorcentaje) : '',
    aplicaA: t.aplicaA ?? '',
    condicionTexto: t.condicionTexto ?? '',
    minNoches: t.minNoches != null ? String(t.minNoches) : '',
  };
}

export default function NegocioOfertas({
  negocioId,
  tipoNegocio,
}: {
  negocioId: number;
  tipoNegocio: string;
}) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OfertaForm>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/club/negocios/${negocioId}/ofertas`);
      if (!res.ok) throw new Error('Error al cargar ofertas');
      const data = await res.json();
      setOfertas(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [negocioId]);

  useEffect(() => { load(); }, [load]);

  const templates = TEMPLATES_BY_TIPO[tipoNegocio] ?? TEMPLATES_BY_TIPO['COMERCIO'] ?? [];
  const aplicaAOptions = APLICA_A_OPTIONS[tipoNegocio] ?? [{ value: 'COMPRA', label: 'Por compra' }];

  const handleSelectTemplate = (t: Template) => {
    setForm(templateToForm(t));
    setShowTemplates(false);
    setShowForm(true);
    setEditingId(null);
  };

  const handleEdit = (o: Oferta) => {
    setForm(ofertaToForm(o));
    setEditingId(o.id);
    setShowForm(true);
    setShowTemplates(false);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      setError('El título es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);

    const body: any = {
      tipoOferta: form.tipoOferta,
      titulo: form.titulo.trim(),
    };
    if (form.descripcion.trim()) body.descripcion = form.descripcion.trim();
    if (form.descuentoPorcentaje.trim()) body.descuentoPorcentaje = Number(form.descuentoPorcentaje);
    if (form.valorFijoCents.trim()) body.valorFijoCents = Math.round(Number(form.valorFijoCents) * 100);
    if (form.aplicaA) body.aplicaA = form.aplicaA;
    if (form.condicionTexto.trim()) body.condicionTexto = form.condicionTexto.trim();
    if (form.importeMinimoCents.trim()) body.importeMinimoCents = Math.round(Number(form.importeMinimoCents) * 100);
    if (form.minNoches.trim()) body.minNoches = Number(form.minNoches);
    if (form.minComensales.trim()) body.minComensales = Number(form.minComensales);
    body.destacada = form.destacada;
    if (form.vigenciaDesde) body.vigenciaDesde = form.vigenciaDesde;
    if (form.vigenciaHasta) body.vigenciaHasta = form.vigenciaHasta;

    try {
      const url = editingId
        ? `/api/club/negocios/ofertas/${editingId}`
        : `/api/club/negocios/${negocioId}/ofertas`;
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error al guardar oferta');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ofertaId: number) => {
    if (!confirm('¿Eliminar esta oferta?')) return;
    try {
      await fetch(`/api/club/negocios/ofertas/${ofertaId}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    }
  };

  const toggleActivo = async (o: Oferta) => {
    try {
      await fetch(`/api/club/negocios/ofertas/${o.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !o.activo }),
      });
      await load();
    } catch {}
  };

  if (loading) return <p className="py-2 text-xs text-muted-foreground">Cargando ofertas...</p>;

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">{error}</div>
      )}

      {/* Existing offers list */}
      {ofertas.length > 0 && (
        <div className="space-y-2">
          {ofertas.map((o) => (
            <div
              key={o.id}
              className={`rounded-lg border p-3 transition-colors ${
                o.destacada ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
              } ${!o.activo ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span className="text-lg leading-none mt-0.5">{TIPO_OFERTA_ICONS[o.tipoOferta] ?? '📌'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{o.titulo}</span>
                      {o.descuentoPorcentaje != null && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">
                          -{o.descuentoPorcentaje}%
                        </span>
                      )}
                      {o.valorFijoCents != null && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                          {(o.valorFijoCents / 100).toFixed(2)}€ dto.
                        </span>
                      )}
                      {o.tipoOferta === 'REGALO' && !o.descuentoPorcentaje && !o.valorFijoCents && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                          Gratis
                        </span>
                      )}
                      {o.aplicaA && (
                        <span className="text-[10px] text-muted-foreground">{APLICA_A_LABELS[o.aplicaA] ?? o.aplicaA}</span>
                      )}
                      {o.destacada && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">★ Destacada</span>
                      )}
                    </div>
                    {o.condicionTexto && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{o.condicionTexto}</p>
                    )}
                    {o.descripcion && (
                      <p className="mt-0.5 text-[11px] italic text-muted-foreground">{o.descripcion}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActivo(o)}
                    className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                      o.activo ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title={o.activo ? 'Desactivar' : 'Activar'}
                  >
                    {o.activo ? 'Activa' : 'Inactiva'}
                  </button>
                  <button
                    onClick={() => handleEdit(o)}
                    className="rounded bg-muted px-2 py-1 text-[10px] font-medium text-foreground/80 hover:bg-muted/80"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="rounded bg-red-50 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add offer button / templates panel */}
      {!showForm && !showTemplates && (
        <button
          onClick={() => setShowTemplates(true)}
          className="w-full rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          + Añadir oferta para socios del Club
        </button>
      )}

      {/* Templates panel */}
      {showTemplates && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Elige una plantilla</h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((t, i) => (
              <button
                key={i}
                onClick={() => handleSelectTemplate(t)}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="text-xl">{TIPO_OFERTA_ICONS[t.tipoOferta] ?? '📌'}</span>
                <div>
                  <span className="font-medium text-foreground">{t.titulo}</span>
                  {t.descuentoPorcentaje && (
                    <span className="ml-2 text-xs text-green-600 font-semibold">-{t.descuentoPorcentaje}%</span>
                  )}
                </div>
              </button>
            ))}
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowTemplates(false); setShowForm(true); setEditingId(null); }}
              className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card px-3 py-2.5 text-left text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-xl">✏️</span>
              <span className="font-medium">Crear oferta personalizada</span>
            </button>
          </div>
        </div>
      )}

      {/* Offer form */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {editingId ? 'Editar oferta' : 'Nueva oferta'}
            </h4>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/80">Título de la oferta *</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Ej: 10% de descuento en alojamiento"
            />
          </div>

          {/* Type + Value row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">Tipo</label>
              <select
                value={form.tipoOferta}
                onChange={(e) => setForm((f) => ({ ...f, tipoOferta: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {Object.entries(TIPO_OFERTA_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">Descuento (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.descuentoPorcentaje}
                onChange={(e) => setForm((f) => ({ ...f, descuentoPorcentaje: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Ej: 10"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">O importe fijo (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valorFijoCents}
                onChange={(e) => setForm((f) => ({ ...f, valorFijoCents: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Ej: 5.00"
              />
            </div>
          </div>

          {/* Aplica a + Conditions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">Aplica a</label>
              <select
                value={form.aplicaA}
                onChange={(e) => setForm((f) => ({ ...f, aplicaA: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="">Sin especificar</option>
                {aplicaAOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">Condiciones</label>
              <input
                value={form.condicionTexto}
                onChange={(e) => setForm((f) => ({ ...f, condicionTexto: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Ej: Estancia mínima 2 noches"
              />
            </div>
          </div>

          {/* Specific conditions based on business type */}
          <div className="grid gap-3 sm:grid-cols-3">
            {(tipoNegocio === 'HOTEL' || tipoNegocio === 'CASA_RURAL') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/80">Mín. noches</label>
                <input
                  type="number"
                  min="1"
                  value={form.minNoches}
                  onChange={(e) => setForm((f) => ({ ...f, minNoches: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            )}
            {(tipoNegocio === 'RESTAURANTE' || tipoNegocio === 'BAR') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/80">Mín. comensales</label>
                <input
                  type="number"
                  min="1"
                  value={form.minComensales}
                  onChange={(e) => setForm((f) => ({ ...f, minComensales: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>
            )}
            {(tipoNegocio === 'COMERCIO' || tipoNegocio === 'TIENDA_ARTESANIA') && (
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/80">Importe mínimo (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.importeMinimoCents}
                  onChange={(e) => setForm((f) => ({ ...f, importeMinimoCents: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Ej: 50"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground/80">Detalles adicionales</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Descripción opcional de la oferta"
            />
          </div>

          {/* Vigencia + Destacada */}
          <div className="grid gap-3 sm:grid-cols-3 items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">Vigencia desde</label>
              <input
                type="date"
                value={form.vigenciaDesde}
                onChange={(e) => setForm((f) => ({ ...f, vigenciaDesde: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/80">Vigencia hasta</label>
              <input
                type="date"
                value={form.vigenciaHasta}
                onChange={(e) => setForm((f) => ({ ...f, vigenciaHasta: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={form.destacada}
                onChange={(e) => setForm((f) => ({ ...f, destacada: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-xs font-medium text-foreground/80">Oferta destacada</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); }}
              className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground/80 hover:bg-muted/40"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar oferta' : 'Crear oferta'}
            </button>
          </div>
        </div>
      )}

      {ofertas.length === 0 && !showForm && !showTemplates && (
        <p className="text-xs text-muted-foreground">
          Aún no has creado ofertas. Usa las plantillas para empezar rápidamente.
        </p>
      )}
    </div>
  );
}
