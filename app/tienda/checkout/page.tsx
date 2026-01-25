'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/src/store/cart';
import { getUserDirecciones, createDireccion, createCheckout } from '@/src/lib/tiendaApi';
import { formatEUR, toNumber } from '@/src/lib/money';
import type { Direccion, CheckoutResponse } from '@/src/types/tienda';
import StripePaymentClient from './StripePaymentClient';
import CheckoutSummary from './CheckoutSummary';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, getTotal } = useCartStore();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [selectedDireccionId, setSelectedDireccionId] = useState<number | null>(null);
  const [showNewDireccion, setShowNewDireccion] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<{ orderId: number; clientSecret: string } | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Formulario nueva dirección
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    pais: 'España',
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

  const handleCreateDireccion = async () => {
    if (!formData.nombre || !formData.direccion || !formData.ciudad || !formData.codigoPostal) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const newDir = await createDireccion(formData);
      setDirecciones([...direcciones, newDir]);
      setSelectedDireccionId(newDir.id);
      setShowNewDireccion(false);
      
      // Reset form
      setFormData({
        nombre: '',
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        pais: 'España',
        telefono: '',
        esPrincipal: false,
      });
      
      // Previsualizar checkout tras crear dirección
      await previewCheckout(newDir.id);
    } catch (e: any) {
      setError(e?.message ?? 'Error creando dirección');
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

    setError(null);
    
    try {
      const payload = {
        direccionId: dirId,
        items: items.map((item) => ({
          productoId: item.product.id,
          cantidad: item.quantity,
        })),
        couponCode: coupon,
      };

      const result = await createCheckout(payload);
      setCheckoutData(result);
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
        <p>Cargando...</p>
      </main>
    );
  }

  // Sin login
  if (!isLoggedIn) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-8 text-center">
          <h2 className="text-xl font-semibold mb-3">Login requerido</h2>
          <p className="text-gray-700 mb-6">
            Debes iniciar sesión para completar tu compra
          </p>
          <button
            onClick={() => router.push('/entrar?redirect=/tienda/checkout')}
            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Direcciones */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Dirección de envío</h2>

            {!showNewDireccion && direcciones.length > 0 && (
              <div className="space-y-3">
                {direcciones.map((dir) => (
                  <label
                    key={dir.id}
                    className={`block rounded-lg border p-4 cursor-pointer transition-colors ${
                      selectedDireccionId === dir.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="direccion"
                      checked={selectedDireccionId === dir.id}
                      onChange={() => setSelectedDireccionId(dir.id)}
                      className="mr-3"
                    />
                    <strong>{dir.nombre}</strong>
                    <br />
                    {dir.direccion}
                    <br />
                    {dir.codigoPostal} {dir.ciudad}, {dir.provincia}
                    <br />
                    {dir.pais}
                    {dir.telefono && (
                      <>
                        <br />
                        Tel: {dir.telefono}
                      </>
                    )}
                    {dir.esPrincipal && (
                      <span className="ml-3 inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                        Principal
                      </span>
                    )}
                  </label>
                ))}

                <button
                  onClick={() => setShowNewDireccion(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Añadir nueva dirección
                </button>
              </div>
            )}

            {(showNewDireccion || direcciones.length === 0) && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
                <h3 className="font-semibold">Nueva dirección</h3>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre completo *
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
                    Dirección *
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
                      Ciudad *
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
                      Provincia
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
                      Código Postal *
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
                      País
                    </label>
                    <input
                      type="text"
                      value={formData.pais}
                      onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Teléfono
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
                  <span className="text-sm">Establecer como principal</span>
                </label>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={handleCreateDireccion}
                    disabled={processing}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? 'Guardando...' : 'Guardar dirección'}
                  </button>
                  
                  {direcciones.length > 0 && (
                    <button
                      onClick={() => setShowNewDireccion(false)}
                      className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
                    >
                      Cancelar
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
                {processing ? 'Procesando...' : 'Realizar pedido'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
