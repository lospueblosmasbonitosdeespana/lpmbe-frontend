# Actualización: Split Intro/Paradas/Outro + Convertidor Inteligente

## ✅ Cambios Implementados

### 1. **Página Pública `/rutas/[slug]` - Split de Descripción**

**Objetivo:** Mostrar intro → paradas → outro (tips) sin duplicar contenido.

**Implementación:**

```typescript
function splitDescripcionIntoIntroAndOutro(descripcion: string | null): {
  intro: string | null;
  outro: string | null;
}
```

**Lógica de corte:**

1. **Regla 1 (preferida):** Busca "¡Empezamos!"
   - `intro` = todo hasta "¡Empezamos!" (incluido)
   - `resto` = después de "¡Empezamos!"
   - `outro` = extrae de `resto` todo después de "TIPS DE RUTA" o "CONOCE MÁS RUTAS"

2. **Regla 2 (fallback):** Busca el primer `1.` (patrón `^\s*1\.\s+`)
   - `intro` = todo antes del primer `1.`
   - `resto` = desde el primer `1.`
   - `outro` = igual que regla 1

3. **Fallback final:** Si no se detecta patrón
   - `intro` = toda la descripción
   - `outro` = null

**Render:**
```
[Intro - texto inicial hasta paradas]
    ↓
[Bloque Paradas - datos reales de RutaPueblo]
    ↓
[Outro - tips y cierre]
```

**Cambios en UI de paradas:**
- ✅ Botón "Saber más" en lugar de "Ver pueblo →"
- ✅ Descripción con `whitespace-pre-line` para respetar saltos
- ✅ Sin duplicar el bloque numerado legacy

---

### 2. **Convertidor de Texto - Sistema de Preview Inteligente**

**Objetivo:** Convertir rutas heredadas con 1 click (o mínimos ajustes).

**Flujo nuevo:**

```
[Pegar texto] 
    ↓
[Generar preview] 
    ↓
[Preview con estadísticas y estado por parada]
    ↓
[Confirmar solo si todas tienen pueblo] 
    ↓
[Añadir paradas al formulario]
```

**Features del preview:**

1. **Parsing mejorado:**
   - Detecta `1. Nombre`, `1) Nombre`, `1 - Nombre`
   - Limpia "Saber más" del final de nombres
   - Extrae descripción completa (hasta siguiente número)

2. **Match inteligente de pueblos:**
   - **Exact match:** nombre normalizado igual
   - **Match por separador:** Si tiene `–` o `-`, prueba ambas partes
     - Ejemplo: "Ujué – Uxue" → prueba "Ujué" Y "Uxue"
   - **Contains bidireccional:**
     - Pueblo contiene nombre detectado
     - Nombre detectado contiene pueblo
   - **Normalización robusta:**
     - Lower case
     - Quita tildes
     - Quita caracteres especiales
     - Trim espacios

3. **Estados visuales:**
   - 🟢 Verde: match exacto
   - 🟡 Amarillo: match parcial
   - 🔴 Rojo: sin pueblo

4. **Estadísticas en tiempo real:**
   ```
   [12 con pueblo] [3 parciales] [0 sin pueblo]
   ```

5. **Validación antes de confirmar:**
   - ❌ No permite confirmar si hay paradas sin pueblo
   - ✅ Mensaje claro de qué falta

**Resultado:** En la mayoría de rutas (10-12 de 16), será **1 click y listo**. En las pocas con nombres raros, el preview muestra exactamente cuáles ajustar.

---

## 🎯 Casos de Uso Cubiertos

### **Caso 1: Ruta con "¡Empezamos!"**
```
Descripción:
"Esta ruta recorre los pueblos más bonitos...
¡Empezamos!
1. Ujué – Uxue
...
12. Bagergue
TIPS DE RUTA
- Llevar agua
- ..."
```

**Resultado:**
- Intro: texto hasta "¡Empezamos!" ✅
- Paradas: bloque real de RutaPueblo ✅
- Outro: "TIPS DE RUTA..." ✅

---

### **Caso 2: Ruta sin "¡Empezamos!" pero con "1."**
```
Descripción:
"Introducción...
1. Pueblo A
...
TIPS"
```

**Resultado:**
- Intro: texto hasta "1." ✅
- Paradas: bloque real ✅
- Outro: "TIPS" ✅

---

### **Caso 3: Ruta sin paradas (legacy puro)**
```
Descripción:
"Solo texto descriptivo"
```

**Resultado:**
- Intro: todo el texto ✅
- Paradas: no se muestra bloque ✅
- Outro: null ✅

---

## 📊 Migración de las 16 Rutas

### **Flujo recomendado:**

1. Ir a `/gestion/asociacion/rutas`
2. Para cada ruta:
   - Click "Editar"
   - Copiar descripción de WordPress
   - Pegar en "Generar paradas desde descripción"
   - Click "Generar preview"
   - Verificar preview:
     - Si todo verde → "Confirmar y añadir"
     - Si hay amarillo/rojo → ajustar texto y regenerar
   - Guardar ruta

**Tiempo estimado:** 5-10 min por ruta = **1-2 horas total** para las 16.

---

## 🚀 Ventajas del Sistema

### **Para usuarios públicos:**
- ✅ No ven duplicados ("Saber más" legacy + botón nuevo)
- ✅ Contenido bien estructurado (intro clara, paradas limpias, tips al final)
- ✅ Botones "Saber más" consistentes
- ✅ Fotos y descripciones por parada

### **Para admin:**
- ✅ Conversión automática (no copiar/pegar manual)
- ✅ Preview antes de confirmar
- ✅ Estadísticas claras de qué necesita ajuste
- ✅ Match inteligente de pueblos (incluso con nombres dobles)
- ✅ Bloqueo de guardado si falta pueblo (evita errores)

---

## 🔧 Archivos Modificados

- `app/rutas/[slug]/page.tsx` - Split intro/paradas/outro
- `app/gestion/asociacion/rutas/ConvertidorTexto.tsx` - Preview inteligente

---

## ✅ Testing Checklist

- [ ] Ruta con "¡Empezamos!" → split correcto
- [ ] Ruta sin "¡Empezamos!" → split por "1."
- [ ] Ruta sin paradas → muestra toda descripción
- [ ] Convertidor detecta 12 paradas
- [ ] Match exacto: "Ujué" → Ujué
- [ ] Match con separador: "Ujué – Uxue" → Ujué
- [ ] Match parcial: "Roncal de Navarra" → Roncal
- [ ] Preview muestra estadísticas
- [ ] No permite confirmar con paradas sin pueblo
- [ ] Al confirmar, paradas se añaden correctamente

---

**Implementación completada** ✅  
Listo para migrar las 16 rutas heredadas.
