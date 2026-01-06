# Requisitos Backend - Notificaciones tipo SEMAFORO

## Problema Actual

El endpoint `GET /notificaciones` devuelve items tipo `SEMAFORO` pero **NO incluye el estado/color del semáforo**.

### Ejemplo actual (incompleto):
```json
{
  "id": 33,
  "tipo": "SEMAFORO",
  "titulo": "Semáforo turístico",
  "contenido": "Cambio de estado del semáforo.",
  "puebloId": 37,
  "pueblo": {
    "id": 37,
    "nombre": "Aínsa",
    "slug": "ainsa"
  },
  "createdAt": "2025-01-01T12:00:00Z"
}
```

## Solución Requerida

El endpoint debe incluir los siguientes campos para items tipo `SEMAFORO`:

### 1. `estado` (string, requerido)
- Valores permitidos: `"VERDE"` | `"AMARILLO"` | `"ROJO"`
- Debe venir en el nivel raíz del objeto

### 2. `motivoPublico` (string, opcional)
- Texto corto para mostrar al público
- Ejemplos: "por fiestas", "por nieve", "accesos cortados", etc.
- Si no existe, puede omitirse o venir como `null`

### Ejemplo esperado (completo):
```json
{
  "id": 33,
  "tipo": "SEMAFORO",
  "titulo": "Semáforo turístico",
  "contenido": "Cambio de estado del semáforo.",
  "puebloId": 37,
  "pueblo": {
    "id": 37,
    "nombre": "Aínsa",
    "slug": "ainsa"
  },
  "createdAt": "2025-01-01T12:00:00Z",
  "estado": "ROJO",
  "motivoPublico": "Accesos cortados por nieve"
}
```

## Implementación Backend

En el servicio/controlador que genera las notificaciones tipo `SEMAFORO`:

1. **Obtener el estado actual del semáforo** del pueblo
   - Consultar la tabla `Semaforo` o la relación `pueblo.semaforo`
   - Extraer el campo `estado` (VERDE/AMARILLO/ROJO)

2. **Obtener el motivo público** (si existe)
   - Consultar el campo `mensajePublico` o `motivo` del semáforo
   - Si no existe, puede omitirse

3. **Incluir en la respuesta** del endpoint `GET /notificaciones`
   - Añadir `estado` al objeto de notificación
   - Añadir `motivoPublico` si existe

## Frontend Preparado

El frontend ya está preparado para recibir estos campos:
- Mapea `item.estado` → normaliza a "VERDE" | "AMARILLO" | "ROJO"
- Mapea `item.motivoPublico` → muestra como "Motivo: {motivoPublico}"
- Genera título: `"{PUEBLO} está en {color}"`
- Link a ficha del pueblo: `/pueblos/{slug}`

## Resultado Final

Cuando el backend envíe estos campos, el frontend mostrará:

```
31 dic 2025, 13:03 · Semáforo · Pueblo: Aínsa
Aínsa está en rojo
Motivo: Accesos cortados por nieve
```

Y el título será clickeable → `/pueblos/ainsa`





















