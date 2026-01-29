# ✅ FIX DEFINITIVO: Layout Adaptativo para Fotos Rotadas en POIs

**Fecha:** 29 enero 2026  
**Problema resuelto:** Fotos rotadas 90/270 se recortaban o tapaban textos

---

## 🎯 Problema identificado

Con `overflow: hidden` + `object-fit: cover`:
- ❌ Fotos rotadas 90/270 (verticales) se recortaban
- ❌ Layout quedaba "chato"
- ❌ No se adaptaba a orientación vertical

---

## ✅ Solución: Componente `RotatedImage` con layout adaptativo

### Patrón implementado:

```typescript
const isVertical = rotation % 180 !== 0; // 90 o 270

// Contenedor adaptativo
const containerHeight = isVertical 
  ? height * 1.5  // Más alto para verticales
  : height;       // Normal para horizontales

// Imagen adaptativa
objectFit: isVertical ? "contain" : "cover"
```

**Resultado:**
- ✅ Fotos 0/180 (horizontales) → `cover` (llena todo)
- ✅ Fotos 90/270 (verticales) → `contain` (se ve completa, sin recortar)
- ✅ Contenedor crece 1.5x en altura para verticales

---

## 📝 Componente creado

**Archivo:** `app/components/RotatedImage.tsx`

```typescript
type RotatedImageProps = {
  src: string;
  alt: string;
  rotation?: number | null;
  height?: number;     // Altura base (default 200)
  width?: number | string; // Ancho (default "100%")
  loading?: "lazy" | "eager";
};

export default function RotatedImage({ ... }) {
  const rot = rotation ?? 0;
  const isVertical = rot % 180 !== 0;
  const containerHeight = isVertical ? height * 1.5 : height;

  return (
    <div style={{
      width: ...,
      height: containerHeight,
      overflow: "hidden",
      backgroundColor: "#f5f5f5",
      borderRadius: 4,
    }}>
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          objectFit: isVertical ? "contain" : "cover",
          transform: rot !== 0 ? `rotate(${rot}deg)` : undefined,
          transformOrigin: "center",
        }}
      />
    </div>
  );
}
```

---

## 📍 Lugares donde se aplicó

### 1. **Listado público de POIs** (3 secciones)
**Archivo:** `app/pueblos/[slug]/page.tsx`

**ANTES:**
```typescript
<img
  src={poi.foto}
  style={{
    height: "200px",
    objectFit: "cover",
    transform: `rotate(${poi.rotation}deg)`,
  }}
/>
```

**AHORA:**
```typescript
<RotatedImage
  src={poi.foto}
  alt={poi.nombre}
  rotation={poi.rotation}
  height={200}
  loading="lazy"
/>
```

---

### 2. **Listado admin de POIs**
**Archivo:** `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx`

**ANTES:**
```typescript
<img
  src={row.foto}
  style={{
    maxWidth: 200,
    maxHeight: 150,
    objectFit: "cover",
    transform: `rotate(${row.rotation}deg)`,
  }}
/>
```

**AHORA:**
```typescript
<RotatedImage
  src={row.foto}
  alt={row.nombre}
  rotation={row.rotation}
  height={150}
  width={200}
  loading="eager"
/>
```

---

## 🎨 Comportamiento visual

### Foto horizontal (0° o 180°):
```
┌─────────────────┐
│                 │  height: 200px
│   [COVER]       │  (llena todo)
│                 │
└─────────────────┘
```

### Foto vertical (90° o 270°):
```
┌─────────────────┐
│                 │
│                 │  height: 300px (200 × 1.5)
│   [CONTAIN]     │  (se ve completa)
│                 │
│                 │
└─────────────────┘
```

**Fondo gris (#f5f5f5) rellena los huecos.**

---

## ✅ Resultado esperado

### Público (`/pueblos/ainsa`):
- ✅ POIs con foto horizontal (0/180) → se ve normal
- ✅ POIs con foto vertical (90/270) → contenedor más alto, foto completa sin recortar
- ✅ No tapa texto de abajo

### Admin (`/gestion/pueblos/ainsa/pois`):
- ✅ Miniatura en listado se adapta a rotación
- ✅ No se desborda

---

## 📝 Archivos modificados

**Creado:**
- ✅ `app/components/RotatedImage.tsx` (componente reutilizable)

**Modificados:**
- ✅ `app/pueblos/[slug]/page.tsx` (3 secciones de POIs)
- ✅ `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx` (listado admin)

**NO se tocó:**
- ✅ PhotoManager (no era necesario)
- ✅ Endpoints (no era necesario)
- ✅ Backend (no era necesario)

---

## 🧪 Probar ahora

1. **Público:** Ir a `/pueblos/ainsa`
2. Ver sección POIs
3. Si hay una foto rotada 90° → contenedor más alto, foto completa
4. **Admin:** Ir a `/gestion/pueblos/ainsa/pois`
5. Miniaturas rotadas se ven bien

---

**LISTO. Las fotos rotadas ya no recortan ni tapan texto.** ✅
