# Plan de migración a TipTap - Editor moderno para toda la web

## Objetivo
Sustituir todos los editores de texto (textarea + MarkdownEditor) por TipTap, un editor WYSIWYG moderno, intuitivo y fácil de usar para alcaldes y administradores.

## Cambios técnicos
- **Formato anterior:** Markdown (texto plano con sintaxis especial)
- **Formato nuevo:** HTML (guardado y renderizado)
- **Editor:** TipTap con extensiones para texto, imágenes, listas, enlaces, etc.
- **Sanitización:** DOMPurify para seguridad
- **Renderizado:** Componente SafeHtml que sanitiza antes de mostrar

---

## Componentes base (a crear)

### 1. `/app/_components/editor/TipTapEditor.tsx`
Editor reutilizable con:
- Texto rico (negrita, cursiva, títulos, listas)
- Subida de imágenes con drag & drop
- Enlaces
- Botones de formato visibles
- Altura ajustable

### 2. `/app/_components/ui/SafeHtml.tsx`
Componente para renderizar HTML sanitizado de forma segura en vistas públicas.

### 3. `/lib/sanitizeHtml.ts` (actualizar)
Adaptarlo para sanitizar HTML del editor (ya existe uno básico).

---

## Fases de implementación

### **FASE 1: El Sello (ADMIN)**
**Prioridad:** ALTA  
**Complejidad:** BAJA  
**Usuarios:** Solo administradores

**Archivos a modificar:**
- `app/gestion/asociacion/el-sello/SelloEditorForm.tsx` → Sustituir textarea por TipTapEditor
- `app/_components/ui/SelloCmsPage.tsx` → Usar SafeHtml en vez de EnrichedMarkdown
- `app/el-sello/*/page.tsx` → Usar SafeHtml

**Bloques especiales (:::callout, :::grid-3):**
- **Opción A:** Crear extensiones custom en TipTap para estos bloques
- **Opción B (recomendada por ahora):** Mantener sintaxis Markdown para estos bloques; TipTap para texto rico normal

**Estado:** ✅ Por hacer primero

---

### **FASE 2: Contenidos, Noticias, Eventos (ASOCIACIÓN + PUEBLO)**
**Prioridad:** ALTA  
**Complejidad:** MEDIA  
**Usuarios:** Administradores + alcaldes

**Archivos a modificar:**

#### Asociación
- `app/gestion/asociacion/contenidos/nuevo/NuevoContenidoClient.tsx`
- `app/gestion/asociacion/contenidos/[id]/editar/EditarContenidoClient.tsx`
- `app/gestion/asociacion/noticias/nueva/page.tsx`
- `app/gestion/asociacion/noticias/[id]/editar/EditarNoticiaClient.tsx`
- `app/gestion/asociacion/eventos/nuevo/page.tsx`
- `app/gestion/asociacion/eventos/[id]/editar/EditarEventoClient.tsx`

#### Pueblo
- `app/gestion/pueblo/contenidos/nuevo/NuevoContenidoPuebloClient.tsx`
- `app/gestion/pueblo/contenidos/[id]/editar/EditarContenidoPuebloClient.tsx`
- `app/gestion/pueblos/[slug]/noticias/nueva/page.tsx`
- `app/gestion/pueblos/[slug]/eventos/nuevo/page.tsx`

#### Vistas públicas
- `app/c/[slug]/page.tsx` → Usar SafeHtml
- `app/pueblos/[slug]/ContenidosPuebloSection.tsx` → Verificar renderizado

**Estado:** Pendiente

---

### **FASE 3: Descripciones de pueblos, POIs, Multiexperiencias**
**Prioridad:** MEDIA  
**Complejidad:** MEDIA  
**Usuarios:** Alcaldes + administradores

**Archivos a modificar:**
- `app/gestion/pueblos/[slug]/descripcion/DescripcionPuebloClient.tsx`
- `app/gestion/pueblos/[slug]/pois/PoisPuebloClient.tsx`
- `app/gestion/pueblos/[slug]/multiexperiencias/MultiexperienciasPuebloClient.tsx`

