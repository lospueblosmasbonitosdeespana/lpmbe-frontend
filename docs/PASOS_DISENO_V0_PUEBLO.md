# Pasos para aplicar el diseño V0 a la página del pueblo

## Contexto

- **Rama de trabajo**: `Desingn-V0` (dentro de `lpmbe-frontend`)
- **Referencia de diseño**: `~/Downloads/tourism-website-design/` (o repo GitHub `v0-tourism-website-design`)
- **Página objetivo**: `app/pueblos/[slug]/page.tsx`

## Orden de secciones en el diseño de referencia

1. Hero (imagen a pantalla completa, breadcrumbs, título)
2. Barra de acciones (Compartir, Mapa, Cómo llegar, Suscribirse, Actualidad)
3. Semáforo turístico
4. En Cifras (stats)
5. Meteo (Tiempo ahora + Próximos 3 días)
6. Qué hacer en [Pueblo] + Multiexperiencias
7. Intro + Descripción
8. Galería
9. Qué ver - Lugares de interés (POIs)
10. Mapa
11. Experiencias por categoría (6 categorías, colores del diseño)
12. Tabs temáticas
13. Pueblos cercanos

## Colores del diseño

- **Fondo página**: `#fbf9f6` (beige/crema)
- **Primary**: ámbar/marrón
- **Categorías**: verde (Naturaleza), ámbar (Cultura), azul (Familia), stone (Patrimonio), naranja (Petfriendly), rosa (Gastronomía)

## Archivos clave

| Referencia (tourism-website-design) | LPMBE (implementado) |
|-------------------------------------|----------------------|
| `components/village-hero.tsx` | `app/components/ui/detail-page-hero.tsx` |
| `components/village-description.tsx` | `app/components/ui/detail-section.tsx` (DetailIntroSection) |
| `components/village-gallery.tsx` | `app/components/ui/detail-gallery-section.tsx` |
| `components/points-of-interest.tsx` | `app/components/pueblos/PointsOfInterest.tsx` |
| `components/village/village-actions-bar.tsx` | `app/pueblos/[slug]/PuebloActions.tsx` |
| `components/village/weather-block.tsx` | `app/pueblos/[slug]/_components/MeteoPanel.tsx` |
| `components/village/category-highlights.tsx` | `app/components/village/category-highlights.tsx` |
| `components/village/map-section.tsx` | `app/components/village/map-section.tsx` |
| - | `app/pueblos/[slug]/_components/QueHacerSection.tsx` |

## Cómo trabajar con la referencia

1. **Leer el diseño**: Los componentes en `tourism-website-design` usan `@/components` y `@/lib`. En LPMBE usamos `@/app/components` y `@/lib`.

2. **Adaptar imports**: Al copiar de la referencia, cambiar:
   - `@/components/ui/` → `@/app/components/ui/`
   - `@/components/village/` → `@/app/components/village/`

3. **Mantener la lógica LPMBE**: No reemplazar la obtención de datos reales (API, getPuebloBySlug) por mocks.

## Checklist de verificación

- [ ] Fondo `#fbf9f6` en la página
- [ ] Hero a pantalla completa con overlay
- [ ] Meteo con "Tiempo ahora" y "Próximos 3 días"
- [ ] "Qué hacer en [Pueblo]" con subtítulo y Multiexperiencias
- [ ] Las 6 categorías siempre visibles (aunque vacías)
- [ ] Colores de categorías correctos
