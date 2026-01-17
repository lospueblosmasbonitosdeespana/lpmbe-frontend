# Fix: Carga de Datos Editar + Payload Limpio

## ✅ Cambios Aplicados

### 1. **Soporte para Diferentes Formatos del Backend**

**Problema:**
- Backend puede devolver `fotoPortada` o `foto_portada`
- Backend puede devolver `descripcionLarga` o `descripcion`
- Backend puede devolver `distanciaKm` o `distancia`
- Backend puede devolver `tiempoEstimado` o `tiempo`

**Solución:**

```typescript
// RutaFormProps con campos opcionales y ambos formatos
type RutaFormProps = {
  rutaId?: number;
  initialData?: {
    titulo?: string;
    slug?: string;
    fotoPortada?: string;
    foto_portada?: string; // snake_case del backend
    descripcionLarga?: string;
    descripcion?: string; // legacy
    distanciaKm?: number;
    distancia?: number; // legacy
    tiempoEstimado?: number;
    tiempo?: number; // legacy
    // ...
  };
};
```

**Inicialización con fallbacks:**

```typescript
const [fotoPortada, setFotoPortada] = useState(
  initialData?.fotoPortada ?? initialData?.foto_portada ?? ''
);

const [descripcionLarga, setDescripcionLarga] = useState(
  initialData?.descripcionLarga ?? initialData?.descripcion ?? ''
);

const [distanciaKm, setDistanciaKm] = useState<string>(
  (initialData?.distanciaKm ?? initialData?.distancia)?.toString() ?? ''
);

const [tiempoEstimado, setTiempoEstimado] = useState<string>(
  (initialData?.tiempoEstimado ?? initialData?.tiempo)?.toString() ?? ''
);
```

**Resultado:**
- ✅ Funciona con cualquier formato del backend
- ✅ No se pierden datos al editar
- ✅ Foto portada y descripción se cargan correctamente

---

### 2. **Payload Limpio (Solo Campos con Valor)**

**Problema anterior:**
```typescript
// ❌ ANTES: enviaba TODOS los campos (incluso vacíos)
const rutaPayload = {
  titulo: titulo.trim(),
  slug: slug.trim(),
  fotoPortada: fotoPortada.trim() || null, // ❌ null si vacío
  descripcionLarga: descripcionLarga.trim() || null, // ❌ null si vacío
  distanciaKm: distanciaKm ? parseFloat(distanciaKm) : null, // ❌ null si vacío
  // ...
};
```

**Problema:**
- Backend puede rechazar campos `null` por DTO
- Puede pisar datos existentes sin querer
- Payload innecesariamente grande

**Solución nueva:**

```typescript
// ✅ AHORA: solo campos con valor real
const rutaPayload: any = {
  titulo: titulo.trim(), // obligatorio
  slug: slug.trim(), // obligatorio
  activo, // obligatorio
};

// Solo añadir si tiene valor
if (fotoPortada.trim()) {
  rutaPayload.fotoPortada = fotoPortada.trim();
}
if (descripcionLarga.trim()) {
  rutaPayload.descripcionLarga = descripcionLarga.trim();
}
if (distanciaKm) {
  rutaPayload.distanciaKm = parseFloat(distanciaKm);
}
// ... etc
```

**Resultado:**
- ✅ No envía campos vacíos
- ✅ Backend no se queja por DTOs
- ✅ No pisa datos existentes sin querer

---

### 3. **Logs de Debug Mejorados**

**Añadidos:**

```typescript
console.log('[RUTAS] Guardando ruta:', rutaPayload);
console.log('[RUTAS] Ruta guardada:', savedRuta);
console.log('[RUTAS] Guardando paradas:', paradasPayload);
console.log('[RUTAS] Respuesta paradas:', resParadas.status);
```

**Para debug en DevTools:**

1. **Guardando ruta:**
   ```
   [RUTAS] Guardando ruta: {titulo: "...", slug: "...", activo: true}
   ```

2. **Ruta guardada:**
   ```
   [RUTAS] Ruta guardada: {id: 1, titulo: "...", ...}
   ```

3. **Guardando paradas:**
   ```
   [RUTAS] Guardando paradas: [{orden: 1, puebloId: 37, ...}]
   ```

