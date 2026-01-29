# ✅ FIX FINAL: Rotación en Página Pública del POI

**Fecha:** 29 enero 2026  
**Problema resuelto:** La página pública del POI no aplicaba `rotation` a las fotos

---

## 🔍 PROBLEMA IDENTIFICADO

### Antes (buggy):

**Archivo:** `app/pueblos/[slug]/pois/[poi]/page.tsx`

```typescript
{foto ? (
  <section style={{ marginTop: 32 }}>
    <img
      src={foto}
      alt={data?.nombre ?? "POI"}
      style={{
        maxWidth: 900,
        width: "100%",
        height: "auto",
        borderRadius: 8,
        // ❌ NO aplicaba rotation
      }}
    />
  </section>
) : null}
```

**Problemas:**
- ❌ Solo mostraba 1 foto (la principal)
- ❌ NO aplicaba `rotation` desde `fotosPoi[].rotation`
- ❌ NO mostraba galería si había más fotos

---

## 🔧 SOLUCIÓN IMPLEMENTADA

### Ahora (correcto):

```typescript
{/* FOTO PRINCIPAL */}
{foto ? (
  <section style={{ marginTop: 32 }}>
    <img
      src={foto}
      alt={data?.nombre ?? "POI"}
      style={{
        maxWidth: 900,
        width: "100%",
        height: "auto",
        borderRadius: 8,
        // ✅ Aplicar rotación de la foto principal
        transform: (() => {
          const fotos = Array.isArray(data?.fotosPoi) ? data.fotosPoi : [];
          const principal = fotos.find((f: any) => f?.orden === 1) ?? fotos[0];
          const rotation = principal?.rotation ?? 0;
          return rotation !== 0 ? `rotate(${rotation}deg)` : undefined;
        })(),
      }}
    />
  </section>
) : null}

{/* GALERÍA DE FOTOS (si hay más de 1) */}
{(() => {
  const fotos = Array.isArray(data?.fotosPoi) ? data.fotosPoi : [];
  const fotosSorted = [...fotos].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
  
  if (fotosSorted.length <= 1) return null;
  
  return (
    <section style={{ marginTop: 32 }}>
      <h2>Galería</h2>
      <div style={{ display: "grid", gap: 16 }}>
        {fotosSorted.map((foto: any, idx: number) => (
          <div key={foto.id ?? idx}>
            <img
              src={foto.url}
              style={{
                // ✅ IMPORTANTE: Aplicar rotación desde el dato
                transform: foto.rotation ? `rotate(${foto.rotation}deg)` : undefined,
              }}
            />
            {foto.orden === 1 && <div>Principal</div>}
          </div>
        ))}
      </div>
    </section>
  );
})()}
```

---

## ✅ CAMBIOS REALIZADOS

### 1. Foto Principal
- ✅ Busca `fotosPoi[].rotation` de la foto principal (orden=1 o primera)
- ✅ Aplica `transform: rotate(${rotation}deg)` si `rotation !== 0`
- ✅ Usa `data?.fotosPoi` (array del backend con rotación)

### 2. Galería de Fotos (nueva)
- ✅ Muestra todas las fotos si hay más de 1
- ✅ Ordena por `orden` (1, 2, 3...)
- ✅ Cada foto aplica su propia `rotation`
- ✅ Badge "Principal" en la foto orden=1

### 3. Cache del fetch
- ✅ Ya existe `cache: "no-store"` en línea 37
- ✅ No cachea respuestas viejas

---

## 🧪 PRUEBA DETERMINÍSTICA

### Paso 1: Rotar en admin
```
1. Ir a: /gestion/pueblos/ainsa/pois
2. Editar POI 103
3. Rotar foto 2761 → 90°
4. Verificar logs:
   [PhotoManager] PATCH /api/admin/fotos/2761/rotation
   [PhotoManager] rotation PATCH success { rotation: 90 }
```

### Paso 2: Verificar en público (incógnito)
```
1. Abrir nueva pestaña incógnito
2. Ir a: /pueblos/ainsa/pois/103
3. Hacer Ctrl+F5 (force refresh)
4. ✅ La foto principal DEBE aparecer rotada 90°
```

### Paso 3: Verificar con DevTools
```
1. Abrir DevTools → Elements
2. Buscar el <img> de la foto principal
3. Inspeccionar el atributo style
4. ✅ DEBE contener: transform: rotate(90deg)
```

