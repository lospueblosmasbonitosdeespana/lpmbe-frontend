# INVENTARIO: Club de Amigos (Frontend)

## A) RUTAS Y ARCHIVOS

### Páginas de Usuario (Mi Cuenta)
- **`app/mi-cuenta/club/page.tsx`**
  - Ruta: `/mi-cuenta/club`
  - Tipo: Client Component
  - Componentes usados: Ninguno externo (todo inline)

### Páginas de Gestión (Alcaldes/Admin)
- **`app/gestion/pueblos/[slug]/club/page.tsx`**
  - Ruta: `/gestion/pueblos/[slug]/club`
  - Tipo: Server Component
  - Componentes usados:
    - `ClubRecursos` (client component)

- **`app/gestion/pueblos/[slug]/club/ClubRecursos.client.tsx`**
  - Tipo: Client Component
  - Funcionalidad: CRUD completo de recursos turísticos

### Enlaces desde otras páginas
- **`app/gestion/pueblos/[slug]/page.tsx`** (línea 59-60)
  - Link: "Club de Amigos" → `/gestion/pueblos/${slug}/club`

---

## B) LLAMADAS API DETECTADAS

### Proxies Next.js (app/api/club/*)

#### 1. Estado del Club (Usuario)
- **Proxy:** `GET /api/club/me`
- **Backend:** `GET ${API_BASE}/club/me`
- **Uso:** `app/mi-cuenta/club/page.tsx` (línea 82)
- **Respuesta esperada:**
  ```typescript
  {
    isMember: boolean;
    plan: string | null;
    status: string | null;
    validUntil: string | null;
    qrToken?: string | null;
    qrPayload?: string | null;
  }
  ```

#### 2. Historial de Visitas (Usuario)
- **Proxy:** `GET /api/club/visitas`
- **Backend:** `GET ${API_BASE}/club/visitas`
- **Uso:** `app/mi-cuenta/club/page.tsx` (línea 83)
- **Respuesta esperada:**
  ```typescript
  {
    items?: Array<{
      id: number;
      scannedAt: string;
      puntos?: number | null;
      puebloId?: number | null;
      recurso?: {
        id: number;
        nombre: string;
        tipo: string;
        codigoQr: string;
        puebloId?: number | null;
      };
    }>;
    total?: number;
  }
  ```

#### 3. Registrar Visita (Demo - Usuario)
- **Proxy:** `POST /api/club/scan`
- **Backend:** `POST ${API_BASE}/club/scan`
- **Uso:** `app/mi-cuenta/club/page.tsx` (línea 151)
- **Body:**
  ```json
  {
    "codigoQr": "string",
    "origen": "WEB",
    "meta": { "source": "web-demo" }
  }
  ```
- **Respuesta:** `{ duplicated?: boolean }`

#### 4. Recursos Disponibles (Usuario)
- **Proxy:** `GET /api/club/recursos/disponibles`
- **Backend:** `GET ${API_BASE}/club/recursos/disponibles`
- **Uso:** `app/mi-cuenta/club/page.tsx` (línea 84)
- **Respuesta esperada:**
  ```typescript
  Array<{
    id: number;
    nombre: string;
    tipo: string;
    descuentoPorcentaje?: number | null;
    codigoQr: string;
    puebloId?: number | null;
  }>
  ```

#### 5. Recursos por Pueblo (Gestión - Listar)
- **Proxy:** `GET /api/club/recursos/pueblo/[puebloId]`
- **Backend:** `GET ${API_BASE}/club/recursos/pueblo/${puebloId}`
- **Uso:** `app/gestion/pueblos/[slug]/club/ClubRecursos.client.tsx` (línea 42)
- **Respuesta esperada:**
  ```typescript
  Array<{
    id: number;
    nombre: string;
    tipo: string;
    descuentoPorcentaje?: number | null;
    activo: boolean;
    codigoQr: string;
    puebloId: number;
  }>
  ```

#### 6. Crear Recurso (Gestión)
- **Proxy:** `POST /api/club/recursos/pueblo/[puebloId]`
- **Backend:** `POST ${API_BASE}/club/recursos/pueblo/${puebloId}`
- **Uso:** `app/gestion/pueblos/[slug]/club/ClubRecursos.client.tsx` (línea 105)
- **Body:**
  ```json
  {
    "nombre": "string",
    "tipo": "string | null",
    "descuentoPorcentaje": "number | null",
    "activo": boolean
  }
  ```

#### 7. Editar Recurso (Gestión)
- **Proxy:** `PATCH /api/club/recursos/[id]`
- **Backend:** `PATCH ${API_BASE}/club/recursos/${id}`
- **Uso:** `app/gestion/pueblos/[slug]/club/ClubRecursos.client.tsx` (línea 176, 227)
- **Body:** Campos opcionales (nombre, tipo, descuentoPorcentaje, activo)

#### 8. Eliminar Recurso (Gestión)
- **Proxy:** `DELETE /api/club/recursos/[id]`
- **Backend:** `DELETE ${API_BASE}/club/recursos/${id}`
- **Uso:** `app/gestion/pueblos/[slug]/club/ClubRecursos.client.tsx` (línea 206)

---

## C) DIAGNÓSTICO DEL UI ACTUAL

