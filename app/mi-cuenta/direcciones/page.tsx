'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Section } from '@/app/components/ui/section';
import { Container } from '@/app/components/ui/container';
import { Headline, Title, Caption } from '@/app/components/ui/typography';
import {
  getUserDirecciones,
  createDireccion,
  updateDireccion,
  deleteDireccion,
} from '@/src/lib/tiendaApi';
import { PAISES_ENVIO, getCountryLabel, getCountrySelectValue } from '@/src/lib/countries';
import type { Direccion } from '@/src/types/tienda';

const emptyForm = {
  nombre: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  pais: 'ES',
  paisOtro: '',
  telefono: '',
  esPrincipal: false,
};

export default function DireccionesPage() {
  const router = useRouter();
  const t = useTranslations('addresses');
  const tAccount = useTranslations('myAccount');
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
      setError(t('loadError'));
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
    const selVal = getCountrySelectValue(dir.pais);
    setFormData({
      nombre: dir.nombre,
      direccion: dir.direccion,
      ciudad: dir.ciudad,
      provincia: dir.provincia ?? '',
      codigoPostal: dir.codigoPostal,
      pais: selVal,
      paisOtro: selVal === 'XX' ? (dir.pais ?? '') : '',
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
      setError(t('requiredFields'));
      return;
    }
    const paisFinal = formData.pais === 'XX' ? (formData.paisOtro || 'ES') : formData.pais;
    if (formData.pais === 'XX' && !formData.paisOtro?.trim()) {
      setError(t('enterCountryName'));
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
        pais: paisFinal,
        telefono: formData.telefono || null,
        esPrincipal: formData.esPrincipal,
      };

      if (editingId) {
        await updateDireccion(editingId, payload);
        setSuccess(t('addressUpdated'));
      } else {
        await createDireccion(payload);
        setSuccess(t('addressAdded'));
      }

      await loadDirecciones();
      handleCancel();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t('confirmDelete'))) return;

    setDeletingId(id);
    setError(null);

    try {
      await deleteDireccion(id);
      setSuccess(t('addressDeleted'));
      await loadDirecciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrincipal(id: number) {
    setSaving(true);
    setError(null);

    try {
      await updateDireccion(id, { esPrincipal: true });
      setSuccess(t('principalUpdated'));
      await loadDirecciones();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('updateError'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Section spacing="lg" background="default">
        <Container>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">{tAccount('loading')}</p>
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
            <Headline as="h1">{t('title')}</Headline>
            <Caption className="mt-1 block">
              {t('subtitle')}
            </Caption>
          </div>
          <Link
            href="/mi-cuenta"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {tAccount('back')}
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
                {t('savedAddresses')} ({direcciones.length})
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
                      <p className="text-sm text-muted-foreground">{getCountryLabel(dir.pais)}</p>
                      {dir.telefono && (
                        <p className="text-sm text-muted-foreground">Tel: {dir.telefono}</p>
                      )}
                      {dir.esPrincipal && (
                        <span className="mt-2 inline-block rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          {t('principal')}
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
                          {t('setPrincipal')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(dir)}
                        disabled={saving}
                        className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dir.id)}
                        disabled={deletingId === dir.id}
                        className="rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {deletingId === dir.id ? t('deleting') : t('delete')}
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
                {editingId ? t('editAddress') : t('newAddress')}
              </Title>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t('fullName')}</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t('phone')}</label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('address')}</label>
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
                    <label className="block text-sm font-medium">{t('postalCode')}</label>
                    <input
                      type="text"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t('city')}</label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">{t('province')}</label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('country')}</label>
                  <select
                    value={formData.pais}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pais: e.target.value,
                        paisOtro: e.target.value === 'XX' ? formData.paisOtro : '',
                      })
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    {PAISES_ENVIO.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {formData.pais === 'XX' && (
                    <input
                      type="text"
                      placeholder={t('countryPlaceholder')}
                      value={formData.paisOtro}
                      onChange={(e) => setFormData({ ...formData, paisOtro: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  )}
                  <Caption className="mt-1 block">
                    {t('shippingWorldwide')}
                  </Caption>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.esPrincipal}
                    onChange={(e) => setFormData({ ...formData, esPrincipal: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-medium">{t('setAsPrincipal')}</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? t('saving') : t('save')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    {t('cancel')}
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
                  {t('addAddress')}
                </span>
                <Caption className="mt-1">
                  {t('addAddressHint')}
                </Caption>
              </button>
            </div>
          )}

        </div>
      </Container>
    </Section>
  );
}
