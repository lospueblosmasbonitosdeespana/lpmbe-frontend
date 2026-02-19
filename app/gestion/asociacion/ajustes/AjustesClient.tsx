'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

type Settings = {
  brandName: string;
  activeLogo: 'default' | 'variant' | 'text';
  logoUrl: string | null;
  logoAlt: string;
  logoVariantUrl: string | null;
};

type Logo = {
  id: number;
  nombre: string;
  url: string;
  etiqueta: string | null;
};

export default function AjustesClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [activeLogo, setActiveLogo] = useState<'default' | 'variant' | 'text'>('text');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoAlt, setLogoAlt] = useState('');
  const [logoVariantUrl, setLogoVariantUrl] = useState<string | null>(null);

  // Biblioteca de logos
  const [logos, setLogos] = useState<Logo[]>([]);

  // Crear logo (formulario inline)
  const [showNewLogoForm, setShowNewLogoForm] = useState(false);
  const [newLogoNombre, setNewLogoNombre] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newLogoEtiqueta, setNewLogoEtiqueta] = useState('');
  const [newLogoDestino, setNewLogoDestino] = useState<'header' | 'footer' | 'ambos'>('header');
  const [creatingLogo, setCreatingLogo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadLogos = useCallback(async () => {
    try {
      const logosRes = await fetch('/api/admin/logos', { cache: 'no-store' });
      if (logosRes.ok) {
        const logosData = await logosRes.json();
        setLogos(Array.isArray(logosData) ? logosData : []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [settingsRes, logosRes] = await Promise.all([
          fetch('/api/admin/site-settings', { cache: 'no-store' }),
          fetch('/api/admin/logos', { cache: 'no-store' }),
        ]);

        if (settingsRes.status === 401) {
          window.location.href = '/entrar';
          return;
        }
        if (!settingsRes.ok) throw new Error('Error cargando ajustes');

        const data: Settings = await settingsRes.json();
        setBrandName(data.brandName);
        setActiveLogo(data.activeLogo);
        setLogoUrl(data.logoUrl);
        setLogoAlt(data.logoAlt);
        setLogoVariantUrl(data.logoVariantUrl);

        if (logosRes.ok) {
          const logosData = await logosRes.json();
          setLogos(Array.isArray(logosData) ? logosData : []);
        }
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUploadLogo(file: File) {
    setUploadingLogo(true);
    setError(null);
    try {
      const { uploadImageToR2 } = await import('@/src/lib/uploadHelper');
      const { url } = await uploadImageToR2(file, 'logos');
      setNewLogoUrl(url);
      if (!newLogoNombre.trim()) {
        setNewLogoNombre(file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error subiendo imagen a R2');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleCreateLogo(e: React.FormEvent) {
    e.preventDefault();
    if (!newLogoUrl.trim()) {
      setError('Primero sube una imagen');
      return;
    }
    if (!newLogoNombre.trim()) {
      setError('El nombre del logo es obligatorio');
      return;
    }
    setCreatingLogo(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newLogoNombre.trim(),
          url: newLogoUrl.trim(),
          etiqueta: newLogoEtiqueta.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Error creando logo');
      await loadLogos();

      const createdUrl = newLogoUrl.trim();

      if (newLogoDestino === 'header' || newLogoDestino === 'ambos') {
        setLogoUrl(createdUrl);
        setActiveLogo('default');
      }
      if (newLogoDestino === 'footer' || newLogoDestino === 'ambos') {
        setLogoVariantUrl(createdUrl);
      }

      // Auto-guardar los ajustes
      const payload: Settings = {
        brandName: brandName.trim() || 'LPBME',
        activeLogo: (newLogoDestino === 'header' || newLogoDestino === 'ambos') ? 'default' : activeLogo,
        logoUrl: (newLogoDestino === 'header' || newLogoDestino === 'ambos') ? createdUrl : logoUrl,
        logoAlt: logoAlt.trim() || 'Logo',
        logoVariantUrl: (newLogoDestino === 'footer' || newLogoDestino === 'ambos') ? createdUrl : logoVariantUrl,
      };
      await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setShowNewLogoForm(false);
      setNewLogoNombre('');
      setNewLogoUrl('');
      setNewLogoEtiqueta('');
      setNewLogoDestino('header');
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? 'Error al crear logo');
    } finally {
      setCreatingLogo(false);
    }
  }

  async function handleDeleteLogo(logo: Logo, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`¿Eliminar el logo "${logo.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/logos/${logo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando logo');
      if (logoUrl === logo.url) setLogoUrl(null);
      if (logoVariantUrl === logo.url) setLogoVariantUrl(null);
      await loadLogos();
    } catch (e: any) {
      setError(e?.message ?? 'Error al eliminar');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!brandName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const payload: Settings = {
        brandName: brandName.trim(),
        activeLogo,
        logoUrl,
        logoAlt: logoAlt.trim() || 'Logo',
        logoVariantUrl,
      };

      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? 'Error guardando');
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mt-6 text-gray-600">Cargando...</div>;
  }

  const selectedHeaderLogo = logos.find((l) => l.url === logoUrl);
  const selectedFooterLogo = logos.find((l) => l.url === logoVariantUrl);

  return (
    <form onSubmit={handleSave} className="mt-6 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Ajustes guardados correctamente
        </div>
      )}

      {/* Nombre de marca */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Nombre de marca</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="LPBME"
          required
        />
        <p className="text-xs text-gray-500">
          Nombre que aparece cuando el logo está en modo texto
        </p>
      </div>

      {/* ALT del logo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Texto alternativo (ALT)</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2"
          value={logoAlt}
          onChange={(e) => setLogoAlt(e.target.value)}
          placeholder="Los Pueblos Más Bonitos de España"
        />
        <p className="text-xs text-gray-500">
          Descripción del logo para accesibilidad y SEO
        </p>
      </div>

      {/* Modo de logo del header */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Modo de logo (Header)</label>
        <select
          className="w-full rounded-md border px-3 py-2"
          value={activeLogo}
          onChange={(e) => setActiveLogo(e.target.value as any)}
        >
          <option value="text">Texto (nombre de marca)</option>
          <option value="default">Logo principal (Header)</option>
          <option value="variant">Logo variante (Footer)</option>
        </select>
      </div>

      {/* Crear nuevo logo (sube a R2) */}
      <div className="space-y-3 rounded-md border border-dashed border-gray-300 bg-gray-50/50 p-4">
        {!showNewLogoForm ? (
          <button
            type="button"
            onClick={() => setShowNewLogoForm(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + Subir nuevo logo
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Subir nuevo logo</span>
              <button
                type="button"
                onClick={() => {
                  setShowNewLogoForm(false);
                  setNewLogoNombre('');
                  setNewLogoUrl('');
                  setNewLogoEtiqueta('');
                  setNewLogoDestino('header');
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancelar
              </button>
            </div>

            <form onSubmit={handleCreateLogo} className="space-y-4">
              {/* Paso 1: Imagen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Selecciona la imagen
                </label>
                {!newLogoUrl ? (
                  <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition ${
                    uploadingLogo ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                  }`}>
                    {uploadingLogo ? (
                      <div className="text-center">
                        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-primary">Subiendo a R2...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="mx-auto mb-2 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0-3 3m3-3 3 3M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" />
                        </svg>
                        <p className="text-sm font-medium text-gray-600">Haz clic para seleccionar imagen</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG, WebP</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadLogo(f);
                      }}
                    />
                  </label>
                ) : (
                  <div className="relative flex items-center gap-4 rounded-lg border bg-white p-4">
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded border bg-gray-50 p-2">
                      <img src={newLogoUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700">Imagen subida correctamente</p>
                      <p className="text-xs text-gray-400 truncate mt-1">{newLogoUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewLogoUrl('')}
                      className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Cambiar imagen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Paso 2: Nombre y etiqueta */}
              {newLogoUrl && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        2. Nombre del logo
                      </label>
                      <input
                        type="text"
                        value={newLogoNombre}
                        onChange={(e) => setNewLogoNombre(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="Ej: Logo principal"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etiqueta (opcional)
                      </label>
                      <input
                        type="text"
                        value={newLogoEtiqueta}
                        onChange={(e) => setNewLogoEtiqueta(e.target.value)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="transparente, principal..."
                      />
                    </div>
                  </div>

                  {/* Paso 3: Destino */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3. ¿Dónde quieres usarlo?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { value: 'header' as const, label: 'Header (navegación)' },
                        { value: 'footer' as const, label: 'Footer (pie de página)' },
                        { value: 'ambos' as const, label: 'Header y Footer' },
                      ]).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewLogoDestino(opt.value)}
                          className={`rounded-full border px-4 py-1.5 text-sm transition ${
                            newLogoDestino === opt.value
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-primary'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingLogo || !newLogoNombre.trim()}
                    className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {creatingLogo ? 'Creando y asignando...' : `Crear logo y asignar a ${newLogoDestino === 'ambos' ? 'Header y Footer' : newLogoDestino === 'header' ? 'Header' : 'Footer'}`}
                  </button>
                </>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Selector de logo Header */}
      <div className="space-y-3 rounded-md border p-4">
        <label className="block text-sm font-medium">Logo del Header</label>
        <p className="text-xs text-gray-500">
          Aparece en la barra de navegación principal
        </p>

        {logos.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay logos. Usa &quot;Añadir logo nuevo&quot; arriba o{' '}
            <Link href="/gestion/asociacion/logos" className="text-primary hover:underline">
              Biblioteca de logos
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {logos.map((logo) => {
              const isSelected = logo.url === logoUrl;
              return (
                <div
                  key={logo.id}
                  className={`relative flex flex-col items-center rounded-lg border-2 p-3 transition ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-gray-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setLogoUrl(logo.url)}
                    className="flex w-full flex-col items-center"
                  >
                    <div className="flex h-16 w-full items-center justify-center">
                      <img
                        src={logo.url}
                        alt={logo.nombre}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="mt-2 text-xs font-medium text-center leading-tight">
                      {logo.nombre}
                    </span>
                    {logo.etiqueta && (
                      <span className="mt-0.5 text-[10px] text-gray-400">{logo.etiqueta}</span>
                    )}
                    {isSelected && (
                      <span className="mt-1 text-[10px] font-semibold text-primary">✓ Header</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteLogo(logo, e)}
                    className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar logo"
                    aria-label="Eliminar logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selector de logo Footer / variante */}
      <div className="space-y-3 rounded-md border p-4">
        <label className="block text-sm font-medium">Logo del Footer (variante)</label>
        <p className="text-xs text-gray-500">
          Aparece en el pie de página. Puede ser el mismo o uno diferente.
        </p>

        {logos.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay logos. Usa &quot;Añadir logo nuevo&quot; arriba o{' '}
            <Link href="/gestion/asociacion/logos" className="text-primary hover:underline">
              Biblioteca de logos
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setLogoVariantUrl(null)}
              className={`flex flex-col items-center rounded-lg border-2 p-3 transition ${
                !logoVariantUrl
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-gray-400'
              }`}
            >
              <div className="flex h-16 w-full items-center justify-center text-gray-400">
                —
              </div>
              <span className="mt-2 text-xs font-medium">Sin logo</span>
              {!logoVariantUrl && (
                <span className="mt-1 text-[10px] font-semibold text-primary">✓ Footer</span>
              )}
            </button>
            {logos.map((logo) => {
              const isSelected = logo.url === logoVariantUrl;
              return (
                <div
                  key={logo.id}
                  className={`relative flex flex-col items-center rounded-lg border-2 p-3 transition ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-gray-400'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setLogoVariantUrl(logo.url)}
                    className="flex w-full flex-col items-center"
                  >
                    <div className="flex h-16 w-full items-center justify-center">
                      <img
                        src={logo.url}
                        alt={logo.nombre}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="mt-2 text-xs font-medium text-center leading-tight">
                      {logo.nombre}
                    </span>
                    {logo.etiqueta && (
                      <span className="mt-0.5 text-[10px] text-gray-400">{logo.etiqueta}</span>
                    )}
                    {isSelected && (
                      <span className="mt-1 text-[10px] font-semibold text-primary">✓ Footer</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteLogo(logo, e)}
                    className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar logo"
                    aria-label="Eliminar logo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enlace a biblioteca de logos */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>¿Necesitas más logos?</strong>{' '}
          Añade, edita o elimina logos desde la{' '}
          <Link href="/gestion/asociacion/logos" className="font-medium underline">
            Biblioteca de logos
          </Link>
          . Todos los logos que añadas allí estarán disponibles aquí y en las rutas.
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar ajustes'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/gestion/asociacion')}
          className="rounded-md border px-6 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
