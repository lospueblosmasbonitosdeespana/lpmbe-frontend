# ✅ OPTIMIZACIÓN PÁGINA /PUEBLOS — RESUMEN

**Fecha:** 29 de enero de 2026  
**Archivos modificados:**
- `app/hooks/usePuebloPhotos.ts`
- `app/pueblos/PueblosList.tsx`

---

## 🎯 PROBLEMAS IDENTIFICADOS

1. **Límite de hidratación demasiado bajo** (60 pueblos)
   - Los pueblos posteriores nunca cargaban su foto
   - Causaba "Sin imagen" permanente para pueblos fuera del límite

2. **Fetch serial lento**
   - Solo 2 peticiones concurrentes
   - 100+ pueblos = cascada de requests muy lenta

3. **Grid inestable**
   - Sin altura mínima en tarjetas
   - Las imágenes cargando causaban "saltos" visuales
   - Re-renders innecesarios

4. **No se priorizaba el contenido visible**
   - IntersectionObserver esperaba scroll
   - Las primeras tarjetas (above the fold) se cargaban tarde

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Aumentar límites y concurrencia
**Archivo:** `app/hooks/usePuebloPhotos.ts`

```typescript
const MAX_CONCURRENT = 4;        // era 2 → ahora 4
const MAX_HYDRATE_LIMIT = 200;   // era 60 → ahora 200
```

**Resultado:**
- ✅ Todos los pueblos pueden cargar su foto (no solo los primeros 60)
- ✅ 2x throughput de peticiones (más rápido)

---

### 2. Preload de tarjetas visibles (above the fold)
**Archivo:** `app/hooks/usePuebloPhotos.ts`

```typescript
// Preload SIEMPRE las primeras 12 tarjetas (above the fold, ~3 filas)
const firstBatch = pueblos.slice(0, 12);
firstBatch.forEach(p => {
  if (!fetchedRef.current.has(p.slug)) {
    fetchPhoto(p.slug);
  }
});
```

**Resultado:**
- ✅ Las primeras tarjetas cargan INMEDIATAMENTE (no esperan scroll)
- ✅ Sensación de página más rápida

---

### 3. IntersectionObserver mejorado
**Archivo:** `app/hooks/usePuebloPhotos.ts`

```typescript
rootMargin: "400px"  // era 200px → ahora 400px
```

**Resultado:**
- ✅ Carga anticipada más agresiva
- ✅ Las imágenes aparecen ANTES de que el usuario llegue

---

### 4. Grid estable con altura fija
**Archivo:** `app/pueblos/PueblosList.tsx`

```typescript
// Tarjeta con altura mínima
minHeight: "240px"

// Contenedor de foto con altura fija
height: "140px"
flexShrink: 0  // No permitir que se encoja

// Grid con alineación correcta
alignItems: "start"  // Evita que las tarjetas se estiren
```

**Resultado:**
- ✅ El grid NO salta cuando cargan las imágenes
- ✅ Todas las tarjetas tienen el mismo tamaño desde el inicio
- ✅ Layout estable

---

### 5. Memoización de tarjetas
**Archivo:** `app/pueblos/PueblosList.tsx`

```typescript
const PuebloCard = memo(function PuebloCard({ ... }) { ... });
```

**Resultado:**
- ✅ No re-renderizar tarjetas que no cambiaron
- ✅ Mejor performance al filtrar/buscar

---

### 6. Atributos HTML optimizados
**Archivo:** `app/pueblos/PueblosList.tsx`

```typescript
<img
  loading="lazy"      // Browser nativo lazy loading
  decoding="async"    // Decodificación no bloqueante
  ...
/>
```

**Resultado:**
- ✅ El navegador gestiona la carga de forma óptima
- ✅ No bloquea el thread principal

---

## 📊 MÉTRICAS ESPERADAS

| Métrica | Antes | Ahora |
|---------|-------|-------|
| **Pueblos con foto** | ~60 | 200+ (todos) |
| **Requests concurrentes** | 2 | 4 |
| **Preload above fold** | ❌ No | ✅ Sí (12 primeras) |
| **Grid estable** | ❌ Saltos | ✅ Estable |
| **Re-renders innecesarios** | ❌ Sí | ✅ No (memo) |

---

## 🧪 TESTING

### Prueba 1: Carga inicial
1. Ir a `/pueblos`
2. Las primeras 12 tarjetas deben cargar fotos **inmediatamente**
3. El grid debe mantener su forma (sin "saltos")

### Prueba 2: Scroll
1. Hacer scroll hacia abajo
2. Las fotos deben aparecer **antes** de llegar (preload 400px)
3. No debe haber "parpadeos" ni cambios de tamaño

### Prueba 3: Filtros/búsqueda
1. Usar el buscador
2. Las tarjetas NO deben re-renderizarse todas (memo)
3. Solo cambiar las que entran/salen del filtro

### Prueba 4: Todos los pueblos
1. Scroll hasta el final (pueblo ~126)
2. Todos deben tener foto (o "Sin imagen" si realmente no tienen)
3. NO debe quedarse en blanco por límite de 60

---

## ⚠️ LO QUE NO SE TOCÓ

- ❌ Backend
- ❌ Endpoints
- ❌ Diseño visual
- ❌ Estructura de datos
- ❌ Lógica de negocio

**Solo optimización de carga y render.**

---

## 🚀 PRÓXIMOS PASOS (OPCIONAL)

Si aún se ve lento en producción:
1. Considerar Next.js `<Image>` con placeholder blur
2. Implementar prefetch de rutas al hover
3. Añadir Service Worker para cache de imágenes
4. Considerar CDN para fotos de pueblos

---

## 📝 NOTAS

- **Build local:** ✅ Correcto
- **TypeScript:** ✅ Sin errores
- **Compatibilidad:** ✅ Mismo diseño
- **Estado:** ✅ Listo para testing

**NO subido a GitHub** (esperando confirmación de Fran).
