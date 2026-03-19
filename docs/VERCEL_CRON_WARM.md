# Cron de warm-up (Vercel → frontend + backend)

Los informes de “**Broken internal URLs**” con código **-1** (sin respuesta) o **500** suelen deberse a **timeouts** cuando Railway estaba frío o saturado, no a enlaces mal puestos en el HTML.

## Qué hace

- Ruta: `GET /api/cron/warm`
- Cada **10 minutos** (Vercel Cron) hace peticiones a:
  - La **home** del sitio (`NEXT_PUBLIC_SITE_URL` o dominio por defecto).
  - El **backend** NestJS en `NEXT_PUBLIC_API_URL/ping` (endpoint ligero definido en `backend/src/main.ts`).

## Configuración en Vercel

1. En el proyecto → **Settings → Environment Variables**:
   - `CRON_SECRET`: cadena larga aleatoria (ej. `openssl rand -hex 32`).
2. Vercel inyecta `Authorization: Bearer <CRON_SECRET>` en las ejecuciones del cron si la variable existe.
3. Tras el deploy, en **Cron Jobs** debería aparecer el job definido en `vercel.json`.

Si no configuras `CRON_SECRET`, la ruta intenta validar el header `x-vercel-cron` (comportamiento según plan/plataforma).

## Probar en local

```bash
curl -s "http://localhost:3000/api/cron/warm"
```

En desarrollo la ruta **no** exige autenticación.
