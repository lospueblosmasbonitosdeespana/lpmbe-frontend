'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, CalendarDays, Map, Bell, ImageIcon, Trash2, BedDouble, UtensilsCrossed, Users } from 'lucide-react';
import TabDatos from './_tabs/TabDatos';
import TabPrograma from './_tabs/TabPrograma';
import TabRuta from './_tabs/TabRuta';
import TabAvisos from './_tabs/TabAvisos';
import TabFotos from './_tabs/TabFotos';
import TabAlojamientos from './_tabs/TabAlojamientos';
import TabRestaurantes from './_tabs/TabRestaurantes';
import TabAsistentes from './_tabs/TabAsistentes';

export type EventoEditDetail = {
  id: number;
  slug: string;
  nombre: string;
  publicado: boolean;
  noindex: boolean;
  logoUrl: string | null;
  pdfUrl: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  heroKicker_es: string | null;
  heroTitulo_es: string | null;
  heroSubtitulo_es: string | null;
  heroIntro_es: string | null;
  heroFederacion_es: string | null;
  contactoTitulo_es: string | null;
  contactoTexto_es: string | null;
  contactoNombre: string | null;
  contactoTelefono: string | null;
  logisticaAirportTitulo_es: string | null;
  logisticaAirportTexto_es: string | null;
  logisticaHotelTitulo_es: string | null;
  logisticaHotelTexto_es: string | null;
  logisticaIdiomasTitulo_es: string | null;
  logisticaIdiomasTexto_es: string | null;
  villagesIntro_es: string | null;
  mapIntro_es: string | null;
  dias: Array<{
    id: number;
    orden: number;
    label_es: string;
    titulo_es: string;
    actos: Array<{ id: number; orden: number; hora: string; texto_es: string }>;
  }>;
  pueblos: Array<{
    id: number;
    puebloId: number;
    orden: number;
    tagline_es: string | null;
    fotoUrl: string | null;
    pueblo: {
      id: number;
      slug: string;
      nombre: string;
      provincia: string;
      foto_destacada: string | null;
      lat: number;
      lng: number;
    };
  }>;
  paradas: Array<{
    id: number;
    orden: number;
    nombre_es: string;
    descripcion_es: string | null;
    lat: number;
    lng: number;
    tipoIcono: string;
    fotoUrl: string | null;
  }>;
  alojamientos: Array<{
    id: number;
    orden: number;
    nombre: string;
    paraTodos: boolean;
    pendiente: boolean;
    fechaCheckIn: string;
    fechaCheckOut: string;
    direccion: string | null;
    ciudad: string | null;
    lat: number | null;
    lng: number | null;
    telefono: string | null;
    web: string | null;
    fotoUrl: string | null;
    notas_es: string | null;
    asignaciones: Array<{ id: number; delegacion: string; persona: string; notas: string | null; orden: number }>;
  }>;
  restaurantes: Array<{
    id: number;
    orden: number;
    nombre: string;
    fecha: string | null;
    tipo: 'comida' | 'cena' | null;
    hora: string | null;
    direccion: string | null;
    ciudad: string | null;
    lat: number | null;
    lng: number | null;
    telefono: string | null;
    web: string | null;
    fotoUrl: string | null;
    notas_es: string | null;
  }>;
  avisos: Array<{
    id: number;
    importancia: 'info' | 'warning' | 'critical';
    texto_es: string;
    activo: boolean;
    expiraAt: string | null;
    createdAt: string;
  }>;
  fotos: Array<{
    id: number;
    url: string;
    pieFoto_es: string | null;
    orden: number;
    visible: boolean;
    fechaFoto: string | null;
    createdAt: string;
  }>;
};

type Tab = 'datos' | 'programa' | 'ruta' | 'alojamientos' | 'restaurantes' | 'avisos' | 'fotos' | 'asistentes';

export default function GranEventoEditor({ eventoId }: { eventoId: number }) {
  const router = useRouter();
  const [evento, setEvento] = useState<EventoEditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('datos');
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/grandes-eventos/${eventoId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('No se ha encontrado el evento');
      const data = (await res.json()) as EventoEditDetail;
      setEvento(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) return <p className="text-sm text-stone-500">Cargando…</p>;
  if (error || !evento) return <p className="text-sm text-red-600">{error ?? 'Evento no encontrado'}</p>;

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${evento.nombre}"? Esto borrará programa, fotos y avisos. No se puede deshacer.`)) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/grandes-eventos/${eventoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Error eliminando');
      router.push('/gestion/asociacion/grandes-eventos');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
      setDeleting(false);
    }
  };

  const TABS: Array<{ id: Tab; label: string; count?: number; Icon: typeof ClipboardList }> = [
    { id: 'datos', label: 'Datos', Icon: ClipboardList },
    { id: 'programa', label: 'Programa', count: evento.dias.length, Icon: CalendarDays },
    { id: 'ruta', label: 'Ruta', count: evento.pueblos.length + (evento.paradas?.length ?? 0), Icon: Map },
    { id: 'alojamientos', label: 'Alojamientos', count: evento.alojamientos?.length ?? 0, Icon: BedDouble },
    { id: 'restaurantes', label: 'Restaurantes', count: evento.restaurantes?.length ?? 0, Icon: UtensilsCrossed },
    { id: 'avisos', label: 'Avisos', count: evento.avisos.filter((a) => a.activo).length, Icon: Bell },
    { id: 'fotos', label: 'Fotos', count: evento.fotos.length, Icon: ImageIcon },
    { id: 'asistentes', label: 'Asistentes', Icon: Users },
  ];

  const publicUrl = evento.slug === 'rencontres-internationales-des-plus-beaux-villages-de-la-terre-2026'
    ? `/${evento.slug}`
    : `/encuentros/${evento.slug}`;

  return (
    <div className="space-y-5">
      {/* Cabecera con identidad del evento */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-900">{evento.nombre}</h2>
            <Link
              href={publicUrl}
              target="_blank"
              className="text-xs font-medium text-amber-700 hover:underline"
            >
              {publicUrl} ↗
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                evento.publicado ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
              }`}
            >
              {evento.publicado ? 'Publicado' : 'Borrador'}
            </span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Eliminando…' : 'Eliminar evento'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-amber-700 text-white shadow-md'
                  : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {typeof t.count === 'number' ? (
                <span
                  className={`ml-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    tab === t.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div>
        {tab === 'datos' && <TabDatos evento={evento} reload={reload} />}
        {tab === 'programa' && <TabPrograma evento={evento} reload={reload} />}
        {tab === 'ruta' && <TabRuta evento={evento} reload={reload} />}
        {tab === 'alojamientos' && <TabAlojamientos evento={evento} reload={reload} />}
        {tab === 'restaurantes' && <TabRestaurantes evento={evento} reload={reload} />}
        {tab === 'avisos' && <TabAvisos evento={evento} reload={reload} />}
        {tab === 'fotos' && <TabFotos evento={evento} reload={reload} />}
        {tab === 'asistentes' && <TabAsistentes />}
      </div>
    </div>
  );
}
