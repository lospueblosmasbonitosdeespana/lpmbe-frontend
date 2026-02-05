import { getApiUrl } from "./api";

export type HomeSlide = {
  image: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  cta?: { text: string; href: string };
  hidden?: boolean; // NUEVO: permite ocultar sin borrar
};

export type HomeTheme = {
  key: string;
  title: string;
  image: string;
  href: string;
};

export type HomeConfig = {
  hero: {
    title: string;
    subtitle: string;
    slides: HomeSlide[];
    intervalMs: number;
  };
  themes: HomeTheme[];
  homeRutas: {
    enabled: boolean;
    count: number;
  };
  actualidad: {
    limit: number;
  };
};

/**
 * Obtener configuración del home desde el backend
 */
export async function getHomeConfig(): Promise<HomeConfig> {
  const API_BASE = getApiUrl();
  
  try {
    const res = await fetch(`${API_BASE}/home`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[HOME] Backend respondió ${res.status}, usando fallback`);
      return getFallbackHomeConfig();
    }

    const data = await res.json();
    
    // Normalizar hero: soportar slides o images legacy
    const hero = data.hero ?? {};
    let slides: HomeSlide[] = [];

    if (Array.isArray(hero.slides)) {
      slides = hero.slides;
    } else if (Array.isArray(hero.images)) {
      // Convertir images legacy a slides
      slides = hero.images.map((u: any) => ({ 
        image: String(u || ''), 
        alt: '', 
        hidden: false 
      }));
    }

    // Normalizar cada slide (sin filtrar por image vacío ni por hidden)
    slides = slides
      .map((s: any) => ({
        image: typeof s?.image === 'string' ? s.image : '',
        alt: typeof s?.alt === 'string' ? s.alt : '',
        hidden: !!s?.hidden,
        title: typeof s?.title === 'string' ? s.title : undefined,
        subtitle: typeof s?.subtitle === 'string' ? s.subtitle : undefined,
        cta: s?.cta && typeof s.cta === 'object' ? s.cta : undefined,
      }))
      .slice(0, 4);  // Máximo 4 slides para carrusel hero
    
    // Si el backend no devuelve themes, usar fallback local
    const fallback = getFallbackHomeConfig();
    
    return {
      hero: {
        title: hero.title ?? '',
        subtitle: hero.subtitle ?? '',
        intervalMs: Number(hero.intervalMs) || 4000,
        slides,
      },
      themes: Array.isArray(data.themes) && data.themes.length > 0 
        ? data.themes 
        : fallback.themes,
      homeRutas: {
        enabled: data.homeRutas?.enabled ?? true,
        count: data.homeRutas?.count ?? 4,
      },
      actualidad: {
        limit: data.actualidad?.limit ?? 6,
      },
    };
  } catch (err) {
    console.error('[HOME] Error cargando config desde backend:', err);
    return getFallbackHomeConfig();
  }
}

/**
 * Actualizar configuración del home (admin)
 */
export async function updateHomeConfig(
  token: string,
  patch: Partial<HomeConfig>
): Promise<void> {
  // Usar proxy de Next.js que maneja auth automáticamente
  const res = await fetch('/api/admin/home', {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error actualizando home: ${res.status} - ${errorText}`);
  }
}

/**
 * Fallback local si el backend no responde
 */
function getFallbackHomeConfig(): HomeConfig {
  return {
    hero: {
      title: "Los Pueblos Más Bonitos de España",
      subtitle: "Descubre la esencia de nuestros pueblos",
      slides: [],
      intervalMs: 4000,
    },
    themes: [
      {
        key: "gastronomia",
        title: "Gastronomía",
        image: "https://via.placeholder.com/600x400/e74c3c/ffffff?text=Gastronomia",
        href: "/experiencias/gastronomia",
      },
      {
        key: "naturaleza",
        title: "Naturaleza",
        image: "https://via.placeholder.com/600x400/27ae60/ffffff?text=Naturaleza",
        href: "/experiencias/naturaleza",
      },
      {
        key: "cultura",
        title: "Cultura",
        image: "https://via.placeholder.com/600x400/f39c12/ffffff?text=Cultura",
        href: "/experiencias/cultura",
      },
      {
        key: "en-familia",
        title: "En familia",
        image: "https://via.placeholder.com/600x400/9b59b6/ffffff?text=Familia",
        href: "/experiencias/en-familia",
      },
      {
        key: "petfriendly",
        title: "Petfriendly",
        image: "https://via.placeholder.com/600x400/3498db/ffffff?text=Petfriendly",
        href: "/experiencias/petfriendly",
      },
    ],
    homeRutas: {
      enabled: true,
      count: 4,
    },
    actualidad: {
      limit: 6,
    },
  };
}
