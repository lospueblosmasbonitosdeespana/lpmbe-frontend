import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import HomeConfigForm from './HomeConfigForm';
import type { HomeConfig, HomeSlide } from '@/lib/homeApi';

async function getAdminHomeConfig(token: string): Promise<HomeConfig> {
  const API_BASE = getApiUrl();
  
  try {
    // Llamada DIRECTA al backend admin (sin filtrar ocultas)
    const res = await fetch(`${API_BASE}/admin/home`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[ADMIN HOME] Backend respondió ${res.status}`);
      return getFallbackConfig();
    }

    const data = await res.json();
    
    // Normalizar: asegurar que slides existe y está bien formado
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

    // Normalizar cada slide (SIN filtrar por hidden ni por image vacío)
    slides = slides
      .map((s: any) => ({
        image: typeof s?.image === 'string' ? s.image : '',
        alt: typeof s?.alt === 'string' ? s.alt : '',
        hidden: !!s?.hidden,
        title: typeof s?.title === 'string' ? s.title : undefined,
        subtitle: typeof s?.subtitle === 'string' ? s.subtitle : undefined,
        cta: s?.cta && typeof s.cta === 'object' ? s.cta : undefined,
      }))
      .slice(0, 5);  // Solo limitar cantidad

    // Normalizar themes: usar del backend o fallback local
    const fallback = getFallbackConfig();
    const themes = Array.isArray(data.themes) && data.themes.length > 0 
      ? data.themes 
      : fallback.themes;

    return {
      hero: {
        title: hero.title ?? '',
        subtitle: hero.subtitle ?? '',
        intervalMs: Number(hero.intervalMs) || 6000,
        slides,
      },
      themes,
      homeRutas: {
        enabled: data.homeRutas?.enabled ?? true,
        count: data.homeRutas?.count ?? 4,
      },
      actualidad: {
        limit: data.actualidad?.limit ?? 6,
      },
      mapPreviewImage: typeof data.mapPreviewImage === 'string' ? data.mapPreviewImage : '',
      shopBannerImage: typeof data.shopBannerImage === 'string' ? data.shopBannerImage : '',
    };
  } catch (err) {
    console.error('[ADMIN HOME] Error cargando config:', err);
    return getFallbackConfig();
  }
}

function getFallbackConfig(): HomeConfig {
  return {
    hero: {
      title: "Los Pueblos Más Bonitos de España",
      subtitle: "Descubre la esencia de nuestros pueblos",
      slides: [],
      intervalMs: 6000,
    },
    themes: [
      {
        key: "gastronomia",
        title: "Gastronomía",
        image: "",
        href: "/experiencias/gastronomia",
      },
      {
        key: "naturaleza",
        title: "Naturaleza",
        image: "",
        href: "/experiencias/naturaleza",
      },
      {
        key: "cultura",
        title: "Cultura",
        image: "",
        href: "/experiencias/cultura",
      },
      {
        key: "en-familia",
        title: "En familia",
        image: "",
        href: "/experiencias/en-familia",
      },
      {
        key: "petfriendly",
        title: "Petfriendly",
        image: "",
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
    mapPreviewImage: '',
    shopBannerImage: '',
  };
}

export default async function GestionHomePage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const token = await getToken();
  if (!token) redirect('/entrar');

  // Cargar configuración ADMIN (sin filtrar ocultas)
  const config = await getAdminHomeConfig(token);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Configuración del Home</h1>
      <p className="mt-2 text-sm text-gray-600">
        Personaliza el contenido de la página principal
      </p>

      <div className="mt-8">
        <HomeConfigForm initialConfig={config} />
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver a gestión asociación
        </Link>
      </div>
    </main>
  );
}
