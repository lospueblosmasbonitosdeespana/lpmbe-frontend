// API cliente para la tienda

import { getApiUrl } from '@/lib/api';
import type { Product, ProductImage, Direccion, Order, Coupon, Promotion, CheckoutResponse } from '@/src/types/tienda';

const API_BASE = getApiUrl();

// Helper para obtener token de auth
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Helper para fetch con auth
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Merge existing headers
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}

// ===== PRODUCTOS =====

export async function getProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error cargando productos');
  return res.json();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${API_BASE}/products/slug/${slug}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Error cargando producto');
  return res.json();
}

// ===== DIRECCIONES =====

export async function getUserDirecciones(): Promise<Direccion[]> {
  const res = await fetch('/api/usuarios/me/direcciones', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error cargando direcciones');
  return res.json();
}

export async function createDireccion(data: Omit<Direccion, 'id'>): Promise<Direccion> {
  const res = await fetch('/api/usuarios/me/direcciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando dirección');
  return res.json();
}

export async function updateDireccion(id: number, data: Partial<Omit<Direccion, 'id'>>): Promise<Direccion> {
  const res = await fetch(`/api/usuarios/me/direcciones/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando dirección');
  return res.json();
}

export async function deleteDireccion(id: number): Promise<void> {
  const res = await fetch(`/api/usuarios/me/direcciones/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando dirección');
}

// ===== PROMOCIONES =====

export async function getActivePromotions(): Promise<Promotion[]> {
  const res = await fetch(`${API_BASE}/promotions/active`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// ===== ENVÍO =====

export type ShippingConfig = {
  flatRate: number;
  freeOver: number;
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  const res = await fetch('/api/orders/shipping-config', { cache: 'no-store' });
  if (!res.ok) throw new Error('Error cargando configuración de envío');
  return res.json();
}

// ===== CHECKOUT =====

export type CheckoutPayload = {
  shippingAddressId: number;
  items: Array<{ productId: number; cantidad: number }>;
  couponCode?: string;
};

export async function createCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const res = await fetch('/api/orders/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  
  if (res.status === 503) {
    throw new Error('Pagos no disponibles todavía');
  }
  
  if (!res.ok) {
    // Intentar parsear el error del backend
    try {
      const errorData = await res.json();
      
      // Si el backend devuelve código específico de Stripe no configurado
      if (errorData.code === 'STRIPE_NOT_CONFIGURED') {
        const error: any = new Error('Stripe no configurado');
        error.code = 'STRIPE_NOT_CONFIGURED';
        throw error;
      }
      
      // Error 400 con detalles del backend
      if (res.status === 400) {
        const message = errorData.message || errorData.error || 'Datos de checkout incorrectos';
        throw new Error(message);
      }
      
      throw new Error(errorData.message || errorData.error || `Error ${res.status}`);
    } catch (parseError) {
      if (parseError instanceof Error) throw parseError;
      throw new Error(`Error en checkout (${res.status})`);
    }
  }
  
  return res.json();
}

// ===== ADMIN PRODUCTOS =====

export async function uploadProductImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', 'productos');

  const res = await fetch('/api/admin/uploads', {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error ?? data?.message ?? `Error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : 'Error subiendo imagen');
  }
  const url = data?.url ?? data?.publicUrl;
  if (!url) throw new Error('La subida no devolvió URL');
  return url;
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/products/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/admin/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await fetch(`/api/products/admin/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
}

// ===== ADMIN PEDIDOS =====

export async function getAdminOrders(): Promise<Order[]> {
  const res = await fetch('/api/admin/orders', {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updateOrderStatus(
  id: number,
  payload: { status: string; trackingNumber?: string }
): Promise<Order> {
  const res = await fetch(`/api/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

// ===== ADMIN PROMOCIÓN GLOBAL =====

export async function listGlobalPromotions(): Promise<import('@/src/types/tienda').GlobalPromotion[]> {
  const res = await fetch('/api/admin/global-promotion', {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function createGlobalPromotion(payload: {
  title: string;
  percent: number;
  description?: string;
  active?: boolean;
}): Promise<import('@/src/types/tienda').GlobalPromotion> {
  const res = await fetch('/api/admin/global-promotion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updateGlobalPromotion(
  id: number,
  payload: {
    title?: string;
    percent?: number;
    description?: string;
    active?: boolean;
  }
): Promise<import('@/src/types/tienda').GlobalPromotion> {
  const res = await fetch(`/api/admin/global-promotion/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function activateGlobalPromotion(id: number): Promise<import('@/src/types/tienda').GlobalPromotion> {
  const res = await fetch(`/api/admin/global-promotion/${id}/activate`, {
    method: 'POST',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function deactivateGlobalPromotion(id: number): Promise<import('@/src/types/tienda').GlobalPromotion> {
  const res = await fetch(`/api/admin/global-promotion/${id}/deactivate`, {
    method: 'POST',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function deleteGlobalPromotion(id: number): Promise<void> {
  const res = await fetch(`/api/admin/global-promotion/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
}

// ===== PROMOCIÓN GLOBAL ACTIVA (PÚBLICO) =====

export async function getActiveGlobalPromotion(): Promise<import('@/src/types/tienda').GlobalPromotion | null> {
  const res = await fetch('/api/global-promotion/active', { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

// ===== ADMIN CUPONES =====

export async function getAdminCoupons(): Promise<Coupon[]> {
  const res = await fetch('/api/admin/coupons', {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function createCoupon(data: Partial<Coupon>): Promise<Coupon> {
  const res = await fetch('/api/admin/coupons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function updateCoupon(id: number, data: Partial<Coupon>): Promise<Coupon> {
  const res = await fetch(`/api/admin/coupons/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export async function deleteCoupon(id: number): Promise<void> {
  const res = await fetch(`/api/admin/coupons/${id}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    throw new Error(message);
  }
}

// ===== ADMIN PRODUCT IMAGES (GALERÍA) =====

export async function listProductImages(productId: number): Promise<ProductImage[]> {
  const res = await fetch(`/api/products/admin/${productId}/images`, {
    cache: 'no-store',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function createProductImage(
  productId: number,
  data: { url: string; alt?: string; order?: number }
): Promise<ProductImage> {
  const res = await fetch(`/api/products/admin/${productId}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function updateProductImage(
  productId: number,
  imageId: number,
  data: { alt?: string; order?: number }
): Promise<ProductImage> {
  const res = await fetch(`/api/products/admin/${productId}/images/${imageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<void> {
  const res = await fetch(`/api/products/admin/${productId}/images/${imageId}`, {
    method: 'DELETE',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
}

export async function reorderProductImages(
  productId: number,
  imageIds: number[]
): Promise<void> {
  const res = await fetch(`/api/products/admin/${productId}/images/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: imageIds }),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.message || errorData?.error || `Error ${res.status}`;
    const error: any = new Error(message);
    error.status = res.status;
    throw error;
  }
}
