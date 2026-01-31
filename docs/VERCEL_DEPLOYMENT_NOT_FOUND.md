# DEPLOYMENT_NOT_FOUND – Guía completa

## 1. Sugerencia de solución (fix)

**En tu caso concreto:** El error aparecía porque estabas entrando a una URL que **no está asignada** a tu proyecto en Vercel.

| URL que usabas (incorrecta)     | URL que sí existe en tu proyecto      |
|---------------------------------|----------------------------------------|
| `https://lpbme-frontend.vercel.app` ❌ | `https://lpmbe-frontend.vercel.app` ✅ |

**Qué hacer:**

- **Opción A (Vercel):** Usar siempre la URL correcta del proyecto:
  - **https://lpmbe-frontend.vercel.app** (con **m** en “l**p**m**b**e”).
- **Opción B (staging, recomendada para Apple):** Usar el dominio propio:
  - **https://staging.lospueblosmasbonitosdeespana.org**

No hace falta cambiar código. Solo usar la URL correcta en el navegador, en documentación y en configuraciones externas (p. ej. Apple Developer).

**Comprobar en Vercel:**  
Project → **Settings → Domains**. Ahí aparecen los dominios realmente asignados. Cualquier otro hostname (typo o antiguo) puede devolver DEPLOYMENT_NOT_FOUND.

---

## 2. Causa raíz

**Qué estaba pasando:**

- Entrabas (o un link/config) a **lpbme-frontend.vercel.app**.
- Ese hostname **no está** en la lista de dominios del proyecto en Vercel.
- Vercel recibe la petición, busca qué proyecto/deployment sirve ese dominio, no encuentra ninguno y responde **DEPLOYMENT_NOT_FOUND**.

**Qué tendría que pasar:**

- Usar un hostname que **sí** esté asignado al proyecto:  
  `lpmbe-frontend.vercel.app` o `staging.lospueblosmasbonitosdeespana.org`.

**Condiciones que disparan el error:**

1. Typo en el dominio (ej. **lpbme** en vez de **lpmbe**).
2. Dominio que nunca se añadió al proyecto en Vercel.
3. Dominio que se eliminó del proyecto.
4. Deployment borrado o proyecto migrado y el dominio sigue apuntando al proyecto viejo.

**Qué falló en el proceso:**

- Se asumió que “cualquier variante del nombre del proyecto” (lpbme / lpmbe) sería válida.
- En realidad, Vercel solo sirve **exactamente** los dominios que tú añades en **Settings → Domains**; no inventa variantes.

---

## 3. Concepto: por qué existe este error

**Qué te está protegiendo:**

- Que no se sirva contenido de tu app en un dominio que **tú no has configurado**.
- Evita confusión entre proyectos (dos proyectos con nombres parecidos).
- Deja claro: “este hostname no tiene deployment asociado”.

**Modelo mental correcto:**

- **Deployment** = una versión concreta de tu app (build) desplegada.
- **Dominio** = un nombre (ej. `lpmbe-frontend.vercel.app`) que **tú enlazas** a un proyecto en Vercel.
- Si alguien pide `https://cualquier-cosa.vercel.app` (o tu dominio propio), Vercel hace:  
  “¿Este hostname está en la lista de dominios de algún proyecto?”  
  - Sí → sirve el deployment de ese proyecto.  
  - No → **DEPLOYMENT_NOT_FOUND** (no “no hay app”, sino “no hay deployment asociado a *este* hostname”).

**En el diseño de Vercel:**

- Cada petición llega con un **Host**.
- El enrutado es **por dominio**, no por “nombre del repo” ni por “nombre que me suena”.
- Un typo en el dominio = otro hostname = otro “sitio” para Vercel = sin deployment.

---

## 4. Señales de alarma y patrones similares

**Qué vigilar para no repetirlo:**

1. **Copiar/pegar URLs** sin comprobar letra por letra (lpbme vs lpmbe).
2. **Documentación o .cursorrules** con una URL que no coincide con **Settings → Domains** en Vercel.
3. **Configuraciones externas** (Apple, OAuth, webhooks, etc.) que usen una URL que no sea exactamente la de Domains.
4. **Links fijos** en código o docs a `lpbme-frontend` si el dominio real es `lpmbe-frontend`.

**Errores parecidos en otros entornos:**

- **Cloudflare / Netlify:** “Site not found” o 404 cuando el dominio no está asignado al sitio correcto.
- **DNS:** Dominio apuntando a un servicio que ya no existe o a otro proyecto.
- **OAuth/Apple:** “Redirect URI mismatch” cuando la URL que envías no coincide **exactamente** con la configurada (mismo principio: identificación por URL exacta).

**Code smells / patrones:**

- Varias URLs “de producción” o “de staging” escritas a mano en distintos archivos (sin una única fuente de verdad).
- Nombres muy parecidos (lpbme / lpmbe) sin una convención clara de cuál es la oficial.
- Documentación que no se revisa contra la configuración real de Vercel (Domains).

---

## 5. Alternativas y trade-offs

**A) Corregir la URL y seguir con Vercel (*.vercel.app)**  
- Usar solo **lpmbe-frontend.vercel.app** en todos los sitios.  
- Ventaja: rápido, sin tocar DNS.  
- Desventaja: dependes del subdominio de Vercel; si cambias de cuenta/proyecto, la URL puede cambiar.

**B) Usar solo dominio propio (staging/producción)**  
- Ejemplo: **staging.lospueblosmasbonitosdeespana.org** (y en prod el que corresponda).  
- Ventaja: URL estable, no depende del nombre del proyecto en Vercel; mejor para integraciones (Apple, OAuth, etc.).  
- Desventaja: hay que configurar dominio y DNS (ya lo tienes para staging).

**C) Tener ambas y documentar una como “oficial”**  
- Tener `lpmbe-frontend.vercel.app` y `staging.lospueblosmasbonitosdeespana.org`, pero decidir **una** como la que se usa en configs externas (p. ej. Apple) y en docs.  
- Ventaja: flexibilidad.  
- Desventaja: riesgo de volver a usar la URL equivocada si no está claro cuál es la canónica.

**Recomendación en tu proyecto:**  
Usar **staging.lospueblosmasbonitosdeespana.org** como URL estable para Apple y documentación, y considerar **lpmbe-frontend.vercel.app** solo como URL técnica de Vercel. Así evitas confusión entre lpbme/lpmbe y reduces el riesgo de DEPLOYMENT_NOT_FOUND por typo en el futuro.

---

## Resumen

| Pregunta | Respuesta |
|----------|-----------|
| **Fix** | Usar **lpmbe-frontend.vercel.app** (con m) o **staging.lospueblosmasbonitosdeespana.org**. No usar lpbme-frontend.vercel.app. |
| **Causa** | El hostname al que entrabas no está asignado en Vercel → no hay deployment para ese dominio. |
| **Concepto** | Vercel enruta por **dominio exacto**. Sin dominio asignado = DEPLOYMENT_NOT_FOUND. |
| **Prevención** | Comprobar URLs en Domains, evitar typos, usar una URL canónica (p. ej. staging) en configs externas. |
| **Alternativa** | Fijar un único dominio “oficial” (p. ej. staging) para docs y Apple; dejar *.vercel.app como referencia técnica. |
