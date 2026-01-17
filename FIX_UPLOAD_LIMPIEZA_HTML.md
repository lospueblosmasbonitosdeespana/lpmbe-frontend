# Fix: Upload Fotos + Limpieza HTML + Mejor Manejo de Errores

## ✅ Cambios Implementados

### A) **Upload de Foto Portada (desde fichero)**

**UI Mejorada:**
```tsx
{fotoPortada && (
  <div className="relative inline-block">
    <img src={fotoPortada} alt="Portada" className="h-32 w-auto rounded border" />
    <button onClick={() => setFotoPortada('')}>✕</button>
  </div>
)}

<input type="file" accept="image/*" onChange={handleUploadPortada} />
```

**Características:**
- ✅ Preview de foto actual
- ✅ Botón "✕" para quitar foto
- ✅ Upload inmediato al seleccionar archivo
- ✅ FormData → POST /api/admin/uploads → {url}
- ✅ setFotoPortada(url)

---

### B) **Upload de Fotos por Parada**

**UI Mejorada:**
```tsx
{parada.fotoUrl && (
  <div className="relative inline-block">
    <img src={parada.fotoUrl} className="h-20 w-auto rounded border" />
    <button onClick={() => updateParada(tempId, 'fotoUrl', '')}>✕</button>
  </div>
)}

<input type="file" accept="image/*" onChange={uploadFotoParada} />
```

**Características:**
- ✅ Preview por parada
- ✅ Botón "✕" para quitar
- ✅ Upload inmediato
- ✅ Error handling mejorado

---

### C) **Limpieza de HTML Heredado**

**Helpers creados:** `lib/rutaHelpers.ts`

#### **1. sanitizeRutaDescripcionForTextarea(html: string)**

**Qué hace:**
- Elimina `<img>` completas
- Convierte `<br>`, `</p>`, `</h1-6>` → `\n`
- Elimina todos los tags HTML
- Decode entities (`&nbsp;`, `&amp;`, etc.)
- Elimina "Saber más"
- Colapsa saltos múltiples (máx 2)
- Trim espacios

**Uso:**
```typescript
const descripcionLimpia = sanitizeRutaDescripcionForTextarea(descripcionHTML);
setDescripcionLarga(descripcionLimpia);
```

**Resultado:**
- ✅ Textarea sin HTML
- ✅ Estructura legible
- ✅ Sin "Saber más"
- ✅ Sin saltos excesivos

---

#### **2. stripLegacyStops(descripcion: string)**

**Qué hace:**
- Detecta "¡Empezamos!" y "TIPS DE RUTA"
- Elimina el bloque numerado intermedio
- Mantiene intro + outro

**Ejemplo:**
```
Intro...
¡Empezamos!
1. Pueblo A
2. Pueblo B  ← esto se elimina
...
TIPS DE RUTA
Tips...
```

**Resultado:**
```
Intro...
¡Empezamos!

TIPS DE RUTA
Tips...
```

**UI:**
```tsx
{descripcionLarga.includes('¡Empezamos!') && (
  <button onClick={() => setDescripcionLarga(stripLegacyStops(descripcionLarga))}>
    Eliminar bloque de paradas del texto
  </button>
)}
```

---

### D) **Aplicación Automática al Cargar Datos**

**En RutaForm:**
```typescript
const descripcionRaw = initialData?.descripcionLarga ?? initialData?.descripcion ?? '';
const [descripcionLarga, setDescripcionLarga] = useState(
  sanitizeRutaDescripcionForTextarea(descripcionRaw)
);

useEffect(() => {
  if (initialData) {
    const desc = initialData?.descripcionLarga ?? initialData?.descripcion ?? '';
    if (desc) {
      setDescripcionLarga(sanitizeRutaDescripcionForTextarea(desc));
    }
  }
}, [initialData?.descripcionLarga, initialData?.descripcion]);
```

**Resultado:**
- ✅ Al editar ruta, HTML se limpia automáticamente
- ✅ Usuario ve texto limpio en textarea
- ✅ Puede eliminar bloque numerado con 1 click

---

### E) **Mejor Manejo de Errores**

**Problema anterior:**
```typescript
// ❌ Tragaba errores
const data = await res.json().catch(() => ({}));
throw new Error(data?.message || 'Error'); // mostraba {}
```

**Solución:**
```typescript
// ✅ Lee texto primero, intenta parsear
const text = await res.text();
console.error('[RUTAS] Error guardando (raw):', text);

let data: any = {};
try {
  data = JSON.parse(text);
} catch {
  // No es JSON, usar texto directo
}

const errorMsg = data?.message || text || `Error ${res.status}`;
throw new Error(errorMsg);
```

**Resultado:**
- ✅ Muestra error real del backend
- ✅ No más `{}` en consola
- ✅ Logs claros con raw text

---

## 📋 Flujo Completo Actualizado

