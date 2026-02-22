'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, X, Check, Upload } from 'lucide-react';

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
  orden?: number;
  _count?: { rutas: number };
};

export default function AjustesClient() {
  const router = useRouter();

  // --- Brand settings ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [activeLogo, setActiveLogo] = useState<'default' | 'variant' | 'text'>('text');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoAlt, setLogoAlt] = useState('');
  const [logoVariantUrl, setLogoVariantUrl] = useState<string | null>(null);

  // --- Logo library ---
  const [logos, setLogos] = useState<Logo[]>([]);
  const [libError, setLibError] = useState<string | null>(null);

  // Form: new/edit logo
  const [editingId, setEditingId] = useState<number | null>(null); // -1 = new
  const [form, setForm] = useState({ nombre: '', url: '', etiqueta: '' });
  const [libSaving, setLibSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Quick-assign feedback
  const [assigningId, setAssigningId] = useState<number | null>(null);

  const loadLogos = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/logos', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogos(Array.isArray(data) ? data : []);
      }
    } catch { /* ignore */ }
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
        if (!settingsRes.ok) throw new Error(`Error cargando ajustes (${settingsRes.status})`);

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
        setSettingsError(e?.message ?? 'Error al cargar');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ---- Brand settings save ----
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) { setSettingsError('El nombre es requerido'); return; }
    setSettingsError(null);
    setSettingsSuccess(false);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName: brandName.trim(), activeLogo, logoUrl, logoAlt: logoAlt.trim() || 'Logo', logoVariantUrl } as Settings),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message ?? 'Error guardando');
      }
      setSettingsSuccess(true);
      setTimeout(() => { router.refresh(); }, 600);
    } catch (e: any) {
      setSettingsError(e?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  // ---- Quick assign (header / footer) ----
  async function assignLogo(logo: Logo, target: 'header' | 'footer') {
    setAssigningId(logo.id);
    try {
      const newLogoUrl = target === 'header' ? logo.url : logoUrl;
      const newVariantUrl = target === 'footer' ? logo.url : logoVariantUrl;
      const newActive = target === 'header' ? 'default' as const : activeLogo;
      const res = await fetch('/api/admin/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandName, activeLogo: newActive, logoUrl: newLogoUrl, logoAlt: logoAlt || 'Logo', logoVariantUrl: newVariantUrl }),
      });
      if (!res.ok) throw new Error('Error asignando');
      setLogoUrl(newLogoUrl);
      setLogoVariantUrl(newVariantUrl);
      setActiveLogo(newActive);
    } catch (e: any) {
      setSettingsError(e?.message ?? 'Error asignando logo');
    } finally {
      setAssigningId(null);
    }
  }

  async function unassignLogo(target: 'header' | 'footer') {
    const newLogoUrl = target === 'header' ? null : logoUrl;
    const newVariantUrl = target === 'footer' ? null : logoVariantUrl;
    const newActive = target === 'header' ? 'text' as const : activeLogo;
    const res = await fetch('/api/admin/site-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandName, activeLogo: newActive, logoUrl: newLogoUrl, logoAlt: logoAlt || 'Logo', logoVariantUrl: newVariantUrl }),
    });
    if (res.ok) {
      setLogoUrl(newLogoUrl);
      setLogoVariantUrl(newVariantUrl);
      setActiveLogo(newActive);
    }
  }

  // ---- Logo library CRUD ----
  function startNew() {
    setEditingId(-1);
    setForm({ nombre: '', url: '', etiqueta: '' });
    setLibError(null);
  }

  function startEdit(logo: Logo) {
    setEditingId(logo.id);
    setForm({ nombre: logo.nombre, url: logo.url, etiqueta: logo.etiqueta ?? '' });
    setLibError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ nombre: '', url: '', etiqueta: '' });
    setLibError(null);
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    setLibError(null);
    try {
      const { uploadImageToR2 } = await import('@/src/lib/uploadHelper');
      const { url, warning } = await uploadImageToR2(file, 'logos');
      if (warning) console.warn('[Logos]', warning);
      setForm((p) => ({ ...p, url }));
      if (!form.nombre.trim()) {
        setForm((p) => ({ ...p, nombre: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') }));
      }
    } catch (e: any) {
      setLibError(e?.message ?? 'Error subiendo imagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveLogo() {
    if (!form.url.trim()) { setLibError('Sube o introduce una URL'); return; }
    if (!form.nombre.trim()) { setLibError('El nombre es obligatorio'); return; }
    setLibSaving(true);
    setLibError(null);
    try {
      const body = { nombre: form.nombre.trim(), url: form.url.trim(), etiqueta: form.etiqueta.trim() || null };
      if (editingId === -1) {
        const res = await fetch('/api/admin/logos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Error creando logo');
      } else {
        const res = await fetch(`/api/admin/logos/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Error actualizando logo');
      }
      await loadLogos();
      cancelEdit();
    } catch (e: any) {
      setLibError(e?.message ?? 'Error al guardar');
    } finally {
      setLibSaving(false);
    }
  }

  async function handleDeleteLogo(logo: Logo) {
    if (!confirm(`¿Eliminar el logo "${logo.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/admin/logos/${logo.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando');
      if (logoUrl === logo.url) { setLogoUrl(null); }
      if (logoVariantUrl === logo.url) { setLogoVariantUrl(null); }
      await loadLogos();
      if (editingId === logo.id) cancelEdit();
    } catch (e: any) {
      setLibError(e?.message ?? 'Error al eliminar');
    }
  }

  if (loading) return <div className="mt-6 text-gray-600">Cargando...</div>;

  const headerLogo = logos.find((l) => l.url === logoUrl);
  const footerLogo = logos.find((l) => l.url === logoVariantUrl);

  return (
    <div className="mt-6 space-y-10">

      {/* ── SECCIÓN 1: Ajustes de marca ── */}
      <section>
        <h2 className="text-lg font-semibold">Identidad de marca</h2>
        <p className="mt-1 text-sm text-muted-foreground">Nombre, logo activo y texto alternativo.</p>

        <form onSubmit={handleSaveSettings} className="mt-4 space-y-4 rounded-xl border p-5">
          {settingsError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{settingsError}</div>
          )}
          {settingsSuccess && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">Ajustes guardados correctamente</div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Nombre de marca</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="LPBME"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Se muestra cuando el logo está en modo texto</p>
            </div>
            <div>
              <label className="block text-sm font-medium">Texto alternativo (ALT)</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                value={logoAlt}
                onChange={(e) => setLogoAlt(e.target.value)}
                placeholder="Los Pueblos Más Bonitos de España"
              />
              <p className="mt-1 text-xs text-gray-500">Para accesibilidad y SEO</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Logo activo en el Header</label>
            <select
              className="mt-1 rounded-md border px-3 py-2 text-sm"
              value={activeLogo}
              onChange={(e) => setActiveLogo(e.target.value as 'default' | 'variant' | 'text')}
            >
              <option value="text">Texto (nombre de marca)</option>
              <option value="default">Logo principal (Header asignado)</option>
              <option value="variant">Logo variante (Footer asignado)</option>
            </select>
          </div>

          {/* Resumen de logos asignados */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <span className="font-medium text-muted-foreground">Header:</span>
              {headerLogo ? (
                <>
                  <img src={headerLogo.url} alt={headerLogo.nombre} className="h-8 max-w-[80px] object-contain" />
                  <span>{headerLogo.nombre}</span>
                  <button type="button" onClick={() => unassignLogo('header')} className="text-xs text-destructive hover:underline">Quitar</button>
                </>
              ) : (
                <span className="text-muted-foreground italic">Sin logo asignado</span>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <span className="font-medium text-muted-foreground">Footer:</span>
              {footerLogo ? (
                <>
                  <img src={footerLogo.url} alt={footerLogo.nombre} className="h-8 max-w-[80px] object-contain" />
                  <span>{footerLogo.nombre}</span>
                  <button type="button" onClick={() => unassignLogo('footer')} className="text-xs text-destructive hover:underline">Quitar</button>
                </>
              ) : (
                <span className="text-muted-foreground italic">Sin logo asignado</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar ajustes'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/gestion/asociacion')}
              className="rounded-md border px-6 py-2 text-sm hover:bg-muted"
            >
              Volver
            </button>
          </div>
        </form>
      </section>

      {/* ── SECCIÓN 2: Biblioteca de logos ── */}
      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Biblioteca de logos</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Gestiona todos los logos. Asígnalos al Header/Footer o úsalos en rutas.
            </p>
          </div>
          {editingId === null ? (
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              Nuevo logo
            </button>
          ) : (
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm hover:bg-muted"
            >
              <X className="h-4 w-4" /> Cancelar
            </button>
          )}
        </div>

        {libError && (
          <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{libError}</div>
        )}

        {/* Formulario nuevo/editar logo */}
        {editingId !== null && (
          <div className="mt-4 rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-medium">{editingId === -1 ? 'Nuevo logo' : 'Editar logo'}</h3>
            <div className="mt-4 space-y-4">
              {/* Imagen */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Imagen</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={form.url}
                    onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                    className="flex-1 rounded-md border px-3 py-2 text-sm"
                    placeholder="URL o sube una imagen →"
                  />
                  <label className={`cursor-pointer rounded-md border px-4 py-2 text-sm transition hover:bg-muted ${uploading ? 'opacity-50' : ''}`}>
                    {uploading ? 'Subiendo…' : 'Subir archivo'}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); }} />
                  </label>
                </div>
                {form.url && (
                  <div className="mt-2 flex h-16 w-32 items-center justify-center rounded-lg border bg-muted p-2">
                    <img src={form.url} alt="Preview" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  className="mt-1 w-full max-w-md rounded-md border px-3 py-2 text-sm"
                  placeholder="Ej: Logotipo original"
                />
              </div>

              {/* Etiqueta */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Etiqueta (opcional)</label>
                <input
                  type="text"
                  value={form.etiqueta}
                  onChange={(e) => setForm((p) => ({ ...p, etiqueta: e.target.value }))}
                  className="mt-1 w-full max-w-md rounded-md border px-3 py-2 text-sm"
                  placeholder="transparente, color, versión…"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  disabled={libSaving}
                  className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {libSaving ? 'Guardando…' : editingId === -1 ? 'Crear logo' : 'Guardar cambios'}
                </button>
                {editingId !== -1 && (
                  <button
                    type="button"
                    onClick={() => editingId > 0 && handleDeleteLogo(logos.find((l) => l.id === editingId)!)}
                    className="rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    Eliminar
                  </button>
                )}
                <button type="button" onClick={cancelEdit} className="rounded-md border px-4 py-2 text-sm hover:bg-muted">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid de logos */}
        {logos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No hay logos todavía. Crea el primero con el botón de arriba.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {logos.map((logo) => {
              const isHeader = logo.url === logoUrl;
              const isFooter = logo.url === logoVariantUrl;
              const isAssigning = assigningId === logo.id;
              return (
                <div
                  key={logo.id}
                  className={`relative flex flex-col overflow-hidden rounded-xl border-2 bg-card transition ${
                    isHeader || isFooter ? 'border-primary/60' : 'border-border'
                  }`}
                >
                  {/* Preview */}
                  <div className="flex h-24 items-center justify-center bg-muted p-3">
                    <img src={logo.url} alt={logo.nombre} className="max-h-full max-w-full object-contain" />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm font-medium leading-tight">{logo.nombre}</p>
                    {logo.etiqueta && <p className="mt-0.5 text-xs text-muted-foreground">{logo.etiqueta}</p>}
                    {logo._count && logo._count.rutas > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Usado en {logo._count.rutas} ruta(s)</p>
                    )}

                    {/* Badges de asignación */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {isHeader && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Check className="h-3 w-3" /> Header
                        </span>
                      )}
                      {isFooter && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Check className="h-3 w-3" /> Footer
                        </span>
                      )}
                    </div>

                    {/* Acciones de asignación */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {!isHeader && (
                        <button
                          type="button"
                          disabled={isAssigning}
                          onClick={() => assignLogo(logo, 'header')}
                          className="rounded border px-2 py-1 text-[11px] font-medium hover:bg-primary hover:text-primary-foreground disabled:opacity-40 transition"
                        >
                          → Header
                        </button>
                      )}
                      {!isFooter && (
                        <button
                          type="button"
                          disabled={isAssigning}
                          onClick={() => assignLogo(logo, 'footer')}
                          className="rounded border px-2 py-1 text-[11px] font-medium hover:bg-primary hover:text-primary-foreground disabled:opacity-40 transition"
                        >
                          → Footer
                        </button>
                      )}
                    </div>

                    {/* Editar / Eliminar */}
                    <div className="mt-2 flex gap-2 border-t pt-2">
                      <button
                        type="button"
                        onClick={() => startEdit(logo)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLogo(logo)}
                        className="flex items-center gap-1 text-xs text-destructive hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
