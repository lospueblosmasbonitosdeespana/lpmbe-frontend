# RAMAS Y FLUJO LPMBE – Documento de referencia

> **IMPORTANTE**: Consultar siempre este documento antes de hacer commits, pushes o cambios de rama.

## Repositorios

| Repo | Ubicación | Propósito |
|------|-----------|-----------|
| **lpmbe-frontend** | `/LPMBE/frontend/` | Frontend web Next.js (producción) |
| **lpmbe-backend** | `/LPMBE/backend/` | API NestJS |
| **v0-tourism-website-design** | `/LPMBE/v0-tourism-website-design/` | Diseño de referencia (NO es rama del frontend) |

---

## Ramas de lpmbe-frontend

| Rama | Uso | Despliegue |
|------|-----|------------|
| **main** | Producción, fixes críticos (fotos, foto_destacada, etc.) | Vercel → producción |
| **Desingn-V0** | Diseño (pueblos, rutas, Meteo, colores, layout) | No desplegada a prod |

> ⚠️ El nombre correcto es **Desingn-V0** (typo intencional: "Desingn", no "Design").

---

## Ramas de lpmbe-backend

| Rama | Uso |
|------|-----|
| **main** | Producción |

---

## Reglas de trabajo

1. **Fixes críticos** (fotos, reorder, foto_destacada) → trabajar en `main` (frontend + backend).
2. **Diseño** (página pueblo, rutas, Meteo, colores) → trabajar en `Desingn-V0` (frontend).
3. **Antes de cambiar de rama** → commitear o guardar cambios pendientes.
4. **Antes de subir a GitHub** → esperar confirmación explícita del usuario.
5. **No hacer merge** de Desingn-V0 → main sin que el usuario lo pida.

---

## Flujo típico

```
TRABAJAR EN DISEÑO:
  cd frontend && git checkout Desingn-V0

TRABAJAR EN FIXES DE PRODUCCIÓN:
  cd frontend && git checkout main

DESPUÉS DE TERMINAR DISEÑO (cuando el usuario confirme):
  git checkout main
  git merge Desingn-V0
  git push origin main
```

---

## Flujo seguro (no fastidiar main)

**Objetivo**: Subir diseño a GitHub sin tocar main. Luego, cuando acabemos el día, subir lo hecho a main. No equivocarse.

### 1. Subir solo a rama diseño (NO toca main)

```bash
cd frontend
git status                    # Comprobar rama (debe ser Desingn-V0)
git add .
git commit -m "feat(meteo): diseño completo"
git push origin Desingn-V0    # Solo la rama diseño, main NO se toca
```

### 2. Al acabar el día: pasar diseño a producción (main)

```bash
cd frontend
git checkout main             # Cambiar a main
git pull origin main          # Traer última versión de main
git merge Desingn-V0          # Incorporar diseño
git push origin main          # Subir a producción
```

### Reglas clave

- **Nunca hacer push a main** hasta que el usuario confirme explícitamente.
- **No hacer checkout a main** si hay cambios sin commitear (primero commit en Desingn-V0).
- **`git push origin Desingn-V0`** solo actualiza la rama diseño; main permanece intacta.
- **El merge a main** lo decide el usuario cuando todo esté listo.

---

## v0-tourism-website-design

- **Ruta local** (IMPORTANTE, memorizar): `Projects/LPMBE/tourism-website-design` (clonada a mano)
- **Ruta absoluta**: `/Users/franmestre/Projects/LPMBE/tourism-website-design`
- **Repositorio separado** clonado en `LPMBE/`. Sirve como **referencia de diseño**.
- **No es una rama** de lpmbe-frontend.

### Actualizar cuando hay página nueva de diseño

Cuando el usuario diga que hay una **página nueva de diseño** en GitHub:

1. **Descargar** el último repositorio de GitHub (repo de diseño).
2. **Sustituir** el contenido de `Projects/LPMBE/tourism-website-design` por lo descargado.
3. El diseño nuevo estará visible en local tras la sustitución.

```
cd /Users/franmestre/Projects/LPMBE
rm -rf tourism-website-design   # o hacer backup primero
git clone https://github.com/lospueblosmasbonitosdeespana/v0-tourism-website-design tourism-website-design
```

O si ya está clonado y solo hay que actualizar:
```
cd /Users/franmestre/Projects/LPMBE/tourism-website-design
git fetch origin && git pull origin main
```

### Páginas de diseño conocidas

- ListingCard, ListingPageTemplate, listingPresets (pueblos, rutas).
- Meteo: `components/meteo/meteo-list-row.tsx` + `meteo-listing-page.tsx` (diseño de referencia).
  - **IMPORTANTE**: En LPMBE, mantener SOLO bandera de comunidad (NO añadir emojis 🏰🏴🍇 ni iconos de categoría).
  - Usar SVG de clima, estructura Link clickable, colores de temperatura.
- Tienda: `components/shop/shop-page.tsx` + `product-card.tsx` + `shop-category-card.tsx` (diseño de referencia).
  - **Implementado**: Hero con búsqueda, BenefitsBar, ProductCard, banners destacados, newsletter CTA.
  - Componentes creados: `ProductCard.tsx`, `ShopCategoryCard.tsx` en `app/_components/tienda/`.

---

## Checklist antes de commit/push

- [ ] ¿Estoy en la rama correcta? (main vs Desingn-V0)
- [ ] ¿El usuario ha confirmado que puedo subir a GitHub?
- [ ] ¿Backend y frontend están en ramas coherentes para el tipo de cambio?