**Estado:** Pendiente

---

### **FASE 4: Productos, Rutas, Alertas**
**Prioridad:** BAJA  
**Complejidad:** BAJA-MEDIA  
**Usuarios:** Administradores

**Archivos a modificar:**
- `app/gestion/asociacion/tienda/productos/ProductosAdminClient.tsx`
- `app/gestion/asociacion/rutas/RutaForm.client.tsx`
- `app/gestion/asociacion/rutas/ParadasEditor.tsx`
- `app/gestion/pueblos/[slug]/alertas/nueva/page.tsx`
- `app/gestion/pueblos/[slug]/alertas/[id]/editar/page.tsx`
- `app/gestion/asociacion/alertas/nueva/page.tsx`
- `app/gestion/asociacion/alertas/[id]/editar/page.tsx`

**Estado:** Pendiente

---

### **FASE 5: Otros (Home, Banners, Semáforo, Promociones)**
**Prioridad:** BAJA  
**Complejidad:** BAJA  
**Usuarios:** Administradores

**Archivos a modificar:**
- `app/gestion/asociacion/home/HomeConfigForm.tsx`
- `app/gestion/asociacion/tienda/destacados/FeaturedBannersAdminClient.tsx`
- `app/gestion/asociacion/tienda/promocion-global/GlobalPromotionClient.tsx`
- `app/gestion/pueblos/[slug]/semaforo/SemaforoForm.client.tsx`

**Estado:** Pendiente

---

## Dependencias a instalar

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link dompurify
npm install --save-dev @types/dompurify
```

---

## Backend: Cambios necesarios

### Base de datos
- **No** es necesario crear nuevas columnas
- Los campos actuales `contenido`, `contenidoMd`, `descripcion` pueden almacenar HTML
- El tipo `@db.Text` ya soporta HTML

### Sanitización
- Añadir sanitización en el backend (opcional pero recomendado)
- Validar que el HTML no tenga scripts maliciosos

---

## Estrategia de migración de datos existentes

### Datos en Markdown (descripciones ya existentes)
**Opción A (recomendada):** Dejarlos tal cual
- El HTML de TipTap puede convivir con Markdown antiguo
- Al editar por primera vez, se convierte automáticamente

**Opción B:** Script de conversión Markdown → HTML
- Solo si quieres tener todo homogéneo desde el principio
- No es estrictamente necesario

### Bloques especiales de El Sello
- Mantener sintaxis `:::callout`, `:::grid-3`, etc.
- Renderizar con `EnrichedMarkdown` cuando se detecten
- O crear extensiones TipTap custom (más trabajo)

---

## Notas importantes

1. **No rompe datos existentes:** El HTML es más permisivo que Markdown
2. **Reversible:** Si hace falta, se puede volver a Markdown (con conversión)
3. **Seguridad:** DOMPurify previene XSS y código malicioso
4. **WordPress desaparece:** Este sistema es independiente y moderno
5. **Mantenimiento:** TipTap está muy activo, bien documentado y es el estándar actual

---

## Estimación de tiempo

| Fase | Tiempo estimado |
|------|----------------|
| Componentes base (TipTapEditor + SafeHtml) | 1–2 días |
| Fase 1: El Sello | 0.5–1 día |
| Fase 2: Contenidos, noticias, eventos | 2–3 días |
| Fase 3: Descripciones, POIs, multiexperiencias | 1–2 días |
| Fase 4: Productos, rutas, alertas | 1–2 días |
| Fase 5: Otros | 0.5–1 día |
| Pruebas y ajustes | 1 día |
| **TOTAL** | **7–12 días** |

---

## Estado actual

- ✅ Plan creado
- ⏳ Instalando dependencias
- ⏳ Creando componentes base
- ⏳ Fase 1: El Sello

---

**Última actualización:** 4 de febrero de 2026
