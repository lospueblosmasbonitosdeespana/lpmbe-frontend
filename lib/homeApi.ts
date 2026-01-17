import { getApiUrl } from "./api";

export type HomeSlide = {
  image: string;
  title?: string;
  subtitle?: string;
  cta?: {
    text: string;
    href: string;
  };
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
      cache: "no-store", // Cambiar a no-store para evitar cache en build
    });

    // Si no es OK, devolver fallback en lugar de lanzar error
    if (!res.ok) {
      console.warn(`[HOME] Backend respondió ${res.status}, usando fallback`);
      return getFallbackHomeConfig();
    }

    return await res.json();
  } catch (err) {
    console.error('[HOME] Error cargando config desde backend:', err);
    // Fallback a config local si falla
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
  const API_BASE = getApiUrl();
  
  const res = await fetch(`${API_BASE}/admin/home`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
      slides: [
        {
          image: "https://via.placeholder.com/1920x800/4a90e2/ffffff?text=Slide+1",
          title: "Bienvenido",
          subtitle: "Explora los pueblos más bonitos",
        },
      ],
      intervalMs: 5000,
    },
    themes: [
      {
        key: "gastronomia",
        title: "Gastronomía",
        image: "https://via.placeholder.com/600x400/e74c3c/ffffff?text=Gastronomia",
        href: "/pueblos?tema=gastronomia",
      },
      {
        key: "naturaleza",
        title: "Naturaleza",
        image: "https://via.placeholder.com/600x400/27ae60/ffffff?text=Naturaleza",
        href: "/pueblos?tema=naturaleza",
      },
      {
        key: "cultura",
        title: "Cultura",
        image: "https://via.placeholder.com/600x400/f39c12/ffffff?text=Cultura",
        href: "/pueblos?tema=cultura",
      },
      {
        key: "familia",
        title: "En familia",
        image: "https://via.placeholder.com/600x400/9b59b6/ffffff?text=Familia",
        href: "/pueblos?tema=familia",
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
