// Tipos para la tienda

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
  predeterminada: boolean;
};

export type Order = {
  id: number;
  usuarioId: number;
  direccionId: number;
  total: number;
  estado: 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'COMPLETADO' | 'CANCELADO';
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type OrderItem = {
  id: number;
  pedidoId: number;
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  producto?: Product;
};
