# 🔍 DIAGNÓSTICO METEO - ERROR 500

**Fecha:** 29 de enero de 2026  
**Estado:** 🔍 Investigando

---

## ❌ ERROR ACTUAL

```
Error Type: Runtime Error
Error Message: Meteo agregada: HTTP 500
```

**Dónde ocurre:** Página `/meteo`

---

## 🔎 INVESTIGACIÓN

### 1. Configuración actual (CORRECTA)

La ruta `/api/meteo/pueblos` está configurada **exactamente igual** que en el commit que funcionaba (9a0bf45):

```typescript
// app/api/meteo/pueblos/route.ts
export async function GET() {
  const base = getBackendBase(); // Lee API_BASE_URL o NEXT_PUBLIC_API_URL
  const r = await fetch(`${base}/public/meteo/pueblos`, { cache: "no-store" });
  // ...
}
```

### 2. Flujo de la página

```
Usuario → /meteo
  ↓
app/meteo/page.tsx
  ↓
fetch(`${origin}/api/meteo/pueblos`)
  ↓
app/api/meteo/pueblos/route.ts
  ↓
fetch(`${BACKEND}/public/meteo/pueblos`)
  ↓
Backend (NestJS)
```

### 3. El problema NO está en el frontend

**Conclusión:** El código del frontend es **idéntico** al que funcionaba.

El error 500 viene del backend (`/public/meteo/pueblos`).

---

## 🔧 CAMBIOS REALIZADOS

### 1. Eliminadas rutas innecesarias

Eliminé las rutas que creé (que no se usaban):
- ❌ `/api/public/meteo/route.ts` (eliminado)
- ❌ `/api/public/meteo/aggregated/route.ts` (eliminado)

Estas rutas **no se usaban** y solo añadían confusión.

### 2. Añadidos logs de debug

Actualicé `/api/meteo/pueblos/route.ts` con logs para identificar el problema:

```typescript
console.log("[api/meteo/pueblos] Fetching:", url);
console.log("[api/meteo/pueblos] Backend response:", r.status);

if (!r.ok) {
  console.error("[api/meteo/pueblos] Backend error:", text.substring(0, 500));
}
```

---

## 🧪 CÓMO DIAGNOSTICAR

### Paso 1: Verificar logs del servidor Next.js

Cuando abras `/meteo`, en la terminal de Next.js deberías ver:

```
[api/meteo/pueblos] Fetching: http://localhost:3000/public/meteo/pueblos
[api/meteo/pueblos] Backend response: 500
[api/meteo/pueblos] Backend error: { ... }
```

**Copia el error completo del backend.**

### Paso 2: Verificar el backend directamente

```bash
# Probar el endpoint del backend directamente
curl http://localhost:3000/public/meteo/pueblos
```

**Resultado esperado:**
- Si retorna 200 + JSON → el problema es de configuración de variables
- Si retorna 500 → el problema está en el backend (código o BD)

### Paso 3: Verificar variables de entorno

En `.env.local` del frontend debe haber:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
# o
API_BASE_URL=http://localhost:3000
```

---

## ✅ ESTADO ACTUAL DEL FRONTEND

- **Configuración:** ✅ Idéntica al commit que funcionaba
- **Rutas innecesarias:** ✅ Eliminadas
- **Logs de debug:** ✅ Añadidos
- **Build:** ✅ Sin errores

**El frontend está correcto.**

---

## 🚨 SIGUIENTE PASO

**NO tocar más el frontend.**

El problema es uno de estos dos:

1. **Variables de entorno:**
   - El frontend no puede conectar al backend
   - Verifica `NEXT_PUBLIC_API_URL` o `API_BASE_URL`

2. **Backend retorna 500:**
   - El endpoint `/public/meteo/pueblos` tiene un error
   - Verificar logs del backend (NestJS)
   - Verificar BD / datos

---

## 📋 CHECKLIST

Para identificar el problema:

- [ ] Abrir `/meteo` en el navegador
- [ ] Ver logs en terminal de Next.js (npm run dev)
- [ ] Copiar el log `[api/meteo/pueblos] Backend error: ...`
- [ ] Probar curl directo al backend
- [ ] Verificar variables de entorno
- [ ] Ver logs del backend (si aplica)

**Con estos logs sabré exactamente dónde está el problema.**
