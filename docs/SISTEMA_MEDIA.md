# Sistema de Media Unificado

Este documento describe cómo el frontend gestiona imágenes y archivos multimedia usando el sistema unificado con Cloudflare R2.

## Principios

1. **El frontend NO conoce el storage**: No sabe si las imágenes vienen de Cloudflare R2, WordPress legacy, o cualquier otro origen.
2. **Todo pasa por el backend**: El frontend solo habla con endpoints del backend, nunca directamente con servicios de storage.
3. **URLs públicas**: El frontend siempre recibe URLs públicas listas para usar.

## Tipos

### MediaItem (`src/types/media.ts`)

```typescript
export type MediaItem = {
  id: number;
  ownerType: MediaOwnerType;
  ownerId: number;
  publicUrl: string;  // ← URL pública lista para usar
  altText?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};
```

### Tipos de entidades soportados

- `pueblo`
- `poi`
- `producto`
- `ruta`
- `multiexperiencia`
- `parada`
- `contenido`
- `evento`
- `noticia`
- `usuario`
- `ajustes`
- `home`
- `sello`
- `documento`

## Endpoints del Backend

### Lectura de imágenes

```
GET /media?ownerType=pueblo&ownerId=123
```

Respuesta:
```json
{
  "media": [
    {
      "id": 1,
      "ownerType": "pueblo",
      "ownerId": 123,
      "publicUrl": "https://media.lospueblosmasbonitosdeespana.org/...",
      "altText": "Vista del pueblo",
      "order": 1,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Subida de imágenes

```
POST /media/upload
Content-Type: multipart/form-data

file: <archivo>
ownerType: pueblo
ownerId: 123
```

Respuesta:
```json
{
  "id": 1,
  "publicUrl": "https://media.lospueblosmasbonitosdeespana.org/...",
  "ownerType": "pueblo",
  "ownerId": 123,
  "order": 1
}
```

### Eliminación

```
DELETE /media/:id
```

### Actualización (order, altText)

```
PATCH /media/:id
Content-Type: application/json

{
  "order": 2,
  "altText": "Nueva descripción"
}
```

## API Routes del Frontend

El frontend expone proxies a los endpoints del backend:

- `GET /api/media?ownerType=X&ownerId=Y` → Backend `/media`
- `POST /api/media/upload` → Backend `/media/upload`
- `DELETE /api/media/:id` → Backend `/media/:id`
- `PATCH /api/media/:id` → Backend `/media/:id`

## Componentes

### PhotoManager

Componente unificado para gestión de galerías de pueblos y POIs.

```tsx
<PhotoManager entity="pueblo" entityId={123} />
```

Características:
- Carga imágenes desde `/api/media`
- Sube imágenes a `/api/media/upload`
- Permite reordenar con drag & drop
- Eliminar imágenes
- Editar alt text

### ProductGalleryManager

Componente especializado para galerías de productos.

```tsx
<ProductGalleryManager productId={456} productNombre="Producto X" />
```

Similar a PhotoManager pero adaptado a productos.

## Helpers

### `getPuebloMainPhoto(pueblo: Pueblo): string | null`

Obtiene la foto principal de un pueblo con fallback a legacy.

```typescript
const foto = getPuebloMainPhoto(pueblo);
```

### `getPoiMainPhoto(poi: any): string | null`

Obtiene la foto principal de un POI con fallback a legacy.

```typescript
const foto = getPoiMainPhoto(poi);
```

### `normalizeMediaArray(media: MediaItem[] | undefined | null): MediaItem[]`

Normaliza arrays que pueden venir undefined/null del backend.

```typescript
const media = normalizeMediaArray(data.fotosPueblo);
```

## Compatibilidad Legacy

El sistema mantiene compatibilidad con datos legacy:

1. **Pueblos**: Campo `foto_destacada` se usa como fallback si no hay `fotosPueblo`
2. **POIs**: Campos `fotoUrl`, `foto`, `imagen` se usan como fallback
3. **Productos**: El sistema antiguo ya usaba URLs, se mantiene compatibilidad

## Migración

Para migrar un componente al nuevo sistema:

1. Importar tipos de `src/types/media.ts`
2. Usar endpoints `/api/media` en vez de endpoints entity-specific
3. Usar `publicUrl` en vez de `url` (aunque `url` se mantiene por compatibilidad)
4. Usar `order` en vez de `orden`
5. Normalizar arrays con helpers

## Ejemplo de Migración

Antes:
```typescript
const res = await fetch(`/api/admin/pueblos/${id}/fotos`);
const fotos = await res.json();
fotos.map(f => <img src={f.url} />)
```

Después:
```typescript
const res = await fetch(`/api/media?ownerType=pueblo&ownerId=${id}`);
const { media } = await res.json();
media.map(m => <img src={m.publicUrl} />)
```

## Validación

Para verificar que un componente está correctamente migrado:

- ✅ No hace referencia a `wp-content` o URLs hardcodeadas
- ✅ No construye URLs manualmente
- ✅ Usa endpoints `/api/media`
- ✅ Normaliza arrays que pueden venir undefined
- ✅ Usa `publicUrl` (o `url` mapeado desde `publicUrl`)
- ✅ Usa `order` en vez de `orden`

## Próximos Pasos

Una vez WordPress esté completamente apagado:

1. Eliminar campos legacy (`foto_destacada`, `fotoUrl`, etc.)
2. Eliminar fallbacks en helpers
3. Simplificar tipos para usar solo `MediaItem`
4. Eliminar proxies entity-specific del backend