### Paso 4: Verificar backend
```bash
curl http://localhost:3000/pueblos/ainsa/pois/103 | jq '.fotosPoi'

# DEBE devolver:
[
  {
    "id": 2761,
    "url": "https://...",
    "orden": 1,
    "rotation": 90  # ← Muy importante
  }
]
```

---

## 📊 FLOW COMPLETO (Admin → Público)

### 1. Admin rota foto
```
Usuario pulsa 🔄 en gestión POI
  ↓
PhotoManager.handleRotate()
  ↓
PATCH /api/admin/fotos/2761/rotation { rotation: 90 }
  ↓
Backend persiste en BD
  ↓
PhotoManager actualiza estado local
```

### 2. Público carga POI
```
Usuario abre /pueblos/ainsa/pois/103
  ↓
fetchPoi() → GET /pueblos/ainsa/pois/103 (cache: "no-store")
  ↓
Backend devuelve: { fotosPoi: [{ id: 2761, rotation: 90 }] }
  ↓
Render aplica: transform: rotate(90deg)
  ↓
✅ Usuario ve foto rotada
```

---

## ❌ SI NO ROTA EN PÚBLICO

### Problema 1: Backend no devuelve `rotation`

**Verificar:**
```bash
curl http://localhost:3000/pueblos/ainsa/pois/103 | jq '.fotosPoi[0].rotation'

# Si devuelve null → problema backend
# Si devuelve 90 → problema frontend
```

**Solución backend:**
- Asegurar que el endpoint `/pueblos/:slug/pois/:id` incluye `rotation` en `fotosPoi[]`

---

### Problema 2: Frontend no lee `fotosPoi`

**Verificar en DevTools:**
```javascript
// En consola del navegador:
console.log(data.fotosPoi);

// DEBE mostrar array con rotation
```

**Si `fotosPoi` es `undefined`:**
- El backend no está devolviendo el campo
- Verificar que el endpoint público incluye `fotosPoi: []`

---

### Problema 3: CSS sobreescribe `transform`

**Verificar en DevTools → Elements:**
```html
<img 
  src="..." 
  style="transform: rotate(90deg); ..." 
/>
```

**Si no aparece `transform` en style:**
- Verificar que `rotation !== 0` (si es 0, no se aplica)
- Verificar que la lógica IIFE se ejecuta correctamente

---

## 📝 ARCHIVOS MODIFICADOS

### Modificados:
- ✅ `app/pueblos/[slug]/pois/[poi]/page.tsx`
  - Foto principal aplica `rotation`
  - Nueva galería para múltiples fotos
  - Cada foto en galería aplica su `rotation`

### Sin tocar (ya correctos):
- ✅ `app/components/PhotoManager.tsx` (autosave con PATCH)
- ✅ `app/api/admin/fotos/[fotoId]/rotation/route.ts` (proxy)
- ✅ `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx` (gestión)

---

## 🎉 RESULTADO ESPERADO

### Admin:
- ✅ Rotar foto → persiste inmediatamente
- ✅ Logs visibles en navegador + terminal
- ✅ Refrescar → rotación se mantiene

### Público:
- ✅ Abrir POI → foto principal rotada
- ✅ Galería (si >1 foto) → cada foto con su rotación
- ✅ Badge "Principal" en foto orden=1
- ✅ Force refresh (Ctrl+F5) → rotación se mantiene

---

## 🚀 SIGUIENTE PASO

**Prueba completa:**

1. **Admin:** Rotar foto 2761 en POI 103 de Aínsa
2. **Logs:** Verificar logs en consola + terminal
3. **Público:** Abrir `/pueblos/ainsa/pois/103` en incógnito
4. **Resultado:** ✅ Foto rotada sin cache

**Si funciona, CERRAR DEFINITIVAMENTE.** 🎊

---

## 📌 NOTAS FINALES

### Por qué era necesario este fix:

1. **Gestión ya funcionaba** (PhotoManager con PATCH)
2. **Backend ya persistía** (verificado con curl)
3. **Faltaba:** Que el **público leyera y aplicara `rotation`**

### Patrón aplicado (igual que Pueblo):

```typescript
// En GaleriaGrid.tsx (pueblo) línea 43:
transform: `rotate(${foto.rotation ?? 0}deg)`

// Ahora también en page.tsx (POI):
transform: foto.rotation ? `rotate(${foto.rotation}deg)` : undefined
```

**Consistencia total entre pueblo y POI.** ✅
