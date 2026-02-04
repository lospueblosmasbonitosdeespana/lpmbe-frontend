# Problema y Solución: Renderizado HTML en SafeHtml

## 🔴 Problema

El contenido HTML de las páginas públicas se mostraba como **texto plano** en lugar de renderizarse correctamente:

```
<p>## Un sello de calidad reconocido...</p><img class="editor-image" style="...">
```

En lugar de verse como:

```
Un sello de calidad reconocido...
[imagen renderizada]
```

## 🔍 Causa raíz

SafeHtml usaba `innerHTML` dentro de un `useEffect`, lo que causaba:

1. **Primer render (SSR)**: Div vacío se renderiza en el servidor
2. **Segundo render (Cliente)**: useEffect se ejecuta y asigna innerHTML
3. **Resultado**: El usuario ve texto HTML sin procesar hasta que JavaScript carga

## ✅ Solución final

### Cambio 1: isomorphic-dompurify
```bash
npm install isomorphic-dompurify
```

Permite sanitizar HTML tanto en servidor como en cliente.

### Cambio 2: dangerouslySetInnerHTML + useMemo
```tsx
const cleanHtml = useMemo(() => {
  return DOMPurify.sanitize(html, { ... });
}, [html]);

return (
  <div
    ref={containerRef}
    dangerouslySetInnerHTML={{ __html: cleanHtml }}
    className="prose prose-lg ..."
  />
);
```

**Ventajas:**
- ✅ HTML se sanitiza **síncronamente** antes del render
- ✅ SSR funciona correctamente (servidor envía HTML ya procesado)
- ✅ No hay flash de contenido sin procesar
- ✅ SEO correcto (motores de búsqueda ven HTML renderizado)

### Cambio 3: useEffect solo para post-procesamiento
```tsx
useEffect(() => {
  // Solo operaciones que requieren acceso al DOM
  // Enlaces externos: target="_blank"
  // Imágenes: aplicar estilos inline
}, [cleanHtml]);
```

## 📊 Comparación

| Método | SSR | Hidratación | SEO | Flash |
|--------|-----|-------------|-----|-------|
| `innerHTML` en useEffect | ❌ | ⚠️ Lenta | ❌ | ❌ Sí |
| `dangerouslySetInnerHTML` + useMemo | ✅ | ✅ Rápida | ✅ | ✅ No |

## 🎯 Resultado

- ✅ Contenido HTML se renderiza correctamente en SSR
- ✅ Imágenes con estilos controlados (max 800px)
- ✅ Enlaces externos abren en nueva pestaña
- ✅ Performance optimizada con useMemo
- ✅ Sin flash de contenido sin procesar

## 🚀 Para replicar en otros componentes

```tsx
'use client';
import DOMPurify from 'isomorphic-dompurify';
import { useMemo, useEffect, useRef } from 'react';

export default function HtmlRenderer({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 1. Sanitizar síncronamente
  const cleanHtml = useMemo(() => 
    DOMPurify.sanitize(html, { /* config */ }),
    [html]
  );
  
  // 2. Renderizar con dangerouslySetInnerHTML
  return (
    <div 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
  
  // 3. Post-procesamiento en useEffect (opcional)
  useEffect(() => {
    // Manipulaciones DOM adicionales
  }, [cleanHtml]);
}
```

---

**Fecha**: 2026-02-04  
**Archivos modificados**: `SafeHtml.tsx`  
**Commits**: `8de53ae`, `ef99b26`, `d74cc5f`
