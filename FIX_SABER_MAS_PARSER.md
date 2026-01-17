# Fix: Limpieza "Saber más" + Parser Mejorado + Validación

## ✅ Cambios Aplicados

### 1. **Eliminar "Saber más" en Render Público**

**Archivo:** `app/rutas/[slug]/page.tsx`

**Cambio:**
```typescript
// ANTES de sanitizar, limpiar "Saber más"
const introSinSaberMas = intro ? intro.replace(/(\s*)Saber m[aá]s(\s*)/gi, '\n') : null;
const outroSinSaberMas = outro ? outro.replace(/(\s*)Saber m[aá]s(\s*)/gi, '\n') : null;
```

**Resultado:**
- ✅ "Saber más" se elimina de intro y outro
- ✅ Con o sin tilde: "Saber más" / "Saber mas"
- ✅ No se guarda en BD, solo se limpia al renderizar

---

### 2. **Parser Mejorado para Formato con "Saber más" Pegado**

**Archivo:** `app/gestion/asociacion/rutas/ConvertidorTexto.tsx`

**Problema anterior:**
```
1. Ujué – Uxue
Descripción... Saber más 2. Roncal – Erronkari
                     ↑ pegado sin salto
```

**Parser nuevo:**
```typescript
// Regex global que detecta bloques completos
const regex = /(?:^|\n)\s*(\d+)[.\)]\s*(.+?)(?=\n\s*\d+[.\)]|\n\s*TIPS|\n\s*CONOCE\s+M[ÁA]S|$)/gis;
```

**Mejoras:**
- ✅ Detecta paradas con "Saber más" pegado
- ✅ Separa nombre (primera línea) y descripción (resto)
- ✅ Limpia "Saber más" del nombre y descripción
- ✅ Detecta fin de bloque con "TIPS" o "CONOCE MÁS RUTAS"

---

### 3. **Validación Estricta en Guardar**

**Archivo:** `app/gestion/asociacion/rutas/RutaForm.client.tsx`

**Cambio:**
```typescript
// Validar antes de guardar paradas
const sinPueblo = paradas.filter(p => !p.puebloId);
if (sinPueblo.length > 0) {
  throw new Error(`Hay ${sinPueblo.length} parada(s) sin pueblo asignado.`);
}
```

**Logs añadidos:**
```typescript
console.log('[RUTAS] Guardando paradas:', paradasPayload);
console.log('[RUTAS] Respuesta paradas:', resParadas.status);
console.error('[RUTAS] Error guardando paradas:', data); // si falla
```

**Resultado:**
- ✅ No permite guardar si falta algún pueblo
- ✅ Mensaje claro de error
- ✅ Logs en consola para debug

---

## 🔍 Checklist de Debug (DevTools)

### **Al guardar ruta con paradas:**

1. **Abrir DevTools → Console**
   - Ver: `[RUTAS] Guardando paradas: [...]`
   - Ver: `[RUTAS] Respuesta paradas: 200` (o error)

2. **Abrir DevTools → Network**
   - Buscar: `PUT /api/gestion/asociacion/rutas/[id]/paradas`
   - Verificar:
     - **Status 200:** ✅ Guardado correcto
     - **Status 401:** ❌ Token no válido
     - **Status 404:** ❌ Endpoint no existe
     - **Status 400:** ❌ Payload inválido (falta puebloId?)

3. **Si todo OK pero no aparecen en público:**
   - Verificar: `GET /rutas/[id]/paradas` devuelve array
   - Verificar: Backend creó las filas en tabla `RutaPueblo`

---

## 🎯 Flujo Correcto para Migrar Rutas

### **Paso a paso:**

1. **Ir a** `/gestion/asociacion/rutas`
2. **Click** "Editar" en una ruta
3. **Copiar** descripción de WordPress (con todo el bloque numerado)
4. **Pegar** en "Generar paradas desde descripción"
5. **Click** "Generar preview"
6. **Verificar preview:**
   - Verde ✅ = match exacto
   - Amarillo ⚠️ = match parcial (revisar)
   - Rojo ❌ = sin pueblo (seleccionar manualmente)
7. **Si hay rojos:** ajustar el pueblo en el selector
8. **Click** "Confirmar y añadir" (solo si todos tienen pueblo)
9. **Click** "Guardar" (ahora guarda ruta + paradas)
10. **Verificar en consola:**
    ```
    [RUTAS] Guardando paradas: [{orden: 1, puebloId: 37, ...}, ...]
    [RUTAS] Respuesta paradas: 200
    ```
11. **Ir a** `/rutas/[slug]` → Ver paradas renderizadas

---

## 🐛 Troubleshooting

### **Problema: "No se guardan las paradas"**

**Síntomas:**
- Guardas la ruta
- No ves paradas en público
- Consola sin logs `[RUTAS]`

**Causa:**
- Las paradas no tienen `puebloId` asignado
- El convertidor las creó vacías

**Solución:**
1. Revisar que todas las paradas tengan pueblo asignado (sin amarillo)
2. Verificar consola: debe salir error `Hay X parada(s) sin pueblo`

---

### **Problema: "Se guardan pero no se renderizan"**

**Síntomas:**
- Consola: `[RUTAS] Respuesta paradas: 200`
- Público: no aparecen

**Causa:**
- Backend no devuelve paradas en `GET /rutas/:id/paradas`
- O devuelve array vacío

**Solución:**
1. Abrir: `GET /rutas/[id]/paradas` en navegador
2. Verificar respuesta:
   - `[]` = Backend no las creó
   - `[{...}]` = Frontend no las renderiza (bug render)

---

### **Problema: "Parser no detecta paradas"**

**Síntomas:**
- "Generar preview" → 0 paradas detectadas

**Causa:**
- Formato del texto no coincide con regex

**Solución:**
1. Verificar que el texto tenga formato:
   ```
   1. Nombre
   Descripción...
   2. Nombre
   ```
2. O con "Saber más" pegado:
   ```
   1. Nombre
   Descripción... Saber más 2. Nombre
   ```
3. Si sigue fallando: pegar ejemplo del texto en issue

---

## ✅ Test Manual Rápido

### **Caso 1: Texto con "Saber más" pegado**

**Input:**
```
1. Ujué – Uxue
Pueblo medieval... Saber más 2. Roncal – Erronkari
Valle pirenaico... Saber más
```

**Esperado:**
- 2 paradas detectadas
- Parada 1: "Ujué – Uxue" (sin "Saber más")
- Parada 2: "Roncal – Erronkari" (sin "Saber más")

---

### **Caso 2: Texto con TIPS al final**

**Input:**
```
1. Pueblo A
Descripción A
2. Pueblo B
Descripción B
TIPS DE RUTA
- Llevar agua
```

**Esperado:**
- 2 paradas detectadas
- TIPS no incluido en descripción de Pueblo B

---

## 📋 Resumen de Archivos Modificados

- ✅ `app/rutas/[slug]/page.tsx` - Limpieza "Saber más" en render
- ✅ `app/gestion/asociacion/rutas/ConvertidorTexto.tsx` - Parser mejorado
- ✅ `app/gestion/asociacion/rutas/RutaForm.client.tsx` - Validación + logs

---

**Fix completado** ✅  
Listo para migrar rutas con formato legacy pegado.
