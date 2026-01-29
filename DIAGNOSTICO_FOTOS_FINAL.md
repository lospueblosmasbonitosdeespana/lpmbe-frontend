## 🔍 DIAGNÓSTICO FINAL - IMÁGENES NO CARGAN

**Fecha:** 29 de enero de 2026

---

### ✅ ENDPOINT FUNCIONA CORRECTAMENTE

El endpoint `/api/public/pueblos/photos` **SÍ está funcionando**:

```bash
$ curl "http://localhost:3001/api/public/pueblos/photos?ids=37,38,39,40"
{
  "37": { "url": "https://...", "rotation": 0 },
  "38": { "url": "https://...", "rotation": 0 },
  "39": { "url": "https://...", "rotation": 0 },
  "40": { "url": "https://...", "rotation": 0 }
}
```

---

### ❌ EL PROBLEMA

**Muchos pueblos NO tienen fotos en la base de datos:**

```bash
$ curl "http://localhost:3001/api/public/pueblos/photos?ids=1,2,3,4,5"
{
  "1": null,
  "2": null,
  "3": { "url": "..." },
  "4": null,
  "5": null
}
```

**Solo ~118 de 126 pueblos tienen foto.**

---

### 🔧 EL FRONTEND DEBE MANEJAR `null`

El código actual **SÍ maneja null correctamente**:

```typescript
// En PueblosList.tsx línea 237-238:
const photoData = photos[String(pueblo.id)];
const foto = photoData?.url ?? null;

// En PuebloCard línea 60-76:
{foto ? (
  <img src={foto} ... />
) : (
  <span>Sin imagen</span>
)}
```

---

### ❓ ENTONCES, ¿POR QUÉ NO SE VEN LAS FOTOS?

**Posibles causas:**

1. **El hook no se está ejecutando** (no hay logs en consola)
2. **El estado `photos` está vacío** (el fetch falló silenciosamente)
3. **Hay un error de CORS** o red que bloquea el fetch
4. **El servidor Next.js no está reiniciado** después de los cambios

---

### 🧪 VERIFICACIÓN NECESARIA

**Abre la consola del navegador (F12) y busca estos logs:**

```
[usePuebloPhotos] useEffect triggered, 126 pueblos
[usePuebloPhotos] IDs key: 1,2,3,4,5,6...
[usePuebloPhotos] Fetching 126 photos (bulk direct)...
[usePuebloPhotos] Received 118/126 photos with URL
[usePuebloPhotos] Loaded 118/126 photos in XXXms
```

**Si NO ves estos logs:**
- El hook no se ejecuta
- O hay un error que no se está mostrando

**Si VES los logs pero no hay fotos:**
- El estado no se está actualizando
- O hay un problema de render

---

### 🔄 SIGUIENTE PASO

**1. Reinicia el servidor (IMPORTANTE):**
```bash
# Ctrl+C
npm run dev
```

**2. Borra cache del navegador:**
- F12 → Application → Session Storage
- Borrar `pueblos_photos_bulk`

**3. Abre `/pueblos` y pégame:**
- ✅ Los logs de la consola (F12)
- ✅ Screenshot de Network tab mostrando la request `/api/public/pueblos/photos`

---

**SIN ESA INFO NO PUEDO AVANZAR.** El endpoint funciona, el código está bien, necesito ver qué pasa en el navegador.
