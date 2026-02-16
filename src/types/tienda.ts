// Tipos para la tienda

// ✅ ProductImage ahora debe usar MediaItem del sistema unificado
// Manteniendo compatibilidad con el formato actual
export type ProductImage = {
  id: number;
  productId: number;
  url: string; // ← Se mapea desde publicUrl del backend
  alt: string | null;
  order: number; // ✅ Normalizado con backend
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  imagenUrl: string | null;
  categoria: string | null;
  orden: number;
  destacado: boolean;
  createdAt: string;
  updatedAt: string;
  images?: ProductImage[]; // Galería (siempre normalizar si es undefined)
  // Nuevos campos para descuentos
  price?: number; // Alias de precio (compatibilidad)
  finalPrice?: number; // Precio final calculado por backend (con descuento aplicado)
  discount?: {
    percent: number;
    label?: string;
    source: 'PRODUCT' | 'GLOBAL';
  } | null;
  discountPercent?: number | null; // Descuento propio del producto (0-100)
  discountLabel?: string | null; // Etiqueta del descuento propio
  ivaPercent?: number; // 4 o 21 (default 21)
  // Peso y dimensiones (logística)
  weight?: number | null;
  width?: number | null;
  height?: number | null;
  length?: number | null;
  // i18n
  nombre_i18n?: Record<string, string> | null;
  descripcion_i18n?: Record<string, string> | null;
  categoria_i18n?: Record<string, string> | null;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Direccion = {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  pais: string;
  telefono: string | null;
  esPrincipal: boolean; // ✅ Campo del backend
};

export type Order = {
  id: number;
  userId: number;
  shippingAddressId: number;
  total: number | string; // Decimal viene como string desde backend
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: string;
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  orderNumber: string;
  trackingNumber: string | null;
  trackingUrl?: string | null;
  couponCode: string | null;
  discountTotal: number | string; // Decimal viene como string desde backend
  totalBeforeDiscount: number | string; // Decimal viene como string desde backend
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: {
    id: number;
    email: string;
    nombre?: string | null;
    apellidos?: string | null;
  };
  shippingAddressRef?: {
    id: number;
    nombre: string;
    direccion: string;
    ciudad: string;
    provincia: string;
    codigoPostal: string;
    pais: string;
    telefono: string | null;
  };
};

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  cantidad: number;
  precioUnitario: number | string; // Decimal viene como string desde backend
  productNombre?: string; // Snapshot del backend
  producto?: Product;
};

export type Coupon = {
  id: number;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number | string; // Decimal viene como string desde backend
  activo: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minAmount: number | string | null; // Decimal viene como string desde backend
  usageLimit: number | null;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Promotion = {
  id: number;
  name: string;
  type: 'PERCENT' | 'FIXED';
  value: number | string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  minAmount: number | string | null;
  stackable: boolean;
  priority: number;
  applicableToAll: boolean;
  productIds?: number[]; // Opcional, puede no venir del backend
  categoryNames?: string[]; // Opcional, puede no venir del backend
  createdAt: string;
  updatedAt: string;
};

export type PromotionDiscount = {
  promotionId: number;
  promotionName: string;
  amount: number | string;
};

export type CouponDiscount = {
  couponCode: string;
  amount: number | string;
};

export type IvaBreakdown = {
  exento: boolean;
  totalBaseImponible: number;
  totalIva: number;
  shippingIvaPercent: number;
  shippingBaseImponible: number;
  shippingIvaAmount: number;
};

export type CheckoutResponse = {
  orderId: number;
  clientSecret: string;
  originalTotal: number | string;
  finalTotal: number | string;
  shippingCost?: number | string;
  // Logística dinámica
  shipping?: {
    cost: number;
    zone: string | null;
    totalWeight: number;
    isFree: boolean;
    sendcloudMethodId: number | null;
  };
  // IVA / Fiscal
  iva?: IvaBreakdown;
  // items con precios calculados por el backend
  items: CheckoutItemDetail[];
  // discounts SIEMPRE existe (normalizado en frontend si viene undefined/null)
  discounts: {
    promotions: PromotionDiscount[];
    coupon: CouponDiscount | null;
  };
  couponsAllowed: boolean;
  stripeConfigured: boolean;
};

// Helper para normalizar CheckoutResponse del backend
export function normalizeCheckoutResponse(data: any): CheckoutResponse {
  return {
    ...data,
    discounts: {
      promotions: Array.isArray(data.discounts?.promotions) ? data.discounts.promotions : [],
      coupon: data.discounts?.coupon ?? data.coupon ?? null,
    },
  };
}

// Nuevo tipo para detalle de item en checkout (calculado por backend)
export type CheckoutItemDetail = {
  productId: number;
  nombre: string;
  cantidad: number;
  unitOriginalPrice: number | string;
  unitFinalPrice: number | string;
  lineOriginalTotal: number | string;
  lineFinalTotal: number | string;
  discount?: {
    percent: number;
    label?: string;
    source?: 'PRODUCT' | 'GLOBAL';
  } | null;
  ivaPercent?: number;
  baseImponible?: number;
  ivaAmount?: number;
  ivaPercentApplied?: number;
};

// Nuevo tipo para promoción global
export type GlobalPromotion = {
  id: number;
  title: string;
  percent: number;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
