# ✅ VERIFICACIÓN: Rotación y Orden de Fotos en POIs

**Fecha:** 29 enero 2026  
**Estado:** LISTO PARA PROBAR

---

## 📋 RESUMEN

El sistema de gestión de fotos en POIs **YA USA EL MISMO COMPONENTE** que fotos del pueblo (`PhotoManager`), por lo que:

✅ **NO hay botón "Guardar cambios" para fotos**  
✅ **Rotación es AUTOSAVE inmediato** (igual que pueblo)  
✅ **Orden es AUTOSAVE inmediato** (igual que pueblo)  
✅ **El botón "Guardar" del POI SOLO guarda** `nombre`, `descripcion`, `lat`, `lng`

---

## 🔍 ANÁLISIS DEL CÓDIGO ACTUAL

### 1. Componente usado en POIs

**Archivo:** `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx`

**Línea 4:**
```typescript
import PhotoManager from "@/app/components/PhotoManager";
```

**Línea 591:**
```typescript
<PhotoManager entity="poi" entityId={editId} />
```

### 2. Componente usado en Pueblo

**Archivo:** `app/gestion/pueblos/[slug]/fotos/page.tsx`

**Línea 1:**
```typescript
import PhotoManager from "@/app/components/PhotoManager";
```

**Línea 53:**
```typescript
<PhotoManager entity="pueblo" entityId={pueblo.id} useAdminEndpoint={true} />
```

### 3. El botón "Guardar" del POI NO toca fotos

**Archivo:** `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx` (líneas 126-157)

```typescript
async function saveEdit() {
  if (editId == null) return;
  setErr(null);

  const payload: any = {
    nombre: editNombre.trim() || undefined,
    descripcion: editDescripcion.trim() || null,
    lat: typeof editLat === "number" ? editLat : null,
    lng: typeof editLng === "number" ? editLng : null,
  };

  const r = await fetch(`/api/admin/pois/${editId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  // ... error handling ...

  cancelEdit();
  await refresh(); // ← Solo recarga lista de POIs, NO fotos
}
```

**✅ Confirmado:** El payload **NO incluye fotos, rotación ni orden**.

---

## 🎯 COMPORTAMIENTO ACTUAL (IDÉNTICO A PUEBLO)

### Rotación
1. Usuario pulsa 🔄 en una foto
2. `PhotoManager` ejecuta `handleRotate(fotoId)`
3. Hace `POST /api/admin/fotos/${fotoId}/rotate90`
4. Backend canoniza si es legacy y devuelve `{ id, rotation, ... }`
5. `PhotoManager` actualiza estado con respuesta
6. UI muestra rotación INMEDIATAMENTE
7. ✅ **Ya está persistido en BD**

### Orden
1. Usuario pulsa ↑ ó ↓ en una foto
2. `PhotoManager` ejecuta `moveUp(index)` ó `moveDown(index)`
3. Hace swap en array local
4. Actualiza UI inmediatamente
5. Llama a `persistOrder(nextPhotos)`
6. Hace `POST /api/admin/fotos/reorder` con lista completa:
   ```json
   {
     "fotos": [
       { "id": "legacy-1234", "orden": 1 },
       { "id": 2760, "orden": 2 }
     ]
   }
   ```
7. ✅ **Ya está persistido en BD**

### Guardar POI
1. Usuario pulsa "Guardar" (botón verde)
2. Solo se actualiza: nombre, descripción, lat, lng
3. **NO se tocan fotos** (ya están persistidas)
4. Se recarga lista de POIs
5. PhotoManager mantiene su estado interno

---

## 🧪 SECUENCIA DE PRUEBA

### Prueba 1: Rotación persiste
```
1. Ir a: /gestion/pueblos/ainsa/pois
2. Editar cualquier POI con fotos
3. Rotar una foto 🔄
4. Refrescar navegador (F5)
5. ✅ La foto sigue rotada
```

### Prueba 2: Orden persiste
```
1. Ir a: /gestion/pueblos/ainsa/pois
2. Editar cualquier POI con 2+ fotos
3. Mover una foto ↑ ó ↓
4. Refrescar navegador (F5)
5. ✅ El orden se mantiene
```

### Prueba 3: Guardar POI no rompe fotos
```
1. Ir a: /gestion/pueblos/ainsa/pois
2. Editar un POI
3. Rotar foto + cambiar orden
4. Cambiar nombre del POI a "Test"
5. Pulsar "Guardar"
6. ✅ Nombre cambia
7. ✅ Rotación y orden se mantienen
```

### Prueba 4: Canonización legacy
```
1. Editar un POI que tenga fotos legacy (badge "Legacy" amarillo)
2. Rotar una foto legacy 🔄
3. Abrir DevTools → Console
4. ✅ Ver log:
   [admin/fotos/rotate90 POST] legacy-XXXX
   [admin/fotos/rotate90 POST] response: { id: 2760, ... }
5. ✅ Badge "Legacy" desaparece (ya es foto nueva)
```

---

## 📊 LOGS ESPERADOS (DevTools Console)

### Al rotar:
```
[admin/fotos/rotate90 POST] upstreamUrl: http://localhost:3000/admin/fotos/legacy-1234/rotate90
[admin/fotos/rotate90 POST] status: 200
[admin/fotos/rotate90 POST] response: {"id":2760,"rotation":90,"url":"..."}
```

### Al reordenar:
```
[admin/fotos/reorder POST] upstreamUrl: http://localhost:3000/admin/fotos/reorder
[admin/fotos/reorder POST] body: {"fotos":[{"id":"legacy-1234","orden":2},{"id":2760,"orden":1}]}
[admin/fotos/reorder POST] status: 200
```

### Al guardar POI:
```
(NO aparece ningún log de fotos)
```

---

## 🔧 ARCHIVOS MODIFICADOS HOY

### Creados:
- ✅ `app/api/admin/fotos/[fotoId]/rotation/route.ts` (PATCH)

### Modificados:
- ✅ `app/api/admin/fotos/reorder/route.ts` (ahora acepta lista completa)
- ✅ `app/components/PhotoManager.tsx` (rotate actualiza estado, orden usa reorder)

### Sin tocar (ya correctos):
- ✅ `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx` (ya usa PhotoManager)
- ✅ `app/api/admin/fotos/[fotoId]/rotate90/route.ts`
- ✅ `app/api/admin/fotos/swap/route.ts`

---

## ✅ CONCLUSIÓN

**NO había que hacer nada en POIs** porque ya estaban usando el componente correcto.

Los cambios de hoy fueron en:
1. **PhotoManager** (componente compartido)
2. **Proxies de fotos** (usados por ambos: pueblo y POIs)

Por tanto, **POIs ya tiene autosave de rotación y orden desde el momento en que se arreglaron los bugs del PhotoManager**.

---

## 🚀 SIGUIENTE PASO

Probar la secuencia completa en **gestión de POI de Aínsa** y confirmar que:
- ✅ Rotación persiste sin "Guardar cambios"
- ✅ Orden persiste sin "Guardar cambios"
- ✅ Guardar POI no rompe fotos
- ✅ Canonización legacy funciona

Si alguna prueba falla, pegar logs de consola + payload enviado.
