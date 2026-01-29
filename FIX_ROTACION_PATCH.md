# ✅ FIX DEFINITIVO: Rotación con PATCH /rotation (no POST /rotate90)

**Fecha:** 29 enero 2026  
**Problema resuelto:** PhotoManager usaba `rotate90` automático en vez de `rotation` explícito

---

## 🔧 CAMBIOS REALIZADOS

### 1. PhotoManager: Cambio de `rotate90` a `rotation` PATCH

**Archivo:** `app/components/PhotoManager.tsx`

**ANTES (buggy):**
```typescript
async function handleRotate(fotoId: number | string) {
  const res = await fetch(`/api/admin/fotos/${fotoId}/rotate90`, {
    method: "POST",
  });
  // ...
}
```

**AHORA (correcto):**
```typescript
async function handleRotate(fotoId: number | string) {
  // 1. Calcular siguiente rotación
  const currentPhoto = photos.find((p) => String(p.id) === String(fotoId));
  const nextRotation = ((currentPhoto.rotation ?? 0) + 90) % 360;

  console.log("[PhotoManager] rotate", { fotoId, nextRotation });

  // 2. Optimistic update (UI rota al instante)
  setPhotos((prev) =>
    prev.map((p) =>
      String(p.id) === String(fotoId) ? { ...p, rotation: nextRotation } : p
    )
  );

  // 3. Persistir con PATCH /rotation
  console.log("[PhotoManager] PATCH /api/admin/fotos/:id/rotation", fotoId);
  
  const res = await fetch(`/api/admin/fotos/${fotoId}/rotation`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rotation: nextRotation }),
  });

  // 4. Reconciliar respuesta (ID puede cambiar si canoniza)
  const updated = await res.json();
  console.log("[PhotoManager] rotation PATCH success", updated);
  
  setPhotos((prev) =>
    prev.map((p) => {
      if (String(p.id) !== String(fotoId)) return p;
      return {
        ...p,
        id: updated.id,           // ← Muy importante
        rotation: updated.rotation, // ← Muy importante
        publicUrl: updated.url ?? updated.publicUrl ?? p.publicUrl,
        // ...
      };
    })
  );
}
```

### 2. Proxy: Logging SIEMPRE activo (no solo DEV)

**Archivo:** `app/api/admin/fotos/[fotoId]/rotation/route.ts`

**Cambios:**
- ✅ Logs SIEMPRE activos (no condicionales a `DEV_LOGS`)
- ✅ Log en entrada: `[next api] rotation route { fotoId, body }`
- ✅ Log en salida: `[admin/fotos/rotation PATCH] status: 200`

---

## 📊 LOGS ESPERADOS

### En consola del navegador (DevTools):
```
[PhotoManager] rotate { fotoId: 2761, nextRotation: 90 }
[PhotoManager] PATCH /api/admin/fotos/:id/rotation 2761
[PhotoManager] rotation PATCH success { id: 2761, rotation: 90, ... }
```

### En terminal de Next.js:
```
[next api] rotation route { fotoId: '2761', body: { rotation: 90 } }
[admin/fotos/rotation PATCH] upstreamUrl: http://localhost:3000/admin/fotos/2761/rotation
[admin/fotos/rotation PATCH] body: { rotation: 90 }
[admin/fotos/rotation PATCH] status: 200
[admin/fotos/rotation PATCH] response: {"id":2761,"rotation":90,...}
```

---

## 🧪 CHECKLIST DE VALIDACIÓN

### Paso 1: Rotar y verificar logs
```
1. Ir a /gestion/pueblos/ainsa/pois
2. Editar POI 103
3. Rotar foto 2761 🔄
4. En DevTools Console DEBE aparecer:
   [PhotoManager] rotate { fotoId: 2761, nextRotation: 90 }
   [PhotoManager] PATCH /api/admin/fotos/:id/rotation 2761
   [PhotoManager] rotation PATCH success ...

5. En terminal de Next DEBE aparecer:
   [next api] rotation route { fotoId: '2761', body: { rotation: 90 } }
   [admin/fotos/rotation PATCH] status: 200
```

### Paso 2: Verificar persistencia
```
1. Refrescar navegador (F5)
2. La foto 2761 DEBE seguir rotada
3. Verificar con curl:
   curl http://localhost:3000/admin/pois/103/fotos \
     -H "Authorization: Bearer $TOKEN"
   
   → rotation: 90
```

### Paso 3: Verificar que guardar POI no rompe nada
```
1. Cambiar nombre del POI a "Test"
2. Pulsar "Guardar"
3. La rotación DEBE mantenerse (no depende de guardar POI)
```

### Paso 4: Verificar canonización legacy
```
1. Si tienes una foto legacy (badge "Legacy" amarillo)
2. Rotarla debe:
   - Log: id cambió de "legacy-1234" a 2762
   - Badge "Legacy" desaparece
   - Rotación persiste
```

---

## ❌ SI NO APARECEN LOS LOGS

### Problema: No aparece `[PhotoManager] rotate` en navegador

**Causa:** El evento de click no está conectado al handler correcto.

**Verificar:**
```typescript
// En PhotoManager.tsx, buscar el botón rotar:
<button onClick={() => handleRotate(photo.id)}>
  🔄
</button>
```

**Si el botón no llama a `handleRotate`, corregir el `onClick`.**

---

### Problema: No aparece `[next api] rotation route` en terminal

**Causa:** El fetch va a una URL incorrecta o el proxy no existe.

**Verificar:**
```bash
# Debe existir este archivo:
ls -la app/api/admin/fotos/[fotoId]/rotation/route.ts
```

**Si no existe, crearlo según el código arriba.**

---

### Problema: Logs aparecen pero `rotation` no persiste

**Causa:** El estado se sobrescribe después con un refetch que ignora `rotation`.

**Verificar:**
- ¿Hay algún `loadPhotos()` después de rotar?
- ¿El mapping normaliza `rotation: 0` en vez de `rotation: f.rotation ?? 0`?

**Buscar en PhotoManager:**
```typescript
// CORRECTO:
rotation: f.rotation ?? 0,

// INCORRECTO:
rotation: 0,
```

---

## ✅ ESTADO FINAL

**Archivos modificados:**
- ✅ `app/components/PhotoManager.tsx` (cambio de `rotate90` a `rotation`)
- ✅ `app/api/admin/fotos/[fotoId]/rotation/route.ts` (logs siempre activos)

**Archivos sin tocar (ya correctos):**
- ✅ `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx` (no interfiere con fotos)

**Resultado esperado:**
- ✅ Rotar foto en POI → persiste inmediatamente
- ✅ Guardar POI → no afecta fotos
- ✅ Refrescar navegador → rotación se mantiene
- ✅ Canonización legacy → funciona correctamente

---

## 🚀 SIGUIENTE PASO

**Probar secuencia completa:**

1. Rotar foto 2761 en POI 103 de Aínsa
2. Verificar logs en navegador + terminal
3. Refrescar y confirmar persistencia
4. Si falla, pegar logs completos aquí

**Si todo funciona, cerrar el ticket.** 🎉
