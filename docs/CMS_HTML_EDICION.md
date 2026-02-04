# Sistema de Edición CMS con 3 Modos

## Resumen

Sistema de edición de contenido CMS con **3 modos** que permite tanto edición visual como HTML directo.

### Los 3 Modos

| Modo | Botón | Uso |
|------|-------|-----|
| **Editor** | Azul | Editor visual TipTap - texto simple, negritas, listas básicas |
| **HTML** | Amarillo | Código HTML directo - contenido complejo, grids, enlaces externos |
| **Vista previa** | Verde | Ver el resultado final antes de guardar |

---

## IMPORTANTE: Cuándo usar cada modo

### Usar modo EDITOR para:
- Texto simple sin estructura compleja
- Páginas con solo párrafos, títulos y listas
- Contenido sin enlaces externos

### Usar modo HTML para:
- Grids de tarjetas
- Enlaces externos (https://...)
- Cualquier estructura con `<div>` y clases CSS
- Contenido complejo que TipTap podría corromper

### ADVERTENCIA
**NO uses el modo Editor si el contenido tiene enlaces externos.** TipTap corrompe las URLs con `https://` al parsear el HTML. Si necesitas enlaces externos, usa SIEMPRE el modo HTML.

---

## Archivos del Sistema

### Componente principal del editor
`frontend/app/gestion/asociacion/el-sello/SelloEditorForm.tsx`

### Renderizador de HTML seguro
`frontend/app/_components/ui/SafeHtml.tsx`

### Estilos CSS
`frontend/app/globals.css` (buscar `.safe-html-content` y `.grid-paises-internacional`)

---

## Reglas para HTML

### 1. Todo en una línea (grids y tarjetas)
```html
<!-- ✅ CORRECTO -->
<div class="grid-paises-internacional"><div class="pais-card">...</div><div class="pais-card">...</div></div>

<!-- ❌ INCORRECTO - puede romper el grid -->
<div class="grid-paises-internacional">
  <div class="pais-card">...</div>
</div>
```

### 2. Enlaces simples (solo href)
```html
<!-- ✅ CORRECTO -->
<a href="https://ejemplo.com">Web oficial</a>

<!-- ❌ INCORRECTO - TipTap corrompe estos atributos -->
<a href="https://ejemplo.com" target="_blank" rel="noopener">Web</a>
```

### 3. Clases CSS disponibles

| Clase | Resultado |
|-------|-----------|
| `grid-paises-internacional` | Grid responsive de 3 columnas |
| `pais-card` | Tarjeta con borde, fondo blanco y sombra |

---

## Plantillas Reutilizables

### Grid de tarjetas con enlaces

```html
<div class="grid-paises-internacional"><div class="pais-card"><h3>🇫🇷 Francia</h3><p><strong>Descripción</strong> — Texto adicional.</p><p><a href="https://ejemplo.com">Web oficial</a></p></div><div class="pais-card"><h3>🇪🇸 España</h3><p><strong>Descripción</strong> — Texto adicional.</p><p><a href="/pagina-interna">Web oficial</a></p></div></div>
```

### Lista con banderas

```html
<ul>
<li>🇱🇧 <strong>Líbano</strong></li>
<li>🇷🇺 <strong>Rusia</strong></li>
<li>🇨🇳 <strong>China</strong></li>
<li>🇩🇪 <strong>Alemania</strong> — <a href="https://ejemplo.de">Web oficial</a></li>
</ul>
```

### Sección completa

```html
<h2>Título de sección</h2>
<p>Párrafo introductorio con <strong>texto en negrita</strong>.</p>
<h3>Subtítulo</h3>
<p>Más contenido aquí.</p>
```

---

## Ejemplo Completo: Red Internacional

```html
<h2>Les Plus Beaux Villages de la Terre</h2>
<p>Formamos parte de la red internacional <strong>Les Plus Beaux Villages de la Terre</strong>, que agrupa a las asociaciones nacionales de los pueblos más bonitos del mundo y promueve el intercambio de experiencias, la calidad turística y la preservación del patrimonio.</p>
<p>Actualmente, la red cuenta con <strong>7 países miembros oficiales</strong>:</p>
<div class="grid-paises-internacional"><div class="pais-card"><h3>🇫🇷 Francia</h3><p><strong>Les Plus Beaux Villages de France</strong> — Desde 1982. La asociación pionera que dio origen a la red mundial.</p><p><a href="https://www.les-plus-beaux-villages-de-france.org">Web oficial</a></p></div><div class="pais-card"><h3>🇧🇪 Valonia (Bélgica)</h3><p><strong>Les Plus Beaux Villages de Wallonie</strong> — Desde 1994. Los pueblos con más encanto de la región francófona belga.</p><p><a href="https://www.beauxvillages.be">Web oficial</a></p></div><div class="pais-card"><h3>🇮🇹 Italia</h3><p><strong>I Borghi più belli d'Italia</strong> — Desde 2001. Una de las redes más extensas con cientos de pueblos certificados.</p><p><a href="https://www.borghipiubelliditalia.it">Web oficial</a></p></div><div class="pais-card"><h3>🇯🇵 Japón</h3><p><strong>The Most Beautiful Villages in Japan</strong> — Desde 2005. La extensión de la red en Asia.</p><p><a href="https://utsukushii-mura.jp">Web oficial</a></p></div><div class="pais-card"><h3>🇪🇸 España</h3><p><strong>Los Pueblos Más Bonitos de España</strong> — Formamos parte de la red desde nuestros inicios.</p><p><a href="/el-sello">Web oficial</a></p></div><div class="pais-card"><h3>🇨🇦 Quebec (Canadá)</h3><p><strong>Les Plus Beaux Villages du Québec</strong> — Desde 1998. Los pueblos más bonitos de la provincia canadiense.</p><p><a href="https://beauxvillages.qc.ca">Web oficial</a></p></div><div class="pais-card"><h3>🇨🇭 Suiza</h3><p><strong>Les Plus Beaux Villages de Suisse</strong> — Desde 2015. Municipios pintorescos de Suiza y Liechtenstein.</p><p><a href="https://www.lesborghi.ch">Web oficial</a></p></div></div>
<h3>Países observadores</h3>
<p>Además, varios países participan como <strong>miembros observadores</strong>, en proceso de incorporación a la red:</p>
<ul>
<li>🇱🇧 <strong>Líbano</strong></li>
<li>🇷🇺 <strong>Rusia</strong></li>
<li>🇨🇳 <strong>China</strong></li>
<li>🇧🇦 <strong>Bosnia-Herzegovina</strong></li>
<li>🇩🇪 <strong>Alemania</strong> — <a href="https://www.schoenstedoerfer.de">Web oficial</a></li>
</ul>
<p>La red internacional coordina esfuerzos para compartir buenas prácticas, promover el turismo responsable y defender el valor de los pequeños núcleos rurales con patrimonio excepcional.</p>
```

---

## Solución de Problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| HTML se ve como texto plano | Usaste modo Editor con HTML complejo | Usar modo HTML |
| Grid en vertical | Saltos de línea entre tarjetas | Poner todo en una línea |
| Enlaces rotos (URL visible como texto) | TipTap corrompió el HTML | Usar modo HTML, no tocar Editor |
| `target="_blank"` visible | Atributos extra en enlaces | Quitar todo excepto `href` |

---

## Cómo Implementar en Otras Páginas

Para usar este sistema en otras secciones del CMS:

1. Importar `SelloEditorForm` o crear uno similar
2. Usar el componente `SafeHtml` para renderizar el contenido
3. Añadir las clases CSS necesarias en `globals.css`
4. Asegurarse de que el modo por defecto sea `'html'` si hay contenido complejo

---

*Sistema probado y funcionando - Febrero 2026*
