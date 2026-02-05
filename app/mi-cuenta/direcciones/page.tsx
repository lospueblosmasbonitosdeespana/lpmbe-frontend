'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';
import {
  getUserDirecciones,
  createDireccion,
  updateDireccion,
  deleteDireccion,
} from '@/src/lib/tiendaApi';
import type { Direccion } from '@/src/types/tienda';

const emptyForm = {
  nombre: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  pais: 'España',
  telefono: '',
  esPrincipal: false,
};

export default function DireccionesPage() {
  const router = useRouter();
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadDirecciones() {
    try {
      const dirs = await getUserDirecciones();
      setDirecciones(dirs);
    } catch (e) {
      if (e instanceof Error && e.message?.includes('401')) {
        router.push('/entrar');
        return;
      }
      setError('Error cargando direcciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDirecciones();
  }, []);

  function handleStartAdd() {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function handleStartEdit(dir: Direccion) {
    setEditingId(dir.id);
    setFormData({
      nombre: dir.nombre,
      direccion: dir.direccion,
      ciudad: dir.ciudad,
      provincia: dir.provincia ?? '',
      codigoPostal: dir.codigoPostal,
      pais: dir.pais ?? 'España',
      telefono: dir.telefono ?? '',
      esPrincipal: dir.esPrincipal,
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nombre || !formData.direccion || !formData.ciudad || !formData.codigoPostal) {
      setError('Completa los campos obligatorios: nombre, dirección, ciudad y código postal');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        nombre: formData.nombre,
        direccion: formData.direccion,
        ciudad: formData.ciudad,
        provincia: formData.provincia || '',
        codigoPostal: formData.codigoPostal,
        pais: formData.pais || 'España',
        telefono: formData.telefono || null,
        esPrincipal: formData.esPrincipal,
      };

      if (editingId) {
        await updateDireccion(editingId, payload);
        setSuccess('Dirección actualizada');
      } else {
        await createDireccion(payload);
        setSuccess('Dirección añadida');
      }

      await loadDirecciones();
      handleCancel();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta dirección?')) return;

    setDeletingId(id);
    setError(null);

    try {
      await deleteDireccion(id);
      setSuccess('Dirección eliminada');
      await loadDirecciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error eliminando');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrincipal(id: number) {
    setSaving(true);
    setError(null);

    try {
      await updateDireccion(id, { esPrincipal: true });
      setSuccess('Dirección principal actualizada');
      await loadDirecciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error actualizando');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Section spacing="lg" background="default">
        <Container>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </Container>
      </Section>
    );
  }

  const cardClass = 'rounded-xl border border-border bg-card p-6 shadow-sm';

  return (
    <Section spacing="lg" background="default">
      <Container>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Headline as="h1">Mis direcciones</Headline>
            <Caption className="mt-1 block">
              Gestiona tus direcciones de envío para compras en la tienda
            </Caption>
          </div>
          <Link
            href="/mi-cuenta"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Volver
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Lista de direcciones */}
          {direcciones.length > 0 && (
            <div className={cardClass}>
              <Title size="lg" className="mb-4">
                Direcciones guardadas ({direcciones.length})
              </Title>
              <div className="space-y-4">
                {direcciones.map((dir) => (
                  <div
                    key={dir.id}
                    className={`flex flex-wrap items-start justify-between gap-4 rounded-lg border p-4 ${
                      dir.esPrincipal ? 'border-primary/30 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div>
                      <p className="font-medium">{dir.nombre}</p>
                      <p className="text-sm text-muted-foreground">{dir.direccion}</p>
                      <p className="text-sm text-muted-foreground">
                        {dir.codigoPostal} {dir.ciudad}
                        {dir.provincia ? `, ${dir.provincia}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">{dir.pais}</p>
                      {dir.telefono && (
                        <p className="text-sm text-muted-foreground">Tel: {dir.telefono}</p>
                      )}
                      {dir.esPrincipal && (
                        <span className="mt-2 inline-block rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!dir.esPrincipal && (
                        <button
                          type="button"
                          onClick={() => handleSetPrincipal(dir.id)}
                          disabled={saving}
                          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                        >
                          Marcar principal
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(dir)}
                        disabled={saving}
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dir.id)}
                        disabled={deletingId === dir.id}
                        className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingId === dir.id ? 'Eliminando…' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario añadir/editar */}
          {showForm ? (
            <div className={cardClass}>
              <Title size="lg" className="mb-4">
                {editingId ? 'Editar dirección' : 'Nueva dirección'}
              </Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Nombre completo *</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">Dirección *</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Código postal *</label>
                    <input
                      type="text"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Ciudad *</label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Provincia</label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">País</label>
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.esPrincipal}
                    onChange={(e) => setFormData({ ...formData, esPrincipal: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">Usar como dirección principal</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={cardClass}>
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <span className="text-lg font-medium text-muted-foreground">
                  + Añadir dirección de envío
                </span>
                <Caption className="mt-1">
                  Guarda una dirección para agilizar tus compras en la tienda
                </Caption>
              </button>
            </div>
          )}

        </div>
      </Container>
    </Section>
  );
}
