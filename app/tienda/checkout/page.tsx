'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/src/store/cart';
import { getUserDirecciones, createDireccion, updateDireccion, deleteDireccion, createCheckout } from '@/src/lib/tiendaApi';
import { formatEUR, toNumber } from '@/src/lib/money';
import { PAISES_ENVIO, getCountryLabel, getCountrySelectValue } from '@/src/lib/countries';
import type { Direccion, CheckoutResponse } from '@/src/types/tienda';
import { normalizeCheckoutResponse } from '@/src/types/tienda';
import StripePaymentClient from './StripePaymentClient';
import CheckoutSummary from './CheckoutSummary';
import { useTranslations } from 'next-intl';

export default function CheckoutPage() {
  const t = useTranslations('tienda');
  const router = useRouter();
  const { items, clear, getTotal } = useCartStore();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [showNewDireccion, setShowNewDireccion] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ orderId: number; clientSecret: string } | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Formulario nueva/editar dirección
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    pais: 'ES',
    paisOtro: '',
    telefono: '',
    esPrincipal: false,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const ok = res.ok;
      setIsLoggedIn(ok);
      
      if (ok) {
        // Usuario está logueado, cargar direcciones
        try {
          const dirs = await getUserDirecciones();
          setDirecciones(dirs);
          
          // Seleccionar principal si existe
          const defaultDir = dirs.find((d) => d.esPrincipal);
          if (defaultDir) {
            setSelectedDireccionId(defaultDir.id);
          } else if (dirs.length > 0) {
            setSelectedDireccionId(dirs[0].id);
          } else {
            setShowNewDireccion(true);
          }
        } catch (e: any) {
          setError('Error cargando direcciones');
        }
      }
    } catch (e: any) {
      setIsLoggedIn(false);
      setError('Error verificando autenticación');
    }
    
    setLoading(false);
  };

  const emptyForm = () => ({
    nombre: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    pais: 'ES',
    paisOtro: '',
    telefono: '',
    esPrincipal: false,
  });

  const handleStartEdit = (dir: Direccion) => {
    setEditingId(dir.id);
    setFormData({
      nombre: dir.nombre,
      direccion: dir.direccion,
      ciudad: dir.ciudad,
      provincia: dir.provincia ?? '',
      codigoPostal: dir.codigoPostal,
      pais: getCountrySelectValue(dir.pais),
      paisOtro: getCountrySelectValue(dir.pais) === 'XX' ? (dir.pais ?? '') : '',
      telefono: dir.telefono ?? '',
      esPrincipal: dir.esPrincipal,
    });
    setShowNewDireccion(true);
    setError(null);
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteDireccion = async (id: number) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    try {
      setDeletingId(id);
      await deleteDireccion(id);
      setDirecciones((prev) => prev.filter((d) => d.id !== id));
      if (selectedDireccionId === id) {
        const remaining = direcciones.filter((d) => d.id !== id);
        setSelectedDireccionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch {
      setError('No se pudo eliminar la dirección');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelForm = () => {
    setShowNewDireccion(false);
    setEditingId(null);
    setFormData(emptyForm());
  };

  const handleSaveDireccion = async () => {
    if (!formData.nombre || !formData.direccion || !formData.ciudad || !formData.codigoPostal) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    const paisFinal = formData.pais === 'XX' ? (formData.paisOtro || 'ES') : formData.pais;
    if (formData.pais === 'XX' && !formData.paisOtro?.trim()) {
      setError('Indica el nombre del país');
      return;
    }

    setProcessing(true);
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
        const updated = await updateDireccion(editingId, payload);
        setDirecciones(direcciones.map((d) => (d.id === editingId ? updated : d)));
        setSelectedDireccionId(updated.id);
        await previewCheckout(updated.id);
      } else {
        const newDir = await createDireccion(payload);
        setDirecciones([...direcciones, newDir]);
        setSelectedDireccionId(newDir.id);
        await previewCheckout(newDir.id);
      }
      handleCancelForm();
    } catch (e: any) {
      setError(e?.message ?? 'Error guardando dirección');
    } finally {
      setProcessing(false);
    }
  };

  // Previsualizar checkout (calcular precios sin crear pedido)
  const previewCheckout = async (direccionId?: number, coupon?: string) => {
    const dirId = direccionId ?? selectedDireccionId;
    if (!dirId) {
      setCheckoutData(null);
      return;
    }

    // Validar que el ID es un número válido
    const shippingAddressId = Number(dirId);
    if (!Number.isInteger(shippingAddressId)) {
      setError('ID de dirección inválido');
      return;
    }

    setError(null);
    
    try {
      // ✅ Payload correcto según backend
      const payload = {
        shippingAddressId,
        items: items.map((item) => ({
          productId: Number(item.product.id),
          cantidad: Math.max(1, parseInt(String(item.quantity ?? 1), 10) || 1),
        })),
        couponCode: coupon,
      };

      // Validar items
      const invalidItem = payload.items.find(
        i => !Number.isInteger(i.productId) || !Number.isInteger(i.cantidad) || i.cantidad < 1
      );
      if (invalidItem) {
        setError('Datos de carrito inválidos');
        return;
      }

      const result = await createCheckout(payload);
      setCheckoutData(normalizeCheckoutResponse(result));
    } catch (e: any) {
      console.error('Error previsualizando checkout:', e);
      setCheckoutData(null);
      
      // Mostrar error específico
      if (e?.message) {
        setError(`No se pudo calcular el total: ${e.message}`);
      } else {
        setError('No se pudo calcular el total. Verifica tu dirección e inténtalo de nuevo.');
      }
    }
  };

  // Aplicar cupón
  const handleApplyCoupon = async (code: string) => {
    setApplyingCoupon(true);
    setError(null);
    
    try {
      await previewCheckout(selectedDireccionId!, code);
    } catch (e: any) {
      throw new Error(e?.message ?? 'Cupón no válido');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Previsualizar cuando cambie la dirección seleccionada
  useEffect(() => {
    if (selectedDireccionId && items.length > 0) {
      previewCheckout(selectedDireccionId);
    }
  }, [selectedDireccionId, items.length]);

  const handleCheckout = async () => {
    if (!selectedDireccionId) {
      setError('Selecciona una dirección de envío');
      return;
    }

    if (!checkoutData) {
      setError('Error calculando el pedido. Recarga la página.');
      return;
    }

    // Verificar Stripe
    if (!checkoutData.stripeConfigured) {
      setError('Los pagos están temporalmente desactivados.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // El checkout ya se calculó en preview, usar el clientSecret
      if (checkoutData.clientSecret) {
        setPayment({
          orderId: checkoutData.orderId,
          clientSecret: checkoutData.clientSecret,
        });
        return;
      }

      // Sin clientSecret (no debería pasar)
      clear();
      router.push(`/tienda/pedido/${checkoutData.orderId}`);
    } catch (e: any) {
      setError(e?.message ?? 'Error procesando el pedido');
    } finally {
      setProcessing(false);
    }
  };

  const total = getTotal();

  // Redirigir si carrito vacío
  if (!loading && items.length === 0) {
    router.push('/tienda/carrito');
    return null;
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <p>{t('loadingText')}</p>
      </main>
    );
  }

  // Sin login
  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">{t('checkoutTitle')}</h1>
        
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">{t('loginRequired')}</h2>
          <p className="text-gray-700 mb-6">
            {t('loginRequiredDesc')}
          </p>
          <button
            onClick={() => router.push('/entrar?redirect=/tienda/checkout')}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {t('loginButton')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">{t('checkoutTitle')}</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Direcciones */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">{t('shippingAddress')}</h2>

            {!showNewDireccion && direcciones.length > 0 && (
              <div className="space-y-3">
                {direcciones.map((dir) => (
                  <div
                    key={dir.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                      selectedDireccionId === dir.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="direccion"
                        checked={selectedDireccionId === dir.id}
                        onChange={() => setSelectedDireccionId(dir.id)}
                        className="mr-3"
                      />
                      <strong>{dir.nombre}</strong>
                      <br />
                      <span className="text-sm text-gray-700">{dir.direccion}</span>
                      <br />
                      <span className="text-sm text-gray-700">
                        {dir.codigoPostal} {dir.ciudad}
                        {dir.provincia ? `, ${dir.provincia}` : ''}
                      </span>
                      <br />
                      <span className="text-sm text-gray-700">{getCountryLabel(dir.pais)}</span>
                      {dir.telefono && (
                        <>
                          <br />
                          <span className="text-sm text-gray-600">Tel: {dir.telefono}</span>
                        </>
                      )}
                      {dir.esPrincipal && (
                        <span className="ml-2 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          {t('principal')}
                        </span>
                      )}
                    </label>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(dir)}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDireccion(dir.id)}
                        disabled={deletingId === dir.id}
                        className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === dir.id ? t('deleting') : t('delete')}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setFormData(emptyForm());
                      setShowNewDireccion(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t('addNewAddress')}
                  </button>
                  <Link
                    href="/mi-cuenta/direcciones"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {t('manageAddresses')}
                  </Link>
                </div>
              </div>
            )}

            {(showNewDireccion || direcciones.length === 0) && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                <h3 className="font-semibold">{editingId ? t('editAddress') : t('newAddress')}</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('address')}
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('city')}
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('province')}
                    </label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('postalCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('country')}
                    </label>
                    <select
                      value={formData.pais}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFormData({
                          ...formData,
                          pais: v,
                          paisOtro: v === 'XX' ? formData.paisOtro : '',
                        });
                      }}
                      className="w-full rounded border border-gray-300 px-3 py-2"
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
                        value={formData.paisOtro}
                        onChange={(e) =>
                          setFormData({ ...formData, paisOtro: e.target.value })
                        }
                        placeholder={t('countryOtherPlaceholder')}
                        className="mt-2 w-full rounded border border-gray-300 px-3 py-2"
                      />
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {t('shippingWorldwide')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.esPrincipal}
                    onChange={(e) =>
                      setFormData({ ...formData, esPrincipal: e.target.checked })
                    }
                  />
                  <span className="text-sm">{t('setAsPrincipal')}</span>
                </label>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleSaveDireccion}
                    disabled={processing}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? t('saving') : t('save')}
                  </button>
                  {direcciones.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
                    >
                      {t('cancel')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CheckoutSummary 
              checkoutData={checkoutData}
              onApplyCoupon={handleApplyCoupon}
              applying={applyingCoupon}
            />

            {payment ? (
              <div className="mt-4">
                <StripePaymentClient 
                  clientSecret={payment.clientSecret} 
                  orderId={payment.orderId} 
                />
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={processing || !selectedDireccionId || !checkoutData?.stripeConfigured}
                className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing ? t('processing') : t('placeOrder')}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
