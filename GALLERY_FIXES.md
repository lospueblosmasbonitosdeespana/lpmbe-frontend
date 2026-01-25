# ✅ FIXES APLICADOS - GALERÍA DE PRODUCTOS

## 🔧 CAMBIOS REALIZADOS

### 1. **Upload de imagen corregido**
- ✅ Usa `folder: 'productos'` (igual que uploader principal)
- ✅ Validación de tamaño (máx 25MB)
- ✅ Manejo de errores mejorado con mensajes específicos
- ✅ Extrae URL de `data.url` o `data.publicUrl`

### 2. **Manejo de errores mejorado**
- ✅ 404 → "Ruta API no registrada (proxy). Reinicia el servidor."
- ✅ 401 → "No autenticado. Inicia sesión de nuevo."
- ✅ 403 → "Sin permisos para acceder a esta galería."
- ✅ 400 → Muestra mensaje específico del backend
- ✅ Otros → Mensaje genérico

### 3. **API Client con status code**
- ✅ Todas las funciones lanzan errores con `error.status`
- ✅ Permite mapeo específico de códigos HTTP
- ✅ Mejora debugging en ProductGalleryManager

---

## 🚨 SOLUCIÓN AL ERROR 404

### **Problema:**
```
GET /api/admin/products/1/images 404
```

### **Causa:**
El servidor de desarrollo de Next.js no detectó las nuevas rutas.

### **Solución:**
```bash
# 1. Parar el servidor (Ctrl+C)
# 2. Reiniciar
npm run dev
```

### **Verificación:**
1. Abrir en navegador: `http://localhost:3001/api/admin/products/1/images`
2. **Esperado:** 401 "No autenticado" o 200 con datos
3. **NO esperado:** 404

Si sigue dando 404 después de reiniciar:
- Verificar que los archivos existen en:
  - `app/api/admin/products/[productId]/images/route.ts`
  - `app/api/admin/products/[productId]/images/[imageId]/route.ts`
  - `app/api/admin/products/[productId]/images/reorder/route.ts`

---

## 🚨 SOLUCIÓN AL ERROR 400 (Upload)

### **Problema:**
```
POST /api/media/upload 400
```

### **Fix aplicado:**
```typescript
// ANTES (❌ incorrecto):
fd.append('context', 'product');

// AHORA (✅ correcto):
fd.append('file', file);
fd.append('folder', 'productos');
```

### **Verificación en DevTools:**
1. Network tab → POST /api/media/upload
2. Ver Request Payload:
   - ✅ `file`: [binary data]
   - ✅ `folder`: "productos"
3. Ver Response:
   - ✅ 200/201 con `{ url: "https://..." }`
   - ❌ 400 con mensaje de error específico

---

## 📋 CHECKLIST DE VERIFICACIÓN

### **Paso 1: Reiniciar servidor**
```bash
# Terminal
Ctrl+C
npm run dev
```

### **Paso 2: Verificar rutas API**
```bash
# Abrir en navegador (estando logueado como ADMIN):
http://localhost:3001/api/admin/products/1/images
```

**Resultado esperado:**
- ✅ 401 "No autenticado" → OK (ruta existe, pero falta auth en browser directo)
- ✅ 200 con `[]` o con datos → OK (ruta funciona)
- ❌ 404 → Rutas no registradas (reiniciar servidor)

### **Paso 3: Probar en UI admin**
1. Login como ADMIN
2. Editar un producto existente
3. Scroll a "Galería (opcional)"

**Verificar:**
- ✅ Sección visible
- ✅ Sin error de carga
- ✅ Mensaje "Sin imágenes en la galería" (si no hay)

### **Paso 4: Subir imagen de prueba**
1. Click "+ Añadir imagen a la galería"
2. Seleccionar una imagen (< 25MB)

**DevTools Network tab:**
```
POST /api/media/upload
  Request:
    - file: [binary]
    - folder: "productos"
  Response:
    - 200/201
    - { url: "https://..." }

POST /api/admin/products/1/images
  Request:
    - { "url": "https://..." }
  Response:
    - 200/201
    - { id: 1, productId: 1, url: "...", ... }
```

**UI:**
- ✅ Imagen aparece en lista
- ✅ Preview visible (80x80)
- ✅ Botones ↑/↓ aparecen

### **Paso 5: Probar reordenación**
1. Con 2+ imágenes
2. Click ↑ en la segunda

**Verificar:**
- ✅ Imagen sube en la lista
- ✅ Sin errores en consola

**DevTools:**
```
PUT /api/admin/products/1/images/reorder
  Request:
    - { "ids": [2, 1] }
  Response:
    - 200
```

---

## 🐛 SI SIGUE FALLANDO

### **Error 404 persiste:**
```bash
# 1. Verificar archivos existen
ls -la app/api/admin/products/[productId]/images/

# 2. Eliminar cache de Next.js
rm -rf .next
npm run dev
```

### **Error 400 en upload:**
```bash
# DevTools → Network → POST /api/media/upload → Response
# Copiar el mensaje de error exacto y buscar en backend
```

Posibles causas:
- Backend no espera `folder: 'productos'`
- Backend requiere parámetro adicional
- Endpoint protegido con validación específica

### **Error 401/403 en galería:**
```bash
# Verificar token en cookies
# DevTools → Application → Cookies → auth_token

# Si no hay token:
# - Logout y volver a login
# - Verificar que eres ADMIN
```

---

## 📁 ARCHIVOS MODIFICADOS

### **1. ProductGalleryManager.tsx**
- ✅ Upload usa `folder: 'productos'`
- ✅ Validación de tamaño 25MB
- ✅ Manejo de errores con códigos HTTP específicos
- ✅ Extrae URL correctamente (`data.url ?? data.publicUrl`)

### **2. src/lib/tiendaApi.ts**
- ✅ Todas las funciones de imágenes lanzan errores con `error.status`
- ✅ Permite mapeo específico en catch

### **3. Proxies API (sin cambios necesarios)**
- ✅ Ya usan `getToken()` correctamente
- ✅ Reenvían Authorization header
- ✅ Formato correcto

---

## 🎯 RESUMEN

### **Fixes aplicados:**
1. ✅ Upload corregido (field name + folder)
2. ✅ Mensajes de error específicos por código HTTP
3. ✅ Validación de tamaño de archivo
4. ✅ Extracción robusta de URL

### **Próximos pasos:**
1. ⏳ Reiniciar servidor (`npm run dev`)
2. ⏳ Verificar `/api/admin/products/1/images` (debe dar 401 o 200, NO 404)
3. ⏳ Probar upload de imagen en UI
4. ⏳ Verificar Network tab para ver errores reales del backend

### **NO subir a GitHub hasta validar funcionamiento completo** ⚠️
