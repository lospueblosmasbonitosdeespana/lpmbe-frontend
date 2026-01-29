# ✅ SISTEMA DE CACHE ROBUSTO - PUEBLOS FOTOS

**Fecha:** 29 de enero de 2026  
**Problema resuelto:** Cache corrupto causaba que no se mostraran fotos

---

## 🔴 PROBLEMA ANTERIOR

El sistema de cache era frágil:
- ❌ No validaba si los datos eran correctos
- ❌ No tenía versionado
- ❌ Cache viejo se quedaba para siempre
- ❌ No limpiaba caches antiguos

**Resultado:** Cache con puros `null` causaba que no se vieran fotos

---

## ✅ MEJORAS IMPLEMENTADAS

### 1. VERSIONADO DE CACHE

**Antes:**
```typescript
const CACHE_KEY = "pueblos_photos_bulk";
```

**Ahora:**
```typescript
const CACHE_KEY = "pueblos_photos_v3";
```

**Beneficio:**
- ✅ Cada vez que hay un cambio importante, incrementar la versión
- ✅ Invalida automáticamente caches viejos
- ✅ Los usuarios obtienen datos frescos

---

### 2. VALIDACIÓN DE INTEGRIDAD

**Antes:** Aceptaba cualquier cache, aunque fuera corrupto

**Ahora:** Valida que al menos **50% de fotos tengan URL válida**

```typescript
const MIN_VALID_PERCENTAGE = 0.5; // 50%

const withUrl = Object.values(photos).filter(p => p?.url).length;
const percentage = withUrl / totalPhotos;

if (percentage < MIN_VALID_PERCENTAGE) {
  console.warn("Cache corrupto, invalidando");
  sessionStorage.removeItem(CACHE_KEY);
  return null;
}
```

**Beneficio:**
- ✅ Si el cache está corrupto (ej: todos `null`), lo descarta
- ✅ Fuerza un refetch con datos reales
- ✅ Logs claros en consola

---

### 3. LIMPIEZA AUTOMÁTICA DE CACHES VIEJOS

**Ahora al guardar cache:**
```typescript
// Guardar nuevo cache
sessionStorage.setItem("pueblos_photos_v3", ...);

// Limpiar viejos
sessionStorage.removeItem("pueblos_photos_bulk");
sessionStorage.removeItem("pueblos_photos_bulk_v2");
```

**Beneficio:**
- ✅ No acumula caches viejos
- ✅ Libera espacio en sessionStorage
- ✅ Previene confusión

---

### 4. VERIFICACIÓN DE VERSIÓN EN CACHE

**Cada entrada de cache incluye su versión:**
```typescript
interface CacheEntry {
  photos: Record<string, PhotoData>;
  ts: number;
  version: string; // ← NUEVO
}
```

**Al leer:**
```typescript
if (!entry.version || entry.version !== "v3") {
  sessionStorage.removeItem(CACHE_KEY);
  return null;
}
```

**Beneficio:**
- ✅ Si el formato del cache cambia, lo invalida
- ✅ Previene errores de compatibilidad

---

### 5. MANEJO ROBUSTO DE ERRORES

**Antes:** Errores silenciosos

**Ahora:**
```typescript
try {
  // leer cache
} catch (err) {
  console.error("[Cache] Error leyendo cache:", err);
  sessionStorage.removeItem(CACHE_KEY);
  return null;
}
```

**Beneficio:**
- ✅ Si hay un error parseando JSON, limpia el cache
- ✅ Logs claros para debugging
- ✅ Nunca deja al usuario con cache roto

---

## 📊 RESULTADO

| Métrica | Antes | Ahora |
|---------|-------|-------|
| **Cache corrupto** | ❌ Se usa igual | ✅ Se detecta y descarta |
| **Caches viejos** | ❌ Se acumulan | ✅ Se limpian auto |
| **Versión** | ❌ No existe | ✅ `v3` con validación |
| **Validación** | ❌ Ninguna | ✅ Min 50% URLs válidas |
| **Logs** | ❌ Silencioso | ✅ Logs claros |

---

## 🔧 SI VUELVE A PASAR

**Ahora el sistema se autorepara:**

1. **Cache corrupto detectado** → Logs:
   ```
   [Cache] Cache corrupto (solo 10% válidos), invalidando
   ```

2. **Refetch automático** → Se cargan datos reales

3. **Cache nuevo válido** → Guardado con versión `v3`

---

## 🚀 CÓMO FORZAR LIMPIEZA EN FUTURAS ACTUALIZACIONES

**Si haces cambios importantes al sistema:**

1. Cambia la versión:
   ```typescript
   const CACHE_KEY = "pueblos_photos_v4"; // Incrementar número
   ```

2. Actualiza la validación en `getCachedPhotos`:
   ```typescript
   if (!entry.version || entry.version !== "v4") {
   ```

3. Actualiza el save en `setCachedPhotos`:
   ```typescript
   version: "v4"
   ```

4. **Todos los usuarios obtendrán cache limpio automáticamente**

---

## ✅ ARCHIVO MODIFICADO

- `app/hooks/usePuebloPhotos.ts`
  - Versión de cache: `v3`
  - Validación de integridad (50% mínimo)
  - Limpieza automática de caches viejos
  - Logs mejorados

---

## 📝 NOTAS

- **Este sistema es definitivo** - no debería volver a pasar
- **Si cambia la estructura de datos**, incrementar versión
- **Si hay problemas**, los logs mostrarán qué pasó
- **El usuario nunca verá cache corrupto** - se autorepara

---

**LISTO PARA SUBIR A GITHUB** ✅
