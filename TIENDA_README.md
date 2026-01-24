# 🛒 Tienda LPBME - Frontend

Sistema de tienda integrado en el frontend de LPBME.

## 📁 Estructura

```
app/tienda/
├── page.tsx                    → Listado de productos
├── [slug]/
│   ├── page.tsx               → Detalle de producto (server)
│   └── ProductDetailClient.tsx → Lógica del detalle (client)
├── carrito/
│   └── page.tsx               → Carrito de compra
├── checkout/
│   └── page.tsx               → Proceso de checkout
└── pedido/
    └── [orderId]/
        └── page.tsx           → Confirmación de pedido

src/
├── lib/
│   ├── tiendaApi.ts           → Cliente API para la tienda
│   └── money.ts               → 🆕 Helper para precios (toNumber, formatEUR)
├── store/
│   └── cart.ts                → Store Zustand del carrito
└── types/
    └── tienda.ts              → Tipos TypeScript

app/_components/tienda/
└── CartIndicator.tsx          → Indicador de carrito en header
```

## 💰 Helper de precios (`src/lib/money.ts`)

⚠️ **Importante**: Los precios vienen como `string` desde Prisma (ej: `"59.95"`).

Para evitar errores de `precio.toFixed is not a function`, usamos helpers:

```typescript
import { formatEUR, toNumber } from '@/src/lib/money';

// ✅ Mostrar precio formateado
{formatEUR(product.precio)} €  // "59.95"

// ✅ Calcular subtotal
const subtotal = toNumber(item.precio) * item.cantidad;

// ✅ Calcular total
const total = items.reduce((acc, it) => 
  acc + toNumber(it.precio) * it.cantidad, 0
);
```

**Funciones disponibles:**
- `toNumber(value)` - Convierte string/number a number seguro (devuelve 0 si inválido)
- `formatEUR(value)` - Formatea a EUR con 2 decimales (ej: "59.95")

## 🔌 API Endpoints usados

### Públicos
- `GET /products` - Lista todos los productos
- `GET /products/slug/:slug` - Detalle de un producto

### Autenticados (requieren token)
- `GET /usuarios/me/direcciones` - Lista direcciones del usuario
- `POST /usuarios/me/direcciones` - Crea nueva dirección
- `POST /orders/checkout` - Crea pedido y sesión de Stripe

### Admin (requieren token + rol ADMIN)
- `POST /products/admin` - Crear producto
- `PATCH /products/admin/:id` - Actualizar producto
- `DELETE /products/admin/:id` - Eliminar producto (soft delete)
- `GET /admin/orders` - Lista todos los pedidos
- `PATCH /admin/orders/:id/status` - Actualizar estado de pedido

## 🛠️ Funcionalidades implementadas

### ✅ Listado de productos (`/tienda`)
- Grid responsive (1-4 columnas)
- Filtrado automático: solo productos activos
- Ordenación: destacados primero, luego por orden
- Cards con:
  - Imagen (con placeholder si falta)
  - Badge "Destacado"
  - Nombre, categoría, precio
  - Estado de stock (En stock / Últimas unidades / Agotado)

### ✅ Detalle de producto (`/tienda/[slug]`)
- Layout 2 columnas (imagen + info)
- Selector de cantidad con botones +/-
- Validación de stock en tiempo real
- Botón "Añadir al carrito"
- Descripción completa del producto
- Botón "Ver carrito"

### ✅ Carrito (`/tienda/carrito`)
- Persistencia en localStorage (Zustand)
- Lista de items con:
  - Imagen miniatura
  - Cantidad editable (+/-)
  - Precio unitario y total
  - Botón eliminar
  - Warning si cantidad > stock
- Resumen sticky con total
- Botón "Proceder al pago"
- Botón "Vaciar carrito"

### ✅ Checkout (`/tienda/checkout`)
- **Sin login**: Aviso "Login requerido" con botón a `/entrar`
- **Con login**:
  - Selector de dirección existente
  - Formulario para crear nueva dirección
  - Checkbox "Establecer como predeterminada"
  - Resumen del pedido con items
  - Botón "Realizar pedido"
  - Manejo de errores:
    - Si Stripe está deshabilitado (503) → mensaje claro
    - Otros errores → mensaje genérico

### ✅ Confirmación (`/tienda/pedido/[orderId]`)
- Mensaje de éxito
- Número de pedido
- Links a "Volver a la tienda" y "Ver mis pedidos"
- Información de próximos pasos

### ✅ Store del carrito (Zustand)
- Estado global reactivo
- Persistencia en localStorage
- Acciones:
  - `addItem(product, quantity)` - Añade o incrementa
  - `removeItem(productId)` - Elimina item
  - `setQuantity(productId, quantity)` - Cambia cantidad (0 = elimina)
  - `clear()` - Vacía el carrito
  - `getTotal()` - Calcula total
  - `getItemCount()` - Cuenta items totales

### ✅ Indicador de carrito en header
- Icono de carrito siempre visible
- Badge con número de items (si > 0)
- Link a `/tienda/carrito`

## 🔐 Autenticación

El sistema usa:
- **localStorage**: `access_token` (temporal, para desarrollo)
- **Helper**: `getAuthToken()` en `src/lib/tiendaApi.ts`
- **authFetch()**: Añade `Authorization: Bearer <token>` automáticamente

### ⚠️ Próxima mejora
Migrar a **httpOnly cookies** (más seguro) una vez el backend lo soporte completamente.

## 💳 Stripe (Fase 1)

El checkout llama a `POST /orders/checkout` que:
- Si Stripe **está activo**: devuelve `{ sessionUrl, orderId }`
  - Frontend redirige a `sessionUrl` (Stripe Checkout)
- Si Stripe **está inactivo**: devuelve 503
  - Frontend muestra: "Pagos no disponibles todavía"
- Error genérico: muestra mensaje

## 📦 Dependencias añadidas

```bash
npm install zustand
```

## 🎨 Diseño

- Estilo minimalista y funcional
- Compatible con el diseño institucional de LPBME
- Sin iconos decorativos innecesarios
- Grid responsive estándar
- Placeholders para imágenes vacías

## 🔄 Flujo completo

1. Usuario navega a `/tienda`
2. Ve productos activos
3. Click en producto → `/tienda/[slug]`
4. Selecciona cantidad y "Añadir al carrito"
5. Va a `/tienda/carrito`
6. Revisa items, ajusta cantidades
7. Click "Proceder al pago" → `/tienda/checkout`
8. Si no tiene login → redirige a `/entrar?redirect=/tienda/checkout`
9. Si tiene login:
   - Selecciona/crea dirección
   - Click "Realizar pedido"
   - Si Stripe activo → redirige a Stripe
   - Si Stripe inactivo → error 503
   - Si OK sin Stripe → `/tienda/pedido/[orderId]`

## 🚧 Pendiente (backend completo + Stripe)

- Integración real con Stripe
- Confirmación de pago (webhook)
- Emails de confirmación
- Seguimiento de pedidos en `/cuenta`
- Panel admin de productos (crear/editar/eliminar)
- Panel admin de pedidos (cambiar estado)
- Validación de stock en tiempo real (backend)
- Cálculo de envío
- Descuentos / cupones

## 📝 Notas

- **No subir a GitHub** hasta que Fran lo confirme
- El carrito es 100% cliente (localStorage)
- Sin login, el carrito se mantiene pero no puede comprar
- Las direcciones solo se cargan con login
- El sistema está preparado para Stripe pero funciona sin él
