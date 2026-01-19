'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Settings = {
  brandName: string;
  activeLogo: 'default' | 'variant' | 'text';
  logoUrl: string | null;
  logoAlt: string;
  logoVariantUrl: string | null;
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

  const [uploadingDefault, setUploadingDefault] = useState(false);
  const [uploadingVariant, setUploadingVariant] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/site-settings', { cache: 'no-store' });
        if (res.status === 401) {
          window.location.href = '/entrar';
          return;
        }
        if (!res.ok) throw new Error('Error cargando ajustes');

        const data: Settings = await res.json();
        setBrandName(data.brandName);
        setActiveLogo(data.activeLogo);
        setLogoUrl(data.logoUrl);
        setLogoAlt(data.logoAlt);
        setLogoVariantUrl(data.logoVariantUrl);
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUploadLogo(type: 'default' | 'variant') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
        alert('La imagen pesa demasiado (máx 25MB)');
        return;
      }

      if (type === 'default') setUploadingDefault(true);
      else setUploadingVariant(true);

      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'branding');

        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: fd,
        });

        if (!res.ok) throw new Error('Error subiendo imagen');

        const data = await res.json();
        const url = data?.url ?? data?.publicUrl;

        if (type === 'default') {
          setLogoUrl(url);
        } else {
          setLogoVariantUrl(url);
        }
      } catch (e: any) {
        alert(e?.message ?? 'Error subiendo imagen');
      } finally {
        if (type === 'default') setUploadingDefault(false);
        else setUploadingVariant(false);
      }
    };

    input.click();
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

      {/* Modo de logo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Modo de logo</label>
        <select
          className="w-full rounded-md border px-3 py-2"
          value={activeLogo}
          onChange={(e) => setActiveLogo(e.target.value as any)}
        >
          <option value="text">Texto (nombre de marca)</option>
          <option value="default">Logo principal</option>
          <option value="variant">Logo variante (ej: lazo negro)</option>
        </select>
      </div>

      {/* Logo principal */}
      <div className="space-y-2 rounded-md border p-4">
        <label className="block text-sm font-medium">Logo principal</label>
        
        {logoUrl && (
          <div className="mb-3 rounded-md border bg-gray-50 p-4">
            <p className="mb-2 text-xs text-gray-600">Vista previa:</p>
            <img
              src={logoUrl}
              alt="Logo principal"
              style={{
                height: '32px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => handleUploadLogo('default')}
          disabled={uploadingDefault}
          className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {uploadingDefault ? 'Subiendo...' : logoUrl ? 'Cambiar logo principal' : 'Subir logo principal'}
        </button>
      </div>

      {/* Logo variante */}
      <div className="space-y-2 rounded-md border p-4">
        <label className="block text-sm font-medium">Logo variante</label>
        <p className="text-xs text-gray-500">
          Ej: logo con lazo negro para fechas especiales
        </p>
        
        {logoVariantUrl && (
          <div className="mb-3 rounded-md border bg-gray-50 p-4">
            <p className="mb-2 text-xs text-gray-600">Vista previa:</p>
            <img
              src={logoVariantUrl}
              alt="Logo variante"
              style={{
                height: '32px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => handleUploadLogo('variant')}
          disabled={uploadingVariant}
          className="rounded-md border bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {uploadingVariant ? 'Subiendo...' : logoVariantUrl ? 'Cambiar logo variante' : 'Subir logo variante'}
        </button>
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