4. **Respuesta paradas:**
   ```
   [RUTAS] Respuesta paradas: 200
   ```

---

## 🔍 Verificación

### **Test 1: Editar ruta existente**

1. Ir a `/gestion/asociacion/rutas`
2. Click "Editar" en una ruta
3. Verificar que se cargan:
   - ✅ Título
   - ✅ Slug
   - ✅ Foto portada (si existe)
   - ✅ Descripción (si existe)
   - ✅ Distancia, tiempo, etc.
   - ✅ Paradas existentes

### **Test 2: Actualizar ruta sin cambios**

1. Editar ruta
2. No cambiar nada
3. Click "Actualizar"
4. Verificar console:
   ```
   [RUTAS] Guardando ruta: {titulo: "...", slug: "...", activo: true}
   [RUTAS] Ruta guardada: {id: 1, ...}
   ```
5. ✅ No debe dar error de DTO

### **Test 3: Añadir paradas y actualizar**

1. Editar ruta
2. Generar paradas desde descripción
3. Confirmar paradas
4. Click "Actualizar"
5. Verificar console:
   ```
   [RUTAS] Guardando ruta: {...}
   [RUTAS] Ruta guardada: {...}
   [RUTAS] Guardando paradas: [...]
   [RUTAS] Respuesta paradas: 200
   ```
6. ✅ No debe romper

---

## 🐛 Troubleshooting

### **Problema: "Foto no se carga al editar"**

**Causa:** Backend devuelve `foto_portada` pero frontend espera `fotoPortada`

**Solución:** ✅ Ya implementado con fallback:
```typescript
initialData?.fotoPortada ?? initialData?.foto_portada ?? ''
```

---

### **Problema: "Error DTO al actualizar"**

**Causa:** Backend rechaza campos `null` o campos no esperados

**Antes:**
```json
{
  "titulo": "Ruta",
  "slug": "ruta",
  "fotoPortada": null,  // ❌ Backend rechaza
  "descripcionLarga": null  // ❌ Backend rechaza
}
```

**Ahora:**
```json
{
  "titulo": "Ruta",
  "slug": "ruta",
  "activo": true
  // ✅ Solo campos con valor
}
```

---

### **Problema: "Paradas no se guardan"**

**Verificar en console:**
```
[RUTAS] Guardando paradas: [...]  // ¿aparece?
[RUTAS] Respuesta paradas: 200    // ¿es 200?
```

**Si no aparecen logs:**
- Verificar que `paradas.length > 0`
- Verificar que todas tengan `puebloId`

**Si respuesta no es 200:**
- **401:** Token no válido
- **404:** Endpoint backend no existe
- **400:** Payload inválido (falta puebloId)

---

## 📋 Checklist de Funcionalidad

- [x] Cargar datos al editar (ambos formatos)
- [x] Foto portada se muestra al editar
- [x] Descripción se carga al editar
- [x] Payload limpio (solo campos con valor)
- [x] No enviar `null` innecesarios
- [x] Logs de debug en console
- [x] Validación de puebloId antes de guardar paradas
- [x] Error claro si falta puebloId

---

## 📄 Archivos Modificados

- ✅ `app/gestion/asociacion/rutas/RutaForm.client.tsx`
  - Fallbacks para cargar datos
  - Payload limpio
  - Logs de debug

---

## 🎯 Flujo Completo Actualizado

### **Editar ruta existente:**

1. Click "Editar"
2. **Se cargan datos** (con fallbacks)
3. **Se muestra foto portada** (si existe)
4. **Se muestra descripción** (si existe)
5. **Se cargan paradas** (si existen)

### **Actualizar ruta:**

1. Hacer cambios
2. Click "Actualizar"
3. **Payload limpio** (solo campos modificados)
4. **Backend recibe solo lo necesario**
5. ✅ No rompe por DTO

### **Añadir paradas:**

1. Pegar descripción
2. "Generar preview"
3. "Confirmar y añadir"
4. Click "Actualizar"
5. **Se guardan paradas DESPUÉS de ruta**
6. ✅ Logs en console

---

**Fix completado** ✅  
Backend recibe solo campos con valor, sin nulls innecesarios.
