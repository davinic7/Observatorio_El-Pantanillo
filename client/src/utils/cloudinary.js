// Helper para inyectar transformaciones automáticas en URLs de Cloudinary.
// Si la URL ya tiene transformaciones (ej. /upload/c_thumb,...) se devuelve sin tocar.

export function cldOptimize(url, width = 800) {
  if (!url || typeof url !== 'string') return url;
  // No tocar PDFs: las transformaciones de imagen rompen el documento.
  if (url.toLowerCase().endsWith('.pdf')) return url;
  if (!url.includes('/upload/')) return url;
  // Si ya hay transformaciones (segmento con dos letras + underscore después de /upload/), no tocar.
  if (/\/upload\/[a-z]{1,3}_/.test(url)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