### ✅ Confirmado en código:

1. **Se muestra "payload" y "token" en texto (copiable)**
   - Ubicación: `app/mi-cuenta/club/page.tsx` (líneas 273-301)
   - Sección: "Tu QR (para app)"
   - Muestra:
     - `qrPayload` en `<div>` con `font-mono` y `break-all`
     - `qrToken` en `<div>` con `font-mono` y `break-all`
   - Botón "Copiar" solo para `qrPayload` (línea 292-299)

2. **Existe sección "Registrar visita (demo)" con input manual**
   - Ubicación: `app/mi-cuenta/club/page.tsx` (líneas 399-427)
   - Input: `<input type="text">` para `codigoQr`
   - Botón: "Registrar" que llama a `handleRegistrarVisita()`
   - Body enviado: `{ codigoQr, origen: 'WEB', meta: { source: 'web-demo' } }`

3. **Existe lista "Descuentos en recursos turísticos"**
   - Ubicación: `app/mi-cuenta/club/page.tsx` (líneas 304-343)
   - Muestra: `recursosDisponibles` (array)
   - Campos mostrados:
     - Pueblo ID
     - Nombre
     - Tipo
     - Descuento (%)
     - Código QR (solo si `clubMe.isMember === true`)

4. **Existe "Recursos turísticos visitados" (historial)**
   - Ubicación: `app/mi-cuenta/club/page.tsx` (líneas 345-397)
   - Muestra: `visitas` (array, limitado a 30 items)
   - Campos mostrados:
     - Fecha (`scannedAt`)
     - Recurso (nombre, tipo, codigoQr)
     - Pueblo ID
     - Puntos

### 🔍 Observaciones adicionales:

- **Límite de visitas:** Se muestran solo las primeras 30 (línea 240)
- **Manejo de errores:** Incluye detección de 502 (backend no disponible)
- **Autenticación:** Todos los proxies usan `getToken()` server-side
- **Logs temporales:** Existen `console.error` en proxies (solo en `NODE_ENV === 'development'`)

---

## D) PROPUESTA MÍNIMA (Sin implementar aún)

### 1. Quitar token en claro (o dejar solo en dev)
- **Acción:** Ocultar `qrToken` y `qrPayload` en producción
- **Implementación:** Condicionar render con `process.env.NODE_ENV === 'development'`
- **Archivo:** `app/mi-cuenta/club/page.tsx` (líneas 273-301)

### 2. Convertir "Tu QR" en flujo real
- **Problema actual:** Muestra token/payload estático
- **Propuesta:**
  - Seleccionar recurso desde lista "Descuentos en recursos turísticos"
  - Generar QR dinámico (usando librería como `qrcode.react` o similar)
  - Mostrar QR visual + contador de usos (si backend lo expone)
- **Archivo:** `app/mi-cuenta/club/page.tsx` (líneas 272-302)

### 3. Mover "validación manual" fuera de la cuenta del usuario
- **Problema actual:** Usuario puede registrar visitas manualmente desde su cuenta
- **Propuesta:**
  - Eliminar sección "Registrar visita (demo)" de `/mi-cuenta/club`
  - Crear página separada para validadores (ej: `/gestion/validar-qr` o similar)
  - Requiere rol VALIDADOR o ALCALDE/ADMIN
- **Archivo a modificar:** `app/mi-cuenta/club/page.tsx` (líneas 399-427)
- **Archivo nuevo:** `app/gestion/validar-qr/page.tsx` (o similar)

### 4. Conectar historial a endpoint real del backend
- **Estado actual:** Ya está conectado a `/api/club/visitas` → `GET /club/visitas`
- **Verificación:** Confirmar que el backend devuelve la estructura esperada
- **Mejora opcional:** Añadir paginación si hay muchas visitas (>30)

### 5. Mejoras adicionales sugeridas
- **Agrupar descuentos por pueblo:** En lugar de mostrar "Pueblo ID: 37", mostrar nombre del pueblo
- **Filtros en historial:** Por fecha, por recurso, por pueblo
- **Exportar historial:** Botón para descargar CSV/PDF
- **Estadísticas:** Resumen de recursos visitados, puntos totales, etc.

---

## RESUMEN DE ENDPOINTS BACKEND

| Método | Endpoint Backend | Proxy Next.js | Uso |
|--------|------------------|---------------|-----|
| GET | `/club/me` | `/api/club/me` | Estado del usuario |
| GET | `/club/visitas` | `/api/club/visitas` | Historial de visitas |
| POST | `/club/scan` | `/api/club/scan` | Registrar visita (demo) |
| GET | `/club/recursos/disponibles` | `/api/club/recursos/disponibles` | Catálogo de recursos |
| GET | `/club/recursos/pueblo/:id` | `/api/club/recursos/pueblo/[puebloId]` | Listar recursos (gestión) |
| POST | `/club/recursos/pueblo/:id` | `/api/club/recursos/pueblo/[puebloId]` | Crear recurso |
| PATCH | `/club/recursos/:id` | `/api/club/recursos/[id]` | Editar recurso |
| DELETE | `/club/recursos/:id` | `/api/club/recursos/[id]` | Eliminar recurso |

---

**Fecha de inventario:** 2025-01-27
**Estado:** Completo - Sin cambios implementados




