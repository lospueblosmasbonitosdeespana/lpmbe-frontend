# ✅ SOLUCIÓN ERROR METEO - Variable de entorno faltante

**Fecha:** 29 de enero de 2026  
**Estado:** ✅ Resuelto

---

## ❌ ERROR

```
Error: Missing API_BASE_URL or NEXT_PUBLIC_API_URL
```

**Causa:** El frontend no tenía configurada la variable de entorno para conectar al backend.

---

## ✅ SOLUCIÓN APLICADA

### 1. Creado `.env.local`

```bash
# /Users/franmestre/Projects/LPMBE/frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Creado `.env.example` (para referencia)

```bash
# /Users/franmestre/Projects/LPMBE/frontend/.env.example
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Actualizado `.gitignore`

```bash
.env*
!.env.example  # ← permite subir .env.example pero no .env.local
```

---

## 🔄 REINICIAR EL SERVIDOR

**IMPORTANTE:** Debes reiniciar el servidor de Next.js para que tome la variable:

```bash
# En la terminal del frontend:
# Ctrl+C para parar
npm run dev
```

---

## 🧪 VERIFICACIÓN

Después de reiniciar, abre `/meteo` y deberías ver:

**Logs del frontend (terminal):**
```
[api/meteo/pueblos] Fetching: http://localhost:3000/public/meteo/pueblos
[api/meteo/pueblos] Backend response: 200
```

**Página `/meteo`:**
- ✅ Debe cargar sin error
- ✅ Debe mostrar la lista de pueblos con temperatura

---

## 📝 NOTAS

### Para producción (Vercel)

En Vercel, añadir la variable de entorno:

```
NEXT_PUBLIC_API_URL=https://lpbme-backend-production.up.railway.app
```

### Sobre los errores del backend (Open-Meteo 504)

Los errores que ves en el backend:
```
Open-Meteo error 504: Gateway Time-out
```

Son normales y temporales:
- Open-Meteo (API externa) a veces da timeout
- El backend maneja estos errores correctamente
- No afectan al funcionamiento general de la página
- Solo algunos pueblos (2 de 126) fallaron temporalmente

---

## ✅ ESTADO FINAL

- **Variable de entorno:** ✅ Configurada
- **`.env.example`:** ✅ Creado para referencia
- **`.gitignore`:** ✅ Actualizado
- **Frontend:** ✅ Listo (requiere reinicio)

**SIGUIENTE PASO:** Reinicia `npm run dev` en el frontend.
