# Integración diseño V0 - Página del pueblo

## Estado actual

- **shadcn/ui** está inicializado (`components.json`, `globals.css`, `lib/utils.ts`)
- **Componentes UI** en `app/components/ui/` (Section, Container, Grid, Typography, etc.)
- **Componentes village** en `app/components/village/` (CategoryHighlights, DetailStatsBlock, MapSection, TouristTrafficLight)
- **Integración** en `app/pueblos/[slug]/page.tsx`

## Limitación: `shadcn add` con URL V0

El comando:
```bash
npx shadcn add "https://v0.app/chat/b/..."
```

**Falla** porque el bloque V0 declara dependencia de `section`, y ese componente **no existe** en el registry oficial de shadcn (`ui.shadcn.com`).

## Opciones para obtener el diseño V0 exacto

### 1. Copiar desde V0 (recomendado)

1. Abre el chat de V0 en el navegador (logueado)
2. Copia el código de cada componente o bloque
3. Pégalo en archivos separados del proyecto
4. Ajusta imports si hace falta (`@/app/components/ui`, etc.)

### 2. Crear carpeta `v0-reference/`

Si tienes el proyecto completo generado por V0:
- Copia la carpeta dentro del workspace (ej. `frontend/v0-reference/`)
- Usa los archivos como referencia para replicar estructura y estilos

### 3. Añadir bloques uno a uno

En lugar de la URL del chat completo, intenta añadir bloques individuales desde la web de shadcn que no dependan de `section`:
```bash
npx shadcn add button
npx shadcn add card
# etc.
```

## Aliases configurados

En `components.json`, los aliases apuntan a la estructura actual de LPMBE:
- `components` → `@/app/components`
- `ui` → `@/app/components/ui`

## Color primary (ámbar/marrón)

En `globals.css` se ha configurado `--primary` con un tono ámbar para mantener la identidad visual de los pueblos.
