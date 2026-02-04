# Guía de Edición HTML en el CMS

## Resumen

El CMS de "El Sello" permite editar contenido en **3 modos**:

1. **Editor** - Editor visual TipTap (para texto simple)
2. **HTML** - Código HTML directo (para contenido complejo)
3. **Vista previa** - Ver el resultado final

---

## Cuándo usar cada modo

| Modo | Usar para |
|------|-----------|
| **Editor** | Texto simple: párrafos, negritas, cursivas, listas básicas |
| **HTML** | Contenido complejo: grids, tarjetas, layouts personalizados |
| **Vista previa** | Verificar cómo se verá en la web pública |

---

## Reglas importantes para HTML

### 1. Sin saltos de línea dentro de estructuras
Los grids y tarjetas deben ir **todo en una línea** o el CSS puede fallar:

```html
<!-- ✅ CORRECTO -->
<div class="grid-paises-internacional"><div class="pais-card">...</div><div class="pais-card">...</div></div>

<!-- ❌ INCORRECTO -->
<div class="grid-paises-internacional">
  <div class="pais-card">...</div>
  <div class="pais-card">...</div>
</div>
```

### 2. Evitar atributos con comillas dobles complejas
Los atributos como `target="_blank"` pueden romperse. Si necesitas enlaces externos, usa solo el `href`:

```html
<!-- ✅ CORRECTO -->
<a href="https://ejemplo.com">Enlace</a>

<!-- ❌ PUEDE FALLAR -->
<a href="https://ejemplo.com" target="_blank" rel="noopener">Enlace</a>
```

### 3. Usar clases CSS predefinidas
Las siguientes clases tienen estilos aplicados automáticamente:

| Clase | Uso |
|-------|-----|
| `grid-paises-internacional` | Grid responsive de tarjetas (3 columnas) |
| `pais-card` | Tarjeta con borde, fondo blanco y sombra |

---

## Plantillas reutilizables

### Grid de tarjetas (países, servicios, etc.)

```html
<div class="grid-paises-internacional"><div class="pais-card"><h3>🇫🇷 Título</h3><p><strong>Subtítulo</strong> — Descripción breve.</p></div><div class="pais-card"><h3>🇪🇸 Título 2</h3><p><strong>Subtítulo</strong> — Descripción breve.</p></div><div class="pais-card"><h3>🇮🇹 Título 3</h3><p><strong>Subtítulo</strong> — Descripción breve.</p></div></div>
```

### Lista con iconos

```html
<ul>
<li>🇱🇧 <strong>Elemento 1</strong></li>
<li>🇷🇺 <strong>Elemento 2</strong></li>
<li>🇨🇳 <strong>Elemento 3</strong></li>
</ul>
```

### Sección con título y párrafo

```html
<h2>Título de sección</h2>
<p>Párrafo con <strong>texto en negrita</strong> y contenido normal.</p>
```

---

## Etiquetas HTML soportadas

| Etiqueta | Resultado |
|----------|-----------|
| `<h2>` | Título grande |
| `<h3>` | Título mediano |
| `<p>` | Párrafo |
| `<strong>` | Negrita |
| `<em>` | Cursiva |
| `<ul><li>` | Lista con viñetas |
| `<ol><li>` | Lista numerada |
| `<a href="...">` | Enlace |
| `<hr>` | Línea separadora |

---

## Ejemplo completo: Red Internacional

```html
<h2>Les Plus Beaux Villages de la Terre</h2>
<p>Formamos parte de la red internacional <strong>Les Plus Beaux Villages de la Terre</strong>, que agrupa a las asociaciones nacionales de los pueblos más bonitos del mundo.</p>
<p>La red cuenta con <strong>7 países miembros oficiales</strong>:</p>
<div class="grid-paises-internacional"><div class="pais-card"><h3>🇫🇷 Francia</h3><p><strong>Les Plus Beaux Villages de France</strong> — Desde 1982.</p></div><div class="pais-card"><h3>🇪🇸 España</h3><p><strong>Los Pueblos Más Bonitos de España</strong> — Miembro fundador.</p></div></div>
<h3>Países observadores</h3>
<ul>
<li>🇩🇪 <strong>Alemania</strong></li>
<li>🇨🇳 <strong>China</strong></li>
</ul>
```

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| HTML se ve como texto plano | Usar modo **HTML**, no Editor |
| Grid en vertical | Quitar saltos de línea entre tarjetas |
| Enlaces rotos con `target=` visible | Quitar atributos extra, dejar solo `href` |
| Estilos no se aplican | Verificar nombres de clases (sin espacios extra) |

---

## Archivos relacionados

- **CSS**: `frontend/app/globals.css` (buscar `.safe-html-content`)
- **Componente**: `frontend/app/_components/ui/SafeHtml.tsx`
- **Editor**: `frontend/app/gestion/asociacion/el-sello/SelloEditorForm.tsx`

---

*Última actualización: Febrero 2026*
