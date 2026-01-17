# 🔧 Solución de errores 404 en build de Vercel

## 📋 Resumen del problema

El build de Next.js en Vercel está fallando porque:
1. Intenta prerenderizar la página `/` (home)
2. Durante el build, hace fetch a endpoints del backend
3. Si esos endpoints no responden o dan 404, el build falla

## ✅ Cambios aplicados en el frontend

### 1. Página Home (`app/page.tsx`)

Añadidas directivas para forzar render dinámico:

```typescript
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

Esto evita que Next intente prerenderizar la página durante el build.

### 2. API de Home (`lib/homeApi.ts`)

- ✅ Cambio de `revalidate: 300` a `cache: "no-store"`
- ✅ Si el endpoint responde con error, devuelve fallback en lugar de lanzar error
- ✅ Nunca rompe el build, siempre devuelve datos válidos

### 3. API de Rutas (`lib/api.ts`)

- ✅ `getRutas()` ahora devuelve `[]` si hay error
- ✅ Cambio a `cache: "no-store"`
- ✅ No lanza errores que puedan romper el build

## 🔍 Verificar configuración de Vercel

### Variables de entorno necesarias

En **Vercel → Settings → Environment Variables**, asegúrate de tener:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

**⚠️ IMPORTANTE:** El valor debe apuntar al backend de producción en Railway.

### ¿Con o sin `/api`?

Usa el script de verificación para determinar si tu backend usa prefijo `/api`:

```bash
# En tu Mac
cd ~/Projects/LPMBE/frontend
./check-backend.sh https://tu-backend.railway.app
```

El script probará:
- `/home` y `/api/home`
- `/rutas` y `/api/rutas`

**Resultado:**
- Si `/home` devuelve 200 → `NEXT_PUBLIC_API_URL=https://tu-backend.railway.app`
- Si `/api/home` devuelve 200 → `NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api`

## 🚀 Pasos para redeploy

### 1. Verificar backend en Railway

```bash
# Sustituye por tu URL real
BACK="https://tu-backend.railway.app"

# Probar endpoints (con o sin /api según tu backend)
curl -i "$BACK/home"
curl -i "$BACK/rutas"

# O con /api si tu backend lo requiere
curl -i "$BACK/api/home"
curl -i "$BACK/api/rutas"
```

### 2. Configurar Vercel

1. Ve a **Vercel → Project → Settings → Environment Variables**
2. Actualiza `NEXT_PUBLIC_API_URL` con la URL correcta
3. Aplica para **Production**, **Preview**, y **Development**

### 3. Redeploy

```bash
cd ~/Projects/LPMBE/frontend

# Commit vacío para forzar redeploy
git commit --allow-empty -m "chore: redeploy vercel (fix build fetch)"
git push origin main
```

## 🐛 Solución de problemas

### Build sigue fallando

1. **Verifica logs de Vercel:**
   - Ve a Deployments → Click en el deployment fallido → Logs
   - Busca mensajes de error relacionados con fetch

2. **Verifica que el backend esté corriendo:**
   ```bash
   curl -i https://tu-backend.railway.app/health
   ```

3. **Verifica las rutas del backend:**
   - Confirma que `/home` y `/rutas` existen en Railway
   - O que `/api/home` y `/api/rutas` existen si usas prefijo

### Backend da 404

Si el backend da 404 en todos los endpoints:
- Verifica que las rutas estén definidas en el backend
- Confirma que el backend esté desplegado y corriendo en Railway
- Revisa los logs del backend en Railway

## 📝 Notas importantes

1. **No tocar el backend:** Todos los cambios están en el frontend
2. **Fallbacks funcionando:** Si el backend falla, el sitio mostrará datos por defecto
3. **Build nunca falla:** El frontend siempre puede buildear, incluso sin backend
4. **Runtime fetch:** Los datos se cargan en runtime, no en build time

## ✅ Checklist final

- [ ] Variables de entorno configuradas en Vercel
- [ ] `NEXT_PUBLIC_API_URL` apunta al backend correcto
- [ ] Backend responde 200 en `/home` y `/rutas` (o `/api/home` y `/api/rutas`)
- [ ] Redeploy realizado
- [ ] Build exitoso en Vercel
- [ ] Home carga correctamente en producción
