import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { getTokenFromCookies } from '@/lib/auth';

type FeedItem = {
  id: string | number;
  tipo: 'NOTICIA' | 'EVENTO' | 'ALERTA' | 'ALERTA_PUEBLO' | 'SEMAFORO' | 'METEO';
  titulo: string;
  texto: string;
  fecha: string; // ISO
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  estado?: string | null; // Para SEMAFORO: VERDE, AMARILLO, ROJO, etc.
  motivoPublico?: string | null; // Para SEMAFORO: motivo público del cambio
};

// Helper para normalizar fecha
function normalizeFecha(item: any): string {
  const fecha = item.fecha ?? item.fechaInicio ?? item.createdAt ?? item.updatedAt ?? null;
  if (!fecha) return new Date().toISOString();
  try {
    return new Date(fecha).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// PASO 3: Normalización estricta a 3 colores
function normalizeColorEstado(valor: any): 'VERDE' | 'AMARILLO' | 'ROJO' | null {
  if (!valor) return null;
  
  const str = String(valor).trim().toUpperCase();
  
  // VERDE
  if (str.includes('VERD') || str.includes('GREEN')) {
    return 'VERDE';
  }
  
  // AMARILLO
  if (str.includes('AMAR') || str.includes('YELL')) {
    return 'AMARILLO';
  }
  
  // ROJO
  if (str.includes('ROJ') || str.includes('RED')) {
    return 'ROJO';
  }
  
  return null;
}

// Helper para normalizar item
function normalizeItem(item: any): FeedItem | null {
  const tipo = String(item.tipo ?? item.type ?? '').trim().toUpperCase();
  
  // Solo tipos permitidos
  const tiposPermitidos: FeedItem['tipo'][] = ['NOTICIA', 'EVENTO', 'ALERTA', 'ALERTA_PUEBLO', 'SEMAFORO', 'METEO'];
  if (!tiposPermitidos.includes(tipo as FeedItem['tipo'])) {
    return null;
  }

  // Excluir explícitamente
  if (tipo === 'NOTICIA_PUEBLO' || tipo === 'EVENTO_PUEBLO') {
    return null;
  }

  // Mapear estado y motivoPublico para SEMAFORO
  let estado: string | null = null;
  let motivoPublico: string | null = null;
  let texto = '';
  let titulo = '';

  if (tipo === 'SEMAFORO') {
    // Leer estado directamente del backend (ya viene normalizado)
    estado = item.estado ?? null;
    
    // Si estado viene pero no está normalizado, normalizarlo
    if (estado) {
      const normalized = normalizeColorEstado(estado);
      estado = normalized;
    }
    
    // Leer motivoPublico directamente del backend
    motivoPublico = item.motivoPublico ?? null;
    
    // Para texto: usar motivoPublico si existe, sino contenido
    texto = motivoPublico ?? item.contenido ?? '';
    titulo = item.titulo ?? '(sin título)';
  } else if (tipo === 'METEO') {
    // Para METEO: título especial si no viene
    titulo = item.titulo ?? 'Alerta meteorológica';
    texto = item.contenido ?? item.descripcion ?? item.mensaje ?? '';
  } else {
    // Para otros tipos, usar mapeo normal
    texto = item.contenido ?? item.descripcion ?? item.mensaje ?? '';
    titulo = item.titulo ?? '(sin título)';
  }

  return {
    id: item.id ?? item.refId ?? Math.random(),
    tipo: tipo as FeedItem['tipo'],
    titulo: titulo,
    texto: String(texto),
    fecha: normalizeFecha(item),
    pueblo: item.pueblo ?? null,
    estado: estado ? String(estado).toUpperCase() : null,
    motivoPublico: motivoPublico ? String(motivoPublico).trim() : null,
  };
}

export async function GET() {
  try {
    const API_BASE = getApiUrl();
    const token = await getTokenFromCookies();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // PASO 2: Hacer una llamada al backend y filtrar por tipo
    const upstream = await fetch(`${API_BASE}/notificaciones`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    // PASO 1: Logs temporales para diagnóstico
    let debugInfo: any = {};

    // Si el backend devuelve 401/403, devolver 200 con items vacío (feed público)
    if (upstream.status === 401 || upstream.status === 403) {
      debugInfo = { status: upstream.status, error: 'Unauthorized' };
      console.log('[feed] backend status', upstream.status, 'Unauthorized');
      return NextResponse.json({ items: [], debug: debugInfo }, { status: 200 });
    }

    // Si hay otro error, devolver 200 con items vacío y debug
    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      debugInfo = { status: upstream.status, error: errorText.slice(0, 500) };
      console.log('[feed] backend status', upstream.status);
      console.log('[feed] backend error', errorText.slice(0, 500));
      return NextResponse.json(
        { items: [], debug: debugInfo },
        { status: 200 }
      );
    }

    const text = await upstream.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      debugInfo = { parseError: 'No se pudo parsear JSON' };
      console.log('[feed] parse error');
      return NextResponse.json({ items: [], debug: debugInfo }, { status: 200 });
    }

    const allItems = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);

    // PASO 1: Logs temporales
    console.log('[feed] backend status', upstream.status);
    console.log('[feed] items raw', allItems.length);
    console.log('[feed] tipos sample', allItems.slice(0, 15).map((x: any) => x?.tipo ?? x?.type));

    // NOTA: El backend actualmente NO envía estado/color en notificaciones tipo SEMAFORO
    // Cuando el backend incluya estos campos, el mapeo siguiente los detectará automáticamente

    debugInfo = {
      status: upstream.status,
      itemsRaw: allItems.length,
      tiposSample: allItems.slice(0, 15).map((x: any) => x?.tipo ?? x?.type),
    };

    // Filtrar por tipos permitidos
    const noticias = allItems.filter((n: any) => (n.tipo ?? n.type) === 'NOTICIA');
    const eventos = allItems.filter((n: any) => (n.tipo ?? n.type) === 'EVENTO');
    const alertas = allItems.filter((n: any) => {
      const tipo = (n.tipo ?? n.type)?.toUpperCase();
      return tipo === 'ALERTA' || tipo === 'ALERTA_PUEBLO';
    });
    const semaforos = allItems.filter((n: any) => {
      const tipo = (n.tipo ?? n.type)?.toUpperCase();
      return tipo === 'SEMAFORO';
    });
    const meteo = allItems.filter((n: any) => {
      const tipo = (n.tipo ?? n.type)?.toUpperCase();
      return tipo === 'METEO';
    });

    // PASO 1: Log temporal para inspeccionar estructura real de semáforo
    if (semaforos.length > 0) {
      console.log('[feed] sample semaforo raw', JSON.stringify(semaforos[0], null, 2));
    }

    debugInfo.filtered = {
      noticias: noticias.length,
      eventos: eventos.length,
      alertas: alertas.length,
      semaforos: semaforos.length,
      meteo: meteo.length,
    };

    const filteredItems = [...noticias, ...eventos, ...alertas, ...semaforos, ...meteo];

    // PASO 4: Normalizar todos los items filtrados
    const normalized: FeedItem[] = filteredItems
      .map(normalizeItem)
      .filter((item): item is FeedItem => item !== null);

    // Ordenar por fecha desc (fallbacks: fecha, fechaInicio, createdAt, updatedAt)
    normalized.sort((a, b) => {
      const msA = new Date(a.fecha).getTime();
      const msB = new Date(b.fecha).getTime();
      return msB - msA;
    });

    console.log('[feed] total items raw', allItems.length);
    console.log('[feed] total items normalized', normalized.length);
    console.log('[feed] tipos finales', normalized.map(x => x.tipo));

    // Devolver con debug temporal
    return NextResponse.json(
      {
        items: normalized,
        debug: debugInfo, // Temporal para diagnóstico
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Cualquier error: devolver 200 con items vacío (nunca 500)
    console.error('[feed] error catch', error?.message);
    return NextResponse.json(
      {
        items: [],
        error: error?.message ?? 'Error desconocido',
        debug: { error: error?.message },
      },
      { status: 200 }
    );
  }
}
