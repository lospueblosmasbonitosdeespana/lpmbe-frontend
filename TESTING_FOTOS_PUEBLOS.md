# 🧪 TESTING FOTOS PUEBLOS — GUÍA PASO A PASO

**NO subir a GitHub hasta que Fran lo diga.**

---

## ✅ CAMBIOS REALIZADOS

1. **Restaurada API route de Next.js** (proxy sin CORS)
   - `app/api/public/pueblos/photos/route.ts`
   - Llama al backend server-side
   - Logs detallados para debug

2. **Hook actualizado con logs**
   - Llama a `/api/public/pueblos/photos` (misma origin)
   - Logs: IDs recibidos, cantidad de fotos, errores

3. **Acceso correcto a fotos**
   - `photos[String(pueblo.id)]?.url`
   - Funciona en PueblosList y FeaturedPueblosGrid

---

## 🧪 PRUEBAS A REALIZAR

### Prueba 1: Verificar request única

1. Abrir `/pueblos` en el navegador
2. Abrir DevTools → Network
3. Buscar request: `/api/public/pueblos/photos?ids=...`

**✅ Debe verse:**
- **1 sola request** a `/api/public/pueblos/photos`
- **Status 200**
- **Response type:** JSON

---

### Prueba 2: Verificar estructura de respuesta

1. En DevTools → Network
2. Clic en la request `/api/public/pueblos/photos?ids=...`
3. Ver la pestaña **Response**

**✅ Debe tener esta estructura:**
```json
{
  "1": {
    "url": "https://lospueblosmasbonitosdeespana.org/...",
    "rotation": 0
  },
  "2": {
    "url": "https://...",
    "rotation": 90
  },
  ...
}
```

**❌ Si la estructura es diferente:**
- Copiar el response completo
- Enviarlo a Cursor

---

### Prueba 3: Verificar logs del navegador

1. Abrir DevTools → Console
2. Recargar `/pueblos`

**✅ Deberías ver logs como:**
```
[usePuebloPhotos] useEffect triggered, 126 pueblos
[usePuebloPhotos] First 3 pueblos: [{ id: 1, slug: "ainsa" }, ...]
[usePuebloPhotos] Fetching 126 photos, first 5 IDs: [1, 2, 3, 4, 5]
[usePuebloPhotos] Received 118/126 photos with URL
```

**❌ Si ves errores:**
- Buscar líneas con `[ERROR]` o `API error`
- Copiar el error completo
- Enviarlo a Cursor

---

### Prueba 4: Verificar que las fotos se muestran

1. En `/pueblos`, scroll hacia abajo
2. Verificar que las tarjetas muestran imágenes

**✅ Debe verse:**
- Primeras 8 tarjetas con fotos (carga inmediata)
- Resto de tarjetas con fotos al hacer scroll
- Algunas pueden mostrar "Sin imagen" (correcto si no tienen foto)

**❌ Si NO se ve ninguna foto:**
- Ir a Prueba 5

---

### Prueba 5: Debug de fotos vacías

1. Abrir DevTools → Console
2. Buscar el log: `[usePuebloPhotos] Received X/Y photos with URL`

**Caso A: "Received 0/126"**
- El backend no está retornando URLs
- Copiar el response de Network (Prueba 2)
- Enviarlo a Cursor

**Caso B: "Received 118/126"**
- El backend SÍ retorna URLs
- Problema en el acceso frontend
- Abrir DevTools → Elements
- Inspeccionar una tarjeta de pueblo
- Verificar si el `<img>` tiene `src`

**Caso C: No aparece el log**
- El fetch falló antes
- Buscar en Console: `[usePuebloPhotos] API error`
- Copiar el error completo

---

### Prueba 6: Verificar IDs de pueblos

1. Abrir DevTools → Console
2. Buscar el log: `[usePuebloPhotos] First 3 pueblos`

**✅ Debe verse:**
```
[usePuebloPhotos] First 3 pueblos: [
  { id: 1, slug: "ainsa" },
  { id: 2, slug: "albarracin" },
  { id: 3, slug: "alcala-del-jucar" }
]
```

**❌ Si los IDs son undefined/null:**
- El problema está en la carga inicial de pueblos
- No es un problema de fotos
- Copiar el log completo

---

## 🔍 LOGS DEL SERVIDOR (Next.js terminal)

En la terminal donde corre `npm run dev`, deberías ver:

```
[api/public/pueblos/photos] Fetching from backend: http://localhost:3000/public/pueblos/photos?ids=...
[api/public/pueblos/photos] IDs count: 126
[api/public/pueblos/photos] Success 200, body length: 15234
[api/public/pueblos/photos] Photos with URL: 118/126
```

**❌ Si ves:**
```
[api/public/pueblos/photos] Backend error 500: ...
```
- El problema está en el backend
- Copiar el error completo

---

## 📋 CHECKLIST RÁPIDO

Marca con ✅ o ❌ cada punto:

- [ ] Request a `/api/public/pueblos/photos?ids=...` aparece en Network
- [ ] Status de la request es 200
- [ ] Response tiene estructura `{ "1": { url, rotation }, ... }`
- [ ] Log del navegador muestra IDs correctos
- [ ] Log del navegador muestra "Received X photos with URL" (X > 0)
- [ ] Las fotos se muestran en el grid
- [ ] Logs del servidor (terminal) sin errores

---

## 🚨 SI NADA FUNCIONA

**Enviar a Cursor:**

1. **Screenshot de Network** (request + response)
2. **Logs del navegador** (Console completo)
3. **Logs del servidor** (terminal de Next.js)
4. **Estructura de 1 pueblo** (desde el log "First 3 pueblos")

**NO tocar código hasta tener esta info.**

---

## ✅ SI TODO FUNCIONA

Deberías ver:
- 1 request a la API
- Fotos en el grid
- No errores en Console

**Entonces:** ✅ Listo para subir a GitHub (cuando Fran lo diga).
