# Apple Sign In – Diagnóstico (Casos A y B)

**Dominio elegido para Apple:** `staging.lospueblosmasbonitosdeespana.org` (estable, no Vercel ni localhost).

**URL para probar Apple:** https://staging.lospueblosmasbonitosdeespana.org/entrar

El fallo es de **flujo Apple** (antes o después de obtener `id_token`). Solo hay 2 casos; cada uno tiene un arreglo distinto.

---

## Caso A: Apple NO llega a devolver id_token (config Apple)

**Síntoma:**
- Pulsas "Continuar con Apple"
- Sale popup / Touch ID
- Vuelve y aparece "Error al iniciar sesión con Apple"
- En **Network NO aparece** `POST /api/auth/apple`

**Arreglo (100% Apple config):**

1. **Apple Developer** → Service ID: `org.lospueblosmasbonitosdeespana.web` → **Sign In with Apple** → **Configure**
2. Asegúrate de que existen **estas 2 cosas** (además de las de WP):
   - **Domain:** `staging.lospueblosmasbonitosdeespana.org`
   - **Return URL:** `https://staging.lospueblosmasbonitosdeespana.org/auth/callback/apple`
3. **Guarda:** Done → Continue → Save

**En el frontend (Vercel / env):**

- **`NEXT_PUBLIC_APPLE_REDIRECT_URI`** = `https://staging.lospueblosmasbonitosdeespana.org/auth/callback/apple`

Apple valida el redirect aunque uses popup. Si no coincide **exacto**, falla con mensajes raros.

---

## Caso B: Apple SÍ devuelve id_token pero falla el intercambio con backend

**Síntoma:**
- En **Network SÍ aparece** `POST /api/auth/apple`
- Pero responde **401 / 500** (etc.)
- La UI muestra "Error al iniciar sesión con Apple"

**Arreglo (Vercel env / API base):**

1. En **Vercel** → proyecto → **Settings → Environment Variables**, revisa:
   - **`NEXT_PUBLIC_API_URL`** debe apuntar al backend de Railway:
     - `https://lpbme-backend-production.up.railway.app`
2. Vuelve a probar y mira el **status** de `POST /api/auth/apple`:
   - **401** → el backend rechaza el token (audience/issuer) o llega vacío
   - **404 / ECONNREFUSED** → Vercel estaba llamando a localhost o a una URL incorrecta

---

## Lo mínimo para dar el paso exacto (sin capturas)

Abre https://staging.lospueblosmasbonitosdeespana.org/entrar, **DevTools → Network**, y haz click en "Continuar con Apple".

Responde **solo** con:

1. **¿Aparece `POST /api/auth/apple`?** (sí / no)
2. **Si sí:** status (200 / 401 / 500)
3. **Si sí:** ¿a qué URL está llamando el backend por dentro? (la que veas en la request del *server* que hace `/api/auth/apple` a Railway; si no la ves, el status basta)

Con eso se sabe el arreglo único: **Apple config** (Caso A) vs **Vercel env** (Caso B).

---

## Resumen variables Vercel

| Variable | Valor (producción) |
|----------|--------------------|
| `NEXT_PUBLIC_API_URL` | `https://lpbme-backend-production.up.railway.app` |
| `NEXT_PUBLIC_APPLE_REDIRECT_URI` | `https://staging.lospueblosmasbonitosdeespana.org/auth/callback/apple` |
| `NEXT_PUBLIC_APPLE_CLIENT_ID` | `org.lospueblosmasbonitosdeespana.web` |

---

## Local con ngrok (opcional)

Para probar en local con HTTPS:

1. `ngrok http 3001`
2. En `.env.local`: `NEXT_PUBLIC_APPLE_REDIRECT_URI=https://xxxx.ngrok-free.app/auth/callback/apple`
3. En Apple Developer (Service ID): Domain y Return URL con ese `xxxx.ngrok-free.app`
4. Entrar a la app por la URL de ngrok, no por localhost