### **Crear/Editar Ruta:**

1. **Cargar ruta (si editar):**
   - HTML se limpia automáticamente
   - Texto legible en textarea
   - Foto portada se muestra

2. **Subir foto portada:**
   - Click input file
   - Upload inmediato
   - Preview aparece con botón "✕"

3. **Editar descripción:**
   - Si ves "¡Empezamos!" → click "Eliminar bloque"
   - Bloque numerado desaparece
   - Queda intro + outro

4. **Generar paradas:**
   - Pegar texto en convertidor
   - "Generar preview"
   - "Confirmar y añadir"

5. **Añadir fotos a paradas:**
   - Click input file en cada parada
   - Upload inmediato
   - Preview con botón "✕"

6. **Guardar:**
   - Click "Actualizar" / "Crear"
   - **Console:**
     ```
     [RUTAS] Guardando ruta: {...}
     [RUTAS] Ruta guardada: {...}
     [RUTAS] Guardando paradas: [...]
     [RUTAS] Respuesta paradas: 200
     ```
   - Si error: ver texto raw completo

---

## 🔍 Testing

### **Test 1: Cargar ruta con HTML**

1. Editar ruta existente (con HTML en descripción)
2. Verificar:
   - ✅ Textarea muestra texto limpio (sin tags)
   - ✅ Sin "Saber más"
   - ✅ Saltos de línea preservados
   - ✅ Sin saltos excesivos

### **Test 2: Eliminar bloque numerado**

1. Cargar ruta con "¡Empezamos!"
2. Verificar botón "Eliminar bloque de paradas del texto" visible
3. Click botón
4. Verificar:
   - ✅ Bloque "1. 2. 3..." desaparece
   - ✅ Queda intro + outro

### **Test 3: Upload foto portada**

1. Click input file
2. Seleccionar imagen
3. Verificar:
   - ✅ Upload inmediato (ver network)
   - ✅ Preview aparece
   - ✅ Botón "✕" funciona
   - ✅ Al guardar: fotoPortada en payload

### **Test 4: Upload fotos paradas**

1. Añadir parada
2. Click input file en parada
3. Seleccionar imagen
4. Verificar:
   - ✅ Upload inmediato
   - ✅ Preview aparece
   - ✅ Botón "✕" funciona
   - ✅ Al guardar: fotoUrl en parada

### **Test 5: Error handling**

1. Desconectar backend (o provocar error)
2. Intentar guardar
3. Verificar:
   - ✅ Console muestra error raw completo
   - ✅ UI muestra mensaje legible
   - ✅ No muestra `{}`

---

## 🐛 Troubleshooting

### **Problema: "HTML sigue apareciendo en textarea"**

**Causa:** `sanitizeRutaDescripcionForTextarea` no se está llamando

**Verificar:**
```typescript
// En RutaForm, al inicializar descripcionLarga
const descripcionRaw = initialData?.descripcionLarga ?? initialData?.descripcion ?? '';
const [descripcionLarga, setDescripcionLarga] = useState(
  sanitizeRutaDescripcionForTextarea(descripcionRaw) // ← debe estar aquí
);
```

---

### **Problema: "Error al subir foto: 503"**

**Causa:** R2 no configurado en backend

**Verificar:**
- Backend tiene variables R2 configuradas
- O backend devuelve error claro

**Frontend ahora muestra:**
```
Error subiendo foto: Service Unavailable - R2 not configured
```

---

### **Problema: "No puedo quitar foto"**

**Causa:** Botón "✕" no actualiza estado

**Verificar:**
```typescript
<button onClick={() => setFotoPortada('')}>✕</button>
// O en paradas:
<button onClick={() => updateParada(tempId, 'fotoUrl', '')}>✕</button>
```

---

## 📄 Archivos Modificados

- ✅ `lib/rutaHelpers.ts` (nuevo)
  - `sanitizeRutaDescripcionForTextarea()`
  - `stripLegacyStops()`

- ✅ `app/gestion/asociacion/rutas/RutaForm.client.tsx`
  - Import helpers
  - Limpieza automática de descripción
  - Botón "Eliminar bloque"
  - Mejor error handling
  - UI mejorada foto portada

- ✅ `app/gestion/asociacion/rutas/ParadasEditor.tsx`
  - Mejor error handling upload
  - UI mejorada fotos paradas

---

## ✅ Checklist Final

- [x] Upload foto portada con preview + quitar
- [x] Upload fotos paradas con preview + quitar
- [x] Helper limpieza HTML
- [x] Helper eliminar bloque numerado
- [x] Aplicación automática al cargar datos
- [x] Botón "Eliminar bloque" en UI
- [x] Error handling mejorado (no más `{}`)
- [x] Logs claros en console
- [x] Sin errores de linting

---

**Implementación completada** ✅  
Sistema de upload + limpieza HTML funcional.
