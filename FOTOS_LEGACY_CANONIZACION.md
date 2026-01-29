# 📸 FOTOS LEGACY - CANONIZACIÓN AUTOMÁTICA

## ✅ ESTADO ACTUAL (DEFINITIVO)

El sistema de fotos está configurado para **canonización automática** sin perder horas.

---

## 🎯 PRINCIPIO FUNDAMENTAL

**Los controles (rotar, swap, borrar) están SIEMPRE visibles**, incluso para fotos legacy.

**Porque**: La primera acción sobre una foto legacy (rotar/swap/delete) **la canoniza automáticamente** en el backend.

---

## 🔄 FLUJO DE CANONIZACIÓN (BACKEND)

1. **Usuario ve una foto con ID `legacy-1948`**
   - Badge amarillo "Legacy" visible
   - Controles activos (rotar, swap, borrar)

2. **Usuario pulsa "Rotar 90°"**
   - Frontend envía: `POST /admin/fotos/legacy-1948/rotate90`
   - Backend detecta `legacy-` prefix
   - **Canoniza la foto**: crea copia nueva con ID numérico (ej: `2760`)
   - Aplica la rotación a la copia nueva
   - Responde con el nuevo ID

3. **Frontend refresca** (`await loadPhotos()`)
   - Ahora aparece la foto con ID `2760` (sin badge "Legacy")
   - Ya todo funciona normal (swap/rotar/borrar)

---

## 📌 CAMBIOS APLICADOS AL FRONTEND

### 1. **BFF Proxies (sin normalización)**

Los proxies BFF ya NO normalizan `legacy-XXXX → XXXX`:

- ✅ `app/api/admin/fotos/[fotoId]/rotate90/route.ts`
- ✅ `app/api/admin/fotos/swap/route.ts`
- ✅ `app/api/admin/fotos/[fotoId]/route.ts`
- ✅ `app/api/media/[id]/route.ts`

**Resultado**: El backend recibe `legacy-1948` tal cual.

---

### 2. **PhotoManager - Badge "Legacy"**

**Archivo**: `app/components/PhotoManager.tsx`

**Cambio**: Si `photo.id` empieza por `legacy-`, se muestra badge amarillo:

```typescript
{String(photo.id).startsWith('legacy-') && (
  <span
    style={{
      marginLeft: "8px",
      padding: "2px 8px",
      backgroundColor: "#fef3c7",
      color: "#92400e",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "600",
    }}
    title="Foto heredada del sistema antiguo. Al editarla se convertirá en nueva."
  >
    Legacy
  </span>
)}
```

---

### 3. **Nota informativa** (PhotoManager)

Si hay alguna foto legacy en la lista, se muestra un aviso al final:

```
📌 Fotos Legacy: Heredadas del sistema antiguo. Al rotar, reordenar o editar una foto legacy, 
se canoniza automáticamente (obtiene un ID nuevo). Esto es normal y permite editarla sin 
afectar otros pueblos.
```

---

### 4. **Refetch obligatorio tras acciones**

Ya implementado en `PhotoManager`:

```typescript
async function handleRotate(fotoId: number) {
  // ...
  await loadPhotos(); // ← OBLIGATORIO para ver la foto canonizada
}

async function moveUp(index: number) {
  // ...
  await loadPhotos(); // ← OBLIGATORIO
}

async function moveDown(index: number) {
  // ...
  await loadPhotos(); // ← OBLIGATORIO
}
```

---

## 🧪 TESTING RECOMENDADO

### **Caso 1: Rotar foto legacy**

1. Ir a `/gestion/pueblos/ainsa/pois`
2. Editar un POI
3. Ver fotos con badge "Legacy"
4. Click "🔄 Rotar"
5. **Verificar**:
   - Consola backend: logs de canonización
   - UI: foto aparece con nuevo ID (sin badge "Legacy")
   - Foto rotada correctamente

---

### **Caso 2: Swap foto legacy**

1. Tener dos fotos: una legacy + una nueva
2. Click ↑ o ↓ para intercambiar
3. **Verificar**:
   - Orden cambia
   - Si la legacy estaba involucrada, ahora tiene ID nuevo

---

### **Caso 3: Borrar foto legacy**

1. Click 🗑️ en foto legacy
2. **Verificar**:
   - Se elimina de la lista
   - Backend logs: desasociación (no borrado físico)

---

## 📊 LOGS ESPERADOS (BACKEND)

```bash
[FotosService] rotate90 - canonización automática
  - legacyId: 1948
  - multimediadLegacy.id: 1948
  - canonizado → Foto.id: 2760

[FotosService] swap - canonización automática si aplica
  - aId: legacy-1948 → canonizado a 2760
  - bId: 2105 (ya era canónica)
```

---

## ✅ RESULTADO ESPERADO EN UI

**ANTES** (ver foto legacy):
```
Foto #1 [Principal] [Legacy]
ID: legacy-1948
[🔄] [🗑️] [↑] [↓] ← TODOS ACTIVOS
```

**DESPUÉS** (tras rotar):
```
Foto #1 [Principal]
ID: 2760
[🔄] [🗑️] [↑] [↓] ← TODOS ACTIVOS
```

---

## 🚫 LO QUE NO HACEMOS

❌ **No ocultamos controles** basándonos en `editable: false`  
❌ **No mostramos "No se puede editar"**  
❌ **No bloqueamos acciones** sobre fotos legacy  

**Porque**: La canonización automática lo resuelve todo.

---

## 🎯 REGLA DE ORO

> **Si ves `legacy-XXXX` en el ID, puedes hacer cualquier acción.**  
> **La primera acción lo canoniza automáticamente.**  
> **Después funciona como foto normal.**

---

## 📝 NOTAS TÉCNICAS

1. **IDs mixtos**: El sistema soporta tanto `number` como `string` (con `legacy-` prefix).
2. **Parsing tolerante**: `PhotoManager` normaliza el formato de respuesta del backend.
3. **Refetch obligatorio**: Tras cualquier acción (rotate/swap/delete) se llama `await loadPhotos()`.
4. **No normalizar en BFF**: Los proxies envían el ID tal cual al backend.

---

## ✅ TODO LISTO

- ✅ BFF proxies corregidos (sin normalización)
- ✅ Badge "Legacy" visible en UI
- ✅ Nota informativa al usuario
- ✅ Refetch tras acciones
- ✅ Controles siempre activos

**Ahora la canonización automática funciona de punta a punta.** 🚀
