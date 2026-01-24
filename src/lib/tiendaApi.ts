// API cliente para la tienda

import { getApiUrl } from '@/lib/api';
import type { Product, Direccion, Order } from '@/src/types/tienda';

const API_BASE = getApiUrl();

// Helper para obtener token de auth
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Helper para fetch con auth
async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
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
  const res = await authFetch(`${API_BASE}/usuarios/me/direcciones`);
  if (!res.ok) throw new Error('Error cargando direcciones');
  return res.json();
}

export async function createDireccion(data: Omit<Direccion, 'id'>): Promise<Direccion> {
  const res = await authFetch(`${API_BASE}/usuarios/me/direcciones`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando dirección');
  return res.json();
}

// ===== CHECKOUT =====

export type CheckoutPayload = {
  direccionId: number;
  items: Array<{ productoId: number; cantidad: number }>;
};

export async function createCheckout(payload: CheckoutPayload): Promise<{ sessionUrl?: string; orderId: number }> {
  const res = await authFetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  if (res.status === 503) {
    throw new Error('Pagos no disponibles todavía');
  }
  
  if (!res.ok) throw new Error('Error en checkout');
  return res.json();
}

// ===== ADMIN PRODUCTOS =====

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await authFetch(`${API_BASE}/products/admin`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error creando producto');
  return res.json();
}

export async function updateProduct(id: number, data: Partial<Product>): Promise<Product> {
  const res = await authFetch(`${API_BASE}/products/admin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error actualizando producto');
  return res.json();
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await authFetch(`${API_BASE}/products/admin/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error eliminando producto');
}

// ===== ADMIN PEDIDOS =====

export async function getAdminOrders(): Promise<Order[]> {
  const res = await authFetch(`${API_BASE}/admin/orders`);
  if (!res.ok) throw new Error('Error cargando pedidos');
  return res.json();
}

export async function updateOrderStatus(
  id: number,
  estado: Order['estado']
): Promise<Order> {
  const res = await authFetch(`${API_BASE}/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error('Error actualizando estado');
  return res.json();
}
