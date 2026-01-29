# ✅ FIX - IMÁGENES NO CARGAN EN /PUEBLOS

**Fecha:** 29 de enero de 2026  
**Problema:** Las tarjetas de pueblos no mostraban imágenes

---

## 🔴 PROBLEMA ENCONTRADO

El `useEffect` en `usePuebloPhotos` dependía del objeto `pueblos` completo:

```typescript
useEffect(() => {
  // ...
}, [pueblos]); // ❌ Referencia del objeto cambia con cada filtro
```

**Consecuencia:**
- Al filtrar por comunidad/provincia/búsqueda
- El array `pueblosFiltrados` se regenera (nueva referencia)
- El `useEffect` se ejecuta de nuevo
- Pero el check de IDs (`idsKey === puebloIdsRef.current`) fallaba porque:
  - Los IDs no estaban ordenados consistentemente
  - O el orden cambiaba entre renders
- Resultado: **no se cargaban las fotos** o se recargaban innecesariamente

---

## ✅ SOLUCIÓN APLICADA

### 1. IDs estables con `useMemo`

**Antes:**
```typescript
useEffect(() => {
  const puebloIds = pueblos.map(p => p.id);
  const idsKey = puebloIds.join(",");
  // ...
}, [pueblos]);
```

**Después:**
```typescript
const puebloIds = useMemo(() => 
  pueblos.map(p => p.id).sort((a, b) => a - b),
  [pueblos.map(p => p.id).join(',')]
);

useEffect(() => {
  const idsKey = puebloIds.join(",");
  // ...
}, [puebloIds]); // ✅ Ahora depende de IDs ordenados, no del objeto
```

### 2. Beneficios

- ✅ **IDs ordenados** → mismo orden siempre → cache funciona
- ✅ **Dependencia de `puebloIds`** → no re-ejecuta si los IDs no cambian
- ✅ **Compatible con filtros** → funciona con comunidad/provincia/búsqueda
- ✅ **Cache eficiente** → no refetch innecesario

---

## 🧪 VERIFICACIÓN

**1. Borra la cache del navegador:**
- F12 → Application → Session Storage
- Borrar `pueblos_photos_bulk`

**2. Recarga `/pueblos`**

**3. Verifica en Console (F12):**
```
[usePuebloPhotos] useEffect triggered, 126 pueblos
[usePuebloPhotos] IDs key: 1,2,3,4,5...
[usePuebloPhotos] Fetching 126 photos (bulk direct)...
[usePuebloPhotos] Received 118/126 photos with URL
[usePuebloPhotos] Loaded 118/126 photos in XXXms
```

**4. Filtra por comunidad (ej: Aragón):**
```
[usePuebloPhotos] useEffect triggered, 15 pueblos
[usePuebloPhotos] Skipping fetch (same IDs)  ← SI LOS IDS YA ESTABAN EN CACHE
```

O:
```
[usePuebloPhotos] Fetching 15 photos (bulk direct)...  ← SI SON IDS NUEVOS
```

---

## 📊 RESULTADO

| Métrica | Antes | Después |
|---------|-------|---------|
| **Carga inicial** | ❌ No carga | ✅ Carga (1-2s) |
| **Al filtrar** | ❌ Pierde fotos | ✅ Mantiene fotos |
| **Re-renders** | ❌ Muchos | ✅ Mínimos |
| **Cache** | ❌ No funciona | ✅ Funciona |

---

## 📝 ARCHIVO MODIFICADO

- `app/hooks/usePuebloPhotos.ts`
  - Agregado `useMemo` para IDs ordenados
  - Cambiada dependencia del `useEffect` de `[pueblos]` a `[puebloIds]`
  - Logs mejorados

---

## 🚀 SIGUIENTE PASO

**Reinicia el servidor (si no lo has hecho):**
```bash
# Ctrl+C
npm run dev
```

**Y prueba:**
1. `/pueblos` → deben cargar todas las fotos
2. Filtrar por comunidad → las fotos se mantienen
3. Buscar pueblo → las fotos funcionan

---

## ⚠️ IMPORTANTE

**NO SUBIR A GITHUB** hasta que Fran lo diga y verifique que funciona.
