// Tipos para la tienda

export type ProductImage = {
  id: number;
  productId: number;
  url: string;
  alt: string | null;
  order: number; // ✅ Normalizado con backend (no "orden")
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
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: string;
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  orderNumber: string;
  trackingNumber: string | null;
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
  productIds: number[];
  categoryNames: string[];
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

export type CheckoutResponse = {
  orderId: number;
  clientSecret: string;
  originalTotal: number | string;
  finalTotal: number | string;
  discounts: {
    promotions: PromotionDiscount[];
    coupon: CouponDiscount | null;
  };
  couponsAllowed: boolean;
  stripeConfigured: boolean;
};
