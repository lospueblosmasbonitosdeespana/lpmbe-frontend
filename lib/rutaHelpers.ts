/**
 * Limpia HTML heredado para edición en textarea
 * Convierte HTML a texto plano manteniendo estructura básica
 */
export function sanitizeRutaDescripcionForTextarea(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // 1. Eliminar imágenes completas
  text = text.replace(/<img[^>]*>/gi, '');
  
  // 2. Convertir saltos de bloque a \n
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  
  // 3. Eliminar todos los tags restantes
  text = text.replace(/<[^>]+>/g, '');
  
  // 4. Decode entities HTML básicas
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // 5. Eliminar "Saber más"
  text = text.replace(/(\s*)Saber m[aá]s(\s*)/gi, '\n');
  
  // 6. Limpiar espacios
  text = text.trim();
  
  // 7. Colapsar más de 2 saltos seguidos a 2
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // 8. Eliminar espacios al inicio de líneas
  text = text.split('\n').map(line => line.trim()).join('\n');
  
  return text;
}

/**
 * Elimina el bloque numerado de paradas del texto
 * Mantiene intro y outro (TIPS)
 */
export function stripLegacyStops(descripcion: string): string {
  if (!descripcion) return '';
  
  // Buscar "¡Empezamos!" y "TIPS DE RUTA" (o variantes)
  const empezamosIndex = descripcion.indexOf('¡Empezamos!');
  
  if (empezamosIndex === -1) return descripcion;
  
  // Buscar marcadores de fin
  const marcadoresFin = [
    'TIPS DE RUTA',
    'Tips de ruta',
    'CONOCE MÁS RUTAS',
    'Conoce más rutas',
    'TIPS',
    'Tips',
  ];
  
  let finIndex = -1;
  for (const marcador of marcadoresFin) {
    const idx = descripcion.indexOf(marcador, empezamosIndex);
    if (idx !== -1) {
      finIndex = idx;
      break;
    }
  }
  
  if (finIndex === -1) {
    // No hay outro, solo quitar desde ¡Empezamos!
    return descripcion.slice(0, empezamosIndex + '¡Empezamos!'.length);
  }
  
  // Intro + outro
  const intro = descripcion.slice(0, empezamosIndex + '¡Empezamos!'.length);
  const outro = descripcion.slice(finIndex);
  
  return intro + '\n\n' + outro;
}
